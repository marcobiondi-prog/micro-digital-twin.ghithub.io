import { urbanMetrics, vineMetrics, type LabState } from "./lab-store";

export type ExportFlow = "urban" | "vineyard";
type ExportValue = string | number | boolean;
type ExportRow = Record<string, ExportValue>;

/** Grid cells and vineyard zones have no surveyed geographic boundaries. */
export function scenarioExportRows(state: LabState, flow: ExportFlow, exportedAt: string): ExportRow[] {
  const location = state[flow].location;
  const common: ExportRow = {
    flow, location: location.label, longitude: location.lng, latitude: location.lat,
    exported_at: exportedAt, data_type: "simulation", source: "MICRO DIGITAL TWIN · Decision Lab",
    georeference: "selected_location_only", coordinate_reference_system: "EPSG:4326",
  };
  if (flow === "urban") {
    const u = state.urban, m = urbanMetrics(u);
    return [{ ...common, record_id: "urban", trees_count: u.trees,
      permeable_soil_percent: u.permeable, shade_percent: u.shade,
      estimated_cooling_c: m.est.dT, estimated_cooling_low_c: m.est.lo,
      estimated_cooling_high_c: m.est.hi, tree_cover_percent: m.cover,
      heat_index: m.heat, climate_refuges_index: m.refuges, green_index: m.green,
    }];
  }
  const v = state.vineyard, m = vineMetrics(v);
  return v.zones.map((zone, i) => ({ ...common, record_id: `vineyard-zone-${i + 1}`,
    zone_number: i + 1, zone_selected: v.allZones || v.selected === i, phenological_phase: v.phase,
    temperature_c: zone.temperature, soil_moisture_percent: zone.moisture,
    wind_kmh: zone.wind, simulated_rain: zone.rain,
    water_stress_index: m.results[i]?.s ?? 0, risk: m.results[i]?.risk ?? "",
    vineyard_water_stress_index: m.waterStress, vineyard_heat_stress_index: m.heatStress,
  }));
}

export function scenarioGeoJson(state: LabState, flow: ExportFlow, exportedAt: string) {
  return {
    type: "FeatureCollection" as const,
    features: scenarioExportRows(state, flow, exportedAt).map((row) => ({
      type: "Feature" as const, id: row["record_id"],
      geometry: { type: "Point" as const, coordinates: [row["longitude"], row["latitude"]] },
      properties: row,
    })),
  };
}

function csvCell(value: ExportValue): string {
  let text = String(value);
  if (typeof value === "string" && /^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function scenarioCsv(state: LabState, flow: ExportFlow, exportedAt: string): string {
  const rows = scenarioExportRows(state, flow, exportedAt);
  const headers = Object.keys(rows[0] ?? {});
  return "\uFEFF" + [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((key) => csvCell(row[key] ?? "")).join(","))].join("\r\n") + "\r\n";
}