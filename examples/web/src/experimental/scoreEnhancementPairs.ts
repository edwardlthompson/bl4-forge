/** Dual-perk enhancement pair ranking (same manufacturer). */
import {
  type EnhancementCatalog,
  type EnhancementRow,
  type ScoreInput,
  scoreEnhancements,
} from "./scoreEnhancements";

export type ScoredEnhancementPair = {
  a: EnhancementRow;
  b: EnhancementRow;
  score: number;
  why: string;
  search_hint: string;
};

const PAIR_SYNERGY: Array<{
  ids: [string, string];
  bonus: Partial<Record<NonNullable<ScoreInput["archetype"]>, number>>;
  label: string;
}> = [
  {
    ids: ["maliwan_mixologist", "maliwan_transfuser"],
    bonus: { mobbing: 10, balanced: 8, bossing: -2 },
    label: "Toile (Mixologist+Transfuser)",
  },
  {
    ids: ["maliwan_mixologist", "maliwan_primed_potency"],
    bonus: { bossing: 9, balanced: 4, mobbing: 2 },
    label: "Mixologist+Primed Potency",
  },
  {
    ids: ["maliwan_mixologist", "maliwan_synthesizer"],
    bonus: { bossing: 8, balanced: 5, mobbing: 3 },
    label: "Mixologist+Synthesizer",
  },
];

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Rank dual-enhancement perk pairs. Mobbing/balanced → Mixologist+Transfuser (Toile);
 * bossing → Mixologist+Primed Potency (Transfuser needs kills).
 */
export function scoreEnhancementPairs(
  catalog: EnhancementCatalog,
  input: ScoreInput,
): ScoredEnhancementPair[] {
  const singles = scoreEnhancements(catalog, input);
  const byId = new Map(singles.map((s) => [s.enhancement.id, s]));
  const arch = input.archetype ?? "balanced";
  const pairs: ScoredEnhancementPair[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < catalog.enhancements.length; i++) {
    for (let j = i + 1; j < catalog.enhancements.length; j++) {
      const a = catalog.enhancements[i]!;
      const b = catalog.enhancements[j]!;
      if (a.manufacturer !== b.manufacturer) continue;
      const key = pairKey(a.id, b.id);
      if (seen.has(key)) continue;
      seen.add(key);
      let score = (byId.get(a.id)?.score ?? 0) + (byId.get(b.id)?.score ?? 0);
      const reasons = [
        `${a.name}:${byId.get(a.id)?.score ?? 0}`,
        `${b.name}:${byId.get(b.id)?.score ?? 0}`,
      ];
      if (arch === "bossing") {
        for (const row of [a, b]) {
          if (
            row.behavior_tags.includes("on_kill") &&
            !row.behavior_tags.includes("gun_element_bonus")
          ) {
            score -= 4;
            reasons.push(`boss_penalty:${row.name}`);
          }
        }
      }
      for (const syn of PAIR_SYNERGY) {
        if (pairKey(syn.ids[0], syn.ids[1]) === key) {
          const bonus = syn.bonus[arch] ?? 0;
          score += bonus;
          reasons.push(`${syn.label}:+${bonus}`);
        }
      }
      const ordered = a.id < b.id ? [a, b] : [b, a];
      pairs.push({
        a: ordered[0]!,
        b: ordered[1]!,
        score,
        why: reasons.slice(0, 6).join(", "),
        search_hint: `${ordered[0]!.manufacturer} · ${ordered[0]!.name} + ${ordered[1]!.name}`,
      });
    }
  }
  return pairs.sort((x, y) => y.score - x.score || x.search_hint.localeCompare(y.search_hint));
}
