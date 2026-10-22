import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdmin } from "@/integrations/supabase/admin-middleware";
import type { Json } from "@/integrations/supabase/types";

export type AdminUser = {
  id: string;
  email: string | null;
  provider: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
  banned: boolean;
  isAdmin: boolean;
};

export type AdminApproval = {
  id: string;
  userId: string;
  userEmail: string | null;
  entity: string;
  status: "attesa" | "approvato" | "respinto";
  applied: boolean;
  createdAt: string;
  decidedAt: string | null;
};

type AuditContext = { userId: string; adminEmail: string | null };

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

async function audit(ctx: AuditContext, action: string, target: string | null, details: Record<string, Json> = {}) {
  const db = await admin();
  const { error } = await db.from("admin_audit_log").insert({ actor_id: ctx.userId, actor_email: ctx.adminEmail, action, target, details });
  if (error) console.error("Admin audit log", error.code);
}

async function emailsById(ids: string[]) {
  const db = await admin();
  const out = new Map<string, string | null>();
  for (const id of new Set(ids)) {
    const { data } = await db.auth.admin.getUserById(id);
    out.set(id, data.user?.email ?? null);
  }
  return out;
}

/** Lets the UI decide whether to show the admin link; never trusted for authorization. */
export const getMyAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const { data } = await db.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    return { isAdmin: Boolean(data) };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const db = await admin();
    const count = async (table: "profiles" | "external_approval_requests" | "case_source_updates" | "urban_dashboard_state") => {
      const { count: n } = await db.from(table).select("*", { count: "exact", head: true });
      return n ?? 0;
    };
    const [users, pending, sources, dashboards, aiPauses, admins] = await Promise.all([
      db.auth.admin.listUsers({ page: 1, perPage: 1 }).then((r) => ("total" in r.data ? (r.data.total as number) : r.data.users.length)),
      db.from("external_approval_requests").select("*", { count: "exact", head: true }).eq("status", "attesa").then((r) => r.count ?? 0),
      count("case_source_updates"),
      count("urban_dashboard_state"),
      db.from("ar_ai_access_state").select("*", { count: "exact", head: true }).then((r) => r.count ?? 0),
      db.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin").then((r) => r.count ?? 0),
    ]);
    return {
      users,
      admins,
      pendingApprovals: pending,
      caseSources: sources,
      dashboards,
      aiPaused: aiPauses > 0,
      services: {
        ai: Boolean(process.env["GEMINI_API_KEY"] || process.env["OPENAI_API_KEY"]),
        googleMaps: Boolean(process.env["GOOGLE_MAPS_API_KEY"]),
        parallel: Boolean(process.env["PARALLEL_API_KEY"]),
        copernicus: Boolean(process.env["CDSE_CLIENT_ID"] && process.env["CDSE_CLIENT_SECRET"]),
        cron: Boolean(process.env["CRON_SECRET"]),
      },
    };
  });

// ───────── Utenti ─────────

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<{ users: AdminUser[] }> => {
    const db = await admin();
    const all: AdminUser[] = [];
    const { data: roles } = await db.from("user_roles").select("user_id").eq("role", "admin");
    const admins = new Set((roles ?? []).map((r) => r.user_id));
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(`Elenco utenti non disponibile: ${error.message}`);
      for (const u of data.users) {
        all.push({
          id: u.id,
          email: u.email ?? null,
          provider: typeof u.app_metadata?.["provider"] === "string" ? u.app_metadata["provider"] : null,
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at ?? null,
          confirmed: Boolean(u.email_confirmed_at ?? u.confirmed_at),
          banned: Boolean(u.banned_until && new Date(u.banned_until) > new Date()),
          isAdmin: admins.has(u.id),
        });
      }
      if (data.users.length < 200) break;
    }
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { users: all };
  });

export const setUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), admin: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId && !data.admin) throw new Error("Non puoi rimuovere il ruolo admin a te stesso.");
    const db = await admin();
    const { error } = data.admin
      ? await db.from("user_roles").upsert({ user_id: data.userId, role: "admin" })
      : await db.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    if (error) throw new Error(error.message);
    await audit(context, data.admin ? "user.grant_admin" : "user.revoke_admin", data.userId);
    return { ok: true };
  });

export const setUserBanned = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), banned: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("Non puoi sospendere il tuo account.");
    const db = await admin();
    const { error } = await db.auth.admin.updateUserById(data.userId, { ban_duration: data.banned ? "876000h" : "none" });
    if (error) throw new Error(error.message);
    await audit(context, data.banned ? "user.ban" : "user.unban", data.userId);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("Non puoi eliminare il tuo account dal pannello.");
    const db = await admin();
    const { data: target } = await db.auth.admin.getUserById(data.userId);
    // Storage objects are not removed by the auth cascade.
    for (const bucket of ["account-avatars", "lab-media"]) {
      const { data: files } = await db.storage.from(bucket).list(data.userId, { limit: 1000 });
      if (files?.length) await db.storage.from(bucket).remove(files.map((f) => `${data.userId}/${f.name}`));
    }
    const { error } = await db.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await audit(context, "user.delete", data.userId, { email: target.user?.email ?? null });
    return { ok: true };
  });

// ───────── Pareri esterni ─────────

export const listApprovals = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<{ approvals: AdminApproval[] }> => {
    const db = await admin();
    const { data, error } = await db.from("external_approval_requests").select("id, user_id, entity, status, applied, created_at, decided_at").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    const emails = await emailsById((data ?? []).map((r) => r.user_id));
    return {
      approvals: (data ?? []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        userEmail: emails.get(r.user_id) ?? null,
        entity: r.entity,
        status: r.status as AdminApproval["status"],
        applied: r.applied,
        createdAt: r.created_at,
        decidedAt: r.decided_at,
      })),
    };
  });

export const setApprovalStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(["attesa", "approvato", "respinto"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { error } = await db.from("external_approval_requests").update({ status: data.status, decided_at: data.status === "attesa" ? null : new Date().toISOString(), applied: false }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(context, "approval.set_status", data.id, { status: data.status });
    return { ok: true };
  });

export const deleteApproval = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { error } = await db.from("external_approval_requests").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(context, "approval.delete", data.id);
    return { ok: true };
  });

// ───────── Fonti dei casi studio ─────────

export const listCaseSourceStatus = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const db = await admin();
    const { data, error } = await db.from("case_source_updates").select("case_id, publications, checked_at, attempted_at, error").order("case_id");
    if (error) throw new Error(error.message);
    return {
      sources: (data ?? []).map((r) => ({
        caseId: r.case_id,
        publications: Array.isArray(r.publications) ? r.publications.length : 0,
        checkedAt: r.checked_at,
        attemptedAt: r.attempted_at,
        error: r.error,
      })),
    };
  });

export const refreshCaseSourcesNow = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const parallelKey = process.env["PARALLEL_API_KEY"];
    if (!parallelKey) throw new Error("PARALLEL_API_KEY non configurata sul server.");
    const db = await admin();
    const { refreshCaseSources } = await import("@/controllers/case-research.server");
    const result = await refreshCaseSources(db, parallelKey);
    await audit(context, "cases.refresh_sources", null, { successful: result.successful, total: result.results.length });
    return { successful: result.successful, total: result.results.length };
  });

// ───────── Servizio AI ─────────

export const listAiPauses = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const db = await admin();
    const { data, error } = await db.from("ar_ai_access_state").select("scope, status, reason, updated_at");
    if (error) throw new Error(error.message);
    return { pauses: data ?? [] };
  });

export const clearAiPause = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d) => z.object({ scope: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { error } = await db.from("ar_ai_access_state").delete().eq("scope", data.scope);
    if (error) throw new Error(error.message);
    await audit(context, "ai.clear_pause", data.scope);
    return { ok: true };
  });

// ───────── Registro ─────────

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const db = await admin();
    const { data, error } = await db.from("admin_audit_log").select("id, actor_email, action, target, details, created_at").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return { entries: data ?? [] };
  });
