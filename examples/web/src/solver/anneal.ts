import { mulberry32 } from "./rng";
import type { Candidate } from "./types";

/** Simulated annealing over loadout slots; anytime best-so-far. */
export function annealLoadout(
  seed: Candidate,
  neighbors: (c: Candidate) => Candidate[],
  iterations: number,
  rngSeed: number,
  timeoutMs: number,
  now: () => number = () => Date.now(),
): Candidate {
  const rng = mulberry32(rngSeed);
  let current = seed;
  let best = seed;
  const start = now();
  let temp = 1;

  for (let i = 0; i < iterations; i++) {
    if (now() - start > timeoutMs) break;
    const opts = neighbors(current);
    if (opts.length === 0) break;
    const next = opts[Math.floor(rng() * opts.length)]!;
    const delta = next.score - current.score;
    if (delta >= 0 || rng() < Math.exp(delta / Math.max(temp, 1e-9))) {
      current = next;
      if (current.score > best.score) best = current;
    }
    temp *= 0.995;
  }
  return best;
}
