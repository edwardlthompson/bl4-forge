import type { SkillAllocation } from "../skills/types";

export type PermalinkState = {
  patch: string;
  seed: number;
  experimental: boolean;
};

export function encodePermalink(state: PermalinkState): string {
  const q = new URLSearchParams({
    patch: state.patch,
    seed: String(state.seed),
    exp: state.experimental ? "1" : "0",
  });
  return `?${q.toString()}`;
}

export function decodePermalink(search: string): PermalinkState | null {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const patch = q.get("patch");
  const seed = Number(q.get("seed"));
  if (!patch || !Number.isFinite(seed)) return null;
  return { patch, seed, experimental: q.get("exp") === "1" };
}

/** Compact skill allocation permalink (hunter + action + ranks + mods). */
export function encodeSkillPermalink(alloc: SkillAllocation): string {
  const q = new URLSearchParams({
    hunter: alloc.hunterId,
    budget: String(alloc.pointBudget),
  });
  if (alloc.actionSkillId) q.set("action", alloc.actionSkillId);
  if (alloc.capstoneId) q.set("cap", alloc.capstoneId);
  if (alloc.augmentIds.length) q.set("aug", alloc.augmentIds.join(","));
  if (alloc.ranks.length) {
    q.set("ranks", alloc.ranks.map((r) => `${r.id}:${r.rank}`).join(","));
  }
  return `?${q.toString()}`;
}

export function decodeSkillPermalink(search: string): SkillAllocation | null {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const hunterId = q.get("hunter");
  if (!hunterId) return null;
  const ranks = (q.get("ranks") || "")
    .split(",")
    .filter(Boolean)
    .map((pair) => {
      const [id, rankStr] = pair.split(":");
      return { id: id!, rank: Number(rankStr) || 0 };
    })
    .filter((r) => r.id && r.rank > 0);
  return {
    hunterId,
    ranks,
    actionSkillId: q.get("action"),
    augmentIds: (q.get("aug") || "").split(",").filter(Boolean),
    capstoneId: q.get("cap"),
    pointBudget: Number(q.get("budget")) || 69,
  };
}
