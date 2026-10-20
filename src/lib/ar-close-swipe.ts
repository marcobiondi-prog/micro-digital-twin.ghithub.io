/** Deliberate upward or leftward swipes; taps, right/down and diagonals stay inert. */
export function isArCloseSwipe(dx: number, dy: number) {
  return (dy <= -64 && -dy >= Math.abs(dx) * 1.5) ||
    (dx <= -64 && -dx >= Math.abs(dy) * 1.5);
}
/** Left swipes across the preview; upward swipes start in the lower quarter. */
export function isCameraCloseGesture(dx: number, dy: number, startY: number, height: number) {
  return isArCloseSwipe(dx, dy) && (dx <= -64 || startY >= height * 0.75);
}
