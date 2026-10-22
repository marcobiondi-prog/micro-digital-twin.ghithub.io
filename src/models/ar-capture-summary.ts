export type CaptureSummary = {
  commonName: string; scientificName: string; level: string;
  count: number; cooling: number | null; shade: number | null;
};

/** A capture snapshot, never a live temperature measurement. */
export function captureSummaryLines(summary: CaptureSummary | null, context: string, satellite: string | null = null): string[] {
  const lines = [context || "Sopralluogo AI"];
  // Copernicus area context, when read: satellite values for the surroundings, not the photo.
  const area = satellite ? [satellite] : [];
  if (!summary) return [...lines, "Pianta non identificata · nessuna stima botanica", ...area];
  return [...lines, `${summary.commonName} · ${summary.scientificName} · ${summary.level}`,
    `${summary.count} esemplari · raffrescamento ${summary.cooling === null ? "n.d." : `≈ −${summary.cooling.toFixed(summary.cooling > 0 && summary.cooling < 0.095 ? 2 : 1)} °C`} · ombra ${summary.shade === null ? "n.d." : `≈ ${Math.round(summary.shade)} m²`}`,
    ...area,
    "Stime indicative · temperatura non misurata"];
}