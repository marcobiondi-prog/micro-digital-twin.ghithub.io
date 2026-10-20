import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { applySharedScenario, LAB_FLOW_KEY } from "@/views/ScenarioTools";
import { Building2, Grape, Database, Box, LineChart, Compass, Check, X } from "lucide-react";
import { Card, Ring, SectionTitle } from "@/views/health";
import { insights, flows } from "@/models/data";
import { HomeVideos } from "@/views/HomeVideos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MICRO DIGITAL TWIN — Dal rischio climatico alla scelta informata" },
      { name: "description", content: "Insight e due flussi (urbano e vitivinicolo) per l'adattamento climatico." },
      { property: "og:title", content: "MICRO DIGITAL TWIN — Dal rischio climatico alla scelta informata" },
      { property: "og:description", content: "Dati locali, sensori e simulazioni per confrontare interventi di adattamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  ["1", "Scegli il contesto", "Piazza urbana o vigneto"],
  ["2", "Modella gli interventi", "Alberi, suolo permeabile, ombra, irrigazione"],
  ["3", "Misura il beneficio", "Gradi risparmiati, costi e co-benefici"],
] as const;

const plan = [
  ["Casi studio con meteo aggiornato", true, true],
  ["Aggiornamento automatico dei casi con fonti online", true, true],
  ["Simulazione urbana e vitivinicola", true, true],
  ["Dati climatici reali della località", true, true],
  ["Importa il meteo reale come scenario di partenza", false, true],
  ["Esportazione PDF, copia e stampa", true, true],
  ["Foto e video sul dispositivo", true, true],
  ["Invio di più foto/video in un unico ZIP", true, true],
  ["Riconoscimento IA delle foglie", false, true],
  ["Mappa virtuale del terreno in scansione", false, true],
  ["Suggerimenti IA per la posizione dei sensori", false, true],
  ["Didascalie IA nelle foto e nei PDF", false, true],
  ["Archivio media nel cloud e link di condivisione", false, true],
  ["Ciclo di approvazione salvato nell’account", false, true],
  ["Invio di email al funzionario comunale", true, true],
  ["Email ai vari enti pubblici per l’approvazione", false, true],
  ["Dossier per località con documenti tecnici e video", false, true],
] as const;

function Mark({ on }: { on: boolean }) {
  return on ? (
    <span className="grid size-7 place-items-center rounded-full bg-ok text-ok-foreground shadow-sm shadow-ok/45" role="img" aria-label="Incluso"><Check className="size-4 stroke-[3]" /></span>
  ) : (
    <span className="grid size-7 place-items-center rounded-full bg-danger text-danger-foreground shadow-sm shadow-danger/45" role="img" aria-label="Non incluso"><X className="size-4 stroke-[3]" /></span>
  );
}

function QuickStart() {
  const go = (flow: "urban" | "vineyard") => sessionStorage.setItem(LAB_FLOW_KEY, flow);
  return (
    <section aria-labelledby="quick-start" className="rounded-3xl border border-primary/25 bg-primary/5 p-5 sm:p-6">
      <h2 id="quick-start" className="text-lg font-semibold">Inizia in 3 passi</h2>
      <p className="text-sm text-muted-foreground">Simula il tuo primo scenario in meno di un minuto a costo 0 e/o funzionalità <strong className="font-bold">Premium</strong><br />(occorre registrarsi)</p>
      <ol className="mt-4 grid gap-2 sm:grid-cols-3">
        {steps.map(([n, t, d]) => (
          <li key={n} className="flex items-start gap-3 rounded-2xl bg-card p-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{n}</span>
            <div className="min-w-0"><div className="text-sm font-semibold">{t}</div><div className="text-xs text-muted-foreground">{d}</div></div>
          </li>
        ))}
      </ol>
      <div className="simulation-selector-capsule mt-4 grid grid-cols-2 gap-1 rounded-full p-1.5 sm:inline-flex" role="group" aria-label="Scegli da dove partire">
        <Link to="/lab" onClick={() => go("urban")} className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full bg-primary px-2.5 py-2 text-[13px] font-medium whitespace-nowrap text-primary-foreground max-[359px]:px-2 max-[359px]:text-xs sm:w-auto sm:px-4 sm:text-sm"><Building2 className="size-4 shrink-0 max-[359px]:hidden" /><span className="truncate">Prova la piazza</span></Link>
        <Link to="/lab" onClick={() => go("vineyard")} className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full bg-muted px-2.5 py-2 text-[13px] font-medium whitespace-nowrap max-[359px]:px-2 max-[359px]:text-xs sm:w-auto sm:px-4 sm:text-sm"><Grape className="size-4 shrink-0 max-[359px]:hidden" /><span className="truncate">Prova il vigneto</span></Link>
      </div>
    </section>
  );
}

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("scenario");
    if (!raw) return;
    const flow = applySharedScenario(raw);
    if (!flow) { toast.error("Link dello scenario non valido"); return; }
    sessionStorage.setItem(LAB_FLOW_KEY, flow);
    toast.success("Scenario condiviso caricato");
    // Wait for the landing page to settle before moving (see AGENTS back-navigation rule).
    const id = setTimeout(() => void navigate({ to: "/lab", replace: true }), 300);
    return () => clearTimeout(id);
  }, [navigate]);
  return (
    <div className="space-y-16">
      <HomeVideos />
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-6 sm:p-8 md:p-10">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-6xl">Dal rischio climatico <span className="text-primary">alla scelta informata.</span></h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">Un sistema che integra dati locali, sensori e simulazioni per confrontare interventi di adattamento in uno spazio urbano o agricolo circoscritto.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/casi" className="rounded-full bg-muted px-5 py-2.5 font-medium transition-colors hover:bg-accent">Esplora i casi studio</Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
            {([["Diagnosi locale", "/dashboard"], ["Scenari comparabili", "/lab"], ["Decisione umana", "/casi"]] as const).map(([t, to]) => <Link key={t} to={to} className="rounded-full border px-3 py-1 transition-colors hover:border-primary hover:text-primary">{t}</Link>)}
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-4 max-lg:order-2">
          <Card className="col-span-2 flex items-center gap-5">
            <Ring value={38.4} max={50} color="var(--danger)"><span className="font-display text-2xl font-semibold">38.4°</span><span className="text-[10px] text-muted-foreground">superficie</span></Ring>
            <div><div className="text-sm text-muted-foreground">Superficie critica</div><div className="font-display text-2xl font-semibold">38.4 °C</div><div className="mt-1 text-xs text-muted-foreground">Area pilota 120 × 80 m</div></div>
          </Card>
          <Card><div className="text-sm text-muted-foreground">Scenario B</div><div className="mt-1 font-display text-lg font-semibold">Ombra + depaving</div></Card>
          <Card><div className="text-sm text-muted-foreground">Stima dimostrativa</div><div className="mt-1 font-display text-3xl font-semibold text-ok">−2.1 °C</div></Card>
        </div>
        <div className="lg:col-span-2 max-lg:order-1 max-lg:-mt-2"><QuickStart /></div>
      </section>

      <section>
        <SectionTitle eyebrow="Insight" title="Ciò che emerge dalle ricerche" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((i, k) => (
            <Card key={i.t} className="lift">
              <div className="font-display text-sm font-bold text-primary">0{k + 1}</div>
              <h3 className="mt-1 text-lg font-semibold">{i.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{i.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Moduli" title="Due flussi, un motore comune" />
        <div className="grid gap-4 lg:grid-cols-2">
          {([["urban", Building2, "var(--urban)"], ["vine", Grape, "var(--vine)"]] as const).map(([k, Icon, col]) => (
            <Card key={k} className="p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl text-primary-foreground" style={{ background: col }}><Icon className="size-5" /></span>
                <h3 className="text-2xl font-semibold">{flows[k].name}</h3>
              </div>
              <div className="mt-4 space-y-2">
                {flows[k].modules.map((m) => (
                  <div key={m.t} className="rounded-2xl bg-muted p-4">
                    <div className="font-semibold" style={{ color: col }}>{m.t}</div>
                    <div className="text-sm text-muted-foreground">{m.d}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Architettura concettuale" title="Una base, due applicazioni" />
        <div className="grid gap-4 md:grid-cols-4">
          {[[Database, "Dati", "Sensori, satellite, meteo, cartografia"], [Box, "Modello", "Rappresentazione locale aggiornabile"], [LineChart, "Analisi", "Indicatori, scenari, incertezza"], [Compass, "DSS", "Confronto o raccomandazione supervisionata"]].map(([I, t, d]) => {
            const Icon = I as typeof Database;
            return <Card key={t as string} className="lift"><Icon className="size-6 text-primary" /><div className="mt-2 font-semibold">{t as string}</div><div className="text-sm text-muted-foreground">{d as string}</div></Card>;
          })}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[["A", "Micro Twin urbano", "Confronto tra interventi su piazze, parchi e percorsi esposti.", "Tecnici comunali e gestori del verde"], ["B", "Adaptive Vineyard", "Mappa dello stress e priorità per zone del vigneto.", "Agricoltori, consulenti, cooperative"], ["C", "Climate Decision Engine", "Motore comune con moduli urbano e agricolo.", "Enti, imprese e servizi territoriali"]].map(([a, t, d, u]) => (
            <Card key={a}><div className="font-display text-3xl font-bold text-primary/30">{a}</div><h3 className="text-lg font-semibold">{t}</h3><p className="text-sm text-muted-foreground">{d}</p><p className="mt-2 text-xs font-semibold">Utenti: {u}</p></Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Modello di business" title="Free e Premium" desc="Proposta di suddivisione delle funzioni, da validare con i test di usabilità. Le funzioni con la fotocamera IA sono riservate a Premium." />
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[1fr_4.25rem_5.25rem] items-center border-b bg-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[1fr_6rem_7rem] sm:text-sm sm:normal-case sm:tracking-normal">
            <div className="p-3 sm:p-4">Funzione</div>
            <div className="p-3 text-center sm:p-4">Free</div>
            <div className="border-l p-3 text-center font-semibold text-primary sm:p-4">Premium</div>
          </div>
          {plan.map(([t, free, premium]) => (
            <div key={t} className="grid grid-cols-[1fr_4.25rem_5.25rem] items-center border-b text-sm last:border-b-0 sm:grid-cols-[1fr_6rem_7rem]">
              <div className="p-3 sm:p-4">{t}</div>
              <div className="grid place-items-center border-l p-2 sm:p-3"><Mark on={free} /></div>
              <div className="grid place-items-center border-l p-2 sm:p-3"><Mark on={premium} /></div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
