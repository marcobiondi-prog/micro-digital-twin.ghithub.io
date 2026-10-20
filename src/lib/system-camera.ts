/** Windows tablets ignore capture and open a file picker; use a live camera there. */
export function supportsSystemCapture(userAgent: string, platform: string, maxTouchPoints: number): boolean {
  return /Android|iPhone|iPad|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1);
}

/** Viewport-filling dialogs do not request browser fullscreen. */
export async function prepareSystemCamera(): Promise<void> {}

export function releaseSystemCamera(): void {}

/** Native capture must stay synchronous with the user's menu tap. */
export function openSystemCamera(input: HTMLInputElement | null, mode: "photo" | "video"): void {
  if (!input) return;
  input.accept = mode === "photo" ? "image/*" : "video/*";
  input.setAttribute("capture", "environment");
  input.multiple = false;
  input.value = "";
  // showPicker can choose a generic file picker on tablet/WebView hosts.
  input.click();
}