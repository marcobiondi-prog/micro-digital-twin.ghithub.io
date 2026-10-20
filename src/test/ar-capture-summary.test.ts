import { describe, expect, it } from "vitest";
import { captureSummaryLines } from "@/models/ar-capture-summary";

describe("AI capture estimate snapshot", () => {
  it("keeps botanical identity and numeric thermal values with the photo", () => {
    const lines = captureSummaryLines({ commonName: "Acero", scientificName: "Acer", level: "Genere probabile", count: 2, cooling: 1.4, shade: 24 }, "Piazza");
    expect(lines[1]).toContain("Acero · Acer · Genere probabile");
    expect(lines[2]).toBe("2 esemplari · raffrescamento ≈ −1.4 °C · ombra ≈ 24 m²");
  });
  it("does not invent estimates without a botanical result", () => {
    expect(captureSummaryLines(null, "Vigneto")).toEqual(["Vigneto", "Pianta non identificata · nessuna stima botanica"]);
  });
});