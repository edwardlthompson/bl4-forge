import type { CondType, SimEffect } from "../sim/types";

export type SpecNodeKind = "base" | "prestige";

export type SpecSkillDef = {
  id: string;
  unlock_points: number;
  synergy?: string[];
  proc?: string;
  effect_text?: string;
};

export type SpecNodeDef = {
  id: string;
  display_name?: string;
  kind: SpecNodeKind;
  requires_nodes?: string[];
  require_points_each?: number;
  node_bonus?: Record<string, number>;
  skills: SpecSkillDef[];
};

export type SpecCatalog = {
  version: number;
  socket_thresholds: number[];
  max_equipped: number;
  nodes: SpecNodeDef[];
};

/** Points invested per node id + up to 4 equipped passive skill ids. */
export type SpecAllocation = {
  nodePoints: Record<string, number>;
  equipped: string[];
};

export type SpecIssue = { code: string; message: string; skillId?: string };

export type SpecEffectBundle = {
  effects: SimEffect[];
  synergyKeys: string[];
  procs: Array<{ skillId: string; proc: string; cond: CondType }>;
};
