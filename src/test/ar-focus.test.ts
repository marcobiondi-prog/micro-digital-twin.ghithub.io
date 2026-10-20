import { describe, expect, it } from "vitest";
import { AR_FOCUS, arFocusOption, defaultArFocus } from "@/models/ar-focus";
describe("AI camera per tab", () => {
  it("urban offers trees and ground", () => expect(AR_FOCUS.urban.map(o => o.id)).toEqual(["tree", "ground"]));
  it("vineyard offers leaf, canopy and interrow", () => expect(AR_FOCUS.vineyard.map(o => o.id)).toEqual(["leaf", "canopy", "interrow"]));
  it("other tab's target falls back", () => expect(arFocusOption("vineyard", "ground").id).toBe(defaultArFocus("vineyard")));
});
