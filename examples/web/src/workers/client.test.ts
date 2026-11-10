import { describe, expect, it } from "vitest";
import type { ComposeInput } from "../sim/types";
import type { Candidate, SolverRules } from "../solver/types";
import { scoreViaWorker, solveViaWorker } from "./client";

const rules: SolverRules = {
  beam_width: 4,
  anneal_iterations: 10,
  timeout_ms: 1000,
  balanced: { strategy: "maximin", mob_floor: 0.1, boss_floor: 0.1 },
  obtainable_for_published: ["confirmed"],
  obtainable_for_experimental: ["confirmed", "probable"],
};

describe("workers client fallback", () => {
  it("scores and solves without Worker", async () => {
    const input: ComposeInput = {
      base: 100,
      effects: [],
      archetype: "mobbing",
      uptime: { always: 1 },
      fireRate: 4,
      fireRateCap: 20,
      magazineSize: 10,
      reloadS: 1,
      reloadCancel: 0,
      elementMult: 1,
      critMult: 1,
      scenarioMods: 1,
    };
    const scored = await scoreViaWorker(input);
    expect(scored.damage).toBe(100);
    const pool: Candidate[] = [
      {
        id: "a",
        score: 0.8,
        mobScore: 0.8,
        bossScore: 0.8,
        obtainable: "confirmed",
        gate: "base",
        legal: true,
        prereqsMet: true,
        skills: [],
        gear: [],
        synergyKeys: [],
      },
    ];
    const solved = await solveViaWorker(pool, rules, { rngSeed: 1 });
    expect(solved.bestId).toBe("a");
  });
});
