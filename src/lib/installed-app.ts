import { useSyncExternalStore } from "react";

// The app counts as installed when it runs outside a browser tab: a PWA window
// (standalone/fullscreen/minimal-ui) or an iOS home-screen web app.
const QUERY = "(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)";

export function isInstalledApp(): boolean {
  if (typeof window === "undefined") return false;
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  return window.matchMedia?.(QUERY).matches ?? false;
}

function subscribe(onChange: () => void) {
  const media = typeof window !== "undefined" ? window.matchMedia?.(QUERY) : undefined;
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
}

/** Server render and browser tabs report false; an installed window reports true. */
export function useInstalledApp(): boolean {
  return useSyncExternalStore(subscribe, isInstalledApp, () => false);
}
