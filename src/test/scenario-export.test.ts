import { describe, expect, it } from "vitest";
import type { LabState } from "@/models/lab-store";
import { scenarioCsv, scenarioGeoJson } from "@/models/scenario-export";

const state: LabState = {
  urban: { trees: 6, permeable: 20, shade: 15, treeCells: null, permeableCells: null, shadeCells: null,
    location: { label: 'Piazza "Verde", Campobasso', lat: 41.5603, lng: 14.6627 } },
  vineyard: { zones: [
    { temperature: 34, moisture: 30, wind: 8, rain: false },
    { temperature: 36, moisture: 24, wind: 6, rain: true },
    { temperature: 38, moisture: 17, wind: 4, rain: false },
  ], phase: "Invaiatura", selected: 1, allZones: false,
    location: { label: "Colline del Molise", lat: 41.83, lng: 14.98 } },
};
const stamp = "2026-10-18T17:42:00.000Z";

describe("separate GIS/CSV scenario exports", () => {
  it("exports only urban data with numeric values and longitude-first coordinates", () => {
    const geo = scenarioGeoJson(state, "urban", stamp);
    expect(geo.features).toHaveLength(1);
    expect(geo.features[0]?.geometry).toEqual({ type: "Point", coordinates: [14.6627, 41.5603] });
    expect(geo.features[0]?.properties).toMatchObject({ trees_count: 6, permeable_soil_percent: 20, shade_percent: 15,
      estimated_cooling_c: 2.75, exported_at: stamp, data_type: "simulation", georeference: "selected_location_only" });
    expect(geo.features[0]?.properties).not.toHaveProperty("temperature_c");
    expect(scenarioCsv(state, "urban", stamp)).not.toContain("Colline del Molise");
  });
  it("exports three vineyard zones without inventing zone coordinates", () => {
    const geo = scenarioGeoJson(state, "vineyard", stamp);
    expect(geo.features).toHaveLength(3);
    expect(geo.features.map((f) => f.properties["temperature_c"])).toEqual([34, 36, 38]);
    expect(geo.features.map((f) => f.properties["zone_selected"])).toEqual([false, true, false]);
    for (const feature of geo.features) {
      expect(feature.geometry.coordinates).toEqual([14.98, 41.83]);
      expect(feature.properties).not.toHaveProperty("trees_count");
    }
    expect(scenarioCsv(state, "vineyard", stamp)).not.toContain("Campobasso");
  });
  it("preserves all-zone selection and simulator state", () => {
    const all = { ...state, vineyard: { ...state.vineyard, allZones: true } };
    const before = JSON.stringify(all);
    expect(scenarioGeoJson(all, "vineyard", stamp).features.every((f) => f.properties["zone_selected"])).toBe(true);
    scenarioCsv(all, "vineyard", stamp);
    expect(JSON.stringify(all)).toBe(before);
  });
  it("escapes CSV quotes and commas with UTF-8 encoding", () => {
    const csv = scenarioCsv(state, "urban", stamp);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Piazza ""Verde"", Campobasso"');
    expect(csv.split("\r\n")).toHaveLength(3);
  });
  it("neutralizes spreadsheet formulas in place labels", () => {
    const edited = { ...state, urban: { ...state.urban, location: { ...state.urban.location, label: '=HYPERLINK("example")' } } };
    expect(scenarioCsv(edited, "urban", stamp)).toContain('"\'=HYPERLINK(""example"")"');
  });
});