/** Shared types for the deterministic damage simulator. */

export type Archetype = "mobbing" | "bossing" | "balanced";

export type CondType =
  | "always"
  | "on_kill"
  | "on_crit"
  | "on_reload"
  | "while_shield_down"
  | "while_moving"
  | "while_airborne"
  | "ads"
  | "on_ordnance_hit"
  | "on_melee"
  | "while_overdrive";

export type EffectOp = "add" | "mul" | "set" | "flag";

export type EffectOracle = "card_match" | "name_inferred" | "manual";

export type EffectStage = "on_shot" | "on_hit" | "rate" | "flag";

export type SimEffect = {
  op: EffectOp;
  target: string;
  value: number;
  /** Cumulative magnitude at each rank (index = rank-1). */
  values_by_rank?: number[];
  /** Damage pipeline bucket (On Shot × On Hit). */
  stage?: EffectStage;
  cond?: { type: CondType; window_s?: number };
  tags?: string[];
  behavior_tags?: string[];
  oracle?: EffectOracle;
  label?: string;
  unparsed?: boolean;
  tag_only?: boolean;
};

export type StatRange = {
  damage?: [number, number];
  damage_median?: number;
  fire_rate?: [number, number];
  [key: string]: number | [number, number] | undefined;
};

export type ComposeInput = {
  base: number;
  effects: SimEffect[];
  archetype: Archetype;
  uptime: Record<string, number>;
  fireRate: number;
  fireRateCap: number;
  magazineSize: number;
  reloadS: number;
  /** Fraction of reload time cancelled (0–1). */
  reloadCancel: number;
  elementMult: number;
  critMult: number;
  scenarioMods: number;
  /** Elemental resist 0–1 applied as (1 - resist). */
  elementResist?: number;
  /** Fraction of splash that hits self (0–1); reduces effective damage. */
  splashSelf?: number;
  /** Weight applied per tag when an effect is unparsed / tag_only. */
  tagWeight?: number;
  statRange?: StatRange;
};

export type VarianceBand = {
  low: number;
  high: number;
  median: number;
};

export type ComposeResult = {
  damage: number;
  dps: number;
  magazineDps: number;
  sustainedDps: number;
  additiveSum: number;
  multiplicativeProduct: number;
  variance: VarianceBand | null;
  contributions: Array<{ target: string; op: EffectOp; effective: number }>;
};

/** Targets that adjust fire/reload inputs instead of damage additive pool. */
export const RATE_TARGETS = new Set(["fire_rate", "reload_speed"]);
