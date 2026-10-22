// AI camera edge-to-edge: hides the white system bars while the camera is open.
// 1) Browser fullscreen (hides status and navigation bar) where the host allows it: Android/desktop
//    Chrome, needs the tap that opened the camera (transient user activation). iOS has no element
//    fullscreen, so it is skipped there.
// 2) Always, as the fallback when fullscreen is refused: a dark theme-color, so at least the status
//    bar turns dark. Both are undone on close. Losing this fullscreen (rotation, Back) never closes the
//    camera: it simply stays open with the dark bars (cameraOwnsFullscreen).

const CAMERA_THEME = "#000000";
let enteredFullscreen = false;
// Our own theme-color, placed first in <head> (browsers use the first one): the app's own tag is
// managed by the router head and must not be rewritten.
let cameraMeta: HTMLMetaElement | null = null;

/** Which way the camera goes edge-to-edge on this device. */
export function cameraChromeMode(doc: Pick<Document, "fullscreenEnabled"> & { documentElement: { requestFullscreen?: unknown } }): "fullscreen" | "dark-bars" {
  return doc.fullscreenEnabled && typeof doc.documentElement.requestFullscreen === "function" ? "fullscreen" : "dark-bars";
}

/** True while the camera itself asked for fullscreen; its exit must not be read as "close the camera". */
let ownsFullscreen = false;
export function cameraOwnsFullscreen() { return ownsFullscreen; }

/** Resolves true when the camera went fullscreen (the caller then shows its own short hint). */
export function enterCameraChrome(): Promise<boolean> {
  if (!cameraMeta) {
    cameraMeta = document.createElement("meta");
    cameraMeta.name = "theme-color";
    cameraMeta.content = CAMERA_THEME;
    cameraMeta.dataset["cameraChrome"] = "";
  }
  if (!cameraMeta.isConnected) document.head.prepend(cameraMeta);
  if (cameraChromeMode(document) !== "fullscreen" || document.fullscreenElement) return Promise.resolve(false);
  ownsFullscreen = true;
  return document.documentElement.requestFullscreen({ navigationUI: "hide" })
    .then(() => { enteredFullscreen = true; return true; })
    .catch(() => { ownsFullscreen = false; return false; /* Refused (no user activation, WebView, policy): dark bars stay. */ });
}

export function exitCameraChrome() {
  cameraMeta?.remove();
  if (enteredFullscreen && document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  enteredFullscreen = false;
  ownsFullscreen = false;
}
