import { useEffect, useState } from "react";
import { isTouchDevice } from "@/lib/touch-device";

export function supportsTouchCenterCapture(touch: boolean, width: number, height: number) {
  return touch && width > 0 && height > 0;
}
/** Tablets have a short side of at least 600 px; phones fall below it. */
export function isTabletViewport(width: number, height: number) {
  return Math.min(width, height) >= 600;
}
export function useTouchCenterCapture(tabletOnly = false) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const sync = () => setEnabled(supportsTouchCenterCapture(isTouchDevice(), window.innerWidth, window.innerHeight) &&
      (!tabletOnly || isTabletViewport(window.innerWidth, window.innerHeight)));
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return enabled;
}
