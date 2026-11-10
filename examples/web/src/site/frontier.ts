import type { Candidate } from "../solver/types";

/** Reduced-beam approximate frontier point for explorer UI. */
export function approximateFrontier(ranked: Candidate[], t: number): Candidate | null {
  if (ranked.length === 0) return null;
  const idx = Math.min(ranked.length - 1, Math.max(0, Math.round(t * (ranked.length - 1))));
  const c = ranked[idx]!;
  return { ...c, id: `approx-${c.id}`, score: c.score };
}
