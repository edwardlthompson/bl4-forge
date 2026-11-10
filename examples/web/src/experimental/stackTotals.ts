/** Aggregate splash / radius / gun / ordnance stacks across the guide loadout. */
import { allocationEffects, behaviorTagsForAllocation } from "../skills/effects";
import type { SkillAllocation } from "../skills/types";
import { detectSynergies, type GrenadeRoll, synergyEffects } from "../synergy";
import { effectsForEnhancementIds } from "./enhancementEffects";
import { type FirmwareLoadoutPiece, sumFirmwareTotals } from "./firmwareTotals";
import { effectsForGearPieces, type GearPieceInput } from "./gearStackContrib";
import {
  loadFirmwareCatalog,
  loadGrenadeCatalog,
  loadRafaSkillEffects,
  loadSynergyRules,
} from "./loadPacks";
import { addStackEffect, mergeFirmwareLine, type StackBucket } from "./stackBucket";

export type { StackBucket } from "./stackBucket";

export type StackTotals = {
  experimental: true;
  buckets: StackBucket[];
  notes: string[];
};

/** Sum numeric add effects from skills + firmware + synergies + COM + gear + enhancements. */
export function computeStackTotals(input: {
  allocation: SkillAllocation;
  firmware: FirmwareLoadoutPiece[];
  grenadeRoll?: GrenadeRoll;
  includeComGodroll?: boolean;
  gearPieces?: GearPieceInput[];
  enhancementIds?: string[];
}): StackTotals {
  const map = new Map<string, StackBucket>();
  const notes: string[] = [];
  const pack = loadRafaSkillEffects();
  for (const e of allocationEffects(pack, input.allocation)) {
    addStackEffect(map, e, e.label ? `Skill: ${e.label}` : `Skill: ${e.target}`);
  }
  for (const line of sumFirmwareTotals(loadFirmwareCatalog(), input.firmware)) {
    mergeFirmwareLine(map, line);
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
  const tags = behaviorTagsForAllocation(pack, input.allocation);
  for (const e of synergyEffects(
    detectSynergies(loadSynergyRules(), loadGrenadeCatalog(), roll, tags),
  )) {
    addStackEffect(map, e, e.label ? `Synergy: ${e.label}` : `Synergy: ${e.target}`);
  }

  if (input.includeComGodroll !== false) {
    addStackEffect(
      map,
      { op: "add", target: "gun_damage", value: 0.35, label: "Grenazerker fixed" },
      "COM: Grenazerker +35% Gun Damage",
    );
    addStackEffect(
      map,
      { op: "add", target: "splash_damage", value: 0.46, label: "Grenazerker Splash" },
      "COM: +46% Splash Damage",
    );
    notes.push(
      "COM assumes Grenazerker +3 Sinergia / +4 Confeti / Splash; Confeti ordnance is proc-only.",
    );
  }

  if (input.enhancementIds?.length) {
    for (const e of effectsForEnhancementIds(input.enhancementIds)) {
      addStackEffect(map, e, e.label ? `Enhancement: ${e.label}` : `Enhancement: ${e.target}`);
    }
    notes.push(`Enhancement perks: ${input.enhancementIds.join(" + ")}.`);
  }

  if (input.gearPieces?.length) {
    const { effects, notes: gearNotes } = effectsForGearPieces(input.gearPieces);
    for (const e of effects) {
      addStackEffect(map, e, e.label ? `Gear: ${e.label}` : `Gear: ${e.target}`);
    }
    notes.push(...gearNotes);
    notes.push(`Loadout gear counted: ${input.gearPieces.map((p) => p.item_name).join(", ")}.`);
  }

  notes.push("Totals are additive experimental name_inferred stacks — not card_match certified.");
  const buckets = [...map.values()].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  return { experimental: true, buckets, notes };
}
