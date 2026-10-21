export type CameraSound = "shutter" | "video-start" | "video-stop" | "scan-start" | "scan-done" | "scan-fail";
type ToneCue = { tones: number[]; gap: number; wave: OscillatorType };
// AI scan cues: a quick rising arpeggio, a bright chime when results land, a falling pair on failure.
const CUES: Record<Exclude<CameraSound, "shutter">, ToneCue> = {
  "video-start": { tones: [660, 880], gap: 0.09, wave: "sine" },
  "video-stop": { tones: [880, 660], gap: 0.09, wave: "sine" },
  "scan-start": { tones: [523, 659, 784], gap: 0.05, wave: "triangle" },
  "scan-done": { tones: [784, 1047, 1319], gap: 0.09, wave: "triangle" },
  "scan-fail": { tones: [440, 330], gap: 0.12, wave: "sine" },
};
let audio: AudioContext | undefined;

/** Browser-safe, local system-style cues; native cameras own their sounds. */
export function playCameraSound(sound: CameraSound, volume = 1): void {
  if (typeof window === "undefined") return;
  try {
    const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Audio) return;
    if (!audio || audio.state === "closed") audio = new Audio();
    const context = audio;
    const play = () => {
      const now = context.currentTime;
      const level = Math.min(2, Math.max(0, volume));
      if (sound === "shutter") {
        // Mechanical "clic-clac": two filtered noise bursts plus a low mirror thunk, loud enough for phone speakers.
        const burst = (at: number, length: number, frequency: number, peak: number) => {
          const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * length), context.sampleRate);
          const samples = buffer.getChannelData(0);
          for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
          const source = context.createBufferSource();
          source.buffer = buffer;
          const filter = context.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.value = frequency;
          const gain = context.createGain();
          gain.gain.setValueAtTime(0.0001, at);
          gain.gain.linearRampToValueAtTime(Math.min(1, peak * level), at + 0.002);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
          source.connect(filter).connect(gain).connect(context.destination);
          source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
          source.start(at);
          source.stop(at + length);
        };
        burst(now, 0.035, 3200, 0.5);
        burst(now + 0.075, 0.06, 2000, 0.4);
        const thunk = context.createOscillator();
        const body = context.createGain();
        thunk.type = "triangle";
        thunk.frequency.value = 120;
        body.gain.setValueAtTime(0.0001, now + 0.075);
        body.gain.linearRampToValueAtTime(Math.min(1, 0.2 * level), now + 0.08);
        body.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
        thunk.connect(body).connect(context.destination);
        thunk.onended = () => { thunk.disconnect(); body.disconnect(); };
        thunk.start(now + 0.075);
        thunk.stop(now + 0.18);
        return;
      }
      const { tones, gap, wave } = CUES[sound];
      tones.forEach((frequency, index) => {
        const at = now + index * gap;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = wave;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.linearRampToValueAtTime(0.12 * level, at + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.075);
        oscillator.connect(gain).connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at);
        oscillator.stop(at + 0.08);
      });
    };
    if (context.state === "suspended") void context.resume().then(play).catch(() => {});
    else play();
  } catch { /* Audio rejection must not block capture or scanning. */ }
}
/** Cycle of the ground scan line (styles.css: ar-ground-sweep), so the hum rises and falls with it. */
const SCAN_SWEEP_SECONDS = 3.6;
/** Optional recorded scan loop; without it (or if it fails to decode) the synthesized hum plays. */
export const SCAN_LOOP_URL = "/sounds/scan-loop.mp3";
const FADE_IN = 2, FADE_OUT = 1.8;
let scanLoop: Promise<AudioBuffer | null> | undefined;

function loadScanLoop(context: AudioContext): Promise<AudioBuffer | null> {
  scanLoop ??= fetch(SCAN_LOOP_URL)
    .then((r) => (r.ok && /audio|octet-stream/.test(r.headers.get("content-type") ?? "") ? r.arrayBuffer() : null))
    .then((data) => (data ? context.decodeAudioData(data) : null))
    .catch(() => null);
  return scanLoop;
}

/**
 * Looping scan sound while the AI analysis runs, faded in and out: the recorded loop when
 * present, else a soft filtered hum whose pitch follows the sweeping line. Returns a stop
 * function (safe to call twice); audio failures never block the scan.
 */
export function startScanLoop(volume = 1): () => void {
  if (typeof window === "undefined") return () => {};
  try {
    const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Audio) return () => {};
    if (!audio || audio.state === "closed") audio = new Audio();
    const context = audio;
    const level = Math.min(2, Math.max(0, volume));
    if (context.state === "suspended") void context.resume().catch(() => {});
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.connect(context.destination);
    const sources: AudioScheduledSourceNode[] = [];
    const nodes: AudioNode[] = [master];
    let stopped = false;
    const fadeIn = (peak: number) => {
      const at = context.currentTime;
      master.gain.setValueAtTime(0.0001, at);
      master.gain.linearRampToValueAtTime(peak, at + FADE_IN);
    };
    const hum = () => {
      const now = context.currentTime;
      const tone = context.createOscillator();
      tone.type = "triangle";
      tone.frequency.value = 330;
      // Same period as the line; the negative depth lowers the pitch while the line descends.
      const sweep = context.createOscillator();
      sweep.type = "sine";
      sweep.frequency.value = 1 / SCAN_SWEEP_SECONDS;
      const depth = context.createGain();
      depth.gain.value = -70;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200;
      sweep.connect(depth).connect(tone.frequency);
      tone.connect(filter).connect(master);
      tone.start(now);
      sweep.start(now);
      sources.push(tone, sweep);
      nodes.push(depth, filter);
      fadeIn(0.07 * level);
    };
    void loadScanLoop(context).then((buffer) => {
      if (stopped) return;
      try {
        if (!buffer) { hum(); return; }
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(master);
        source.start(context.currentTime);
        sources.push(source);
        fadeIn(Math.min(1, 0.6 * level));
      } catch { /* Audio rejection must not block scanning. */ }
    });
    return () => {
      if (stopped) return;
      stopped = true;
      try {
        const end = context.currentTime;
        master.gain.cancelScheduledValues(end);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), end);
        master.gain.exponentialRampToValueAtTime(0.0001, end + FADE_OUT);
        sources.forEach((source) => source.stop(end + FADE_OUT + 0.05));
        const release = () => nodes.concat(sources).forEach((node) => node.disconnect());
        if (sources[0]) sources[0].onended = release;
        else release();
      } catch { /* Already stopped or audio gone. */ }
    };
  } catch {
    return () => {};
  }
}
