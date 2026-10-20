export type CameraSound = "shutter" | "video-start" | "video-stop";
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
      const tones = sound === "video-start" ? [660, 880] : [880, 660];
      tones.forEach((frequency, index) => {
        const at = now + index * 0.09;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
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
  } catch { /* Audio rejection must not block photo/video capture. */ }
}