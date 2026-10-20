/** Resolve a deliberate swipe in the rotated tutorial's own coordinates. */
export function tutorialSwipeStep(step: number, total: number, dx: number, dy: number, rotation: number) {
  const angle = rotation * Math.PI / 180;
  const horizontal = dx * Math.cos(angle) + dy * Math.sin(angle);
  const vertical = -dx * Math.sin(angle) + dy * Math.cos(angle);
  if (Math.abs(horizontal) < 48 || Math.abs(horizontal) < Math.abs(vertical) * 1.5) return step;
  return Math.max(0, Math.min(total - 1, step + (horizontal < 0 ? 1 : -1)));
}