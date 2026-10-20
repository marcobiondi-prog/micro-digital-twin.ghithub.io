import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
export const Route=createFileRoute("/api/public/jobs/case-sources")({server:{handlers:{POST:async({request})=>{
  const failure=await authenticateCronRequest(request);if(failure)return failure;
  const parallelKey=process.env["PARALLEL_API_KEY"];
  if(!parallelKey)return Response.json({error:"Research connection unavailable"},{status:503});
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {refreshCaseSources}=await import("@/controllers/case-research.server");
  const result=await refreshCaseSources(supabaseAdmin,parallelKey);
  return Response.json(result,{status:result.successful===0?502:200});
}}}});