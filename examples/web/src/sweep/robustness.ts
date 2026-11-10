import type { Candidate } from "../solver/types";

/** Mean score under ±perturbation of mob/boss assumptions. */
export function robustnessTiebreak(candidates: Candidate[], perturbation = 0.2): Candidate[] {
  return [...candidates]
    .map((c) => {
      const factors = [1 - perturbation, 1, 1 + perturbation];
      let sum = 0;
      let n = 0;
      for (const fm of factors) {
        for (const fb of factors) {
          sum += Math.min(c.mobScore * fm, c.bossScore * fb);
          n += 1;
        }
      }
      return { ...c, score: sum / n };
    })
    .sort((a, b) => b.score - a.score);
}
