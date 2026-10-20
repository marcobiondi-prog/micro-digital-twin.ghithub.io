import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { caseLocations, parseCaseWeather, publicationSchema, type CaseSourceUpdate } from "@/models/case-updates";
export const getCaseWeather=createServerFn({method:"GET"}).handler(async()=>{
  const url=new URL("https://api.open-meteo.com/v1/forecast");
  url.search=new URLSearchParams({latitude:caseLocations.map(p=>p.lat).join(","),longitude:caseLocations.map(p=>p.lng).join(","),current:"temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation",timezone:"GMT",timeformat:"unixtime",forecast_days:"1"}).toString();
  try{
    const r=await fetch(url,{signal:AbortSignal.timeout(12000)});
    if(!r.ok){const body=await r.text();console.error(`Open-Meteo [${r.status}]: ${body}`);return {readings:[],error:`Open-Meteo non disponibile (${r.status})`};}
    return {readings:parseCaseWeather(await r.json()),error:null};
  }catch(e){console.error("Case weather",e);return {readings:[],error:"Meteo momentaneamente non disponibile"};}
});
/** La tabella non ha più accesso diretto dal browser: il server legge solo le colonne pubbliche
 * e non espone mai il testo interno degli errori del job. */
export const getCaseSources=createServerFn({method:"GET"}).handler(async():Promise<{updates:CaseSourceUpdate[];error:string|null}>=>{
  // Not configured yet: behave like "first check pending" instead of showing an error.
  if(!process.env["SUPABASE_SERVICE_ROLE_KEY"])return {updates:[],error:null};
  try{
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const {data,error}=await supabaseAdmin.from("case_source_updates").select("case_id,publications,checked_at,attempted_at,error");
    if(error){console.error("Case sources",error);return {updates:[],error:"Fonti momentaneamente non disponibili"};}
    return {updates:(data??[]).map(r=>({...r,error:r.error?"Aggiornamento non riuscito":null,publications:z.array(publicationSchema).safeParse(r.publications).data??[]})),error:null};
  }catch(e){console.error("Case sources",e);return {updates:[],error:"Fonti momentaneamente non disponibili"};}
});
