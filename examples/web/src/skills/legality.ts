import { pointsSpent, rankOf, rowUnlocked } from "./rowGates";
import type { HunterDef, LegalityIssue, SkillAllocation, SkillDef } from "./types";

function byId(hunter: HunterDef): Map<string, SkillDef> {
  return new Map(hunter.skills.map((s) => [s.id, s]));
}

function augmentSlots(hunter: HunterDef, alloc: SkillAllocation): number {
  if (!hunter.no_capstones) return 1;
  let slots = 1;
  for (const s of hunter.skills) {
    if (s.devils_tines && rankOf(alloc, s.id) > 0) slots += 1;
  }
  return Math.min(slots, 4);
}

/** Validate a skill allocation against documented BL4 unlock/equip rules. */
export function validateAllocation(hunter: HunterDef, alloc: SkillAllocation): LegalityIssue[] {
  const issues: LegalityIssue[] = [];
  if (alloc.hunterId !== hunter.id) {
    issues.push({ code: "hunter_mismatch", message: "Allocation hunterId does not match catalog" });
  }
  const map = byId(hunter);
  const spent = pointsSpent(alloc, hunter.skills);
  if (spent > alloc.pointBudget) {
    issues.push({
      code: "over_budget",
      message: `Spent ${spent} > budget ${alloc.pointBudget}`,
    });
  }

  for (const r of alloc.ranks) {
    const def = map.get(r.id);
    if (!def) {
      issues.push({ code: "unknown_skill", message: `Unknown skill ${r.id}`, skillId: r.id });
      continue;
    }
    if (r.rank < 0 || r.rank > def.max_rank) {
      issues.push({
        code: "bad_rank",
        message: `Rank ${r.rank} outside 0..${def.max_rank}`,
        skillId: r.id,
      });
    }
    if (r.rank > 0) {
      for (const req of def.requires) {
        if (rankOf(alloc, req) < 1) {
          issues.push({
            code: "prereq",
            message: `${r.id} requires ${req}`,
            skillId: r.id,
          });
        }
      }
      const kind = def.kind ?? "passive";
      if (kind === "passive" && !rowUnlocked(alloc, hunter.skills, def)) {
        issues.push({
          code: "row_locked",
          message: `${r.id} row not unlocked`,
          skillId: r.id,
        });
      }
    }
  }

  if (alloc.actionSkillId) {
    const action = map.get(alloc.actionSkillId);
    if (!action || (action.kind ?? "") !== "action") {
      issues.push({
        code: "bad_action",
        message: "actionSkillId must be an action skill",
        skillId: alloc.actionSkillId,
      });
    } else {
      for (const augId of alloc.augmentIds) {
        const aug = map.get(augId);
        if (!aug || (aug.kind ?? "") !== "augment") {
          issues.push({ code: "bad_augment", message: `Not an augment: ${augId}`, skillId: augId });
        } else if (aug.tree !== action.tree) {
          issues.push({
            code: "augment_tree",
            message: `Augment ${augId} tree must match action tree ${action.tree}`,
            skillId: augId,
          });
        }
      }
      const slots = augmentSlots(hunter, alloc);
      if (alloc.augmentIds.length > slots) {
        issues.push({
          code: "augment_slots",
          message: `Equipped ${alloc.augmentIds.length} augments > slots ${slots}`,
        });
      }
      if (alloc.capstoneId) {
        if (hunter.no_capstones) {
          issues.push({
            code: "no_capstones",
            message: "Hunter has no capstones (C4SH)",
            skillId: alloc.capstoneId,
          });
        } else {
          const cap = map.get(alloc.capstoneId);
          if (!cap || (cap.kind ?? "") !== "capstone") {
            issues.push({
              code: "bad_capstone",
              message: "capstoneId must be a capstone",
              skillId: alloc.capstoneId,
            });
          } else if (cap.tree !== action.tree) {
            issues.push({
              code: "capstone_tree",
              message: `Capstone must match action tree ${action.tree}`,
              skillId: alloc.capstoneId,
            });
          }
        }
      }
    }
  } else if (alloc.augmentIds.length || alloc.capstoneId) {
    issues.push({
      code: "modifiers_need_action",
      message: "Augments/capstones require an equipped action skill",
    });
  }

  return issues;
}

export function isLegal(hunter: HunterDef, alloc: SkillAllocation): boolean {
  return validateAllocation(hunter, alloc).length === 0;
}
