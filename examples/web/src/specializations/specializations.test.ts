import { describe, expect, it } from "vitest";
import { getSpecCatalog } from "./catalog";
import { specializationEffects } from "./effects";
import { isSpecLegal, socketCount, validateSpecAllocation } from "./legality";

describe("specialization legality + procs", () => {
  const catalog = getSpecCatalog();

  it("unlocks 4 sockets at 30 total points", () => {
    const alloc = {
      nodePoints: { survivor: 10, brute: 10, sharpshooter: 10 },
      equipped: [],
    };
    expect(socketCount(catalog, alloc)).toBe(4);
  });

  it("locks prestige Killer until Brute+Sharpshooter have 10", () => {
    const bad = {
      nodePoints: { killer: 1, brute: 5, sharpshooter: 10 },
      equipped: ["contamination"],
    };
    expect(validateSpecAllocation(catalog, bad).map((i) => i.code)).toEqual(
      expect.arrayContaining(["prestige_locked", "node_locked"]),
    );
  });

  it("accepts 4 equipped skills when sockets and unlocks met", () => {
    const good = {
      nodePoints: { survivor: 20, brute: 20, sharpshooter: 10 },
      equipped: ["sturdy_stuff", "the_best_defense", "lead_or_alive", "cqc"],
    };
    expect(isSpecLegal(catalog, good)).toBe(true);
    const bundle = specializationEffects(catalog, good);
    expect(bundle.effects.length).toBeGreaterThan(0);
    expect(bundle.synergyKeys).toEqual(expect.arrayContaining(["gun_damage", "survivability"]));
    expect(bundle.procs.some((p) => p.skillId === "cqc")).toBe(true);
  });
});
