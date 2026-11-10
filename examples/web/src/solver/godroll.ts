import type { Candidate } from "./types";

export type PartAttr = {
  target: string;
  op: "add" | "mul" | "set" | "flag";
  min: number;
  max: number;
  median: number;
};

export type BoundPart = {
  name: string;
  slot?: string;
  attributes: PartAttr[];
};

export type GodRollPick = {
  part: string;
  target: string;
  value: number;
  extremum: "max" | "min";
};

/** Pick extremal attribute values per target (god-roll / dump-roll). */
export function enumerateGodRolls(parts: BoundPart[], mode: "max" | "min" = "max"): GodRollPick[] {
  const best = new Map<string, GodRollPick>();
  for (const p of parts) {
    for (const a of p.attributes ?? []) {
      const value = mode === "max" ? a.max : a.min;
      const prev = best.get(a.target);
      const better = !prev || (mode === "max" ? value > prev.value : value < prev.value);
      if (better) {
        best.set(a.target, {
          part: p.name,
          target: a.target,
          value,
          extremum: mode,
        });
      }
    }
  }
  return [...best.values()];
}

/** Turn god-roll picks into a solver Candidate seed. */
export function godRollCandidate(picks: GodRollPick[], id = "godroll"): Candidate {
  const score = picks.reduce(
    (s, p) => s + (p.extremum === "max" ? p.value : 1 / Math.max(p.value, 1e-6)),
    0,
  );
  return {
    id,
    score,
    mobScore: score,
    bossScore: score,
    obtainable: "probable",
    gate: "base",
    legal: true,
    prereqsMet: true,
    skills: [],
    gear: picks.map((p) => p.part),
    synergyKeys: picks.map((p) => p.target),
  };
}
