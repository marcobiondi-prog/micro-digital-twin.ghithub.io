type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
export function supportsCameraTorch(track: MediaStreamTrack | undefined) {
  try { return !!track && (track.getCapabilities() as TorchCapabilities).torch === true; }
  catch { return false; }
}
export async function setCameraTorch(track: MediaStreamTrack | undefined, enabled: boolean) {
  if (!track || !supportsCameraTorch(track)) return false;
  try {
    await track.applyConstraints({ advanced: [{ torch: enabled } as MediaTrackConstraintSet] });
    return true;
  } catch { return false; }
}