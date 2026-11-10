import { buildRafaPool, PEACEBREAKER_ID, rafaNeighbors } from "./candidates/rafaFactory";
import { solve } from "./pipeline";
import rulesJson from "./rules.json";
import type { ScoredBuild } from "./scoreCandidate";
import type { Candidate, SolverRules } from "./types";

export type RafaSolveResult = {
  best: Candidate | null;
  ranked: Candidate[];
  scored: Map<string, ScoredBuild>;
  peacebreaker: ScoredBuild | undefined;
  deltaVsPeacebreaker: number | null;
  solverVersion: string;
  seed: number;
  experimental: true;
};

export function loadSolverRules(): SolverRules {
  return rulesJson as SolverRules;
}

/** Run Rafa discovery: pool → anneal neighbors → maximin rank. */
export function solveRafa(seed = 42): RafaSolveResult {
  const { scored, pool, peacebreakerId } = buildRafaPool();
  const scoredById = new Map(scored.map((s) => [s.candidate.id, s]));
  const rules = loadSolverRules();
  const maxMob = Math.max(...pool.map((c) => c.mobScore), 1);
  const maxBoss = Math.max(...pool.map((c) => c.bossScore), 1);
  const normalized = pool.map((c) => ({
    ...c,
    mobScore: c.mobScore / maxMob,
    bossScore: c.bossScore / maxBoss,
    score: Math.min(c.mobScore / maxMob, c.bossScore / maxBoss),
  }));
  const out = solve({
    pool: normalized,
    rules: {
      ...rules,
      anneal_iterations: Math.min(rules.anneal_iterations, 40),
      balanced: { strategy: "maximin", mob_floor: 0.05, boss_floor: 0.05 },
    },
    experimental: true,
    neighbors: rafaNeighbors(scoredById),
    rngSeed: seed,
  });
  const ranked = out.ranked.map((c) => {
    const s = scoredById.get(c.id);
    return s ? s.candidate : c;
  });
  const best = ranked[0] ?? null;
  const peacebreaker = scoredById.get(peacebreakerId);
  const delta = best && peacebreaker ? best.score - peacebreaker.candidate.score : null;
  return {
    best,
    ranked,
    scored: scoredById,
    peacebreaker,
    deltaVsPeacebreaker: delta,
    solverVersion: "0.25.0-rafa",
    seed,
    experimental: true,
  };
}

export { PEACEBREAKER_ID };
