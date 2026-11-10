import type { CondType, SimEffect } from "../sim/types";
import type { HunterDef, SkillAllocation, SkillDef } from "./types";

export type RankedEffectDef = SimEffect & {
  values_by_rank?: number[];
  oracle: NonNullable<SimEffect["oracle"]>;
};

export type SkillEffectPack = {
  experimental: true;
  obtainable: "unverified";
  skills: Record<
    string,
    {
      display_name?: string;
      max_rank: number;
      effects: RankedEffectDef[];
      behavior_tags?: string[];
      source_url?: string;
    }
  >;
};

export type StatLine = {
  target: string;
  label: string;
  pct: number;
  delta: number;
  cond?: CondType;
};

function asPct(v: number): number {
  return Math.round(v * 1000) / 10;
}

function valueAtRank(effect: RankedEffectDef, rank: number): number {
  if (rank <= 0) return 0;
  const series = effect.values_by_rank;
  if (series?.length) {
    const idx = Math.min(rank, series.length) - 1;
    return series[idx] ?? 0;
  }
  return typeof effect.value === "number" ? effect.value * rank : 0;
}

/** Resolve skill effects at a concrete rank into runtime SimEffects. */
export function effectsAtRank(def: RankedEffectDef[], rank: number): SimEffect[] {
  if (rank <= 0) return [];
  return def.map((e) => {
    const value = valueAtRank(e, rank);
    return {
      op: e.op,
      target: e.target,
      value,
      cond: e.cond,
      tags: e.tags,
      behavior_tags: e.behavior_tags,
      oracle: e.oracle,
      label: e.label,
      unparsed: e.unparsed,
      tag_only: e.tag_only,
    };
  });
}

export function allocationEffects(pack: SkillEffectPack, alloc: SkillAllocation): SimEffect[] {
  const out: SimEffect[] = [];
  for (const r of alloc.ranks) {
    const entry = pack.skills[r.id];
    if (!entry || r.rank <= 0) continue;
    out.push(...effectsAtRank(entry.effects, r.rank));
  }
  return out;
}

export function behaviorTagsForAllocation(pack: SkillEffectPack, alloc: SkillAllocation): string[] {
  const tags = new Set<string>();
  for (const r of alloc.ranks) {
    if (r.rank <= 0) continue;
    const entry = pack.skills[r.id];
    for (const t of entry?.behavior_tags ?? []) tags.add(t);
    for (const e of effectsAtRank(entry?.effects ?? [], r.rank)) {
      for (const t of e.behavior_tags ?? []) tags.add(t);
    }
  }
  return [...tags];
}

/** Per-stat lines at a skill rank (cumulative + delta vs prior rank). */
export function cumulativeStatLines(effects: RankedEffectDef[], toRank: number): StatLine[] {
  const lines: StatLine[] = [];
  for (const e of effects) {
    const now = valueAtRank(e, toRank);
    const prev = valueAtRank(e, toRank - 1);
    lines.push({
      target: e.target,
      label: e.label ?? e.target,
      pct: asPct(now),
      delta: asPct(now - prev),
      cond: e.cond?.type,
    });
  }
  return lines;
}

export function mergePackOntoHunter(hunter: HunterDef, pack: SkillEffectPack): HunterDef {
  return {
    ...hunter,
    skills: hunter.skills.map((s: SkillDef) => {
      const entry = pack.skills[s.id];
      if (!entry) return s;
      return {
        ...s,
        effects: entry.effects,
        tags: [...new Set([...s.tags, ...(entry.behavior_tags ?? [])])],
      };
    }),
  };
}
