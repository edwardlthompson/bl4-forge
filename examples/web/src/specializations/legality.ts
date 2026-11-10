import type { SpecAllocation, SpecCatalog, SpecIssue, SpecNodeDef } from "./types";

export function totalPoints(alloc: SpecAllocation): number {
  return Object.values(alloc.nodePoints).reduce((a, b) => a + b, 0);
}

/** Socket count from total points vs catalog thresholds (default 0/10/20/30 → 1..4). */
export function socketCount(catalog: SpecCatalog, alloc: SpecAllocation): number {
  const pts = totalPoints(alloc);
  let n = 0;
  for (const t of catalog.socket_thresholds) {
    if (pts >= t) n += 1;
  }
  return Math.min(catalog.max_equipped, Math.max(1, n));
}

export function nodeUnlocked(
  _catalog: SpecCatalog,
  alloc: SpecAllocation,
  node: SpecNodeDef,
): boolean {
  if (node.kind === "base") return true;
  const need = node.require_points_each ?? 10;
  for (const id of node.requires_nodes ?? []) {
    if ((alloc.nodePoints[id] ?? 0) < need) return false;
  }
  return true;
}

function skillNode(catalog: SpecCatalog, skillId: string): SpecNodeDef | undefined {
  return catalog.nodes.find((n) => n.skills.some((s) => s.id === skillId));
}

/** Validate node investment + equipped specialization sockets (max 4). */
export function validateSpecAllocation(catalog: SpecCatalog, alloc: SpecAllocation): SpecIssue[] {
  const issues: SpecIssue[] = [];
  for (const node of catalog.nodes) {
    const pts = alloc.nodePoints[node.id] ?? 0;
    if (pts < 0) {
      issues.push({ code: "neg_points", message: `Negative points on ${node.id}` });
    }
    if (pts > 0 && !nodeUnlocked(catalog, alloc, node)) {
      issues.push({
        code: "prestige_locked",
        message: `${node.id} needs ${node.require_points_each ?? 10} in each of ${(node.requires_nodes ?? []).join(",")}`,
      });
    }
  }

  const slots = socketCount(catalog, alloc);
  if (alloc.equipped.length > slots) {
    issues.push({
      code: "socket_overflow",
      message: `Equipped ${alloc.equipped.length} > sockets ${slots}`,
    });
  }
  if (alloc.equipped.length > catalog.max_equipped) {
    issues.push({
      code: "max_equipped",
      message: `Max ${catalog.max_equipped} specialization skills`,
    });
  }

  const seen = new Set<string>();
  for (const id of alloc.equipped) {
    if (seen.has(id)) {
      issues.push({ code: "dup_equip", message: `Duplicate ${id}`, skillId: id });
    }
    seen.add(id);
    const node = skillNode(catalog, id);
    if (!node) {
      issues.push({ code: "unknown_skill", message: `Unknown ${id}`, skillId: id });
      continue;
    }
    if (!nodeUnlocked(catalog, alloc, node)) {
      issues.push({ code: "node_locked", message: `Node locked for ${id}`, skillId: id });
      continue;
    }
    const skill = node.skills.find((s) => s.id === id)!;
    if ((alloc.nodePoints[node.id] ?? 0) < skill.unlock_points) {
      issues.push({
        code: "skill_locked",
        message: `${id} needs ${skill.unlock_points} in ${node.id}`,
        skillId: id,
      });
    }
  }
  return issues;
}

export function isSpecLegal(catalog: SpecCatalog, alloc: SpecAllocation): boolean {
  return validateSpecAllocation(catalog, alloc).length === 0;
}
