export const PROMO_SEEN_KEY = "micro-digital-twin:promo-seen:v1";
export function shouldShowPromo(storage: Pick<Storage, "getItem">, sharedScenario = false): boolean {
  if (sharedScenario) return false;
  try { return storage.getItem(PROMO_SEEN_KEY) !== "1"; } catch { return false; }
}
export function markPromoSeen(storage: Pick<Storage, "setItem">): void {
  try { storage.setItem(PROMO_SEEN_KEY, "1"); } catch { /* Disabled storage. */ }
}