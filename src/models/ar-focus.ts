export type ArKind = "urban" | "vineyard";
export type ArFocus = "tree" | "ground" | "leaf" | "canopy" | "interrow";

type FocusOption = { id: ArFocus; label: string; hint: string; prompt: string };

/** Each Lab tab opens its own AI camera: distinct targets, commands and analysis emphasis. */
export const AR_FOCUS: Record<ArKind, readonly FocusOption[]> = {
  urban: [
    { id: "tree", label: "Alberi e ombra", hint: "Inquadra chioma e tronco: stima ombra e raffrescamento per i pedoni.",
      prompt: "Obiettivo urbano: alberatura stradale o di piazza. Privilegia chioma, tronco e specie arborea; l'ombra serve al comfort dei pedoni." },
    { id: "ground", label: "Suolo e depavimentazione", hint: "Inquadra la pavimentazione: permeabilità e possibilità di depavimentare.",
      prompt: "Obiettivo urbano: superficie e pavimentazione. Privilegia soil e survey: asfalto, cemento, lastricato o terra; nella note indica se la depavimentazione (aiuola, pozzo drenante) è fattibile e l'accumulo di calore apparente." },
  ],
  vineyard: [
    { id: "leaf", label: "Foglia e varietà", hint: "Avvicinati a 20–30 cm da una foglia: forma, lobi e segni di stress.",
      prompt: "Obiettivo vitivinicolo: singola foglia da vicino. Privilegia l'ampelografia (lobi, seni, dentatura, nervature) e nell'evidence segnala segni visibili di stress termico, clorosi o scottature, senza diagnosi certe." },
    { id: "canopy", label: "Parete vegetativa", hint: "Inquadra il filare: densità della chioma e ombra sui grappoli.",
      prompt: "Obiettivo vitivinicolo: parete vegetativa del filare. Privilegia densità fogliare e ombreggiamento della fascia dei grappoli; density riflette la parete osservata in modo indicativo." },
    { id: "interrow", label: "Interfilare", hint: "Inquadra il suolo tra i filari: inerbimento, suolo nudo e compattamento.",
      prompt: "Obiettivo vitivinicolo: interfilare. Privilegia soil e survey: inerbimento, suolo nudo, pacciamatura, segni apparenti di compattamento ed evaporazione; consiglia la verifica con sonda." },
  ],
};

export function defaultArFocus(kind: ArKind): ArFocus { return AR_FOCUS[kind][0]!.id; }

/** Rejects a target belonging to the other tab, falling back to that tab's default. */
export function arFocusOption(kind: ArKind, focus: ArFocus | undefined): FocusOption {
  return AR_FOCUS[kind].find(o => o.id === focus) ?? AR_FOCUS[kind][0]!;
}
