import { describe, expect, it } from "vitest";
import type { Candidate } from "../solver/types";
import { dedupeByHash, diversityClamp } from "./dedupe";
import { freezeBoard } from "./freeze";
import { highFidelityRescore } from "./rescore";
import { robustnessTiebreak } from "./robustness";
import { generateSeeds } from "./seeds";

function c(partial: Partial<Candidate> & { id: string }): Candidate {
  return {
    score: 1,
    mobScore: 1,
    bossScore: 1,
    obtainable: "confirmed",
    gate: "base",
    legal: true,
    prereqsMet: true,
    skills: ["s1"],
    gear: ["g1"],
    synergyKeys: ["crit"],
    ...partial,
  };
}

describe("sweep", () => {
  it("generates synergy + random seeds deterministically", () => {
    const pool = [
      c({ id: "a", synergyKeys: ["crit"], score: 2 }),
      c({ id: "b", synergyKeys: ["fire"], score: 1 }),
    ];
    const a = generateSeeds(pool, ["crit", "fire"], 2, 7);
    const b = generateSeeds(pool, ["crit", "fire"], 2, 7);
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    expect(a.length).toBe(4);
  });

  it("dedupes and diversity-clamps", () => {
    const pool = [
      c({ id: "1", skills: ["a", "b"], gear: ["x"], score: 3 }),
      c({ id: "2", skills: ["a", "b"], gear: ["x"], score: 2 }),
      c({ id: "3", skills: ["z"], gear: ["y"], score: 1 }),
    ];
    const d = dedupeByHash(pool);
    expect(d).toHaveLength(2);
    expect(diversityClamp(d, 0.5, 0.5).map((x) => x.id)).toEqual(["1", "3"]);
  });

  it("rescores and robustness-ranks", () => {
    const pool = [
      c({ id: "spike", mobScore: 1, bossScore: 0.5, score: 0.5 }),
      c({ id: "flat", mobScore: 0.8, bossScore: 0.8, score: 0.8 }),
    ];
    const hi = highFidelityRescore(pool, [
      { mob: 1, boss: 1 },
      { mob: 1.1, boss: 0.9 },
    ]);
    expect(hi.every((x) => Number.isFinite(x.score))).toBe(true);
    const rob = robustnessTiebreak(hi, 0.2);
    expect(rob[0]!.id).toBe("flat");
  });

  it("freezes with disclaimer", () => {
    const board = freezeBoard([c({ id: "e" })], {
      patch: "0.0.0-scaffold",
      game_build: "26007962",
      solver_version: "0.1.0",
      scenario_hash: "abc",
      frozen_at: "2026-11-09T00:00:00Z",
    });
    expect(board.disclaimer).toMatch(/not a certified global optimum/i);
    expect(board.entries).toHaveLength(1);
  });
});
