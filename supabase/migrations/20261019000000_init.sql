-- Micro Digital Twin: schema completo per un progetto Supabase nuovo.
-- Riunisce le migrazioni originali (0000-0007) e aggiunge ruoli admin e registro azioni.
-- Si applica con `supabase db push` oppure incollandolo nel SQL Editor di Supabase.

-- ───────────────────────── Profili ─────────────────────────
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_choice text CHECK (avatar_choice IS NULL OR avatar_choice IN ('seedling', 'city', 'sun', 'vine', 'upload')),
  avatar_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ───────────────────────── Dashboard urbana ─────────────────────────
CREATE TABLE public.urban_dashboard_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stage smallint NOT NULL DEFAULT 0 CHECK (stage BETWEEN 0 AND 3),
  log jsonb NOT NULL DEFAULT '[]'::jsonb,
  approvals jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.urban_dashboard_state TO authenticated;
GRANT ALL ON public.urban_dashboard_state TO service_role;
ALTER TABLE public.urban_dashboard_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own urban state select" ON public.urban_dashboard_state FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own urban state insert" ON public.urban_dashboard_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own urban state update" ON public.urban_dashboard_state FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own urban state delete" ON public.urban_dashboard_state FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ───────────────────────── Pareri esterni (link via email) ─────────────────────────
CREATE TABLE public.external_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity text NOT NULL CHECK (length(entity) BETWEEN 1 AND 200),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'attesa' CHECK (status IN ('attesa', 'approvato', 'respinto')),
  applied boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
CREATE INDEX external_approval_requests_user_idx ON public.external_approval_requests (user_id, applied);
GRANT SELECT, DELETE ON public.external_approval_requests TO authenticated;
-- Owners create requests and mark decisions as applied; only the public link (server) sets status.
GRANT INSERT (user_id, entity) ON public.external_approval_requests TO authenticated;
GRANT UPDATE (applied) ON public.external_approval_requests TO authenticated;
GRANT ALL ON public.external_approval_requests TO service_role;
ALTER TABLE public.external_approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own approvals select" ON public.external_approval_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own approvals insert" ON public.external_approval_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own approvals update" ON public.external_approval_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own approvals delete" ON public.external_approval_requests FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ───────────────────────── Stato servizio AI (solo server) ─────────────────────────
CREATE TABLE public.ar_ai_access_state (
  scope text PRIMARY KEY,
  status integer NOT NULL,
  reason text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ar_ai_access_state TO service_role;
ALTER TABLE public.ar_ai_access_state ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.ar_ai_access_state IS 'Server-only AR recognition circuit breaker. Clear it from /admin after service access is restored.';

-- ───────────────────────── Aggiornamenti fonti dei casi (solo server) ─────────────────────────
CREATE TABLE public.case_source_updates (
  case_id text PRIMARY KEY,
  publications jsonb NOT NULL DEFAULT '[]'::jsonb,
  checked_at timestamptz,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  error text
);
GRANT ALL ON public.case_source_updates TO service_role;
ALTER TABLE public.case_source_updates ENABLE ROW LEVEL SECURITY;

-- ───────────────────────── Ruoli e pannello admin ─────────────────────────
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- Users may only see their own roles (the app uses this to show the Admin link).
CREATE POLICY "own roles select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin') $$;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

CREATE TABLE public.admin_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  target text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ───────────────────────── Storage ─────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('account-avatars', 'account-avatars', false, 5242880),
  ('lab-media', 'lab-media', false, 104857600)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "own avatar read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'account-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own avatar insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'account-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own avatar update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'account-avatars' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'account-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own avatar delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'account-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "lab media own read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'lab-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "lab media own insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lab-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "lab media own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'lab-media' AND (storage.foldername(name))[1] = auth.uid()::text);
