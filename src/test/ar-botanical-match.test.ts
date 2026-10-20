import { describe, expect, it } from "vitest";
import { usableBotanicalMatch } from "@/models/ar-botanical-match";

describe("Botanical name verification", () => {
  it("accepts exact plant species and genus, including catalogue variants", () => {
    expect(usableBotanicalMatch("Acer campestre", {name:"Acer campestre",rank:"species",kingdom:"Plantae",type:"variant"})).toBe(true);
    expect(usableBotanicalMatch("Acer", {name:"Acer",rank:"genus",kingdom:"Plantae",type:"EXACT"})).toBe(true);
  });
  it("rejects animal, higher-rank and mismatched names", () => {
    expect(usableBotanicalMatch("Homo sapiens", {name:"Homo sapiens",rank:"species",kingdom:"Animalia",type:"EXACT"})).toBe(false);
    expect(usableBotanicalMatch("Homo sapiens", {name:"Plantae",rank:"kingdom",kingdom:"Plantae",type:"higherrank"})).toBe(false);
    expect(usableBotanicalMatch("Quercus robra", {name:"Quercus",rank:"genus",kingdom:"Plantae",type:"HIGHERRANK"})).toBe(false);
  });
});