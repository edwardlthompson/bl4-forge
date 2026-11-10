import { describe, expect, it } from "vitest";
import { loadItemCatalog, weaponsFromCatalog } from "./catalog";

describe("item catalog", () => {
  it("has ≥87 legendary weapons", () => {
    const cat = loadItemCatalog();
    expect(cat.weapon_count).toBeGreaterThanOrEqual(87);
    expect(weaponsFromCatalog(cat)).toHaveLength(cat.weapon_count);
  });

  it("PlasmaCoil farms Timekeeper Guardian", () => {
    const gun = loadItemCatalog().items.find((i) => i.id.includes("PlasmaCoil"));
    expect(gun?.drop?.boss).toMatch(/Timekeeper/i);
  });

  it("includes HeavyTurret and firewerks + Waterfall", () => {
    const ids = loadItemCatalog().items.map((i) => i.id);
    expect(ids.some((id) => id.includes("HeavyTurret"))).toBe(true);
    expect(ids.some((id) => id.toLowerCase().includes("firewerks"))).toBe(true);
    expect(ids.some((id) => id.includes("Waterfall"))).toBe(true);
  });
});
