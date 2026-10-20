export function sameBotanicalName(a: string, b: string) {
  const normalize = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();
  return normalize(a) === normalize(b);
}
export function usableBotanicalMatch(input: string, match: { name?: string | undefined; rank?: string | undefined; kingdom?: string | undefined; type?: string | undefined }) {
  return match.kingdom === "Plantae" && ["species", "genus", "subspecies", "variety"].includes(match.rank ?? "") &&
    ["EXACT", "exact", "variant"].includes(match.type ?? "") && !!match.name && sameBotanicalName(input, match.name);
}