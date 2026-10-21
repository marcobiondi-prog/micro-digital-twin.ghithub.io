// Short recorded UI clicks played through Web Audio: decoded once, low latency, never blocking.
// WAV, not MP3: MP3 encoders pad the start with silence, which would delay the tap.
export const COMPARE_CLICK_URL = "/sounds/compare-click.wav";
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

/** Low, muffled tap (E5 over the original click, low-passed) when a large Compare card is pressed; plays at once when already decoded. */
export function playCompareClick(volume = 1): void {
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
