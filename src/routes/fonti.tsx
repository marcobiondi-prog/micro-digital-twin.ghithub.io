import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, ShieldAlert, Building2, Sprout } from "lucide-react";
import { Card, SectionTitle } from "@/views/health";
import { sources } from "@/models/data";

export const Route = createFileRoute("/fonti")({
  head: () => ({
    meta: [
      { title: "Sistemi e fonti analizzati — MICRO DIGITAL TWIN" },
      { name: "description", content: "Copernicus, Radar DPC, CLIMAAX, CLIMol e le altre fonti istituzionali e scientifiche della ricerca." },
      { property: "og:title", content: "Sistemi e fonti analizzati — MICRO DIGITAL TWIN" },
      { property: "og:description", content: "Trasparenza sulle fonti istituzionali, scientifiche e territoriali." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fonti,
});

const icons = [ShieldAlert, Building2, Sprout];
const cols = ["var(--danger)", "var(--urban)", "var(--leaf)"];

function Fonti() {
  return (
    <div>
      <SectionTitle eyebrow="Trasparenza" title="Sistemi e fonti analizzati" desc="La ricerca integra fonti istituzionali, scientifiche e testimonianze territoriali. Le simulazioni non riproducono i risultati ufficiali delle piattaforme elencate." />
      <div className="grid gap-4 lg:grid-cols-3">
        {sources.map((s, i) => {
          const Icon = icons[i]!;
          return (
            <Card key={s.t} className="lift">
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl" style={{ background: `color-mix(in oklab, ${cols[i]} 15%, transparent)`, color: cols[i] }}><Icon className="size-5" /></span><h3 className="text-lg font-semibold">{s.t}</h3><span className="ml-auto font-display text-2xl font-semibold" style={{ color: cols[i] }}>{s.items.length}</span></div>
              <div className="mt-4 flex flex-wrap gap-1.5">{s.items.map((item) => {
                const entry = typeof item === "string" ? { label: item } : item;
                return entry.url ? <a key={entry.label} href={entry.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium transition-colors hover:bg-primary/15 hover:text-primary">{entry.label}<ExternalLink className="size-3" /></a> : <span key={entry.label} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{entry.label}</span>;
              })}</div>
            </Card>
          );
        })}
      </div>
      <Card className="mt-6 text-sm text-muted-foreground"><b className="text-foreground">Nota metodologica.</b> I dati quantitativi e le dichiarazioni sono attribuiti alle rispettive fonti. I risultati del simulatore sono deliberatamente indicativi: servono a illustrare l’interazione prevista, non a certificare prestazioni ambientali.</Card>
    </div>
  );
}
