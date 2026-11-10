import { mulberry32 } from "../solver/rng";
import type { Candidate } from "../solver/types";

/** Multi-seed generation: greedy per synergy key + random restarts. */
export function generateSeeds(
  pool: Candidate[],
  synergyKeys: string[],
  restarts: number,
  rngSeed: number,
): Candidate[] {
  const rng = mulberry32(rngSeed);
  const out: Candidate[] = [];
  for (const key of synergyKeys) {
    const hit = pool
      .filter((c) => c.synergyKeys.includes(key))
      .sort((a, b) => b.score - a.score)[0];
    if (hit) out.push({ ...hit, id: `seed-syn-${key}-${hit.id}` });
  }
  for (let i = 0; i < restarts; i++) {
    if (pool.length === 0) break;
    const pick = pool[Math.floor(rng() * pool.length)]!;
    out.push({ ...pick, id: `seed-rand-${i}-${pick.id}` });
  }
  return out;
}
