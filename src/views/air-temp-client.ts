// Current air temperature of a place (Open-Meteo, keyless, browser), one request per place per page.
const readings = new Map<string, Promise<number | null>>();

export function loadAirTemperature(lat: number, lng: number): Promise<number | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  let pending = readings.get(key);
  if (!pending) {
    pending = fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m&timezone=auto`, { signal: AbortSignal.timeout(5000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { current?: { temperature_2m?: unknown } } | null) => (typeof j?.current?.temperature_2m === "number" ? j.current.temperature_2m : null))
      .catch(() => null);
    // A failed reading is not kept, so the next camera opening tries again.
    void pending.then((v) => { if (v === null) readings.delete(key); });
    readings.set(key, pending);
  }
  return pending;
}
