/** Loadout tiles + enhancement/god-roll sections with full visible data. */
import { godrollFromBuild } from "../experimental/godrollFromBuild";
import {
  type ArchetypeId,
  loadBuildAdapters,
  loadEnhancementCatalog,
  loadWeaponGodrolls,
} from "../experimental/loadPacks";
import { scoreEnhancementPairs, scoreEnhancements } from "../experimental/scoreEnhancements";
import { t } from "../i18n";
import { iconImg } from "./guideCardHtml";

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

export function enhancementIdsFromRolls(rolls: string | undefined): string[] {
  if (!rolls) return [];
  const ids: string[] = [];
  if (/mixologist/i.test(rolls)) ids.push("maliwan_mixologist");
  if (/transfuser|transference/i.test(rolls)) ids.push("maliwan_transfuser");
  if (/primed\s*potency/i.test(rolls)) ids.push("maliwan_primed_potency");
  if (/synthesizer/i.test(rolls)) ids.push("maliwan_synthesizer");
  return ids;
}

export type AdapterLoadoutPiece = {
  item_name: string;
  rarity?: string;
  farm?: string;
  icon_id?: string;
  rolls?: string;
  note?: string;
  why?: string;
};

export type AdapterLoadout = Record<string, AdapterLoadoutPiece>;

const SLOT_ORDER = [
  "weapon_1",
  "weapon_2",
  "weapon_3",
  "weapon_4",
  "shield",
  "grenade",
  "class_mod",
  "repkit",
  "enhancement",
  "artifact",
] as const;

export function loadoutPieces(loadout: AdapterLoadout): Array<{
  slot: string;
  piece: AdapterLoadoutPiece;
}> {
  return SLOT_ORDER.filter((s) => loadout[s]).map((slot) => ({
    slot,
    piece: loadout[slot]!,
  }));
}

export function renderLoadoutCardsHtml(loadout: AdapterLoadout): string {
  const cards = loadoutPieces(loadout)
    .map(({ slot, piece }) => {
      const rarity = piece.rarity ?? "legendary";
      return `<li class="gp-guide-tile" data-testid="guide-loadout-${slot}">
        ${iconImg(piece.icon_id ?? `slot_${slot.replace(/_\d+$/, "")}`, piece.item_name)}
        <div class="gp-guide-tile-body">
          <p class="gp-guide-gear-slot">${slot.replace(/_/g, " ")}</p>
          <strong class="gp-rarity-${rarity}" data-testid="guide-gear-name">${piece.item_name}</strong>
          ${piece.rolls ? `<p class="gp-guide-reason">${t("guide.want")}: ${piece.rolls}</p>` : ""}
          ${piece.farm ? `<p class="gp-guide-reason" data-testid="guide-gear-farm"><strong>${t("guide.farm")}</strong>: ${piece.farm}</p>` : ""}
          ${piece.why ? `<p class="gp-guide-reason">${piece.why}</p>` : ""}
          ${piece.note ? `<p class="gp-guide-reason">${piece.note}</p>` : ""}
        </div>
      </li>`;
    })
    .join("");
  return `<ul class="gp-guide-tile-grid" data-testid="guide-loadout-cards">${cards}</ul>`;
}

export function renderEnhancementAndGodroll(
  skillTags: string[],
  archetype: ArchetypeId,
): { enhancementsHtml: string; godrollHtml: string } {
  const catalog = loadEnhancementCatalog();
  const ranked = scoreEnhancements(catalog, {
    buildTags: skillTags,
    weaponLicenses: ["maliwan", "torgue", "jakobs"],
    archetype,
  });
  const pairs = scoreEnhancementPairs(catalog, {
    buildTags: skillTags,
    weaponLicenses: ["maliwan", "torgue", "jakobs"],
    archetype,
  });
  const topPairs = pairs.filter((p) => p.score > 0).slice(0, 5);
  const top = ranked.filter((r) => r.score > 0).slice(0, 8);
  const god = godrollFromBuild(ranked, loadWeaponGodrolls(), skillTags, archetype);
  const best = topPairs[0];

  const enhancementsHtml = `<section class="gp-guide-section gp-guide-scan" data-testid="guide-enhancements">
    <h2>${t("guide.enhancements")}</h2>
    <p class="gp-guide-scan-lead">${t("guide.dual_enh_help")}</p>
    ${
      best
        ? `<p class="gp-guide-hero-callout" data-testid="guide-dual-best">
            <span class="gp-guide-hero-eyebrow">${t("guide.dual_enh_best")}</span>
            <span class="gp-guide-hero-body">${best.search_hint} · score ${best.score} — ${best.why}</span>
          </p>`
        : ""
    }
    <ol class="gp-guide-rank-list" data-testid="guide-dual-pairs">
      ${topPairs
        .map(
          (p) =>
            `<li><strong>${p.a.name} + ${p.b.name}</strong> (${p.a.manufacturer}) · ${p.score} — ${p.why}</li>`,
        )
        .join("")}
    </ol>
    <h3 class="gp-guide-scan-h3">${t("guide.enhancements_singles")}</h3>
    <ol class="gp-guide-rank-list">
      ${top
        .map(
          (r) =>
            `<li><strong>${r.enhancement.name}</strong> (${r.enhancement.manufacturer}) · ${r.score} — ${r.why}</li>`,
        )
        .join("")}
    </ol>
  </section>`;

  const godrollHtml = `<section class="gp-guide-section gp-guide-scan" data-testid="guide-godroll">
    <h2>${t("guide.godroll")}</h2>
    <p class="gp-guide-scan-lead"><strong>${t("guide.ideal_weapon")}</strong>:
      ${god.ideal_profile.licenses.join(", ") || "—"} · ${god.ideal_profile.weapon_type}
      · ${god.ideal_profile.element_pairing.join("/")}</p>
    <p class="gp-guide-scan-lead"><strong>${t("guide.card_bonuses")}</strong>:
      ${god.card_bonuses.map((c) => `${c.stage}: ${c.label}`).join(" · ")}</p>
    <p class="gp-guide-scan-lead"><strong>${t("guide.part_priorities")}</strong>:
      ${god.part_priorities.slice(0, 10).join("; ")}</p>
    <ul class="gp-guide-rank-list">
      ${god.named_examples
        .map((e) => `<li><strong>${e.name}</strong> — ${e.licenses.join("+")}</li>`)
        .join("")}
    </ul>
  </section>`;

  return { enhancementsHtml, godrollHtml };
}

export function adapterFor(arch: ArchetypeId) {
  return loadBuildAdapters().adapters[arch];
}
