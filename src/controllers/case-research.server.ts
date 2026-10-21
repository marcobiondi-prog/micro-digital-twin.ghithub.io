import { cases } from "@/models/data";
import { sourceDomain, sourcePublications } from "@/models/case-updates";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
export async function refreshCaseSources(client:SupabaseClient<Database>,parallelKey:string){
  const results=await Promise.all(cases.map(async study=>{
    const attempted_at=new Date().toISOString();
    try{
      const response=await fetch("https://api.parallel.ai/v1/search",{method:"POST",headers:{"x-api-key":parallelKey,"Content-Type":"application/json"},signal:AbortSignal.timeout(25000),body:JSON.stringify({
        objective:`Find the latest publications and documented updates about ${study.project} in ${study.city} from its original publisher. Prioritize recent publication dates; exclude unrelated projects. Reference: ${study.sourceUrl}`,
        search_queries:[`${study.project} ${study.city}`,study.project,`${study.city} ${study.tags.join(" ")}`].map(q=>q.slice(0,200)),mode:"fast",advanced_settings:{max_results:10,excerpt_settings:{max_chars_per_result:1200},source_policy:{include_domains:[sourceDomain(study.sourceUrl)]}}
      })});
      if(!response.ok){const body=await response.text();console.error(`Parallel [${response.status}]: ${body}`);throw new Error(`Parallel (${response.status}): ${body}`);}
      const payload=await response.json();if(payload.warnings?.length)console.warn("Parallel warnings",payload.warnings);
      const publications=sourcePublications(payload,study.sourceUrl);
      const {error}=await client.from("case_source_updates").upsert({case_id:study.city,publications,checked_at:attempted_at,attempted_at,error:null});if(error)throw error;
      return {city:study.city,ok:true};
    }catch(error){
      console.error(`Case research ${study.city}`,error);
      const {data:previous}=await client.from("case_source_updates").select("case_id").eq("case_id",study.city).maybeSingle();
      const record={attempted_at,error:"Verifica della fonte non riuscita"};
      const write=previous?await client.from("case_source_updates").update(record).eq("case_id",study.city):await client.from("case_source_updates").insert({case_id:study.city,...record});
      if(write.error)console.error("Case failure save",write.error);
      return {city:study.city,ok:false};
    }
  }));return {results,successful:results.filter(r=>r.ok).length};
}