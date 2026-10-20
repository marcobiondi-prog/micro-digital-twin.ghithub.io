/**
 * True touch capability, independent of the CSS pointer media queries.
 * Hybrid 2-in-1 laptops (Surface Pro and similar) report a fine primary
 * pointer, so `(any-pointer: coarse)` alone is not enough there; maxTouchPoints
 * still exposes the touchscreen. The result lands as `data-touch` on <html>
 * so CSS can key off it.
 */
export function isTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  if (navigator.maxTouchPoints > 0) return true;
  if (typeof window !== "undefined" && "ontouchstart" in window) return true;
  return false;
}

/** Mark the document once so CSS can show touch-only controls on hybrids. */
export function markTouchDevice(): void {
  if (typeof document === "undefined") return;
  document.documentElement.toggleAttribute("data-touch", isTouchDevice());
}
