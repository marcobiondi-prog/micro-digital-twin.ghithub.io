// Short recorded UI clicks played through Web Audio: decoded once, low latency, never blocking.
export const COMPARE_CLICK_URL = "/sounds/compare-click.mp3";
let context: AudioContext | undefined;
let click: Promise<AudioBuffer | null> | undefined;

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
    .catch(() => null);
  return click;
}

/** Single soft tap when a large Compare card is chosen. */
export function playCompareClick(volume = 0.8): void {
  try {
    const ctx = audioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    void preloadCompareClick().then((buffer) => {
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
    });
  } catch { /* Audio unavailable. */ }
}
