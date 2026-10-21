import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// After a new deploy, an open tab may request page chunks that no longer exist.
// Reload once to pick up the fresh build instead of showing a blank screen.
const RELOAD_KEY = "chunk-reload-at";
/** Drop the service worker's cached pages first: on a slow network it may serve the old
 * HTML, whose chunks no longer exist, and the reload would fail the same way again. */
export async function reloadFresh() {
  try { if ("caches" in window) await caches.delete("pages"); } catch { /* cache unavailable */ }
  window.location.reload();
}
function reloadForStaleChunk() {
  const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
  if (Date.now() - last < 10_000) return;
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  void reloadFresh();
}
const isChunkError = (e: unknown) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    String((e as { message?: string })?.message ?? e),
  );
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadForStaleChunk();
  });
  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkError(event.reason)) reloadForStaleChunk();
  });
  window.addEventListener("error", (event) => {
    if (isChunkError(event.error ?? event.message)) reloadForStaleChunk();
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
