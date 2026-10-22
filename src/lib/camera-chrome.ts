// AI camera edge-to-edge: hides the white system bars while the camera is open.
// 1) Browser fullscreen (hides status and navigation bar) where the host allows it: Android/desktop
//    Chrome, needs the tap that opened the camera (transient user activation). iOS has no element
//    fullscreen, so it is skipped there.
// 2) Always, as the fallback when fullscreen is refused: a dark theme-color, so at least the status
//    bar turns dark. Both are undone on close; leaving fullscreen with Back closes the camera (ArCamera).

const CAMERA_THEME = "#000000";
let enteredFullscreen = false;
// Our own theme-color, placed first in <head> (browsers use the first one): the app's own tag is
// managed by the router head and must not be rewritten.
let cameraMeta: HTMLMetaElement | null = null;

/** Which way the camera goes edge-to-edge on this device. */
export function cameraChromeMode(doc: Pick<Document, "fullscreenEnabled"> & { documentElement: { requestFullscreen?: unknown } }): "fullscreen" | "dark-bars" {
  return doc.fullscreenEnabled && typeof doc.documentElement.requestFullscreen === "function" ? "fullscreen" : "dark-bars";
}

export function enterCameraChrome() {
  if (!cameraMeta) {
    cameraMeta = document.createElement("meta");
    cameraMeta.name = "theme-color";
    cameraMeta.content = CAMERA_THEME;
    cameraMeta.dataset["cameraChrome"] = "";
  }
  if (!cameraMeta.isConnected) document.head.prepend(cameraMeta);
  if (cameraChromeMode(document) !== "fullscreen" || document.fullscreenElement) return;
  document.documentElement.requestFullscreen({ navigationUI: "hide" })
    .then(() => { enteredFullscreen = true; })
    .catch(() => { /* Refused (no user activation, WebView, policy): the dark bars stay as fallback. */ });
}

export function exitCameraChrome() {
  cameraMeta?.remove();
  if (enteredFullscreen && document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  enteredFullscreen = false;
}
