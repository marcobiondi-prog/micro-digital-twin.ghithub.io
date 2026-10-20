import { describe,expect,it } from "vitest";
import { caseLocations,parseCaseWeather,sourcePublications } from "@/models/case-updates";
import { cases } from "@/models/data";
describe("Current case data",()=>{
  it("maps current weather to every respective case",()=>{
    expect(caseLocations.map(p=>p.city)).toEqual(cases.map(p=>p.city));
    const rows=cases.map((_,i)=>({current:{time:1792364400,temperature_2m:15+i,relative_humidity_2m:65,wind_speed_10m:8,precipitation:0}}));
    expect(parseCaseWeather(rows)[4]?.temperature).toBe(19);expect(parseCaseWeather(rows)[4]?.city).toBe("Campobasso");expect(()=>parseCaseWeather(rows.slice(1))).toThrow("Incomplete weather locations");
  });
  it("keeps publications only from the respective source",()=>{
    expect(sourcePublications({results:[{title:"Update",url:"https://www.mdpi.com/article",publish_date:"2026-10-18",excerpts:["Evidence"]},{title:"Wrong",url:"https://other.test/article"},{title:"Unsafe",url:"javascript:alert(1)"}]},"https://www.mdpi.com/2073-4441/15/14/2506")).toEqual([{title:"Update",url:"https://www.mdpi.com/article",publishedAt:"2026-10-18",excerpt:"Evidence"}]);
  });
  it("never invents a publication date",()=>{expect(sourcePublications({results:[{title:"Article",url:"https://www.mdpi.com/article",excerpts:null}],warnings:null},"https://www.mdpi.com")[0]?.publishedAt).toBeNull();});
  it("keeps the Romanian Living Lab tied to its original source and reference point",()=>{
    const cluj=cases.find(c=>c.city==="Cluj-Napoca");
    expect(cluj?.country).toBe("Romania");
    expect(cluj?.sourceUrl).toBe("https://urbreath.eu/pilots/pilot-4-continental-climatic-zone/");
    expect(caseLocations.find(p=>p.city==="Cluj-Napoca")).toEqual({city:"Cluj-Napoca",lat:46.7712,lng:23.5857});
  });
});