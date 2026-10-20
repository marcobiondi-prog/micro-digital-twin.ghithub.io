import { describe, expect, it, vi } from "vitest";
import { markPromoSeen, PROMO_SEEN_KEY, shouldShowPromo } from "@/models/home-videos";
describe("first-access promo", () => {
  it("shows only on first access after it has been displayed", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(shouldShowPromo(storage)).toBe(true);
    markPromoSeen(storage);
    expect(values.get(PROMO_SEEN_KEY)).toBe("1");
    expect(shouldShowPromo(storage)).toBe(false);
  });
  it("does not interrupt shared scenario opening", () => {
    expect(shouldShowPromo({ getItem: vi.fn().mockReturnValue(null) }, true)).toBe(false);
  });
});