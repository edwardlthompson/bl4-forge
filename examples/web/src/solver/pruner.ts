import type { Candidate, Obtainable } from "./types";

/** Hard-filter obtainable → gate → legality → prereq feasibility. */
export function prune(
  candidates: Candidate[],
  allowed: Obtainable[],
  ownedGates: string[] = ["base"],
): Candidate[] {
  const allow = new Set(allowed);
  return candidates.filter((c) => {
    if (!allow.has(c.obtainable)) return false;
    if (c.gate !== "base" && !ownedGates.includes(c.gate)) return false;
    if (!c.legal) return false;
    if (!c.prereqsMet) return false;
    return true;
  });
}
