import type { Candidate } from "../solver/types";

/** High-fidelity re-score across scenario samples (mean). */
export function highFidelityRescore(
  candidates: Candidate[],
  samples: Array<{ mob: number; boss: number }>,
): Candidate[] {
  if (samples.length === 0) return candidates;
  return candidates.map((c) => {
    let mob = 0;
    let boss = 0;
    for (const s of samples) {
      mob += c.mobScore * s.mob;
      boss += c.bossScore * s.boss;
    }
    const n = samples.length;
    mob /= n;
    boss /= n;
    return { ...c, mobScore: mob, bossScore: boss, score: Math.min(mob, boss) };
  });
}
