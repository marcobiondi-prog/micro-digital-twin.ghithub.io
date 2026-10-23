import { afterEach, describe, expect, it } from "vitest";
import { enterCameraChrome, exitCameraChrome } from "@/lib/camera-chrome";

const themes = () => [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((m) => m.content);

describe("camera chrome", () => {
  afterEach(() => { exitCameraChrome(); document.head.innerHTML = ""; });
  it("puts a dark theme-color first while the camera is open and removes it on close", () => {
    document.head.innerHTML = '<meta name="theme-color" content="#ffffff">';
    enterCameraChrome();
    enterCameraChrome();
    expect(themes()).toEqual(["#000000", "#ffffff"]);
    exitCameraChrome();
    expect(themes()).toEqual(["#ffffff"]);
  });
});
