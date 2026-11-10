import { abilityWeapons, loadWeaponCatalog } from "../experimental/loadWeaponCatalog";
import { loadRafaPeacebreakerGuide } from "../guide/loadGuide";
import { type BuildPiece, composeBuildStats } from "../mvp/composeBuild";
import type { Archetype } from "../sim/types";
import type { SkillAllocation } from "../skills/types";
import type { Candidate } from "./types";
import uptimeTables from "./uptimeTables.json";

export type ScoredBuild = {
  candidate: Candidate;
  allocation: SkillAllocation;
  weaponId: string;
  shieldId: string;
  grenadeId: string;
  mobDps: number;
  bossDps: number;
};

function gearPieces(weaponId: string, shieldId: string, grenadeId: string): BuildPiece[] {
  const cat = loadWeaponCatalog();
  const byId = new Map(cat.weapons.map((w) => [w.id, w]));
  const mk = (id: string, slot: string): BuildPiece => {
    const meta = byId.get(id);
    const tags = meta?.behavior_tags ?? [];
    const keys = meta?.synergy_keys ?? [];
    return {
      id,
      slot,
      label: meta?.search_name ?? id,
      effects: [],
      synergyKeys: [...keys, ...tags],
    };
  };
  return [mk(weaponId, "weapon"), mk(shieldId, "shield"), mk(grenadeId, "grenade")];
}

function scoreArchetype(
  allocation: SkillAllocation,
  pieces: BuildPiece[],
  archetype: Archetype,
): number {
  const guide = loadRafaPeacebreakerGuide();
  const uptime = {
    ...(uptimeTables as Record<string, Record<string, number>>)[archetype],
  };
  const report = composeBuildStats({
    pieces,
    specs: { nodePoints: guide.spec.node_points, equipped: guide.spec.equipped },
    archetype,
    uptime,
    skillAllocation: allocation,
  });
  return report.compose.sustainedDps;
}

/** Score one Rafa loadout under mobbing + bossing scenarios. */
export function scoreRafaLoadout(
  id: string,
  allocation: SkillAllocation,
  weaponId: string,
  shieldId: string,
  grenadeId: string,
): ScoredBuild {
  const pieces = gearPieces(weaponId, shieldId, grenadeId);
  const mobDps = scoreArchetype(allocation, pieces, "mobbing");
  const bossDps = scoreArchetype(allocation, pieces, "bossing");
  const score = Math.min(mobDps, bossDps);
  const keys = new Set<string>();
  for (const p of pieces) for (const k of p.synergyKeys ?? []) keys.add(k);
  const candidate: Candidate = {
    id,
    score,
    mobScore: mobDps,
    bossScore: bossDps,
    obtainable: "unverified",
    gate: "base",
    legal: true,
    prereqsMet: true,
    skills: allocation.ranks.map((r) => `${r.id}:${r.rank}`),
    gear: [weaponId, shieldId, grenadeId],
    synergyKeys: [...keys],
  };
  return { candidate, allocation, weaponId, shieldId, grenadeId, mobDps, bossDps };
}

export function defaultAbilityWeaponIds(): string[] {
  return abilityWeapons()
    .filter((w) => (w.slot ?? "weapon") === "weapon")
    .map((w) => w.id);
}
