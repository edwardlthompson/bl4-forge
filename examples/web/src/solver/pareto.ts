import type { Candidate, ScorePair } from "./types";

/** Balanced archetype: maximin of mob/boss with floors. */
export function maximin(pair: ScorePair, floors: { mob: number; boss: number }): number | null {
  if (pair.mob < floors.mob || pair.boss < floors.boss) return null;
  return Math.min(pair.mob, pair.boss);
}

/** Non-dominated filter on (mobScore, bossScore). */
export function paretoFilter(candidates: Candidate[]): Candidate[] {
  return candidates.filter((c) => {
    return !candidates.some(
      (o) =>
        o !== c &&
        o.mobScore >= c.mobScore &&
        o.bossScore >= c.bossScore &&
        (o.mobScore > c.mobScore || o.bossScore > c.bossScore),
    );
  });
}

export function rankByMaximin(
  candidates: Candidate[],
  floors: { mob: number; boss: number },
): Candidate[] {
  return [...candidates]
    .map((c) => {
      const m = maximin({ mob: c.mobScore, boss: c.bossScore }, floors);
      return m === null ? null : { ...c, score: m };
    })
    .filter((c): c is Candidate => c !== null)
    .sort((a, b) => b.score - a.score);
}
