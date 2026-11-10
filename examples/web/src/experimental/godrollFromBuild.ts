/** Extrapolate ideal weapon profile + god-roll part priorities from scored enhancements. */
import type { ArchetypeId, ScoredEnhancement } from "./scoreEnhancements";

export type WeaponGodrollPack = {
  experimental: boolean;
  examples: Array<{
    id: string;
    name: string;
    licenses: string[];
    weapon_type?: string;
    element_pairing?: string[];
    illustrates_tags: string[];
  }>;
  part_priority_templates: Array<{
    id: string;
    when_tags: string[];
    parts: string[];
  }>;
};

export type GodrollResult = {
  ideal_profile: {
    licenses: string[];
    weapon_type: string;
    element_pairing: string[];
    preferred_stage_bonuses: string[];
  };
  card_bonuses: Array<{ stage: "on_shot" | "on_hit"; label: string }>;
  part_priorities: string[];
  named_examples: WeaponGodrollPack["examples"];
  top_enhancements: Array<{ id: string; name: string; score: number; why: string }>;
};

const STAGE_BONUSES: Record<"on_shot" | "on_hit", string[]> = {
  on_shot: ["Gun Damage (enhancement)", "Amp", "Magazine / first-shot"],
  on_hit: ["Splash Damage", "Crit Damage", "Status Damage", "Ricochet"],
};

/** Derive god-roll wishlist from top scored enhancements + build tags. */
export function godrollFromBuild(
  scored: ScoredEnhancement[],
  pack: WeaponGodrollPack,
  buildTags: string[],
  archetype: ArchetypeId = "balanced",
): GodrollResult {
  const top = scored.filter((s) => s.score > 0).slice(0, 8);
  const pool = top.length ? top : scored.slice(0, 5);
  const licenseCounts = new Map<string, number>();
  for (const s of pool) {
    const lic = s.enhancement.requires_licensed_parts;
    licenseCounts.set(lic, (licenseCounts.get(lic) ?? 0) + s.score);
  }
  const licenses = [...licenseCounts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

  const tags = new Set(buildTags.map((t) => t.toLowerCase()));
  const element_pairing =
    tags.has("inactive_element") || tags.has("dual_element") || tags.has("gun_element_bonus")
      ? ["primary_element", "inactive_element"]
      : tags.has("status")
        ? ["status_element"]
        : ["any"];

  const weapon_type = tags.has("splash")
    ? "splash_friendly"
    : tags.has("ricochet")
      ? "ricochet_friendly"
      : archetype === "bossing"
        ? "single_target"
        : "flexible";

  const preferred_stage_bonuses = [
    ...STAGE_BONUSES.on_shot.filter(() => pool.some((p) => p.enhancement.stage === "on_shot")),
    ...STAGE_BONUSES.on_hit.filter(() => pool.some((p) => p.enhancement.stage === "on_hit")),
  ];

  const card_bonuses: GodrollResult["card_bonuses"] = [
    { stage: "on_shot", label: "Enhancement gun damage / amp" },
    { stage: "on_hit", label: "Splash / crit / status soup" },
  ];

  const part_priorities: string[] = [];
  for (const lic of licenses.slice(0, 3)) {
    part_priorities.push(`${lic}_licensed_parts`);
  }
  for (const tmpl of pack.part_priority_templates) {
    if (tmpl.when_tags.some((t) => tags.has(t.toLowerCase()))) {
      part_priorities.push(...tmpl.parts);
    }
  }
  for (const s of pool.slice(0, 3)) {
    part_priorities.push(`unlock:${s.enhancement.id}`);
  }

  const named_examples = pack.examples.filter(
    (ex) =>
      ex.licenses.some((l) => licenses.includes(l)) ||
      ex.illustrates_tags.some((t) => tags.has(t.toLowerCase())),
  );

  return {
    ideal_profile: {
      licenses,
      weapon_type,
      element_pairing,
      preferred_stage_bonuses,
    },
    card_bonuses,
    part_priorities: [...new Set(part_priorities)],
    named_examples: named_examples.length ? named_examples : pack.examples.slice(0, 2),
    top_enhancements: pool.map((s) => ({
      id: s.enhancement.id,
      name: s.enhancement.name,
      score: s.score,
      why: s.why,
    })),
  };
}
