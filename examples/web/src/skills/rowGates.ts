import type { SkillAllocation, SkillDef } from "./types";

const COMMON_ROW_GATES = [0, 5, 10] as const;
const BRANCH_OPEN_COMMON = 15;
const BRANCH_ROW_GATES = [0, 5, 10] as const;

export function rankOf(alloc: SkillAllocation, id: string): number {
  return alloc.ranks.find((r) => r.id === id)?.rank ?? 0;
}

export function pointsSpent(alloc: SkillAllocation, skills: SkillDef[]): number {
  let n = 0;
  for (const r of alloc.ranks) {
    const def = skills.find((s) => s.id === r.id);
    if (!def) continue;
    const kind = def.kind ?? "passive";
    if (kind === "augment" || kind === "capstone" || kind === "action" || kind === "trait") {
      continue;
    }
    n += r.rank * (def.point_cost ?? 1);
  }
  return n;
}

function pointsInLane(
  alloc: SkillAllocation,
  skills: SkillDef[],
  tree: string,
  lane: string,
): number {
  let n = 0;
  for (const s of skills) {
    if (s.tree !== tree) continue;
    if ((s.lane ?? "common") !== lane) continue;
    if ((s.kind ?? "passive") !== "passive") continue;
    n += rankOf(alloc, s.id) * (s.point_cost ?? 1);
  }
  return n;
}

function commonPointsBeforeRow(
  alloc: SkillAllocation,
  skills: SkillDef[],
  tree: string,
  row: number,
): number {
  let n = 0;
  for (const s of skills) {
    if (s.tree !== tree) continue;
    if ((s.lane ?? "common") !== "common") continue;
    if ((s.row ?? s.tier) >= row) continue;
    if ((s.kind ?? "passive") !== "passive") continue;
    n += rankOf(alloc, s.id) * (s.point_cost ?? 1);
  }
  return n;
}

function branchPointsBeforeRow(
  alloc: SkillAllocation,
  skills: SkillDef[],
  tree: string,
  lane: string,
  row: number,
): number {
  let n = 0;
  for (const s of skills) {
    if (s.tree !== tree) continue;
    if ((s.lane ?? "common") !== lane) continue;
    if ((s.row ?? s.tier) >= row) continue;
    if ((s.kind ?? "passive") !== "passive") continue;
    n += rankOf(alloc, s.id) * (s.point_cost ?? 1);
  }
  return n;
}

export function rowUnlocked(alloc: SkillAllocation, skills: SkillDef[], skill: SkillDef): boolean {
  const lane = skill.lane ?? "common";
  const row = skill.row ?? skill.tier;
  const tree = skill.tree;
  if (lane === "common") {
    const need = COMMON_ROW_GATES[Math.min(row, COMMON_ROW_GATES.length - 1)] ?? 0;
    return commonPointsBeforeRow(alloc, skills, tree, row) >= need;
  }
  if (pointsInLane(alloc, skills, tree, "common") < BRANCH_OPEN_COMMON) return false;
  const need = BRANCH_ROW_GATES[Math.min(row, BRANCH_ROW_GATES.length - 1)] ?? 0;
  return branchPointsBeforeRow(alloc, skills, tree, lane, row) >= need;
}
