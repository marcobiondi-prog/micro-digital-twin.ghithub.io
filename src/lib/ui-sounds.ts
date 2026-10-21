// Short recorded UI clicks played through Web Audio: decoded once, low latency, never blocking.
// WAV, not MP3: MP3 encoders pad the start with silence, which would delay the tap.
// Imported as an asset so its URL carries a content hash: a changed sound never plays from a stale cache.
import compareClickUrl from "@/assets/compare-click.wav";
import { isInstalledApp } from "@/lib/installed-app";
import { isTouchDevice } from "@/lib/touch-device";

export const COMPARE_CLICK_URL = compareClickUrl;
/** Slightly below full scale: the tap accompanies every button, so it stays discreet. */
export const UI_CLICK_VOLUME = 0.75;
/** Tablets sit closer to their speakers' full range, so they play a little softer. */
export const TABLET_CLICK_VOLUME = 0.6;

/**
 * Button taps belong to the installed app on touch devices: silent in a browser tab and on
 * desktops (no touchscreen); phones (short side < 600 px) play at UI_CLICK_VOLUME, tablets softer.
 */
export function uiClickVolume(): number {
  if (typeof window === "undefined" || !isInstalledApp() || !isTouchDevice()) return 0;
  const shortSide = Math.min(window.screen?.width || window.innerWidth, window.screen?.height || window.innerHeight);
  return shortSide < 600 ? UI_CLICK_VOLUME : TABLET_CLICK_VOLUME;
}

function tap(): void {
  const volume = uiClickVolume();
  if (volume > 0) playCompareClick(volume);
}
let context: AudioContext | undefined;
let click: Promise<AudioBuffer | null> | undefined;
let decoded: AudioBuffer | null = null;

function audioContext(): AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Audio) return undefined;
  if (!context || context.state === "closed") context = new Audio();
  return context;
}

/** Fetch and decode the compare-card click ahead of the first tap. */
export function preloadCompareClick(): Promise<AudioBuffer | null> {
  const ctx = audioContext();
  if (!ctx) return Promise.resolve(null);
  click ??= fetch(COMPARE_CLICK_URL)
    .then((r) => (r.ok && /audio|octet-stream/.test(r.headers.get("content-type") ?? "") ? r.arrayBuffer() : null))
    .then((data) => (data ? ctx.decodeAudioData(data) : null))
    .then((buffer) => (decoded = buffer))
    .catch(() => null);
  return click;
}

/** Keyboard-style tap (like Gboard keys or the PSP menu): a bright noise tick, a short tonal body, a faint knock and a high shimmer, played back at double speed (~25 ms); plays at once when already decoded. */
export function playCompareClick(volume = UI_CLICK_VOLUME): void {
  try {
    const ctx = audioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    const play = (buffer: AudioBuffer | null) => {
      if (!buffer) return;
      try {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = Math.min(1, Math.max(0, volume));
        source.connect(gain).connect(ctx.destination);
        source.onended = () => { source.disconnect(); gain.disconnect(); };
        source.start();
      } catch { /* Audio rejection must not block the choice. */ }
    };
    if (decoded) play(decoded);
    else void preloadCompareClick().then(play);
  } catch { /* Audio unavailable. */ }
}

/** Buttons and button-like controls; inline text links are left silent. */
const CLICKABLE = 'button, [role="button"], [role="tab"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="option"], [role="switch"], [role="checkbox"], [role="radio"], summary, a[href]';

function clickTarget(target: EventTarget | null): Element | null {
  const el = target instanceof Element ? target.closest(CLICKABLE) : null;
  if (!el || el.closest("[data-no-ui-click]")) return null;
  if (el.matches(":disabled, [aria-disabled='true']")) return null;
  if (el.tagName === "A" && getComputedStyle(el).display === "inline") return null;
  return el;
}

/**
 * One app-wide listener (volume and on/off from uiClickVolume). A mouse taps on button-down; touch and pen tap only when the
 * press activates the control (its click), so touching a button to scroll stays silent.
 * Keyboard activation (click with detail 0) taps on click. Controls with their own sound
 * (shutter, record, AI scan) and the system camera opt out with data-no-ui-click.
 */
export function installUiClicks(): () => void {
  if (typeof document === "undefined") return () => {};
  void preloadCompareClick();
  let pointer = "mouse";
  // The control a touch started on: menus that open on pointer down (Radix triggers) make
  // the following click land on the page behind them, so the press is matched to its start.
  let pressed: Element | null = null;
  const down = (e: PointerEvent) => {
    pointer = e.pointerType || "mouse";
    pressed = pointer === "mouse" ? null : clickTarget(e.target);
    if (pointer === "mouse" && e.button === 0 && clickTarget(e.target)) tap();
  };
  const click = (e: MouseEvent) => {
    const target = clickTarget(e.target) ?? (pressed?.isConnected ? pressed : null);
    if ((e.detail === 0 || pointer !== "mouse") && target) tap();
    pointer = "mouse";
    pressed = null;
  };
  const cancel = () => { pressed = null; };
  document.addEventListener("pointerdown", down, { capture: true, passive: true });
  document.addEventListener("click", click, { capture: true, passive: true });
  document.addEventListener("pointercancel", cancel, { capture: true, passive: true });
  return () => {
    document.removeEventListener("pointerdown", down, { capture: true });
    document.removeEventListener("click", click, { capture: true });
    document.removeEventListener("pointercancel", cancel, { capture: true });
  };
}
