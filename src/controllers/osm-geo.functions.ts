import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SearchedLocation } from "@/controllers/geo.functions";

// Ricerca gratuita per ospiti tramite OpenStreetMap (Nominatim): nessun costo Google.
const UA = { "User-Agent": "MicroDigitalTwin/1.0", "Accept-Language": "it" };

type NomItem = { lat: string; lon: string; display_name?: string; name?: string; address?: { road?: string; house_number?: string; city?: string; town?: string; village?: string; municipality?: string; state?: string } };

function label(item: NomItem, fallback: string) {
  const a = item.address ?? {};
  const street = [a.road, a.house_number].filter(Boolean).join(" ");
  const city = a.city ?? a.town ?? a.village ?? a.municipality;
  const name = item.name || street || item.display_name?.split(",")[0] || fallback;
  const parts = [street, city, a.state].filter((p): p is string => !!p && p.toLowerCase() !== name.toLowerCase());
  return [name, ...parts].join(" · ");
}

export const searchOsmLocation = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ query: z.string().trim().min(3).max(160) }).parse(d))
  .handler(async ({ data }): Promise<{ location?: SearchedLocation; error?: string }> => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", data.query); url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1"); url.searchParams.set("addressdetails", "1"); url.searchParams.set("countrycodes", "it,va,sm");
    try {
      const r = await fetch(url, { headers: UA });
      if (!r.ok) return { error: "Ricerca della zona non disponibile." };
      const [first] = (await r.json()) as NomItem[];
      if (!first) return { error: "Nessuna zona trovata. Prova con un indirizzo più preciso." };
      return { location: { label: label(first, data.query), lat: Number(first.lat), lng: Number(first.lon) } };
    } catch { return { error: "Ricerca della zona non disponibile." }; }
  });

export const reverseOsmLocation = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).parse(d))
  .handler(async ({ data }): Promise<{ location?: SearchedLocation }> => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${data.lat}&lon=${data.lng}&format=jsonv2&addressdetails=1`, { headers: UA });
      if (!r.ok) return {};
      const item = (await r.json()) as NomItem;
      return { location: { label: label({ ...item, name: "La mia posizione" }, "La mia posizione"), lat: data.lat, lng: data.lng } };
    } catch { return {}; }
  });

// Suggestions while typing for guests via Photon (OpenStreetMap, built for autocomplete).
type PhotonFeature = { geometry: { coordinates: [number, number] }; properties: { name?: string; street?: string; housenumber?: string; city?: string; state?: string; countrycode?: string } };
export const suggestOsmLocations = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ query: z.string().trim().min(2).max(160) }).parse(d))
  .handler(async ({ data }): Promise<{ suggestions: (SearchedLocation & { placeId: string; text: string })[] }> => {
    try {
      const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(data.query)}&limit=8&lat=41.9&lon=12.5`, { headers: UA });
      if (!r.ok) return { suggestions: [] };
      const feats = ((await r.json()) as { features?: PhotonFeature[] }).features ?? [];
      return { suggestions: feats.filter((f) => ["IT", "VA", "SM"].includes(f.properties.countrycode ?? "")).slice(0, 6).map((f, i) => {
        const p = f.properties;
        const street = [p.street, p.housenumber].filter(Boolean).join(" ");
        const name = p.name || street || data.query;
        const text = [name, street !== name ? street : "", p.city, p.state].filter(Boolean).join(", ");
        const [lng, lat] = f.geometry.coordinates;
        return { placeId: `osm-${i}-${lat}-${lng}`, text, label: text.replace(/, /g, " · "), lat, lng };
      }) };
    } catch { return { suggestions: [] }; }
  });
