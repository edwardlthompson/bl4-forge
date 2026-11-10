import { annealLoadout } from "./anneal";
import { beamOverDag } from "./beam";
import { type BoundPart, enumerateGodRolls, godRollCandidate } from "./godroll";
import { paretoFilter, rankByMaximin } from "./pareto";
import { prune } from "./pruner";
import { substituteOnGateConflict } from "./substitute";
import type { Candidate, SolverRules } from "./types";

export type PipelineInput = {
  pool: Candidate[];
  rules: SolverRules;
  ownedGates?: string[];
  experimental?: boolean;
  dag?: { roots: string[]; edges: Record<string, string[]>; scoreOf: (p: string[]) => number };
  neighbors?: (c: Candidate) => Candidate[];
  rngSeed?: number;
  maxDepth?: number;
  /** Optional bound parts → inject god-roll seed into pool. */
  boundParts?: BoundPart[];
  godRollMode?: "max" | "min";
};

/** prune → beam → anneal → Pareto → maximin rank (+ optional substitute). */
export function solve(input: PipelineInput): {
  ranked: Candidate[];
  best: Candidate | null;
  substitute: ReturnType<typeof substituteOnGateConflict>;
} {
  const allowed = input.experimental
    ? input.rules.obtainable_for_experimental
    : input.rules.obtainable_for_published;
  const gates = input.ownedGates ?? ["base"];
  let pool = prune(input.pool, allowed, gates);

  if (input.boundParts?.length) {
    const picks = enumerateGodRolls(input.boundParts, input.godRollMode ?? "max");
    pool = [...pool, godRollCandidate(picks)];
  }

  if (input.dag) {
    const beamed = beamOverDag(
      input.dag.roots,
      input.dag.edges,
      input.dag.scoreOf,
      input.rules.beam_width,
      input.maxDepth ?? 4,
    );
    pool = [...pool, ...beamed];
  }

  if (input.neighbors && pool.length > 0) {
    const seed = [...pool].sort((a, b) => b.score - a.score)[0]!;
    const annealed = annealLoadout(
      seed,
      input.neighbors,
      input.rules.anneal_iterations,
      input.rngSeed ?? 1,
      input.rules.timeout_ms,
    );
    pool = [...pool, annealed];
  }

  const front = paretoFilter(pool);
  const ranked = rankByMaximin(front, {
    mob: input.rules.balanced.mob_floor,
    boss: input.rules.balanced.boss_floor,
  });
  const best = ranked[0] ?? null;
  const substitute = best ? substituteOnGateConflict(best, pool, gates) : null;
  return { ranked, best, substitute };
}
