import { sameBotanicalName } from "@/models/ar-botanical-match";

/**
 * Reference photo of the identified species for Esito, from botanical databases rather than the camera:
 * first Royal Botanic Gardens, Kew (Plants of the World Online, curated images), then GBIF occurrence
 * photos with an open licence. Pure parsers here; the server fetches (ar-detect.functions.ts).
 */
export type ReferencePhoto = { url: string; credit: string; link: string };

type PowoImage = { thumbnail?: string; fullsize?: string; caption?: string };
type PowoResult = { name?: string; accepted?: boolean; url?: string; fqId?: string; images?: PowoImage[] };

const https = (u: string | undefined) => (u ? (u.startsWith("//") ? `https:${u}` : u) : "");

/** First Kew image of the result whose name is the scanned species (accepted names first). */
export function pickPowoPhoto(json: unknown, scientificName: string): ReferencePhoto | null {
  const results = ((json as { results?: PowoResult[] } | null)?.results ?? []).filter((r) => r.name && sameBotanicalName(r.name, scientificName));
  results.sort((a, b) => Number(Boolean(b.accepted)) - Number(Boolean(a.accepted)));
  for (const r of results) {
    const image = r.images?.find((i) => /^(https:)?\/\//.test(i.fullsize ?? i.thumbnail ?? ""));
    const url = https(image?.fullsize ?? image?.thumbnail);
    if (!url.startsWith("https://")) continue;
    const path = r.url ?? (r.fqId ? `/taxon/${r.fqId}` : "");
    return { url, credit: `Royal Botanic Gardens, Kew · Plants of the World Online${image?.caption ? ` · ${image.caption.slice(0, 80)}` : ""}`, link: `https://powo.science.kew.org${path}` };
  }
  return null;
}

type GbifMedia = { type?: string; identifier?: string; license?: string; creator?: string; rightsHolder?: string };
type GbifOccurrence = { key?: number; media?: GbifMedia[] };

/** Short name of an open licence URL, or null when the photo may not be shown (e.g. all rights reserved). */
export function openLicence(license: string | undefined): string | null {
  const l = (license ?? "").toLowerCase();
  if (/publicdomain\/zero|cc0/.test(l)) return "CC0";
  const m = /licenses\/(by(?:-nc)?(?:-sa)?)\//.exec(l) ?? /\bcc[ _-](by(?:[ _-]nc)?(?:[ _-]sa)?)\b/.exec(l);
  return m ? `CC ${m[1]!.replace(/[ _]/g, "-").toUpperCase()}` : null;
}

/** First openly licensed still image among GBIF occurrences of the species. */
export function pickGbifPhoto(json: unknown): ReferencePhoto | null {
  for (const o of (json as { results?: GbifOccurrence[] } | null)?.results ?? []) {
    for (const m of o.media ?? []) {
      const licence = openLicence(m.license);
      if (m.type !== "StillImage" || !licence || !m.identifier?.startsWith("https://") || !o.key) continue;
      const author = (m.creator || m.rightsHolder || "").trim().slice(0, 60);
      return { url: m.identifier, credit: `${author ? `${author} · ` : ""}${licence} · via GBIF`, link: `https://www.gbif.org/occurrence/${o.key}` };
    }
  }
  return null;
}
