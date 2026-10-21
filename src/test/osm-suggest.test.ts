import { describe, expect, it } from "vitest";
import { photonSuggestions, photonUrl } from "@/models/osm-suggest";

describe("Photon suggestions", () => {
  it("keeps Italian places with coordinates, deduplicated and labelled", () => {
    const feature = (name: string, countrycode: string, coordinates?: [number, number], extra = {}) => ({ geometry: coordinates ? { coordinates } : undefined, properties: { name, countrycode, ...extra } });
    const result = photonSuggestions({ features: [
      feature("Campobasso", "IT", [14.66, 41.56], { city: "Campobasso", state: "Molise" }),
      feature("Campobasso", "IT", [14.66, 41.56], { city: "Campobasso", state: "Molise" }),
      feature("Campos", "BR", [-41, -21]),
      feature("Senza coordinate", "IT"),
      feature("San Marino", "SM", [12.45, 43.94]),
    ] }, "Camp");
    expect(result).toEqual([
      { placeId: "osm-41.56-14.66", text: "Campobasso, Molise", label: "Campobasso · Molise", lat: 41.56, lng: 14.66 },
      { placeId: "osm-43.94-12.45", text: "San Marino", label: "San Marino", lat: 43.94, lng: 12.45 },
    ]);
    expect(photonSuggestions(null, "x")).toEqual([]);
    expect(photonUrl("via Roma 1")).toContain("q=via%20Roma%201");
  });
});
