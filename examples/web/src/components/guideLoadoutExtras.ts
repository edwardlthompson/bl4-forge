/** HTML snippets for enhancement ranking + god-roll sections. */
import { godrollFromBuild } from "../experimental/godrollFromBuild";
import {
  type ArchetypeId,
  loadEnhancementCatalog,
  loadWeaponGodrolls,
} from "../experimental/loadPacks";
import { scoreEnhancements } from "../experimental/scoreEnhancements";
import { t } from "../i18n";

export function buildTagsForRafaGuide(extra: string[]): string[] {
  return [
    ...extra,
    "splash",
    "splash_crit",
    "grenade_crit",
    "on_crit",
    "spawn_grenade",
    "radius",
    "afk_clear",
    "inactive_element",
    "dual_element",
    "gun_element_bonus",
    "inherit_gun_element",
    "inherit_gun_parts",
    "collaborative_ignition",
  ];
}

export function renderEnhancementAndGodroll(
  skillTags: string[],
  archetype: ArchetypeId,
): { enhancementsHtml: string; godrollHtml: string } {
  const ranked = scoreEnhancements(loadEnhancementCatalog(), {
    buildTags: skillTags,
    weaponLicenses: ["maliwan", "torgue", "jakobs"],
    archetype,
  });
  const top = ranked.filter((r) => r.score > 0).slice(0, 8);
  const god = godrollFromBuild(ranked, loadWeaponGodrolls(), skillTags, archetype);

  const enhancementsHtml = `<section class="gp-guide-section" data-testid="guide-enhancements">
    <h2>${t("guide.enhancements")}</h2>
    <ol class="gp-guide-rank-list">
      ${top
        .map(
          (r) =>
            `<li><strong>${r.enhancement.name}</strong> (${r.enhancement.manufacturer}) · ${r.score} — ${r.why}</li>`,
        )
        .join("")}
    </ol>
  </section>`;

  const godrollHtml = `<section class="gp-guide-section" data-testid="guide-godroll">
    <h2>${t("guide.godroll")}</h2>
    <p class="gp-body"><strong>${t("guide.ideal_weapon")}</strong>:
      ${god.ideal_profile.licenses.join(", ") || "—"} · ${god.ideal_profile.weapon_type}
      · ${god.ideal_profile.element_pairing.join("/")}</p>
    <p class="gp-body"><strong>${t("guide.card_bonuses")}</strong>:
      ${god.card_bonuses.map((c) => `${c.stage}: ${c.label}`).join(" · ")}</p>
    <p class="gp-body"><strong>${t("guide.part_priorities")}</strong>:
      ${god.part_priorities.slice(0, 10).join("; ")}</p>
    <ul class="gp-guide-rank-list">
      ${god.named_examples
        .map((e) => `<li><strong>${e.name}</strong> — ${e.licenses.join("+")}</li>`)
        .join("")}
    </ul>
  </section>`;

  return { enhancementsHtml, godrollHtml };
}
