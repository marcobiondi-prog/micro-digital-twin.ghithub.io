import { setUrban, setVineyard, type LabState } from "@/models/lab-store";

export const LAB_FLOW_KEY = "mdt-lab-flow";

type Shared =
  | { k: "u"; t: number; p: number; s: number; l: LabState["urban"]["location"] }
  | { k: "v"; z: LabState["vineyard"]["zones"]; l: LabState["vineyard"]["location"] };

/** Applies a shared scenario from the link; returns the flow to open, or null. */
export function applySharedScenario(raw: string): "urban" | "vineyard" | null {
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(raw)))) as Shared;
    if (d.k === "u") { setUrban({ trees: d.t, permeable: d.p, shade: d.s, location: d.l, treeCells: null, permeableCells: null, shadeCells: null }); return "urban"; }
    if (d.k === "v" && Array.isArray(d.z)) { setVineyard({ zones: d.z, location: d.l }); return "vineyard"; }
  } catch { /* link non valido */ }
  return null;
}
