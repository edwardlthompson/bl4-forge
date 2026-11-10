import type { SimEffect } from "../sim/types";

export type SynergyRule = {
  id: string;
  title: string;
  why: string;
  require_all?: string[];
  require_any?: string[];
  skill_tags_any?: string[];
  effects: SimEffect[];
  recommend_grenade?: {
    grenade_id: string;
    payload?: string;
    payload_augment?: string;
    perk?: string;
  };
};

export type SynergyRulesPack = {
  experimental: true;
  obtainable: "unverified";
  rules: SynergyRule[];
};

export type SynergyHit = {
  id: string;
  title: string;
  why: string;
  tags: string[];
  effects: SimEffect[];
  recommend_grenade?: SynergyRule["recommend_grenade"];
};

export type GrenadeRoll = {
  grenade_id: string;
  payload?: string;
  payload_augment?: string;
  perk?: string;
  extra_tags?: string[];
};

export type GrenadeCatalog = {
  experimental: true;
  grenades: Array<{
    id: string;
    name: string;
    behavior_tags?: string[];
    legendary_effect?: { behavior_tags?: string[] };
    payloads?: Array<{
      id: string;
      behavior_tags?: string[];
      augments?: Array<{ id: string; behavior_tags?: string[] }>;
    }>;
    perks?: Array<{ id: string; behavior_tags?: string[]; effects?: SimEffect[] }>;
  }>;
};

function hasAll(tags: Set<string>, need: string[] | undefined): boolean {
  if (!need?.length) return true;
  return need.every((t) => tags.has(t));
}

function hasAny(tags: Set<string>, need: string[] | undefined): boolean {
  if (!need?.length) return true;
  return need.some((t) => tags.has(t));
}

/** Collect behavior tags from a grenade roll + skill tags. */
export function collectTags(
  catalog: GrenadeCatalog,
  roll: GrenadeRoll | null,
  skillTags: string[],
): Set<string> {
  const tags = new Set<string>(skillTags);
  for (const t of roll?.extra_tags ?? []) tags.add(t);
  if (!roll) return tags;
  const g = catalog.grenades.find((x) => x.id === roll.grenade_id);
  if (!g) return tags;
  for (const t of g.behavior_tags ?? []) tags.add(t);
  for (const t of g.legendary_effect?.behavior_tags ?? []) tags.add(t);
  const payload = g.payloads?.find((p) => p.id === roll.payload);
  for (const t of payload?.behavior_tags ?? []) tags.add(t);
  const aug = payload?.augments?.find((a) => a.id === roll.payload_augment);
  for (const t of aug?.behavior_tags ?? []) tags.add(t);
  const perk = g.perks?.find((p) => p.id === roll.perk);
  for (const t of perk?.behavior_tags ?? []) tags.add(t);
  return tags;
}

export function detectSynergies(
  rules: SynergyRulesPack,
  catalog: GrenadeCatalog,
  roll: GrenadeRoll | null,
  skillTags: string[],
): SynergyHit[] {
  const tags = collectTags(catalog, roll, skillTags);
  const skillSet = new Set(skillTags);
  const hits: SynergyHit[] = [];
  for (const rule of rules.rules) {
    if (!hasAll(tags, rule.require_all)) continue;
    if (!hasAny(tags, rule.require_any)) continue;
    if (rule.skill_tags_any?.length && !hasAny(skillSet, rule.skill_tags_any)) continue;
    hits.push({
      id: rule.id,
      title: rule.title,
      why: rule.why,
      tags: [...tags].filter(
        (t) => (rule.require_all ?? []).includes(t) || (rule.require_any ?? []).includes(t),
      ),
      effects: rule.effects,
      recommend_grenade: rule.recommend_grenade,
    });
  }
  return hits;
}

export function synergyEffects(hits: SynergyHit[]): SimEffect[] {
  return hits.flatMap((h) => h.effects);
}

export function bestGrenadeRecommendation(
  hits: SynergyHit[],
): SynergyHit["recommend_grenade"] | null {
  return hits.find((h) => h.recommend_grenade)?.recommend_grenade ?? null;
}
