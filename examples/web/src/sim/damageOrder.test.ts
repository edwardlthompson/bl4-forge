import { describe, expect, it } from "vitest";
import { composeStagedDamage, inferStage } from "./damageOrder";
import type { ComposeInput, SimEffect } from "./types";

const baseInput = (over: Partial<ComposeInput> = {}): ComposeInput => ({
  base: 1000,
  effects: [],
  archetype: "mobbing",
  uptime: { always: 1 },
  fireRate: 4,
  fireRateCap: 20,
  magazineSize: 10,
  reloadS: 2,
  reloadCancel: 0,
  elementMult: 1,
  critMult: 1,
  scenarioMods: 1,
  ...over,
});

describe("composeStagedDamage", () => {
  it("matches OnShot × OnHit frozen fixture", () => {
    const effects: SimEffect[] = [
      { op: "add", target: "enhancement_gun", value: 0.1, stage: "on_shot" },
      { op: "add", target: "amp", value: 0.2, stage: "on_shot" },
      { op: "add", target: "gun_damage", value: 0.5, stage: "on_hit" },
    ];
    // OnShot = 1000 * 1.1 * 1.2 = 1320; OnHit = 1.5 + 0 = 1.5; Final = 1980
    const r = composeStagedDamage(baseInput({ effects }));
    expect(r.onShot).toBeCloseTo(1320, 6);
    expect(r.onHit).toBeCloseTo(1.5, 6);
    expect(r.damage).toBeCloseTo(1980, 6);
  });

  it("adds critModifier into OnHit per published shape", () => {
    const r = composeStagedDamage(baseInput({ critMult: 2, effects: [] }));
    expect(r.onShot).toBe(1000);
    expect(r.onHit).toBeCloseTo(2, 6); // (1+0)*1 + (2-1)
    expect(r.damage).toBeCloseTo(2000, 6);
  });

  it("infers enhancement_gun as on_shot", () => {
    expect(inferStage({ op: "add", target: "enhancement_gun", value: 0.1 })).toBe("on_shot");
    expect(inferStage({ op: "add", target: "gun_damage", value: 0.1 })).toBe("on_hit");
  });
});
