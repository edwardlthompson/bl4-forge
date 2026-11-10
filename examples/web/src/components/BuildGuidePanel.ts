import { sumFirmwareTotals } from "../experimental/firmwareTotals";
import {
  type ArchetypeId,
  loadBuildAdapters,
  loadBuildCore,
  loadFirmwareCatalog,
  loadGrenadeCatalog,
  loadRafaSkillEffects,
  loadSynergyRules,
} from "../experimental/loadPacks";
import {
  formatSkillSpendOrder,
  loadRafaPeacebreakerGuide,
  skillBoardRows,
  treeClass,
  validateGuide,
} from "../guide";
import { t } from "../i18n";
import { archetypeLoadoutChart, stacksHtml } from "./guideArchHtml";
import { formatLines, iconImg, specCard, spendCard } from "./guideCardHtml";
import { renderRecommendedLegendariesHtml, renderRepkitMathHtml } from "./guideLegendariesHtml";
import {
  type AdapterLoadout,
  adapterFor,
  buildTagsForRafaGuide,
  renderEnhancementAndGodroll,
  renderLoadoutCardsHtml,
} from "./guideLoadoutExtras";
import { behaviorTagsFromPack, bestGrenadeRecommendation, detectSynergies } from "./guideSynergy";

export type BuildGuideCallbacks = {
  onClose: () => void;
  onOpenStats?: () => void;
};

const ARCHES: ArchetypeId[] = ["balanced", "mobbing", "bossing"];

/** Rafa build guide: static skills/specs + full gear loadout per content archetype. */
export function createBuildGuidePanel(callbacks: BuildGuideCallbacks): HTMLElement {
  const root = document.createElement("section");
  root.className = "gp-panel gp-build-guide";
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", t("guide.title"));

  let guide;
  try {
    guide = loadRafaPeacebreakerGuide();
  } catch {
    root.innerHTML = `
      <header class="gp-panel-header">
        <h2>${t("guide.title")}</h2>
        <button type="button" class="gp-btn" data-close>${t("nav.back")}</button>
      </header>
      <p class="gp-body" role="alert">${t("guide.error")}</p>`;
    root.querySelector("[data-close]")?.addEventListener("click", () => callbacks.onClose());
    return root;
  }

  const core = loadBuildCore();
  const adapters = loadBuildAdapters();
  const errors = validateGuide(guide);
  const spendText = formatSkillSpendOrder(guide);
  const spent = guide.skill_spend_order.reduce((n, s) => n + (s.points ?? 1), 0);
  const pack = loadRafaSkillEffects();
  let arch: ArchetypeId = "balanced";

  const renderDynamic = () => {
    const adapter = adapterFor(arch);
    const loadout = adapter.loadout as AdapterLoadout;
    const skillTags = buildTagsForRafaGuide([
      ...behaviorTagsFromPack(pack, guide.allocation),
      "double_grenade_spawn",
      ...(adapter.stack_tags ?? []),
    ]);
    const grenadeRoll = adapter.grenade_roll
      ? {
          grenade_id: adapter.grenade_roll.grenade_id,
          payload: adapter.grenade_roll.payload,
          payload_augment: adapter.grenade_roll.payload_augment,
          perk: adapter.grenade_roll.perk,
          extra_tags: adapter.grenade_roll.extra_tags ?? [],
        }
      : {
          grenade_id: "vla_grenade_gadget.comp_05_legendary_Waterfall",
          payload: "lingering",
          payload_augment: "pulsing",
          perk: "nuke",
          extra_tags: ["airdrop", "radius"],
        };
    const hits = detectSynergies(loadSynergyRules(), loadGrenadeCatalog(), grenadeRoll, skillTags);
    const rec = bestGrenadeRecommendation(hits);
    const { enhancementsHtml, godrollHtml } = renderEnhancementAndGodroll(skillTags, arch);
    const archButtons = ARCHES.map(
      (id) =>
        `<button type="button" class="gp-btn gp-guide-arch${id === arch ? " gp-guide-arch-active" : ""}" data-arch="${id}">${t(`guide.arch_${id}`)}</button>`,
    ).join("");
    const purple = guide.gear.find((g) => g.purple_why)?.purple_why;

    const dyn = root.querySelector("[data-guide-dynamic]");
    if (!dyn) return;
    const fwLine = sumFirmwareTotals(loadFirmwareCatalog(), core.firmware.pieces)
      .map((l) => `${l.label} (${l.sources.join(", ")})`)
      .join(" · ");

    dyn.innerHTML = `
      <section class="gp-guide-section gp-guide-scan gp-guide-loadout-block" aria-labelledby="guide-gear-h">
        <div class="gp-guide-arch-row" role="tablist" aria-label="${t("guide.archetypes")}" data-testid="guide-arch-tabs">
          ${archButtons}
        </div>
        <p class="gp-guide-scan-lead" data-testid="guide-arch-why"><strong>${t(`guide.arch_${arch}`)}</strong> — ${adapter.why}</p>
        ${(adapter.secondary_notes ?? []).map((n: string) => `<p class="gp-guide-reason">${n}</p>`).join("")}

        <h2 id="guide-gear-h">${t("guide.gear")}</h2>
        <p class="gp-body gp-guide-com-exact" data-testid="guide-com-exact"><strong>${t("guide.com_godroll")}</strong>:
          <span class="gp-rarity-legendary">Grenazerker</span> · +3 Sinergia · +4 Confeti · Splash Damage passive · Gadget Ahoy firmware
        </p>
        <p class="gp-guide-scan-lead">${t("guide.com_legal")}</p>
        ${renderLoadoutCardsHtml(loadout)}
        ${
          rec
            ? `<p class="gp-guide-scan-lead">${t("guide.grenade_rec")}: ${loadout.grenade?.item_name ?? "—"} · ${rec.payload}/${rec.payload_augment}/${rec.perk}</p>`
            : ""
        }
        ${
          purple
            ? `<p class="gp-guide-reason gp-guide-purple-why" data-testid="guide-purple-why"><strong>${t("guide.purple_why")}</strong>: ${purple}</p>`
            : ""
        }
      </section>

      <section class="gp-guide-section gp-guide-scan" aria-labelledby="guide-stacks-h">
        <h2 id="guide-stacks-h">${t("guide.stack_totals")}</h2>
        <p class="gp-guide-scan-lead">${t("guide.stack_totals_help")}</p>
        ${stacksHtml(guide.allocation, arch)}
        <p class="gp-body" data-testid="guide-firmware-totals"><strong>${t("guide.firmware_totals")}</strong>:
          ${fwLine || "—"}
        </p>
      </section>

      ${enhancementsHtml}
      ${godrollHtml}

      <section class="gp-guide-section gp-guide-scan">
        <h2>${t("mvp.stats.detected")}</h2>
        <ul class="gp-guide-rank-list" data-testid="guide-synergies">${hits
          .map((h) => `<li><strong>${h.title}</strong> — ${h.why}</li>`)
          .join("")}</ul>
      </section>
    `;

    dyn.querySelectorAll("[data-arch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        arch = (btn.getAttribute("data-arch") as ArchetypeId) || "balanced";
        renderDynamic();
      });
    });
  };

  root.innerHTML = `
    <header class="gp-guide-topband" data-testid="guide-sticky">
      <button type="button" class="gp-btn gp-guide-topband-back" data-close aria-label="${t("nav.back")}">${t("nav.back")}</button>
      <div class="gp-guide-topband-center">
        <strong class="gp-guide-topband-title" data-testid="guide-hunter">${guide.hunter_display_name}</strong>
        <span class="gp-guide-tree-remote">${guide.action_skill_name}</span>
        <span data-testid="guide-budget">${spent}/${guide.point_budget}</span>
        <span class="gp-guide-topband-meta">${t("guide.action")}: ${guide.action_skill_name}
          · ${t("guide.augment")}: ${(guide.augment_names ?? []).join(", ") || "—"}
          · ${t("guide.capstone")}: ${guide.capstone_name ?? "—"}</span>
      </div>
      <div class="gp-guide-topband-actions">
        <button type="button" class="gp-btn gp-btn-primary" data-copy data-testid="guide-copy">${t("guide.copy")}</button>
        ${callbacks.onOpenStats ? `<button type="button" class="gp-btn" data-stats>${t("guide.stats_secondary")}</button>` : ""}
      </div>
    </header>
    <p class="gp-guide-banner gp-guide-banner-slim" data-testid="guide-experimental-mags">${t("guide.experimental_mags")} · ${t("guide.patch")}: ${core.patch}</p>
    <p class="gp-guide-icon-disclaimer" data-testid="guide-icon-disclaimer">${t("guide.icon_disclaimer")}</p>
    ${errors.length ? `<p class="gp-body" role="alert">${t("guide.illegal")}: ${errors[0]}</p>` : ""}

    <section class="gp-guide-section gp-guide-how" aria-labelledby="guide-how-h" data-testid="guide-how">
      <h2 id="guide-how-h">${t("guide.how_title")}</h2>
      <p class="gp-body">${t("guide.how_body")}</p>
      <p class="gp-body">${core.narrative}</p>
    </section>

    <section class="gp-guide-section" aria-labelledby="guide-skills-h">
      <h2 id="guide-skills-h">${t("guide.skills")}</h2>
      <ol class="gp-guide-board" data-testid="guide-skill-steps">
        ${skillBoardRows(guide)
          .map((row) => {
            if (row.kind === "loadout") {
              if (row.noteOnly) {
                return `<li class="gp-guide-board-note" data-testid="guide-loadout-note">
                  <span class="gp-guide-levels">L${row.at_level}</span>
                  <span>${row.label}</span>
                </li>`;
              }
              return spendCard(
                "gp-guide-tree-remote",
                row.label,
                "",
                `L${row.at_level}`,
                "",
                row.reason,
                row.icon_id ? iconImg(row.icon_id, row.label) : "",
              ).replace('class="gp-guide-card"', 'class="gp-guide-card gp-guide-card-loadout"');
            }
            const s = row.step;
            return spendCard(
              treeClass(s.tree_id),
              s.display_name,
              `→ ${s.to_rank}`,
              `L${s.level}`,
              formatLines(s.skill_id, s.to_rank)
                ? `<p class="gp-guide-stats">${formatLines(s.skill_id, s.to_rank)}</p>`
                : "",
              s.reason,
              iconImg(s.icon_id ?? s.skill_id, s.display_name),
            );
          })
          .join("")}
      </ol>
    </section>

    <section class="gp-guide-section" aria-labelledby="guide-specs-h">
      <h2 id="guide-specs-h">${t("guide.specs")}</h2>
      <ol class="gp-guide-spec-board" data-testid="guide-spec-steps">
        ${guide.spec.spend_order.map((s) => specCard(s)).join("")}
      </ol>
      <p class="gp-body">${t("guide.specs_equipped")}: ${guide.spec.equipped.join(", ")}</p>
    </section>

    <div data-guide-dynamic></div>
    ${renderRecommendedLegendariesHtml()}
    ${renderRepkitMathHtml()}
    ${archetypeLoadoutChart(adapters.adapters)}
    <p class="gp-body" data-copy-status role="status" hidden></p>
  `;

  renderDynamic();
  root.querySelector("[data-close]")?.addEventListener("click", () => callbacks.onClose());
  root.querySelector("[data-stats]")?.addEventListener("click", () => callbacks.onOpenStats?.());
  root.querySelector("[data-copy]")?.addEventListener("click", async () => {
    const status = root.querySelector<HTMLElement>("[data-copy-status]");
    try {
      await navigator.clipboard.writeText(spendText);
      if (status) {
        status.hidden = false;
        status.textContent = t("guide.copied");
      }
    } catch {
      if (status) {
        status.hidden = false;
        status.textContent = spendText.slice(0, 120) + "…";
      }
    }
  });

  return root;
}
