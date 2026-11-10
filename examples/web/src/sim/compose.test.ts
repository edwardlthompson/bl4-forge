import { describe, expect, it } from "vitest";
import { composeDamage, scaledMul } from "./compose";
import type { ComposeInput, SimEffect } from "./types";

const baseInput = (over: Partial<ComposeInput> = {}): ComposeInput => ({
  base: 1000,
  effects: [],
  archetype: "mobbing",
  uptime: { always: 1, on_kill: 0.9, on_crit: 0.5 },
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

describe("composeDamage", () => {
  it("composes additive then multiplicative in the documented order", () => {
    const effects: SimEffect[] = [
      { op: "add", target: "gun_damage", value: 0.5 },
      { op: "mul", target: "gun_damage", value: 1.25 },
    ];
    const r = composeDamage(baseInput({ effects }));
    // 1000 * (1+0.5) * 1.25 = 1875
    expect(r.damage).toBeCloseTo(1875, 6);
    expect(r.additiveSum).toBeCloseTo(0.5, 6);
    expect(r.multiplicativeProduct).toBeCloseTo(1.25, 6);
  });

  it("respects the fire-rate cap", () => {
    const uncapped = composeDamage(baseInput({ fireRate: 40, fireRateCap: 20 }));
    const capped = composeDamage(baseInput({ fireRate: 20, fireRateCap: 20 }));
    expect(uncapped.dps).toBeCloseTo(capped.dps, 6);
    expect(uncapped.magazineDps).toBeCloseTo(capped.magazineDps, 6);
  });

  it("models reload cancellation", () => {
    const full = composeDamage(baseInput({ reloadCancel: 0 }));
    const cancelled = composeDamage(baseInput({ reloadCancel: 0.5 }));
    expect(cancelled.sustainedDps).toBeGreaterThan(full.sustainedDps);
  });

  it("distinguishes magazine DPS from sustained DPS", () => {
    const r = composeDamage(baseInput({ reloadS: 2, reloadCancel: 0 }));
    expect(r.magazineDps).toBeGreaterThan(r.sustainedDps);
    // mag: 10 shots / (10/4)s = 4 * damage; sustained adds reload
    expect(r.magazineDps).toBeCloseTo(r.damage * 4, 4);
  });

  it("applies splash self-damage as a reduction", () => {
    const clean = composeDamage(baseInput({ splashSelf: 0 }));
    const splash = composeDamage(baseInput({ splashSelf: 0.2 }));
    expect(splash.damage).toBeCloseTo(clean.damage * 0.8, 6);
  });

  it("applies the elemental resist table", () => {
    const r = composeDamage(baseInput({ elementMult: 1.2, elementResist: 0.25 }));
    // 1000 * 1.2 * (1-0.25) = 900
    expect(r.damage).toBeCloseTo(900, 6);
  });

  it("emits a variance band and uses damage_median as the point estimate", () => {
    const r = composeDamage(
      baseInput({
        base: 1240,
        statRange: { damage: [1180, 1310], damage_median: 1240 },
        effects: [{ op: "mul", target: "gun_damage", value: 1.25 }],
      }),
    );
    expect(r.variance).not.toBeNull();
    expect(r.variance?.median).toBe(1240);
    expect(r.variance?.low).toBeCloseTo(1180 * 1.25, 4);
    expect(r.variance?.high).toBeCloseTo(1310 * 1.25, 4);
    expect(r.damage).toBeCloseTo(1240 * 1.25, 4);
  });

  it("gives a conditional modifier with uptime 0 exactly nothing", () => {
    const r = composeDamage(
      baseInput({
        uptime: { always: 1, on_kill: 0 },
        effects: [
          {
            op: "mul",
            target: "gun_damage",
            value: 1.5,
            cond: { type: "on_kill", window_s: 5 },
          },
        ],
      }),
    );
    expect(r.damage).toBeCloseTo(1000, 6);
    expect(r.multiplicativeProduct).toBeCloseTo(1, 6);
    expect(r.contributions[0]?.effective).toBe(0);
  });

  it("gives an unparsed effect only its tag weight, never a numeric default", () => {
    const r = composeDamage(
      baseInput({
        tagWeight: 0.02,
        effects: [
          {
            op: "mul",
            target: "gun_damage",
            value: 9.99,
            unparsed: true,
            tags: ["dps", "mystery"],
          },
        ],
      }),
    );
    // 2 tags * 0.02 = 0.04 additive; mul value ignored
    expect(r.additiveSum).toBeCloseTo(0.04, 6);
    expect(r.multiplicativeProduct).toBeCloseTo(1, 6);
    expect(r.damage).toBeCloseTo(1000 * 1.04, 6);
  });
});

describe("scaledMul", () => {
  it("is identity at uptime 0 and full value at uptime 1", () => {
    expect(scaledMul(1.25, 0)).toBeCloseTo(1, 6);
    expect(scaledMul(1.25, 1)).toBeCloseTo(1.25, 6);
    expect(scaledMul(1.25, 0.5)).toBeCloseTo(1.125, 6);
  });
});
