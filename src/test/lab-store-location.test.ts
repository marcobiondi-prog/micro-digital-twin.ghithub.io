import { describe, expect, it } from "vitest";
import { upgradeUrbanLocation } from "@/models/lab-store";

const piazza = { label: "Piazza Vittorio Emanuele II · Campobasso · Molise", lat: 41.55837, lng: 14.659698 };

describe("upgradeUrbanLocation", () => {
  it("moves the old saved default to the real piazza", () => {
    expect(upgradeUrbanLocation({ label: "Piazza Vittorio Emanuele II · Campobasso · Palazzo San Giorgio (Municipio)", lat: 41.5603, lng: 14.6627 }, piazza)).toBe(piazza);
  });
  it("keeps a place the user chose, and falls back when none is saved", () => {
    const florence = { label: "Firenze", lat: 43.7698, lng: 11.2556 };
    expect(upgradeUrbanLocation(florence, piazza)).toBe(florence);
    expect(upgradeUrbanLocation(undefined, piazza)).toBe(piazza);
  });
});
