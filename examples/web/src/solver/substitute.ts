import type { Candidate, SubstituteResult } from "./types";

/** On gate conflict, swap to next candidate sharing ≥1 synergy key. */
export function substituteOnGateConflict(
  current: Candidate,
  pool: Candidate[],
  ownedGates: string[],
): SubstituteResult | null {
  if (current.gate === "base" || ownedGates.includes(current.gate)) {
    return null;
  }
  const keys = new Set(current.synergyKeys);
  const alt = pool.find(
    (c) =>
      c.id !== current.id &&
      (c.gate === "base" || ownedGates.includes(c.gate)) &&
      c.synergyKeys.some((k) => keys.has(k)),
  );
  if (!alt) return null;
  return { from: current, to: alt, delta: alt.score - current.score };
}
