/** Rank every enhancement perk against build behavior tags (deterministic). */

export type ArchetypeId = "balanced" | "mobbing" | "bossing";

export type EnhancementRow = {
  id: string;
  manufacturer: string;
  name: string;
  requires_licensed_parts: string;
  stage: string;
  behavior_tags: string[];
  effect_text?: string;
  oracle?: string;
};

export type EnhancementCatalog = {
  experimental: boolean;
  enhancements: EnhancementRow[];
};

export type ScoreInput = {
  buildTags: string[];
  weaponLicenses?: string[];
  archetype?: ArchetypeId;
};

export type ScoredEnhancement = {
  enhancement: EnhancementRow;
  score: number;
  why: string;
};

const ARCH_WEIGHTS: Record<ArchetypeId, Record<string, number>> = {
  mobbing: { ricochet: 3, splash: 3, afk_clear: 3, on_kill: 2, radius: 2, status: 1 },
  bossing: { gun_damage: 3, charge: 2, stacking: 2, crit: 2, pierce: 2, amp: 2 },
  balanced: { gun_damage: 1, splash: 1, ricochet: 1, inactive_element: 2, dual_element: 2 },
};

/** Deterministic score: tag overlap + license match + archetype weights. */
export function scoreEnhancements(
  catalog: EnhancementCatalog,
  input: ScoreInput,
): ScoredEnhancement[] {
  const tags = new Set(input.buildTags.map((t) => t.toLowerCase()));
  const licenses = new Set((input.weaponLicenses ?? []).map((l) => l.toLowerCase()));
  const arch = input.archetype ?? "balanced";
  const weights = ARCH_WEIGHTS[arch];

  const ranked = catalog.enhancements.map((enhancement) => {
    let score = 0;
    const reasons: string[] = [];
    for (const tag of enhancement.behavior_tags) {
      const key = tag.toLowerCase();
      if (tags.has(key)) {
        score += 2;
        reasons.push(`tag:${key}`);
      }
      const w = weights[key];
      if (w) {
        score += w;
        reasons.push(`arch:${key}+${w}`);
      }
    }
    const lic = enhancement.requires_licensed_parts.toLowerCase();
    if (licenses.has(lic)) {
      score += 4;
      reasons.push(`license:${lic}`);
    }
    if (enhancement.stage === "on_shot" && tags.has("on_shot_bias")) score += 1;
    if (enhancement.stage === "on_hit" && tags.has("on_hit_bias")) score += 1;
    return {
      enhancement,
      score,
      why: reasons.slice(0, 6).join(", ") || "no tag overlap",
    };
  });

  return ranked.sort(
    (a, b) => b.score - a.score || a.enhancement.id.localeCompare(b.enhancement.id),
  );
}
