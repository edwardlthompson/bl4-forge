import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { humanizeTitle, parseItemId, weaponTypeFromCode } from "./naming";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../");
const drops = JSON.parse(readFileSync(path.join(root, "data/indexes/drops.json"), "utf-8")) as {
  drops: Array<{ item_id: string; item_name: string; gear_type: string }>;
};

const WEAPON = new Set(["PS", "SG", "SM", "AR", "SR", "HW"]);

describe("item naming", () => {
  it("parses PlasmaCoil id", () => {
    const p = parseItemId("MAL_SM.comp_05_legendary_PlasmaCoil");
    expect(p).toMatchObject({
      mfg: "MAL",
      type: "SM",
      rarityTier: 5,
      rarity: "legendary",
      title: "PlasmaCoil",
      blackMarket: false,
    });
    expect(weaponTypeFromCode(p.type)).toBe("smg");
    expect(humanizeTitle(p.title)).toBe("Plasma Coil");
  });

  it("parses black-market DiscJockey", () => {
    const p = parseItemId("bor_hw.comp_blackmarket");
    expect(p.blackMarket).toBe(true);
    expect(p.mfg).toBe("BOR");
    expect(p.type).toBe("HW");
    expect(p.title).toBe("DiscJockey");
  });

  it("humanizes snake and camel titles", () => {
    expect(humanizeTitle("complex_root")).toBe("Complex Root");
    expect(humanizeTitle("TKsWave")).toBe("TKs Wave");
    expect(humanizeTitle("HeavyTurret")).toBe("Heavy Turret");
  });

  it("round-trips all unique weapon item_ids from drops", () => {
    const weapons = drops.drops.filter((d) => WEAPON.has(d.gear_type));
    const byName = new Map<string, string>();
    for (const d of weapons) {
      if (!byName.has(d.item_name)) byName.set(d.item_name, d.item_id);
    }
    expect(byName.size).toBeGreaterThanOrEqual(87);
    for (const [name, id] of byName) {
      const p = parseItemId(id);
      if (!p.blackMarket) {
        expect(p.title.toLowerCase()).toBe(name.toLowerCase());
      }
      expect(p.rarity).toBe("legendary");
    }
  });
});
