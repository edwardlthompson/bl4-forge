import { behaviorTagsForAllocation, type SkillEffectPack } from "../skills/effects";
import type { SkillAllocation } from "../skills/types";
import { bestGrenadeRecommendation, detectSynergies } from "../synergy";

export { bestGrenadeRecommendation, detectSynergies };

export function behaviorTagsFromPack(pack: SkillEffectPack, alloc: SkillAllocation): string[] {
  return behaviorTagsForAllocation(pack, alloc);
}
