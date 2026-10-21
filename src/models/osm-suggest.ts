// Photon (OpenStreetMap) autocomplete: one URL and parser shared by the server function and the browser fallback.
export type OsmSuggestion = { placeId: string; text: string; label: string; lat: number; lng: number };
type PhotonFeature = { geometry?: { coordinates?: [number, number] }; properties?: { name?: string; street?: string; housenumber?: string; city?: string; state?: string; countrycode?: string } };

export const photonUrl = (query: string) => `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lat=41.9&lon=12.5`;

/** Italian (plus Vatican and San Marino) places only, at most six, labelled like the Google results. */
export function photonSuggestions(payload: unknown, query: string): OsmSuggestion[] {
  const features = (payload as { features?: PhotonFeature[] } | null)?.features ?? [];
  return features.flatMap((f) => {
    const p = f.properties ?? {};
    const [lng, lat] = f.geometry?.coordinates ?? [];
    if (!["IT", "VA", "SM"].includes(p.countrycode ?? "") || typeof lat !== "number" || typeof lng !== "number") return [];
    const street = [p.street, p.housenumber].filter(Boolean).join(" ");
    const name = p.name || street || query;
    const text = [name, street !== name ? street : "", p.city !== name ? p.city : "", p.state].filter(Boolean).join(", ");
    return [{ placeId: `osm-${lat}-${lng}`, text, label: text.replace(/, /g, " · "), lat, lng }];
  }).filter((s, i, all) => all.findIndex((o) => o.placeId === s.placeId) === i).slice(0, 6);
}
