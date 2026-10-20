import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { Card, Pills, SectionTitle } from "@/views/health";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cases } from "@/models/data";
import { caseLocations, parseCaseWeather } from "@/models/case-updates";
import { getCaseSources, getCaseWeather } from "@/controllers/case-updates.functions";
import { CaseUpdates, CaseWeatherSummary } from "@/views/CaseUpdates";

const filters = ["Tutti", "Calore", "Digital Twin", "Verde e acqua", "Vitivinicolo", "Italia"] as const;
// When the server's shared IP is rate-limited (429) the device asks Open-Meteo directly.
async function fetchCaseWeatherFromDevice() {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({ latitude: caseLocations.map((p) => p.lat).join(","), longitude: caseLocations.map((p) => p.lng).join(","), current: "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation", timezone: "GMT", timeformat: "unixtime", forecast_days: "1" }).toString();
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) return null;
    const readings = parseCaseWeather(await r.json());
    return readings.length ? readings : null;
  } catch { return null; }
}
let lastWeather: Awaited<ReturnType<typeof getCaseWeather>> | null = null;
const weatherQuery = queryOptions({
  queryKey: ["cases", "weather"],
  queryFn: async () => {
    let res: Awaited<ReturnType<typeof getCaseWeather>>;
    try { res = await getCaseWeather(); } catch { res = { readings: [], error: "Meteo momentaneamente non disponibile" }; }
    if (!res.readings.length && typeof window !== "undefined") {
      const readings = await fetchCaseWeatherFromDevice();
      if (readings) res = { readings, error: null };
      else if (lastWeather?.readings.length) res = lastWeather;
    }
    if (res.readings.length && typeof window !== "undefined") lastWeather = res;
    return res;
  },
  staleTime: (q) => (q.state.data?.readings.length ? 300000 : 0), refetchOnMount: true, refetchInterval: 300000, refetchOnWindowFocus: true,
});
const sourcesQuery = queryOptions({ queryKey: ["cases", "sources"], queryFn: () => getCaseSources(), staleTime: 300000, refetchInterval: 300000 });

export const Route = createFileRoute("/casi")({
  validateSearch: (search: { filtro?: string } & SearchSchemaInput) => ({ filtro: filters.find((filter) => filter === search.filtro) ?? "Tutti" }),
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(weatherQuery), context.queryClient.ensureQueryData(sourcesQuery)]); },
  errorComponent: () => <div role="alert" className="p-6">Impossibile caricare i casi. Riapri la pagina per riprovare.</div>,
  notFoundComponent: () => <div className="p-6">Caso non trovato.</div>,
  head: () => ({
    meta: [
      { title: "Casi studio internazionali — MICRO DIGITAL TWIN" },
      { name: "description", content: "Quattordici casi urbani e vitivinicoli con evidenze datate, meteo attuale e pubblicazioni dalle fonti originali." },
      { property: "og:title", content: "Casi studio internazionali — MICRO DIGITAL TWIN" },
      { property: "og:description", content: "Evidenze storiche, clima attuale e aggiornamenti dalle fonti originali per quattordici casi urbani e vitivinicoli." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Casi,
});

const tagColor: Record<string, string> = { Calore: "var(--danger)", "Digital Twin": "var(--primary)", "Verde e acqua": "var(--leaf)", Vitivinicolo: "var(--vine)", Italia: "var(--brand-turquoise)" };

function Casi() {
  const { filtro: f } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: weatherData } = useSuspenseQuery(weatherQuery);
  const { data: sourcesData } = useSuspenseQuery(sourcesQuery);
  const list = cases.filter((c) => f === "Tutti" || c.tags.includes(f));
  return (
    <div>
      <SectionTitle eyebrow="Benchmark internazionale" title="Città e vigneti misurano il cambiamento" desc="Quattordici casi reali con periodo, risultati quantitativi e fonte originale. I valori simulati sono distinti dalle misure sul campo." />
      <Card className="mb-6">
        <div className="text-sm font-semibold">Pattern comune</div>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          {["Osservare il luogo", "Localizzare il rischio", "Simulare alternative", "Verificare gli effetti"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 rounded-2xl bg-muted p-3 text-sm font-medium"><span className="grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{i + 1}</span>{s}</div>
          ))}
        </div>
      </Card>
      <div className="sticky top-[var(--nav-h)] transition-[top] duration-300 z-20 -mx-4 mb-6 flex items-center gap-3 border-b bg-background/85 px-4 py-2 backdrop-blur-xl">
        <MapPin className="size-5 shrink-0 text-primary" />
        <Pills options={filters} value={f} onChange={(filtro) => void navigate({ search: { filtro }, replace: true })} className="no-scrollbar min-w-0 flex-nowrap overflow-x-auto" />
        <span className="ml-auto shrink-0 text-sm text-muted-foreground">{list.length} di {cases.length}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <Dialog key={`${f}-${c.city}`}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="case-study-card card-soft h-auto min-h-64 w-full flex-col items-stretch justify-between whitespace-normal p-5 text-left">
                <span>
                  <span className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="size-3" />{c.country}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">{c.evidence}</span>
                  </span>
                  <span className="mt-1 block font-display text-2xl font-semibold">{c.city}</span>
                  <span className="block text-sm font-medium text-primary">{c.project}</span>
                  <span className="mt-2 flex items-center gap-1 text-xs font-normal text-muted-foreground"><CalendarDays className="size-3.5" />{c.period}</span>
                  <span className="mt-4 grid grid-cols-2 gap-2">
                    {c.metrics.map((metric) => <span key={metric.label} className="rounded-lg bg-muted p-2"><strong className="block text-lg text-foreground">{metric.value}</strong><span className="block text-[11px] font-normal leading-tight text-muted-foreground">{metric.label}</span></span>)}
                  </span>
                  <CaseWeatherSummary weather={weatherData.readings.find((reading) => reading.city === c.city)} error={weatherData.error} />
                </span>
                <span className="mt-4 flex items-end justify-between gap-3">
                  <span className="flex flex-wrap gap-1.5">
                    {c.tags.map((tag) => <span key={tag} className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ color: tagColor[tag], background: `color-mix(in oklab, ${tagColor[tag]} 14%, transparent)` }}>{tag}</span>)}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">Apri <ArrowUpRight className="size-3.5" /></span>
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto rounded-2xl p-0">
               <div className="border-b bg-muted p-6 pr-12">
                 <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground"><span className="flex items-center gap-1.5"><MapPin className="size-4" />{c.country}</span><span className="rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-foreground">{c.evidence}</span></div>
                <DialogHeader>
                  <DialogTitle className="font-display text-3xl">{c.city}</DialogTitle>
                   <DialogDescription className="text-base font-medium text-primary">{c.project} · {c.period}</DialogDescription>
                </DialogHeader>
              </div>
              <div className="space-y-5 p-6 pt-2">
                <div><div className="mb-1 text-xs font-bold uppercase text-muted-foreground">Approccio</div><p className="text-lg leading-relaxed">{c.claim}</p></div>
                 <div><div className="mb-2 text-xs font-bold uppercase text-muted-foreground">Evidenze quantitative</div><div className="grid grid-cols-2 gap-3">{c.metrics.map((metric) => <div key={metric.label} className="rounded-lg bg-muted p-3"><strong className="block font-display text-2xl text-primary">{metric.value}</strong><span className="text-xs text-muted-foreground">{metric.label}</span></div>)}</div></div>
                <div><div className="mb-2 text-xs font-bold uppercase text-muted-foreground">Ambiti</div><div className="flex flex-wrap gap-2">{c.tags.map((tag) => <span key={tag} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ color: tagColor[tag], background: `color-mix(in oklab, ${tagColor[tag]} 14%, transparent)` }}>{tag}</span>)}</div></div>
                 <Button asChild className="w-full sm:w-auto"><a href={c.sourceUrl} target="_blank" rel="noreferrer">Apri la fonte originale <ExternalLink className="size-4" /></a></Button>
                 <CaseUpdates city={c.city} weather={weatherData.readings.find((reading) => reading.city === c.city)} source={sourcesData.updates.find((update) => update.case_id === c.city)} weatherError={weatherData.error} sourceError={sourcesData.error} />
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
