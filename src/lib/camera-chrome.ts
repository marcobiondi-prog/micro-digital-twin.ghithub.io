// AI camera: dark system bars instead of white ones while the camera is open. No browser fullscreen
// (it interfered with rotation and brought Chrome's notice): a camera-owned dark theme-color, prepended
// to <head> because browsers use the first one and the app's own tag is managed by the router head.

const CAMERA_THEME = "#000000";
let cameraMeta: HTMLMetaElement | null = null;
// The router may re-render <head> and drop foreign tags: while the camera is open, put it back first.
let headWatch: MutationObserver | null = null;
const keepFirst = () => { if (cameraMeta && document.head.firstChild !== cameraMeta) document.head.prepend(cameraMeta); };

export function enterCameraChrome() {
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
}

export function exitCameraChrome() {
  headWatch?.disconnect();
  headWatch = null;
  cameraMeta?.remove();
}
