export type Camera = { center: { lat: number; lng: number; altitude: number }; range: number; tilt: number; heading: number };

/** Oblique view centred on the reference point, so buildings and trees read in depth; a taller panel sits a little closer. */
export function frameCamera(lat: number, lng: number, height: number): Camera {
  return { center: { lat, lng, altitude: 0 }, range: height >= 260 ? 300 : 380, tilt: 62, heading: 20 };
}
