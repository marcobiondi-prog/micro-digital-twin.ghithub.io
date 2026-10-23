// AI camera edge-to-edge: hides the white system bars while the camera is open.
// 1) Browser fullscreen (hides status and navigation bar) where the host allows it: Android/desktop
//    Chrome, needs the tap that opened the camera (transient user activation). iOS has no element
//    fullscreen, so it is skipped there.
// 2) Always, as the fallback when fullscreen is refused: a dark theme-color, so at least the status
//    bar turns dark. Both are undone on close. In fullscreen only Android rotates (cameraRotatesNatively).
// Android Back first only leaves fullscreen (no popstate): a fullscreen exit that does not follow a
// rotation is that Back and closes the camera at once, so one Back is enough (fullscreenExitIsBack).

const CAMERA_THEME = "#000000";
let enteredFullscreen = false;
let cameraMeta: HTMLMetaElement | null = null;
// The router may re-render <head> and drop foreign tags: while the camera is open, put it back first.
let headWatch: MutationObserver | null = null;
const keepFirst = () => { if (cameraMeta && document.head.firstChild !== cameraMeta) document.head.prepend(cameraMeta); };

/** Which way the camera goes edge-to-edge on this device. */
export function cameraChromeMode(doc: Pick<Document, "fullscreenEnabled"> & { documentElement: { requestFullscreen?: unknown } }): "fullscreen" | "dark-bars" {
  return doc.fullscreenEnabled && typeof doc.documentElement.requestFullscreen === "function" ? "fullscreen" : "dark-bars";
}

/**
 * One rotation at a time. In fullscreen the screen may rotate natively (lock "any"), so the camera stops its
 * own CSS rotation and simply follows the native layout: no double turn. Outside fullscreen (refused, iOS,
 * or after leaving it) the app stays portrait and the camera surface turns by itself as before.
 */
let nativeRotation = false;
export function cameraRotatesNatively() { return nativeRotation; }
function allowNativeRotation() {
  const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
  if (!orientation?.lock) return;
  void orientation.lock("any")
    .then(() => { nativeRotation = Boolean(document.fullscreenElement); window.dispatchEvent(new Event("ar-orientation-change")); })
    .catch(() => { /* Host refuses: the camera keeps its own rotation. */ });
}
const onFullscreenChange = () => {
  if (document.fullscreenElement || !nativeRotation) return;
  nativeRotation = false;
  window.dispatchEvent(new Event("ar-orientation-change"));
};

/**
 * A screen-orientation change within this window explains a fullscreen exit. Resize is not used: leaving
 * fullscreen resizes the page by itself, so a Back would look like a rotation.
 */
export const ROTATION_EXIT_WINDOW_MS = 1000;
let lastTurn = Number.NEGATIVE_INFINITY;
const markTurn = () => { lastTurn = performance.now(); };

/** True when a fullscreen exit is the user's Back (close the camera), false when a rotation caused it. */
export function fullscreenExitIsBack(now: number, lastTurnAt: number = lastTurn) {
  return now - lastTurnAt > ROTATION_EXIT_WINDOW_MS;
}

/** Resolves true when the camera went fullscreen (Chrome shows its own notice). */
export function enterCameraChrome(): Promise<boolean> {
  if (!cameraMeta) {
    cameraMeta = document.createElement("meta");
    cameraMeta.name = "theme-color";
    cameraMeta.content = CAMERA_THEME;
    cameraMeta.dataset["cameraChrome"] = "";
  }
  keepFirst();
  if (!headWatch && typeof MutationObserver !== "undefined") {
    headWatch = new MutationObserver(keepFirst);
    headWatch.observe(document.head, { childList: true });
  }
  screen.orientation?.addEventListener?.("change", markTurn);
  document.addEventListener("fullscreenchange", onFullscreenChange);
  if (cameraChromeMode(document) !== "fullscreen" || document.fullscreenElement) return Promise.resolve(false);
  return document.documentElement.requestFullscreen({ navigationUI: "hide" })
    .then(() => { enteredFullscreen = true; allowNativeRotation(); return true; })
    .catch(() => false /* Refused (no user activation, WebView, policy): dark bars stay. */);
}

export function exitCameraChrome() {
  headWatch?.disconnect();
  headWatch = null;
  cameraMeta?.remove();
  screen.orientation?.removeEventListener?.("change", markTurn);
  document.removeEventListener("fullscreenchange", onFullscreenChange);
  nativeRotation = false;
  if (enteredFullscreen && document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  enteredFullscreen = false;
}
