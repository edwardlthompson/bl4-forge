import type { HunterDef, SkillAllocation } from "../skills/types";

export type GuideSpendStep = {
  step: number;
  level: number;
  skill_id: string;
  display_name: string;
  points: number;
  to_rank: number;
  reason: string;
  tree: string;
  tree_id: string;
  icon_id?: string;
  /** @deprecated use level */
  levels?: string;
  note?: string;
};

/** Unified board row: skill point or inline augment/capstone/note beat. */
export type GuideBoardRow =
  | { kind: "skill"; step: GuideSpendStep }
  | {
      kind: "loadout";
      at_level: number;
      label: string;
      reason: string;
      icon_id?: string;
      noteOnly?: boolean;
    };

export type GuideLoadoutEvent = {
  at_level: number;
  equip?: { augment?: string; capstone?: string };
  replace?: { from: string; to: string; why?: string };
  why?: string;
  note?: string;
};

export type GuideSpecStep = {
  step: number;
  kind?: "node" | "equip" | "replace" | "respec_note";
  display_name: string;
  reason?: string;
  note?: string;
  icon_id?: string;
  node?: string;
  to?: number;
  socket?: number;
  skill_id?: string;
  replace_from?: string;
  replace_to?: string;
};

export type GuideGearRarity = "legendary" | "pearl" | "epic" | "rare";

export type GuideGearSlot = {
  slot: string;
  slot_index?: number;
  /** Exact search / display name for the item. */
  item_name?: string;
  item_hint?: string;
  rarity?: GuideGearRarity;
  farm?: string;
  /** Why an Epic/purple is preferred over legendary for this slot (omit if legendary/pearl). */
  purple_why?: string;
  priorities: string[];
  avoid?: string[];
  icon_id?: string;
};

export type GuideTreeSummary = {
  tree: string;
  tree_id?: string;
  points: number;
  note?: string;
};

export type BuildGuide = {
  version: number;
  id: string;
  title: string;
  hunter_id: string;
  hunter_display_name: string;
  subtitle?: string;
  archetype?: string;
  point_budget: number;
  level_cap?: number;
  experimental?: boolean;
  action_tree: string;
  action_skill_id: string;
  action_skill_name: string;
  augment_ids?: string[];
  augment_names?: string[];
  capstone_id?: string | null;
  capstone_name?: string | null;
  hunter: HunterDef;
  allocation: SkillAllocation;
  skill_spend_order: GuideSpendStep[];
  loadout_timeline?: GuideLoadoutEvent[];
  spec: {
    node_points: Record<string, number>;
    equipped: string[];
    spend_order: GuideSpecStep[];
  };
  gear: GuideGearSlot[];
  tree_summary: GuideTreeSummary[];
};
