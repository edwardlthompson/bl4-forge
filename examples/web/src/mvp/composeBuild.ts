import {
  loadGrenadeCatalog,
  loadRafaSkillEffects,
  loadSynergyRules,
} from "../experimental/loadPacks";
import { contributionWaterfall } from "../report/waterfall";
import { composeDamage, sumRateAdds } from "../sim/compose";
import type { Archetype, ComposeResult, SimEffect } from "../sim/types";
import { allocationEffects, behaviorTagsForAllocation } from "../skills/effects";
import type { SkillAllocation } from "../skills/types";
import { getSpecCatalog, type SpecAllocation, specializationEffects } from "../specializations";
import {
  bestGrenadeRecommendation,
  detectSynergies,
  type GrenadeRoll,
  type SynergyHit,
  synergyEffects,
} from "../synergy";

export type BuildPiece = {
  id: string;
  slot: string;
  label: string;
  effects: SimEffect[];
  synergyKeys?: string[];
};

export type BuildStatsInput = {
  pieces: BuildPiece[];
  specs: SpecAllocation;
  archetype?: Archetype;
  uptime: Record<string, number>;
  base?: number;
  fireRate?: number;
  magazineSize?: number;
  reloadS?: number;
  /** Optional VH skill allocation (Rafa guide). */
  skillAllocation?: SkillAllocation;
  grenadeRoll?: GrenadeRoll | null;
};

export type BuildStatsReport = {
  compose: ComposeResult;
  waterfall: ReturnType<typeof contributionWaterfall>;
  synergyKeys: string[];
  procs: ReturnType<typeof specializationEffects>["procs"];
  pieces: Array<{ id: string; slot: string; label: string; synergyKeys: string[] }>;
  synergies: SynergyHit[];
  grenadeRecommendation: ReturnType<typeof bestGrenadeRecommendation>;
  experimental: true;
};

const DEFAULT_UPTIME: Record<string, number> = {
  always: 1,
  while_overdrive: 0.72,
};

/** Merge gear + specialization + VH + auto synergies into stats report. */
export function composeBuildStats(input: BuildStatsInput): BuildStatsReport {
  const catalog = getSpecCatalog();
  const specBundle = specializationEffects(catalog, input.specs);
  const gearEffects = input.pieces.flatMap((p) => p.effects);
  const uptime = { ...DEFAULT_UPTIME, ...input.uptime };

  let vhEffects: SimEffect[] = [];
  let skillTags: string[] = [];
  if (input.skillAllocation) {
    const pack = loadRafaSkillEffects();
    vhEffects = allocationEffects(pack, input.skillAllocation);
    skillTags = behaviorTagsForAllocation(pack, input.skillAllocation);
  }

  const roll =
    input.grenadeRoll ??
    ({
      grenade_id: "vla_grenade_gadget.comp_05_legendary_Waterfall",
      payload: "lingering",
      payload_augment: "pulsing",
      perk: "nuke",
      extra_tags: ["airdrop", "radius"],
    } satisfies GrenadeRoll);

  const grenadeCat = loadGrenadeCatalog();
  const rules = loadSynergyRules();
  const synergies = detectSynergies(rules, grenadeCat, roll, skillTags);
  const synFx = synergyEffects(synergies);

  const allEffects = [...gearEffects, ...specBundle.effects, ...vhEffects, ...synFx];
  const fireRate = (input.fireRate ?? 8) * (1 + sumRateAdds(allEffects, "fire_rate", uptime));
  const reloadS =
    (input.reloadS ?? 2) / Math.max(0.25, 1 + sumRateAdds(allEffects, "reload_speed", uptime));

  const synergyKeys = new Set<string>(specBundle.synergyKeys);
  for (const p of input.pieces) {
    for (const k of p.synergyKeys ?? []) synergyKeys.add(k);
  }
  for (const t of skillTags) synergyKeys.add(t);
  for (const h of synergies) synergyKeys.add(h.id);

  const compose = composeDamage({
    base: input.base ?? 100,
    effects: allEffects,
    archetype: input.archetype ?? "balanced",
    uptime,
    fireRate,
    fireRateCap: 20,
    magazineSize: input.magazineSize ?? 30,
    reloadS,
    reloadCancel: 0.1,
    elementMult: 1,
    critMult: 1.5,
    scenarioMods: 1,
  });

  return {
    compose,
    waterfall: contributionWaterfall(compose),
    synergyKeys: [...synergyKeys],
    procs: specBundle.procs,
    pieces: input.pieces.map((p) => ({
      id: p.id,
      slot: p.slot,
      label: p.label,
      synergyKeys: p.synergyKeys ?? [],
    })),
    synergies,
    grenadeRecommendation: bestGrenadeRecommendation(synergies),
    experimental: true,
  };
}
