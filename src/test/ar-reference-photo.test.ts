import { describe, expect, it } from "vitest";
import { openLicence, pickGbifPhoto, pickPowoPhoto } from "@/models/ar-reference-photo";

describe("ar-reference-photo", () => {
  it("takes the Kew image of the accepted species and links its POWO page", () => {
    const json = { results: [
      { name: "Quercus ilex subsp. ballota", accepted: true, url: "/taxon/x", images: [{ fullsize: "//cdn.kew/x.jpg" }] },
      { name: "Quercus ilex", accepted: false, url: "/taxon/syn", images: [{ fullsize: "//cdn.kew/syn.jpg" }] },
      { name: "Quercus ilex", accepted: true, url: "/taxon/urn:lsid:ipni.org:names:296175-1", images: [{ thumbnail: "//cdn.kew/t.jpg", fullsize: "//cdn.kew/f.jpg", caption: "Leaves" }] },
    ] };
    expect(pickPowoPhoto(json, "Quercus  ilex")).toEqual({
      url: "https://cdn.kew/f.jpg",
      credit: "Royal Botanic Gardens, Kew · Plants of the World Online · Leaves",
      link: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:296175-1",
    });
  });

  it("has no Kew photo without a matching result or image", () => {
    expect(pickPowoPhoto({ results: [{ name: "Quercus ilex", accepted: true, images: [] }] }, "Quercus ilex")).toBeNull();
    expect(pickPowoPhoto({ results: [{ name: "Quercus suber", images: [{ fullsize: "//cdn.kew/s.jpg" }] }] }, "Quercus ilex")).toBeNull();
    expect(pickPowoPhoto(null, "Quercus ilex")).toBeNull();
  });

  it("only shows openly licensed GBIF photos, crediting the author", () => {
    expect(openLicence("http://creativecommons.org/licenses/by-nc/4.0/")).toBe("CC BY-NC");
    expect(openLicence("http://creativecommons.org/publicdomain/zero/1.0/")).toBe("CC0");
    expect(openLicence("All rights reserved")).toBeNull();
    const json = { results: [
      { key: 1, media: [{ type: "StillImage", identifier: "https://img/1.jpg", license: "All rights reserved" }] },
      { key: 2, media: [{ type: "Sound", identifier: "https://img/2.mp3", license: "http://creativecommons.org/licenses/by/4.0/" },
        { type: "StillImage", identifier: "https://img/2.jpg", license: "http://creativecommons.org/licenses/by/4.0/", creator: "Ada" }] },
    ] };
    expect(pickGbifPhoto(json)).toEqual({ url: "https://img/2.jpg", credit: "Ada · CC BY · via GBIF", link: "https://www.gbif.org/occurrence/2" });
  });
});
