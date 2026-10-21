import { z } from "zod";
import { cases } from "./data";
const coordinates = [[37.3891,-5.9845],[41.3874,2.1686],[48.8566,2.3522],[45.4064,11.8768],[41.5584,14.6596],[41.9994,14.9939],[41.5957,14.2345],[1.3521,103.8198],[46.7712,23.5857],[46.3103,7.5715],[38.2975,-122.2869],[46.0748,11.1217],[41.3464,1.6974],[38.2975,-122.2869]];
export const caseLocations = cases.map((c,i) => ({ city:c.city, lat:coordinates[i]?.[0] ?? 0, lng:coordinates[i]?.[1] ?? 0 }));
export const publicationSchema = z.object({ title:z.string(), url:z.url().refine(u=>u.startsWith("https://")), publishedAt:z.string().nullable(), excerpt:z.string() });
export type CasePublication = z.infer<typeof publicationSchema>;
export type CaseSourceUpdate = { case_id:string; publications:CasePublication[]; checked_at:string|null; attempted_at:string; error:string|null };
export type CaseWeather = { city:string; time:string; temperature:number|null; humidity:number|null; wind:number|null; precipitation:number|null };
export function parseCaseWeather(payload:unknown):CaseWeather[] {
  const rows=z.array(z.object({current:z.object({time:z.number(),temperature_2m:z.number().nullable(),relative_humidity_2m:z.number().nullable(),wind_speed_10m:z.number().nullable(),precipitation:z.number().nullable()})})).parse(payload);
  if(rows.length!==cases.length) throw new Error("Incomplete weather locations");
  return rows.map((r,i)=>({city:cases[i]?.city??"",time:new Date(r.current.time*1000).toISOString(),temperature:r.current.temperature_2m,humidity:r.current.relative_humidity_2m,wind:r.current.wind_speed_10m,precipitation:r.current.precipitation}));
}
export const MAX_CASE_PUBLICATIONS=6;
/** The publisher's registrable domain (news.aqua4d.com → aqua4d.com, worldcitiessummit.com.sg kept whole),
 * so the publisher's main site and all its subdomains count as the same source. */
export const sourceDomain=(sourceUrl:string)=>{
  const labels=new URL(sourceUrl).hostname.replace(/^www\./,"").split(".");
  const secondLevel=labels.length>2&&labels.at(-1)!.length===2&&/^(com|co|org|gov|ac|edu|net)$/.test(labels.at(-2)!);
  return labels.slice(secondLevel?-3:-2).join(".");
};
export function sourcePublications(payload:unknown,sourceUrl:string):CasePublication[] {
  const result=z.object({results:z.array(z.object({title:z.string(),url:z.string(),publish_date:z.string().nullish(),excerpts:z.array(z.string()).nullish()})),warnings:z.array(z.unknown()).nullish()}).parse(payload);
  const domain=sourceDomain(sourceUrl);
  const seen=new Set<string>();
  // Newest first; publications without a declared date keep their search order after the dated ones.
  return result.results.flatMap(r=>{
    const p=publicationSchema.safeParse({title:r.title,url:r.url,publishedAt:r.publish_date??null,excerpt:r.excerpts?.join(" ").slice(0,1200)??""});
    if(!p.success||seen.has(p.data.url)) return [];
    seen.add(p.data.url);
    const host=new URL(p.data.url).hostname.replace(/^www\./,"");
    return host===domain||host.endsWith(`.${domain}`)?[p.data]:[];
  }).sort((a,b)=>(b.publishedAt??"").localeCompare(a.publishedAt??"")).slice(0,MAX_CASE_PUBLICATIONS);
}