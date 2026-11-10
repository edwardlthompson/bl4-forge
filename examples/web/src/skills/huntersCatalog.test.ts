import { describe, expect, it } from "vitest";
import { coverageBanner, hunterIds, loadHunterIndex } from "./huntersCatalog";

describe("huntersCatalog", () => {
  it("lists six vault hunters", () => {
    expect(hunterIds().sort()).toEqual(
      ["amon", "c4sh", "harlowe", "loveless", "rafa", "vex"].sort(),
    );
    expect(loadHunterIndex()).toHaveLength(6);
  });

  it("flags structure-only coverage for empty effects", () => {
    const banner = coverageBanner("amon");
    expect(banner).toMatch(/structure only|tag-weight/i);
  });
});
