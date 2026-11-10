import type { SkillEffectPack } from "../skills/effects";
import type { GrenadeCatalog, SynergyRulesPack } from "../synergy";
import adaptersJson from "./builds/adapters.json";
import coreJson from "./builds/core.json";
import recommendedLegendariesJson from "./builds/recommended_legendaries.json";
import enhancementCatalogA from "./enhancement_catalog_a.json";
import enhancementCatalogB from "./enhancement_catalog_b.json";
import firmwareCatalogJson from "./firmware_catalog.json";
import type { FirmwareCatalog } from "./firmwareTotals";
import type { WeaponGodrollPack } from "./godrollFromBuild";
import grenadeCatalogJson from "./grenade_catalog.json";
import procsJson from "./procs.json";
import rafaEffectsJson from "./rafa_skill_effects.json";
import type { EnhancementCatalog } from "./scoreEnhancements";
import synergyRulesJson from "./synergy_rules.json";
import weaponGodrollsJson from "./weapon_godrolls.json";

export type BuildCorePack = typeof coreJson;
export type BuildAdaptersPack = typeof adaptersJson;
export type ArchetypeId = "balanced" | "mobbing" | "bossing";

export function loadRafaSkillEffects(): SkillEffectPack {
  const pack = rafaEffectsJson as SkillEffectPack;
  if (pack.experimental !== true || pack.obtainable !== "unverified") {
    throw new Error("rafa_skill_effects pack must be experimental/unverified");
  }
  return pack;
}

export function loadGrenadeCatalog(): GrenadeCatalog {
  const pack = grenadeCatalogJson as GrenadeCatalog;
  if (pack.experimental !== true) throw new Error("grenade_catalog must be experimental");
  return pack;
}

export function loadSynergyRules(): SynergyRulesPack {
  const pack = synergyRulesJson as SynergyRulesPack;
  if (pack.experimental !== true || pack.obtainable !== "unverified") {
    throw new Error("synergy_rules must be experimental/unverified");
  }
  return pack;
}

export function loadFirmwareCatalog(): FirmwareCatalog {
  return firmwareCatalogJson as FirmwareCatalog;
}

export function loadBuildCore(): BuildCorePack {
  const pack = coreJson as BuildCorePack;
  if (pack.experimental !== true) throw new Error("build core must be experimental");
  return pack;
}

export function loadBuildAdapters(): BuildAdaptersPack {
  const pack = adaptersJson as BuildAdaptersPack;
  if (pack.experimental !== true) throw new Error("adapters must be experimental");
  return pack;
}

export function loadProcs() {
  return procsJson;
}

export function loadEnhancementCatalog(): EnhancementCatalog {
  const a = enhancementCatalogA as EnhancementCatalog & { experimental: boolean };
  const b = enhancementCatalogB as EnhancementCatalog & { experimental: boolean };
  if (a.experimental !== true || b.experimental !== true) {
    throw new Error("enhancement catalog shards must be experimental");
  }
  return {
    experimental: true,
    enhancements: [...a.enhancements, ...b.enhancements],
  };
}

export function loadWeaponGodrolls(): WeaponGodrollPack {
  const pack = weaponGodrollsJson as WeaponGodrollPack & { experimental: boolean };
  if (pack.experimental !== true) throw new Error("weapon_godrolls must be experimental");
  return pack;
}

export type RecommendedLegendariesPack = typeof recommendedLegendariesJson;

export function loadRecommendedLegendaries(): RecommendedLegendariesPack {
  const pack = recommendedLegendariesJson as RecommendedLegendariesPack;
  if (pack.experimental !== true) throw new Error("recommended_legendaries must be experimental");
  return pack;
}
