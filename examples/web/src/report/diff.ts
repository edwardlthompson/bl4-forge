import type { Candidate } from "../solver/types";

/** Why not runner-up: score delta vs rank 2. */
export function whyNotRunnerUp(ranked: Candidate[]): {
  best: Candidate | null;
  runnerUp: Candidate | null;
  delta: number;
} {
  const best = ranked[0] ?? null;
  const runnerUp = ranked[1] ?? null;
  return {
    best,
    runnerUp,
    delta: best && runnerUp ? best.score - runnerUp.score : 0,
  };
}
