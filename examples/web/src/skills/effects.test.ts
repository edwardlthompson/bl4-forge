import { describe, expect, it } from "vitest";
import {
  allocationEffects,
  cumulativeStatLines,
  effectsAtRank,
  type SkillEffectPack,
} from "./effects";

const pack: SkillEffectPack = {
  experimental: true,
  obtainable: "unverified",
  skills: {
    pb_deadline: {
      max_rank: 5,
      effects: [
        {
          op: "add",
          target: "fire_rate",
          value: 0.03,
          values_by_rank: [0.03, 0.06, 0.09, 0.12, 0.15],
          cond: { type: "while_overdrive" },
          oracle: "name_inferred",
          label: "Overdrive Fire Rate",
        },
        {
          op: "add",
          target: "reload_speed",
          value: 0.05,
          values_by_rank: [0.05, 0.1, 0.15, 0.2, 0.25],
          cond: { type: "while_overdrive" },
          oracle: "name_inferred",
          label: "Overdrive Reload",
        },
      ],
    },
  },
};

describe("skills/effects", () => {
  it("resolves cumulative values_by_rank", () => {
    const at3 = effectsAtRank(pack.skills.pb_deadline.effects, 3);
    expect(at3[0]?.value).toBeCloseTo(0.09);
    expect(at3[1]?.value).toBeCloseTo(0.15);
  });

  it("emits cumulative + delta stat lines", () => {
    const lines = cumulativeStatLines(pack.skills.pb_deadline.effects, 3);
    expect(lines[0]).toMatchObject({ pct: 9, delta: 3, label: "Overdrive Fire Rate" });
    expect(lines[1]).toMatchObject({ pct: 15, delta: 5 });
  });

  it("builds allocation effects", () => {
    const fx = allocationEffects(pack, {
      hunterId: "rafa",
      ranks: [{ id: "pb_deadline", rank: 5 }],
      actionSkillId: "pb_action",
      augmentIds: [],
      capstoneId: null,
      pointBudget: 69,
    });
    expect(fx).toHaveLength(2);
    expect(fx[0]?.value).toBeCloseTo(0.15);
  });
});
