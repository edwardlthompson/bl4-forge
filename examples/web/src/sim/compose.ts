import { composeStagedDamage } from "./damageOrder";
import type { ComposeInput, ComposeResult, SimEffect } from "./types";
import { RATE_TARGETS } from "./types";

export { scaledMul } from "./damageOrder";

function uptimeFor(effect: SimEffect, table: Record<string, number>): number {
  const key = effect.cond?.type ?? "always";
  const raw = table[key];
  return typeof raw === "number" ? raw : key === "always" ? 1 : 0;
}

/** Sum additive rate modifiers (fire_rate / reload_speed) scaled by uptime. */
export function sumRateAdds(
  effects: SimEffect[],
  target: string,
  uptime: Record<string, number>,
): number {
  let n = 0;
  for (const e of effects) {
    if (e.target !== target || e.op !== "add" || e.unparsed || e.tag_only) continue;
    if (!RATE_TARGETS.has(e.target) && e.target !== target) continue;
    n += e.value * uptimeFor(e, uptime);
  }
  return n;
}

/**
 * Compose damage via On-Shot × On-Hit (see damageOrder.ts).
 * Conditional effects scale by uptime. Unparsed/tag_only never inject numeric defaults.
 */
export function composeDamage(input: ComposeInput): ComposeResult {
  const staged = composeStagedDamage(input);
  return {
    damage: staged.damage,
    dps: staged.dps,
    magazineDps: staged.magazineDps,
    sustainedDps: staged.sustainedDps,
    additiveSum: staged.additiveSum,
    multiplicativeProduct: staged.multiplicativeProduct,
    variance: staged.variance,
    contributions: staged.contributions,
  };
}
