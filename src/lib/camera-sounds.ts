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
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.12), context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        const source = context.createBufferSource();
        source.buffer = buffer;
        const filter = context.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 1400;
        const gain = context.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.18 * level, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        gain.gain.setValueAtTime(0.12 * level, now + 0.055);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        source.connect(filter).connect(gain).connect(context.destination);
        source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
        source.start(now);
        source.stop(now + 0.12);
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