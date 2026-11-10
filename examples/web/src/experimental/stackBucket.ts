/** Stack bucket helpers for additive % totals. */
import type { SimEffect } from "../sim/types";

export type StackBucket = {
  target: string;
  label: string;
  pct: number;
  sources: string[];
};

export const STACK_INTEREST = new Set([
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

export function addStackEffect(
  map: Map<string, StackBucket>,
  effect: SimEffect,
  source: string,
): void {
  if (effect.unparsed || effect.tag_only || effect.op === "flag" || effect.op === "set") return;
  if (!STACK_INTEREST.has(effect.target) || effect.op !== "add") return;
  const pctAdd = effect.value * 100;
  const existing = map.get(effect.target);
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

export function mergeFirmwareLine(
  map: Map<string, StackBucket>,
  line: { target: string; pct: number; sources: string[]; label?: string },
): void {
  if (!STACK_INTEREST.has(line.target)) return;
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
