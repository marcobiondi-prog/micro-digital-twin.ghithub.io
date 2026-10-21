import { describe, expect, it } from "vitest";
import { AR_FOCUS, arFocusOption, defaultArFocus, scanMissing, scanPrecheck } from "@/models/ar-focus";
describe("AI camera per tab", () => {
  it("urban offers trees and ground", () => expect(AR_FOCUS.urban.map(o => o.id)).toEqual(["tree", "ground"]));
  it("vineyard offers leaf, canopy and interrow", () => expect(AR_FOCUS.vineyard.map(o => o.id)).toEqual(["leaf", "canopy", "interrow"]));
  it("other tab's target falls back", () => expect(arFocusOption("vineyard", "ground").id).toBe(defaultArFocus("vineyard")));
  it("stops a vegetation scan before the AI when no vegetation is locked, never a ground scan", () => {
    expect(scanPrecheck("urban", "tree", false)).toMatch(/Nessun albero/);
    expect(scanPrecheck("vineyard", "leaf", false)).toMatch(/Nessuna foglia/);
    expect(scanPrecheck("vineyard", "canopy", true)).toBeNull();
    expect(scanPrecheck("urban", "ground", false)).toBeNull();
    expect(scanPrecheck("vineyard", "interrow", false)).toBeNull();
  });
  it("stops when the result lacks what each branch target looks for", () => {
    expect(scanMissing("urban", "tree", { plant: false, ground: true })).toMatch(/Nessun albero/);
    expect(scanMissing("urban", "tree", { plant: true, ground: false })).toBeNull();
    expect(scanMissing("urban", "ground", { plant: true, ground: false })).toMatch(/pavimentazione/);
    expect(scanMissing("vineyard", "interrow", { plant: false, ground: true })).toBeNull();
    expect(scanMissing("vineyard", "interrow", { plant: true, ground: false })).toMatch(/interfilare/);
  });
  it("names each section's own two scan steps in both branches", () => {
    for (const options of Object.values(AR_FOCUS)) {
      const statuses = options.map(o => o.phases.map(p => p.status).join(" | "));
      expect(new Set(statuses).size).toBe(options.length);
      for (const o of options) expect(o.phases.every(p => p.tag && p.status.endsWith("…"))).toBe(true);
    }
    expect(arFocusOption("urban", "ground").phases[0].status).toMatch(/pavimentazione/);
    expect(arFocusOption("vineyard", "interrow").phases[1].status).toMatch(/compattamento/);
  });
});
