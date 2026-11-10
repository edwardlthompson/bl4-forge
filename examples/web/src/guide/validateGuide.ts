import { loadRafaSkillEffects } from "../experimental/loadPacks";
import { isLegal } from "../skills/legality";
import { getSpecCatalog, isSpecLegal } from "../specializations";
import type { BuildGuide } from "./types";

/** Ensure guide allocation + specs pass legality engines. */
export function validateGuide(guide: BuildGuide): string[] {
  const errors: string[] = [];
  if (!guide.hunter_display_name.trim()) errors.push("missing hunter_display_name");
  if (!guide.action_tree?.trim()) errors.push("missing action_tree");
  if (!guide.skill_spend_order.length) errors.push("empty skill_spend_order");

  const spendPts = guide.skill_spend_order.reduce((n, s) => n + (s.points ?? 1), 0);
  if (spendPts !== guide.point_budget) {
    errors.push(`spend points ${spendPts} !== budget ${guide.point_budget}`);
  }

  for (const s of guide.skill_spend_order) {
    if (!s.reason?.trim()) errors.push(`spend step ${s.step} missing reason`);
    if (!s.tree_id?.trim()) errors.push(`spend step ${s.step} missing tree_id`);
  }

  const rankFromSpend = new Map<string, number>();
  for (const s of guide.skill_spend_order) {
    rankFromSpend.set(s.skill_id, Math.max(rankFromSpend.get(s.skill_id) ?? 0, s.to_rank));
  }
  for (const r of guide.allocation.ranks) {
    if ((rankFromSpend.get(r.id) ?? 0) !== r.rank) {
      errors.push(`allocation rank mismatch for ${r.id}`);
    }
  }

  if (!guide.gear.length) errors.push("empty gear desired rolls");
  if (!isLegal(guide.hunter, guide.allocation)) {
    errors.push("skill allocation illegal vs hunter def");
  }

  const pack = loadRafaSkillEffects();
  for (const r of guide.allocation.ranks) {
    if (r.rank <= 0) continue;
    if (!pack.skills[r.id]?.effects?.length) {
      errors.push(`missing experimental effects for ${r.id}`);
    }
  }

  const action = guide.hunter.skills.find((sk) => sk.id === guide.allocation.actionSkillId);
  const actionTree = guide.action_tree;
  if (action && action.tree !== actionTree) {
    errors.push("action skill tree !== action_tree");
  }
  for (const augId of guide.allocation.augmentIds) {
    const aug = guide.hunter.skills.find((sk) => sk.id === augId);
    if (!aug) errors.push(`unknown augment ${augId}`);
    else if (aug.tree !== actionTree) errors.push(`augment ${augId} outside action_tree`);
  }
  if (guide.allocation.capstoneId) {
    const cap = guide.hunter.skills.find((sk) => sk.id === guide.allocation.capstoneId);
    if (!cap) errors.push(`unknown capstone ${guide.allocation.capstoneId}`);
    else if (cap.tree !== actionTree) errors.push("capstone outside action_tree");
  }

  const treePts = new Map<string, number>();
  for (const s of guide.skill_spend_order) {
    treePts.set(s.tree_id, (treePts.get(s.tree_id) ?? 0) + (s.points ?? 1));
  }
  for (const tr of guide.tree_summary) {
    const id = tr.tree_id;
    if (id && (treePts.get(id) ?? 0) !== tr.points) {
      errors.push(`tree_summary ${id} points mismatch`);
    }
  }

  const specAlloc = {
    nodePoints: guide.spec.node_points,
    equipped: guide.spec.equipped,
  };
  if (!isSpecLegal(getSpecCatalog(), specAlloc)) {
    errors.push("specialization allocation illegal");
  }
  for (const s of guide.spec.spend_order) {
    if (!(s.reason ?? s.note)?.trim()) errors.push(`spec step ${s.step} missing reason`);
  }

  const slots = new Set(guide.gear.map((g) => g.slot));
  for (const need of ["weapon", "shield", "grenade", "class_mod", "repkit"]) {
    if (!slots.has(need)) errors.push(`gear missing slot ${need}`);
  }
  return errors;
}
