/** Numeric add effects for known enhancement perks (experimental / name_inferred). */
import type { SimEffect } from "../sim/types";
import maliwanJson from "./enhancements/maliwan.json";

const PACKS = [maliwanJson] as const;

/** Resolve add-op effects for enhancement perk ids (e.g. maliwan_mixologist). */
export function effectsForEnhancementIds(ids: string[]): SimEffect[] {
  const want = new Set(ids);
  const out: SimEffect[] = [];
  for (const pack of PACKS) {
    for (const row of pack.enhancements) {
      if (!want.has(row.id)) continue;
      for (const e of row.effects ?? []) {
        if (e.op !== "add") continue;
        let target = e.target;
        // Mixologist stores enhancement_gun — fold into gun_damage stacks for UI totals.
        if (target === "enhancement_gun") target = "gun_damage";
        out.push({
          op: "add",
          target,
          value: e.value,
          label: e.label ?? row.name,
        });
      }
    }
  }
  return out;
}
