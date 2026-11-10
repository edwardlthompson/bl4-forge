/** Aggregate splash / radius / gun / ordnance stacks across the guide loadout. */
import type { SimEffect } from "../sim/types";
import { allocationEffects, behaviorTagsForAllocation } from "../skills/effects";
import type { SkillAllocation } from "../skills/types";
import { detectSynergies, type GrenadeRoll, synergyEffects } from "../synergy";
import { type FirmwareLoadoutPiece, sumFirmwareTotals } from "./firmwareTotals";
import {
  loadFirmwareCatalog,
  loadGrenadeCatalog,
  loadRafaSkillEffects,
  loadSynergyRules,
} from "./loadPacks";

export type StackBucket = {
  target: string;
  label: string;
  pct: number;
  sources: string[];
};

export type StackTotals = {
  experimental: true;
  buckets: StackBucket[];
  notes: string[];
};

const INTEREST = new Set([
  "splash_damage",
  "splash_radius",
  "gun_damage",
  "ordnance_damage",
  "ordnance_cooldown",
  "status_damage",
  "crit_damage",
  "fire_rate",
  "reload_speed",
]);

const LABELS: Record<string, string> = {
  splash_damage: "Splash Damage",
  splash_radius: "Splash Radius",
  gun_damage: "Gun Damage",
  ordnance_damage: "Ordnance Damage",
  ordnance_cooldown: "Ordnance Cooldown",
  status_damage: "Status Damage",
  crit_damage: "Crit Damage",
  fire_rate: "Fire Rate",
  reload_speed: "Reload Speed",
};

function addEffect(map: Map<string, StackBucket>, effect: SimEffect, source: string): void {
  if (effect.unparsed || effect.tag_only || effect.op === "flag" || effect.op === "set") return;
  if (!INTEREST.has(effect.target)) return;
  if (effect.op !== "add") return;
  const existing = map.get(effect.target);
  const pctAdd = effect.value * 100;
  if (existing) {
    existing.pct = Math.round((existing.pct + pctAdd) * 10) / 10;
    existing.sources.push(source);
    existing.label = `${LABELS[effect.target] ?? effect.target}: ${existing.pct >= 0 ? "+" : ""}${existing.pct}%`;
  } else {
    const pct = Math.round(pctAdd * 10) / 10;
    map.set(effect.target, {
      target: effect.target,
      label: `${LABELS[effect.target] ?? effect.target}: ${pct >= 0 ? "+" : ""}${pct}%`,
      pct,
      sources: [source],
    });
  }
}

/** Sum numeric add effects from skills + firmware + synergies + COM god-roll assumptions. */
export function computeStackTotals(input: {
  allocation: SkillAllocation;
  firmware: FirmwareLoadoutPiece[];
  grenadeRoll?: GrenadeRoll;
  includeComGodroll?: boolean;
}): StackTotals {
  const map = new Map<string, StackBucket>();
  const notes: string[] = [];
  const pack = loadRafaSkillEffects();
  const vh = allocationEffects(pack, input.allocation);
  for (const e of vh) {
    addEffect(map, e, e.label ? `Skill: ${e.label}` : `Skill: ${e.target}`);
  }

  for (const line of sumFirmwareTotals(loadFirmwareCatalog(), input.firmware)) {
    if (!INTEREST.has(line.target)) continue;
    const existing = map.get(line.target);
    if (existing) {
      existing.pct = Math.round((existing.pct + line.pct) * 10) / 10;
      existing.sources.push(...line.sources.map((s) => `Firmware: ${s}`));
      existing.label = `${LABELS[line.target] ?? line.target}: ${existing.pct >= 0 ? "+" : ""}${existing.pct}%`;
    } else {
      map.set(line.target, {
        target: line.target,
        label: `${LABELS[line.target] ?? line.target}: ${line.pct >= 0 ? "+" : ""}${line.pct}%`,
        pct: line.pct,
        sources: line.sources.map((s) => `Firmware: ${s}`),
      });
    }
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
  const hits = detectSynergies(loadSynergyRules(), loadGrenadeCatalog(), roll, tags);
  for (const e of synergyEffects(hits)) {
    addEffect(map, e, e.label ? `Synergy: ${e.label}` : `Synergy: ${e.target}`);
  }

  if (input.includeComGodroll !== false) {
    // Exact Grenazerker god-roll assumptions (experimental)
    addEffect(
      map,
      { op: "add", target: "gun_damage", value: 0.35, label: "Grenazerker fixed" },
      "COM: Grenazerker +35% Gun Damage",
    );
    addEffect(
      map,
      { op: "add", target: "splash_damage", value: 0.46, label: "Grenazerker Splash" },
      "COM: +46% Splash Damage",
    );
    notes.push("COM assumes exact Grenazerker +3 Sinergia / +4 Confeti / Splash Damage.");
    notes.push(
      "Confeti elemental ordnance bonus is not a flat splash % — listed in synergies/procs.",
    );
  }

  notes.push("Totals are additive experimental name_inferred stacks — not card_match certified.");
  const buckets = [...map.values()].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  return { experimental: true, buckets, notes };
}
