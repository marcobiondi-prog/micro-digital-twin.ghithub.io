/** Open edge-to-edge without requesting browser fullscreen. */
export async function prepareArOrientation(): Promise<void> {
  setArOrientationActive(true);
}

/** Native orientation policy shared by the app shell and camera lifecycle. */
export async function syncAppOrientation(): Promise<void> {
  const active = document.documentElement.hasAttribute("data-ar-camera");
  const mobile = navigator.maxTouchPoints > 0 || Math.min(screen.width, screen.height) <= 639;
  if (!active && !mobile) return;
  const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
  if (!orientation) return;
  try {
    // AR rotates freely. Home videos keep the portrait lock: their surface is drawn
    // landscape by CSS, so opening/closing never triggers a system rotation.
    await orientation.lock?.(active ? "any" : "portrait-primary");
    // A portrait request already in flight must not relock a newly opened camera.
    if (active !== document.documentElement.hasAttribute("data-ar-camera")) {
      await syncAppOrientation();
    }
  } catch {
    // Release runtime portrait locking; manifest/APK overrides need host support.
    if (active && document.documentElement.hasAttribute("data-ar-camera")) {
      try { orientation.unlock(); } catch { /* Unsupported host. */ }
    }
  }
}

/** Camera-only exception to the app's portrait lock. */
export function setArOrientationActive(active: boolean) {
  document.documentElement.toggleAttribute("data-ar-camera", active);
  void syncAppOrientation();
  window.dispatchEvent(new Event("ar-orientation-change"));
}

/** Project gravity onto screen-down without Euler swaps or full spins. */
export function cameraViewport(width: number, height: number, angle: number, beta: number | null, gamma: number | null, previousRotation = 0) {
  // Native resize wins. Only rotate the inner camera surface when a portrait
  // WebView refuses free orientation without browser fullscreen.
  let rotation = 0;
  if (width < height) {
    const normalized = ((angle % 360) + 360) % 360;
    if (normalized === 90 || normalized === 270) rotation = normalized === 90 ? 90 : -90;
    else if (normalized === 0 && beta != null && gamma != null) {
      // Screen-plane gravity separates an actual quarter turn from camera pitch.
      // When nearly flat or between cardinal directions, keep the last orientation.
      const b = beta * Math.PI / 180, g = gamma * Math.PI / 180;
      const x = -Math.cos(b) * Math.sin(g), y = Math.sin(b);
      rotation = previousRotation;
      if (Math.hypot(x, y) >= 0.45) {
        const bearing = Math.atan2(x, y) * 180 / Math.PI;
        const cardinal = Math.round(bearing / 90) * 90;
        if (Math.abs(bearing - cardinal) <= 25) rotation = cardinal === -180 ? 180 : cardinal || 0;
      }
    }
  }
  const sideways = Math.abs(rotation) === 90;
  return { width: sideways ? height : width, height: sideways ? width : height, rotation, landscape: width > height || sideways };
}

/** Project gravity onto screen-down without Euler swaps or full spins. */
export function groundTilt(beta: number, gamma: number, angle: number) {
  const b = beta * Math.PI / 180;
  const g = gamma * Math.PI / 180;
  const a = angle * Math.PI / 180;
  const x = -Math.cos(b) * Math.sin(g);
  const y = Math.sin(b);
  const z = Math.cos(b) * Math.cos(g);
  const down = y * Math.cos(a) - x * Math.sin(a);
  const pitch = Math.atan2(Math.abs(z), Math.abs(down)) * 180 / Math.PI;
  return { beta: 90 - Math.max(15, Math.min(40, pitch)), gamma: 0 };
}

export const isGroundPoint = (ny: number) => ny >= 0.48 && ny <= 1;
/** Follow the shortest turn, including crossing ±180°. */
export function shortestRotationDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}
