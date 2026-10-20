export type CaptureSummary = {
  commonName: string; scientificName: string; level: string;
  count: number; cooling: number | null; shade: number | null;
};

/** A capture snapshot, never a live temperature measurement. */
export function captureSummaryLines(summary: CaptureSummary | null, context: string): string[] {
  const lines = [context || "Sopralluogo AI"];
  if (!summary) return [...lines, "Pianta non identificata · nessuna stima botanica"];
  return [...lines, `${summary.commonName} · ${summary.scientificName} · ${summary.level}`,
    `${summary.count} esemplari · raffrescamento ${summary.cooling === null ? "n.d." : `≈ −${summary.cooling.toFixed(1)} °C`} · ombra ${summary.shade === null ? "n.d." : `≈ ${Math.round(summary.shade)} m²`}`,
    "Stime indicative · temperatura non misurata"];
}