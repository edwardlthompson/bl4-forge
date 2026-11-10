import type { Candidate } from "../solver/types";

export function loadoutHash(c: Candidate): string {
  return `${[...c.skills].sort().join(",")}|${[...c.gear].sort().join(",")}`;
}

export function dedupeByHash(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const c of [...candidates].sort((a, b) => b.score - a.score)) {
    const h = loadoutHash(c);
    if (seen.has(h)) continue;
    seen.add(h);
    out.push(c);
  }
  return out;
}

function overlap(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const bs = new Set(b);
  const shared = a.filter((x) => bs.has(x)).length;
  return shared / Math.max(a.length, b.length, 1);
}

/** Adjacent entries share ≤ maxSkill skill points and ≤ maxGear gear. */
export function diversityClamp(ranked: Candidate[], maxSkill = 0.7, maxGear = 0.6): Candidate[] {
  const kept: Candidate[] = [];
  for (const c of ranked) {
    const conflict = kept.some(
      (k) => overlap(k.skills, c.skills) > maxSkill || overlap(k.gear, c.gear) > maxGear,
    );
    if (!conflict) kept.push(c);
  }
  return kept;
}
