import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiConfigured, aiResponses } from "@/lib/ai-responses";

export type SensorPick = { nome: string; luogo: string; lat: number; lng: number; priorita: "alta" | "media" | "bassa"; motivi: string[] };
export type NetworkSummary = { sensoriEsistenti: number; temperaturaMedia: number | null; puntiSensibili: number; fermate: number };

type Poi = { kind: string; name: string; lat: number; lng: number };

async function fetchExistingSensors(lat: number, lng: number) {
  try {
    const r = await fetch(`https://data.sensor.community/airrohr/v1/filter/area=${lat.toFixed(3)},${lng.toFixed(3)},1.5`, { headers: { Accept: "application/json" } });
    if (!r.ok) return [];
    const rows = (await r.json()) as { location: { latitude: string; longitude: string; id: number }; sensordatavalues: { value: string; value_type: string }[] }[];
    const seen = new Map<number, { lat: number; lng: number; temp: number | null }>();
    for (const row of rows) {
      const t = row.sensordatavalues.find((v) => v.value_type === "temperature");
      const prev = seen.get(row.location.id);
      seen.set(row.location.id, { lat: Number(row.location.latitude), lng: Number(row.location.longitude), temp: t ? Number(t.value) : prev?.temp ?? null });
    }
    return [...seen.values()].slice(0, 30);
  } catch { return []; }
}

async function fetchPois(lat: number, lng: number): Promise<Poi[]> {
  const q = `[out:json][timeout:25];(node(around:1500,${lat},${lng})[amenity~"school|kindergarten|hospital|clinic|nursing_home|marketplace"];way(around:1500,${lat},${lng})[amenity~"school|hospital|nursing_home|parking"];way(around:1500,${lat},${lng})[leisure~"park|playground"];);out center 120;node(around:1500,${lat},${lng})[highway=bus_stop];out 60;`;
  try {
    const r = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", "User-Agent": "MicroDigitalTwin/1.0" },
      body: new URLSearchParams({ data: q }),
    });
    if (!r.ok) return [];
    const j = (await r.json()) as { elements: { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] };
    return j.elements.map((e) => {
      const t = e.tags ?? {};
      return { kind: t["amenity"] ?? t["leisure"] ?? t["highway"] ?? "altro", name: t["name"] ?? "", lat: e.lat ?? e.center?.lat ?? 0, lng: e.lon ?? e.center?.lon ?? 0 };
    }).filter((p) => p.lat);
  } catch { return []; }
}

const SYSTEM = `Sei un esperto di monitoraggio microclimatico urbano e agricolo. Devi proporre dove installare nuovi sensori di temperatura.
Usa i dati reali forniti: sensori già attivi della rete Sensor.Community e luoghi sensibili da OpenStreetMap (scuole, ospedali, RSA, parchi, parcheggi, fermate).
Privilegia lacune di copertura, popolazioni vulnerabili, superfici impermeabili e, per i vigneti, versanti ed esposizioni diverse. Evita punti vicini a sensori esistenti.
Rispondi SOLO con JSON valido: {"sintesi":"...","sensori":[{"nome":"...","luogo":"...","lat":0,"lng":0,"priorita":"alta|media|bassa","motivi":["...","..."]}]}
Da 3 a 5 sensori: colloca li vicino ai luoghi sensibili entro 1,5 km dal centro della zona cercata, tenendo conto che anche i sensori esistenti sono stati analizzati entro 1,5 km; distribuisi in settori diversi, coordinate reali, 2-3 motivi brevi in italiano che citano i dati.
Il campo "luogo" deve descrivere il punto in modo riconoscibile: nome della via o della piazza e tipo di luogo (es. "Via Mazzini, vicino alla scuola elementare", "Parcheggio del terminal bus", "Versante sud del vigneto").`;

export const suggestHeatSensors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ kind: z.enum(["urban", "vineyard"]), label: z.string().max(300), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).parse(d))
  .handler(async ({ data }) => {
    if (!aiConfigured()) return { error: "Servizio AI non configurato." };
    const [sensors, pois] = await Promise.all([fetchExistingSensors(data.lat, data.lng), fetchPois(data.lat, data.lng)]);
    const temps = sensors.map((s) => s.temp).filter((t): t is number => t != null && Number.isFinite(t));
    const network: NetworkSummary = {
      sensoriEsistenti: sensors.length,
      temperaturaMedia: temps.length ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10 : null,
      puntiSensibili: pois.filter((p) => p.kind !== "bus_stop").length,
      fermate: pois.filter((p) => p.kind === "bus_stop").length,
    };
    const input = [
      `Tipo area: ${data.kind === "urban" ? "urbana" : "vitivinicola"}`,
      `Centro: ${data.label} (${data.lat.toFixed(5)}, ${data.lng.toFixed(5)})`,
      `Sensori esistenti entro 1,5 km (${sensors.length}): ${sensors.map((s) => `${s.lat.toFixed(4)},${s.lng.toFixed(4)}${s.temp != null ? ` ${s.temp}°C` : ""}`).join("; ") || "nessuno"}`,
      `Luoghi OSM entro 1,5 km (${pois.length}): ${pois.slice(0, 120).map((p) => `${p.kind}${p.name ? ` "${p.name}"` : ""} ${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join("; ") || "nessuno"}`,
    ].join("\n");

    const res = await aiResponses({ instructions: SYSTEM, input, stream: true, store: false, reasoning: { effort: "low" } });
    if (!res.ok || !res.body) {
      console.error("AI gateway", res.status, await res.text().catch(() => ""));
      if (res.status === 429) return { error: "Troppe richieste, riprova tra poco." };
      if (res.status === 402) return { error: "Credito dell'API AI esaurito." };
      if (res.status === 403) return { error: "Accesso al servizio AI non consentito: verifica la chiave API." };
      return { error: `Errore del servizio AI (${res.status}).` };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        const p = l.slice(5).trim();
        if (!p || p === "[DONE]") continue;
        try { const ev = JSON.parse(p); if (ev.type === "response.output_text.delta") text += ev.delta; } catch { /* ignore */ }
      }
    }
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { error: "Il modello non ha restituito suggerimenti." };
    try {
      const j = JSON.parse(m[0]) as { sintesi?: string; sensori?: Partial<SensorPick>[] };
      const sensori: SensorPick[] = (j.sensori ?? []).slice(0, 5).map((s) => ({
        nome: String(s.nome ?? ""), luogo: String(s.luogo ?? ""), lat: Number(s.lat) || 0, lng: Number(s.lng) || 0,
        priorita: (s.priorita === "alta" || s.priorita === "bassa" ? s.priorita : "media") as SensorPick["priorita"],
        motivi: (Array.isArray(s.motivi) ? s.motivi : []).slice(0, 3).map(String),
      })).filter((s) => s.nome && s.lat);
      return { sintesi: String(j.sintesi ?? ""), sensori, network };
    } catch {
      return { error: "Risposta del modello non leggibile." };
    }
  });
