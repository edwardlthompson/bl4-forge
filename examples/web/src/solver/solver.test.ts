import { describe, expect, it } from "vitest";
import { annealLoadout } from "./anneal";
import { beamOverDag } from "./beam";
import { enumerateGodRolls, godRollCandidate } from "./godroll";
import { maximin, paretoFilter, rankByMaximin } from "./pareto";
import { solve } from "./pipeline";
import { prune } from "./pruner";
import { mulberry32 } from "./rng";
import { substituteOnGateConflict } from "./substitute";
import type { Candidate, SolverRules } from "./types";

const rules: SolverRules = {
  beam_width: 8,
  anneal_iterations: 50,
  timeout_ms: 5000,
  balanced: { strategy: "maximin", mob_floor: 0.4, boss_floor: 0.4 },
  obtainable_for_published: ["confirmed"],
  obtainable_for_experimental: ["confirmed", "probable"],
};

function cand(partial: Partial<Candidate> & { id: string }): Candidate {
  return {
    score: 1,
    mobScore: 1,
    bossScore: 1,
    obtainable: "confirmed",
    gate: "base",
    legal: true,
    prereqsMet: true,
    skills: [],
    gear: [],
    synergyKeys: ["crit"],
    ...partial,
  };
}

describe("pruner", () => {
  it("filters obtainable, gate, legal, prereqs", () => {
    const pool = [
      cand({ id: "ok" }),
      cand({ id: "prob", obtainable: "probable" }),
      cand({ id: "dlc", gate: "dlc:x" }),
      cand({ id: "illegal", legal: false }),
      cand({ id: "prereq", prereqsMet: false }),
    ];
    expect(prune(pool, ["confirmed"]).map((c) => c.id)).toEqual(["ok"]);
  });
});

describe("beam", () => {
  it("keeps width and prefers higher scores", () => {
    const out = beamOverDag(
      ["a"],
      { a: ["b", "c"], b: ["d"], c: ["e"] },
      (p) => p.join("").length,
      2,
      3,
    );
    expect(out.length).toBeLessThanOrEqual(2);
    expect(out[0]!.score).toBeGreaterThanOrEqual(out[1]?.score ?? 0);
  });

  it("carries leaf nodes when no children", () => {
    const out = beamOverDag(["leaf"], {}, () => 1, 4, 2);
    expect(out).toHaveLength(1);
    expect(out[0]!.skills).toEqual(["leaf"]);
  });
});

describe("anneal + determinism", () => {
  it("same seed same best", () => {
    const seed = cand({ id: "s", score: 1 });
    const neighbors = (c: Candidate) => [
      { ...c, id: `${c.id}-up`, score: c.score + 0.1 },
      { ...c, id: `${c.id}-down`, score: c.score - 0.05 },
    ];
    const a = annealLoadout(seed, neighbors, 40, 42, 5000, () => 0);
    const b = annealLoadout(seed, neighbors, 40, 42, 5000, () => 0);
    expect(a).toEqual(b);
  });

  it("returns seed when neighbor list empty", () => {
    const seed = cand({ id: "lonely", score: 2 });
    expect(
      annealLoadout(
        seed,
        () => [],
        10,
        1,
        5000,
        () => 0,
      ),
    ).toEqual(seed);
  });

  it("stops on timeout", () => {
    const seed = cand({ id: "t", score: 1 });
    let calls = 0;
    const now = () => {
      calls += 1;
      return calls > 2 ? 10_000 : 0;
    };
    const out = annealLoadout(
      seed,
      (c) => [{ ...c, id: "n", score: c.score + 1 }],
      1000,
      1,
      1,
      now,
    );
    expect(out.score).toBeGreaterThanOrEqual(seed.score);
  });

  it("mulberry32 is deterministic", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("pareto + maximin", () => {
  it("drops dominated points", () => {
    const front = paretoFilter([
      cand({ id: "a", mobScore: 1, bossScore: 0.5 }),
      cand({ id: "b", mobScore: 0.9, bossScore: 0.4 }),
      cand({ id: "c", mobScore: 0.5, bossScore: 1 }),
    ]);
    expect(front.map((c) => c.id).sort()).toEqual(["a", "c"]);
  });

  it("maximin is min not average", () => {
    expect(maximin({ mob: 0.9, boss: 0.5 }, { mob: 0.4, boss: 0.4 })).toBe(0.5);
    expect(maximin({ mob: 0.3, boss: 0.9 }, { mob: 0.4, boss: 0.4 })).toBeNull();
  });

  it("ranks by maximin", () => {
    const ranked = rankByMaximin(
      [
        cand({ id: "balanced", mobScore: 0.7, bossScore: 0.7 }),
        cand({ id: "spike", mobScore: 0.95, bossScore: 0.5 }),
      ],
      { mob: 0.4, boss: 0.4 },
    );
    expect(ranked[0]!.id).toBe("balanced");
  });
});

describe("substitute", () => {
  it("swaps on gate conflict sharing synergy", () => {
    const cur = cand({ id: "locked", gate: "dlc:x", score: 2, synergyKeys: ["crit"] });
    const alt = cand({ id: "free", score: 1.5, synergyKeys: ["crit", "fire"] });
    const r = substituteOnGateConflict(cur, [cur, alt], ["base"]);
    expect(r?.to.id).toBe("free");
    expect(r?.delta).toBeCloseTo(-0.5);
  });

  it("returns null when gate owned or no synergy match", () => {
    const cur = cand({ id: "ok", gate: "base" });
    expect(substituteOnGateConflict(cur, [cur], ["base"])).toBeNull();
    const locked = cand({ id: "locked", gate: "dlc:x", synergyKeys: ["a"] });
    const other = cand({ id: "other", synergyKeys: ["b"] });
    expect(substituteOnGateConflict(locked, [locked, other], ["base"])).toBeNull();
  });
});

describe("pipeline", () => {
  it("solve is deterministic for fixed seed", () => {
    const pool = [
      cand({ id: "a", score: 0.8, mobScore: 0.8, bossScore: 0.8 }),
      cand({ id: "b", score: 0.6, mobScore: 0.9, bossScore: 0.55 }),
    ];
    const neighbors = (c: Candidate) => [{ ...c, id: `${c.id}-n`, score: c.score + 0.01 }];
    const x = solve({ pool, rules, neighbors, rngSeed: 99 });
    const y = solve({ pool, rules, neighbors, rngSeed: 99 });
    expect(x.best?.id).toBe(y.best?.id);
    expect(x.ranked.map((c) => c.id)).toEqual(y.ranked.map((c) => c.id));
  });

  it("includes dag beam when provided", () => {
    const pool = [cand({ id: "base", score: 0.5, mobScore: 0.5, bossScore: 0.5 })];
    const out = solve({
      pool,
      rules,
      experimental: true,
      dag: {
        roots: ["root"],
        edges: { root: ["child"] },
        scoreOf: (p) => p.length,
      },
      maxDepth: 2,
    });
    expect(out.ranked.length).toBeGreaterThan(0);
  });

  it("injects god-roll seed from bound parts", () => {
    const picks = enumerateGodRolls(
      [
        {
          name: "part_a",
          attributes: [{ target: "gun_damage", op: "mul", min: 1.1, max: 1.4, median: 1.25 }],
        },
        {
          name: "part_b",
          attributes: [{ target: "gun_damage", op: "mul", min: 1.05, max: 1.2, median: 1.1 }],
        },
      ],
      "max",
    );
    expect(picks[0]?.part).toBe("part_a");
    expect(godRollCandidate(picks).gear).toContain("part_a");
    const out = solve({
      pool: [cand({ id: "weak", score: 0.2, mobScore: 0.5, bossScore: 0.5 })],
      rules: { ...rules, obtainable_for_published: ["confirmed", "probable"] },
      boundParts: [
        {
          name: "part_a",
          attributes: [{ target: "gun_damage", op: "mul", min: 1.1, max: 1.4, median: 1.25 }],
        },
      ],
    });
    expect(out.ranked.some((c) => c.id === "godroll" || c.gear.includes("part_a"))).toBe(true);
  });
});
