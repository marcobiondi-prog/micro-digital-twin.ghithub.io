/**
 * Italian, actionable text for a Geocoding REQUEST_DENIED. Google explains the cause only in
 * `error_message`, so the server key's setup problem is named instead of a generic refusal.
 */
export function geocodingDeniedMessage(errorMessage = ""): string {
  const text = errorMessage.toLowerCase();
  if (text.includes("referer")) return "La chiave server Google Maps ha una restrizione per siti web: in Google Cloud imposta «Restrizioni delle applicazioni: Nessuna».";
  if (text.includes("billing")) return "Fatturazione non attiva sul progetto Google Cloud della chiave server.";
  if (text.includes("invalid")) return "Chiave server Google Maps non valida: ricopiala su Vercel (GOOGLE_MAPS_API_KEY) e ripubblica.";
  if (text.includes("not authorized") || text.includes("not activated") || text.includes("not enabled")) return "La chiave server non abilita Geocoding API: abilitala nel progetto e aggiungila alle restrizioni API della chiave.";
  return "Google Maps ha rifiutato la ricerca: verifica la chiave server.";
}
