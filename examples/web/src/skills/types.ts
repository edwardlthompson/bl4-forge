/** Typed skill catalog + allocation for legality. */

export type SkillKind = "passive" | "action" | "augment" | "capstone" | "trait";
export type SkillLane = "common" | "branch_left" | "branch_center" | "branch_right";

export type SkillDef = {
  id: string;
  character: string;
  tree: string;
  tier: number;
  row?: number;
  lane?: SkillLane;
  kind?: SkillKind;
  max_rank: number;
  requires: string[];
  effect_text: string;
  effects: unknown[];
  tags: string[];
  activator: boolean;
  point_cost?: number;
  devils_tines?: boolean;
};

export type HunterDef = {
  id: string;
  display_name?: string;
  no_capstones?: boolean;
  skills: SkillDef[];
};

export type SkillsCatalog = { hunters: HunterDef[] };

export type RankAlloc = { id: string; rank: number };

export type SkillAllocation = {
  hunterId: string;
  ranks: RankAlloc[];
  actionSkillId: string | null;
  augmentIds: string[];
  capstoneId: string | null;
  pointBudget: number;
};

export type LegalityIssue = {
  code: string;
  message: string;
  skillId?: string;
};
