/** On-Shot × On-Hit composition (Mobalytics general BL4 formula). */
import type { ComposeInput, ComposeResult, EffectOp, SimEffect } from "./types";
import { RATE_TARGETS } from "./types";
import { varianceBand } from "./variance";

export type DamageStage = "on_shot" | "on_hit" | "rate" | "flag";

export type StagedContribution = {
  target: string;
  op: EffectOp;
  effective: number;
  stage: DamageStage;
};

/** Scale a mul factor by uptime: 0 → 1, 1 → value. */
export function scaledMul(value: number, uptime: number): number {
  return 1 + (value - 1) * uptime;
}

function uptimeFor(effect: SimEffect, table: Record<string, number>): number {
  const key = effect.cond?.type ?? "always";
  const raw = table[key];
  return typeof raw === "number" ? raw : key === "always" ? 1 : 0;
}

/** Infer stage when effect.stage is omitted. */
export function inferStage(effect: SimEffect): DamageStage {
  if (effect.stage) return effect.stage;
  if (RATE_TARGETS.has(effect.target)) return "rate";
  if (effect.op === "flag" || effect.op === "set") return "flag";
  if (
    effect.target === "enhancement_gun" ||
    effect.target === "amp" ||
    effect.target === "flat_amp" ||
    effect.target === "card"
  ) {
    return "on_shot";
  }
  return "on_hit";
}

/**
 * OnShot = (Card × (1 + EnhGun…) × (1 + Amp)) + FlatAmp
 * OnHit  = (1 + Soup) × Π mul + CritModifier
 * Final  = OnShot × OnHit × ElementMatch × Resist × scenario × splash
 */
export function composeStagedDamage(input: ComposeInput): ComposeResult & {
  onShot: number;
  onHit: number;
  staged: StagedContribution[];
} {
  const tagWeight = input.tagWeight ?? 0.01;
  let enhGun = 0;
  let amp = 0;
  let shotMul = 1;
  let flatAmp = 0;
  let hitAdd = 0;
  let hitMul = 1;
  const staged: StagedContribution[] = [];

  for (const effect of input.effects) {
    const stage = inferStage(effect);
    if (stage === "rate") {
      const uptime = uptimeFor(effect, input.uptime);
      const effective = effect.op === "add" ? effect.value * uptime : 0;
      staged.push({ target: effect.target, op: effect.op, effective, stage });
      continue;
    }
    if (stage === "flag") {
      staged.push({ target: effect.target, op: effect.op, effective: 0, stage });
      continue;
    }
    if (effect.unparsed || effect.tag_only) {
      const weight = (effect.tags?.length ?? 0) * tagWeight;
      hitAdd += weight;
      staged.push({ target: effect.target, op: effect.op, effective: weight, stage: "on_hit" });
      continue;
    }
    const uptime = uptimeFor(effect, input.uptime);
    if (uptime === 0) {
      staged.push({ target: effect.target, op: effect.op, effective: 0, stage });
      continue;
    }
    if (effect.op === "add") {
      const effective = effect.value * uptime;
      if (effect.target === "flat_amp") flatAmp += effective;
      else if (stage === "on_shot") {
        if (effect.target === "amp") amp += effective;
        else enhGun += effective;
      } else hitAdd += effective;
      staged.push({ target: effect.target, op: "add", effective, stage });
    } else if (effect.op === "mul") {
      const factor = scaledMul(effect.value, uptime);
      if (stage === "on_shot") shotMul *= factor;
      else hitMul *= factor;
      staged.push({ target: effect.target, op: "mul", effective: factor, stage });
    } else {
      staged.push({ target: effect.target, op: effect.op, effective: 0, stage });
    }
  }

  const onShot = input.base * (1 + enhGun) * (1 + amp) * shotMul + flatAmp;
  const critModifier = input.critMult - 1;
  const onHit = (1 + hitAdd) * hitMul + critModifier;
  const resist = input.elementResist ?? 0;
  const element = input.elementMult * (1 - resist);
  const splash = 1 - (input.splashSelf ?? 0);
  const damage = onShot * onHit * element * input.scenarioMods * splash;

  const fireRate = Math.min(input.fireRate, input.fireRateCap);
  const shotInterval = fireRate > 0 ? 1 / fireRate : Number.POSITIVE_INFINITY;
  const magTime = shotInterval * input.magazineSize;
  const reloadEffective = input.reloadS * (1 - input.reloadCancel);
  const cycle = magTime + reloadEffective;
  const magazineDps = magTime > 0 ? (damage * input.magazineSize) / magTime : 0;
  const sustainedDps = cycle > 0 ? (damage * input.magazineSize) / cycle : 0;

  return {
    damage,
    dps: sustainedDps,
    magazineDps,
    sustainedDps,
    additiveSum: enhGun + amp + hitAdd,
    multiplicativeProduct: shotMul * hitMul,
    variance: input.statRange ? varianceBand(damage, input.base, input.statRange) : null,
    contributions: staged.map(({ target, op, effective }) => ({ target, op, effective })),
    onShot,
    onHit,
    staged,
  };
}
