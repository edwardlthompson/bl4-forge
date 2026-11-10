import { describe, expect, it } from "vitest";
import { boundPartsForPool, godRollSeedFromParts } from "./partsPool";

describe("partsPool god-roll", () => {
  it("loads slim bound parts with attributes", () => {
    expect(boundPartsForPool().length).toBeGreaterThan(50);
  });

  it("builds unverified approximate god-roll seed", () => {
    const c = godRollSeedFromParts("max", "gr");
    expect(c.id).toBe("gr");
    expect(c.obtainable).toBe("unverified");
    expect(c.synergyKeys).toContain("rolls:approximate");
    expect(c.gear.length).toBeGreaterThan(0);
  });

  it("filters part names when nameIncludes is set", () => {
    const filtered = boundPartsForPool({ nameIncludes: ["pearl"] });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((p) => p.name.toLowerCase().includes("pearl"))).toBe(true);
    expect(boundPartsForPool({ nameIncludes: ["___none___"] })).toHaveLength(0);
  });
});
