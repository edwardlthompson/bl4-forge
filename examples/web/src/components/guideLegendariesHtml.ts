/** Legendaries + repkit sections — full data visible, icon tiles + meters. */

import repkitPerksJson from "../experimental/builds/repkit_perks.json";
import { loadRecommendedLegendaries } from "../experimental/loadPacks";
import {
  DEFAULT_PEACEBREAKER_COOLDOWN_S,
  DEFAULT_PEACEBREAKER_DURATION_S,
  LEGENDARY_REPKITS,
  rankRepkits,
} from "../experimental/repkitUptime";
import { t } from "../i18n";
import { iconImg } from "./guideCardHtml";
import { meterRow } from "./guideVisualHtml";

export function renderRecommendedLegendariesHtml(): string {
  const pack = loadRecommendedLegendaries();
  const tiles = pack.weapons
    .map(
      (w) => `<li class="gp-guide-tile" data-testid="guide-leg-${w.search_name}">
        ${iconImg(`gear_${w.search_name}`, w.search_name)}
        <div class="gp-guide-tile-body">
          <strong class="gp-rarity-legendary">${w.search_name}</strong>
          <span class="gp-guide-tile-meta">${w.slot_hint}</span>
          <span class="gp-guide-tile-farm" data-testid="guide-gear-farm-leg">${t("guide.farm")}: ${w.farm}</span>
          <p class="gp-guide-reason">${w.why}</p>
          <p class="gp-guide-reason">${t("guide.want")}: ${w.want_rolls.join("; ")}</p>
        </div>
      </li>`,
    )
    .join("");
  return `<section class="gp-guide-section gp-guide-scan" aria-labelledby="guide-legs-h" data-testid="guide-legendaries">
    <h2 id="guide-legs-h">${t("guide.legendaries_title")}</h2>
    <p class="gp-guide-scan-lead">${t("guide.legendaries_help")}</p>
    <ul class="gp-guide-tile-grid">${tiles}</ul>
  </section>`;
}

export function renderRepkitMathHtml(): string {
  const ranked = rankRepkits(
    LEGENDARY_REPKITS,
    DEFAULT_PEACEBREAKER_DURATION_S,
    DEFAULT_PEACEBREAKER_COOLDOWN_S,
  );
  const winner = ranked[0]!;
  const maxU = Math.max(...ranked.map((r) => r.uptime * 100));
  const meters = ranked
    .map((r) =>
      meterRow(
        `${r.search_name} · ${r.charges}×`,
        Math.round(r.uptime * 1000) / 10,
        maxU,
        `cycle ${r.cycleS.toFixed(1)}s · CD left ${(r.remainingCdFraction * 100).toFixed(0)}%`,
      ),
    )
    .join("");
  const rows = ranked
    .map(
      (r) =>
        `<tr${r.search_name === "TripleBypass" ? ' class="gp-guide-swap-hl"' : ""}>
          <th scope="row">${r.search_name}</th>
          <td>${r.charges}</td>
          <td>${(r.uptime * 100).toFixed(1)}%</td>
          <td>${r.cycleS.toFixed(1)}s</td>
          <td>${(r.remainingCdFraction * 100).toFixed(0)}%</td>
        </tr>`,
    )
    .join("");
  return `<section class="gp-guide-section gp-guide-scan" aria-labelledby="guide-repkit-h" data-testid="guide-repkit-math">
    <h2 id="guide-repkit-h">${t("guide.repkit_title")}</h2>
    <p class="gp-guide-hero-callout" data-testid="guide-repkit-winner">
      <span class="gp-guide-hero-eyebrow">${t("guide.repkit_winner")}</span>
      <span class="gp-guide-hero-body"><span class="gp-rarity-legendary">${winner.search_name}</span>
        · search “${winner.search_name}” · farm Backhive · ${(winner.uptime * 100).toFixed(1)}% uptime
        (D=${DEFAULT_PEACEBREAKER_DURATION_S}s, C=${DEFAULT_PEACEBREAKER_COOLDOWN_S}s)</span>
    </p>
    <ul class="gp-guide-meter-list">${meters}</ul>
    <table class="gp-guide-swap-table">
      <thead>
        <tr>
          <th scope="col">${t("guide.repkit_col_name")}</th>
          <th scope="col">${t("guide.repkit_col_charges")}</th>
          <th scope="col">${t("guide.repkit_col_uptime")}</th>
          <th scope="col">${t("guide.repkit_col_cycle")}</th>
          <th scope="col">${t("guide.repkit_col_cd_left")}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="gp-guide-scan-lead">${t("guide.repkit_math")}</p>
    <p class="gp-guide-scan-lead">${t("guide.repkit_rolls")}</p>
    ${renderRepkitPerkRanksHtml()}
  </section>`;
}

function renderRepkitPerkRanksHtml(): string {
  const pack = repkitPerksJson as {
    ideal_triple_bypass: {
      best_secondary_ranked: Array<{ perk: string; prefix: string; effect: string; why: string }>;
      size: string;
    };
    purple_bridge: { search_name: string; why_purple: string; farm: string; ideal_rolls: string[] };
  };
  const ranked = pack.ideal_triple_bypass.best_secondary_ranked
    .map(
      (p, i) =>
        `<li><strong>${i + 1}. ${p.perk}</strong> (${p.prefix}) — ${p.effect}. <em>${p.why}</em></li>`,
    )
    .join("");
  const bridge = pack.purple_bridge;
  return `
    <h3 class="gp-guide-scan-h3">${t("guide.repkit_bonus_title")}</h3>
    <p class="gp-guide-scan-lead">${t("guide.repkit_bonus_help")}</p>
    <ol class="gp-guide-rank-list" data-testid="guide-repkit-perks">${ranked}</ol>
    <p class="gp-guide-scan-lead">${pack.ideal_triple_bypass.size}</p>
    <p class="gp-body gp-guide-purple-why" data-testid="guide-repkit-purple">
      <strong class="gp-rarity-epic">${bridge.search_name}</strong> —
      ${bridge.why_purple}
      <br/><strong>${t("guide.farm")}</strong>: ${bridge.farm}
      <br/>${t("guide.want")}: ${bridge.ideal_rolls.join("; ")}
    </p>`;
}
