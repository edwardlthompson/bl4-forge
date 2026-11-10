import type { Candidate } from "./types";

type Node = { path: string[]; score: number };

/**
 * Beam search over a skill DAG adjacency map.
 * `edges[skill] = children`. Scores from `scoreOf`.
 */
export function beamOverDag(
  roots: string[],
  edges: Record<string, string[]>,
  scoreOf: (path: string[]) => number,
  width: number,
  maxDepth: number,
): Candidate[] {
  let beam: Node[] = roots.map((r) => ({ path: [r], score: scoreOf([r]) }));
  beam.sort((a, b) => b.score - a.score);
  beam = beam.slice(0, width);

  for (let d = 1; d < maxDepth; d++) {
    const next: Node[] = [];
    for (const node of beam) {
      const last = node.path[node.path.length - 1];
      const kids = edges[last] ?? [];
      if (kids.length === 0) {
        next.push(node);
        continue;
      }
      for (const k of kids) {
        if (node.path.includes(k)) continue;
        const path = [...node.path, k];
        next.push({ path, score: scoreOf(path) });
      }
    }
    next.sort((a, b) => b.score - a.score);
    beam = next.slice(0, width);
    if (beam.length === 0) break;
  }

  return beam.map((n, i) => ({
    id: `beam-${i}-${n.path.join(".")}`,
    score: n.score,
    mobScore: n.score,
    bossScore: n.score,
    obtainable: "probable",
    gate: "base",
    legal: true,
    prereqsMet: true,
    skills: n.path,
    gear: [],
    synergyKeys: n.path.slice(0, 1),
  }));
}
