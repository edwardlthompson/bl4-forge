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
import { computeStackTotals } from "../experimental/stackTotals";
import {
  formatSkillSpendOrder,
  loadRafaPeacebreakerGuide,
  skillBoardRows,
  treeClass,
  validateGuide,
} from "../guide";
import { t } from "../i18n";
import { formatLines, iconImg, specCard, spendCard } from "./guideCardHtml";
import { buildTagsForRafaGuide, renderEnhancementAndGodroll } from "./guideLoadoutExtras";
import { behaviorTagsFromPack, bestGrenadeRecommendation, detectSynergies } from "./guideSynergy";

export type BuildGuideCallbacks = {
  onClose: () => void;
  onOpenStats?: () => void;
};

/** Rafa build guide: static core + one-slot archetype swaps (no LLM at runtime). */
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
  const skillTags = buildTagsForRafaGuide([
    ...behaviorTagsFromPack(pack, guide.allocation),
    "double_grenade_spawn",
  ]);
  const hits = detectSynergies(
    loadSynergyRules(),
    loadGrenadeCatalog(),
    {
      grenade_id: "vla_grenade_gadget.comp_05_legendary_Waterfall",
      payload: "lingering",
      payload_augment: "pulsing",
      perk: "nuke",
      extra_tags: ["airdrop", "radius", "on_kill_missiles", "afk_clear"],
    },
    skillTags,
  );
  const rec = bestGrenadeRecommendation(hits);
  const fwLines = sumFirmwareTotals(loadFirmwareCatalog(), core.firmware.pieces);
  const stacks = computeStackTotals({
    allocation: guide.allocation,
    firmware: core.firmware.pieces,
    includeComGodroll: true,
  });

  let archetype: ArchetypeId = "balanced";

  const render = () => {
    const adapter = adapters.adapters[archetype];
    const { enhancementsHtml, godrollHtml } = renderEnhancementAndGodroll(skillTags, archetype);
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

    <div class="gp-guide-archetypes" role="tablist" aria-label="${t("guide.archetypes")}">
      ${(["balanced", "mobbing", "bossing"] as ArchetypeId[])
        .map(
          (id) =>
            `<button type="button" class="gp-btn gp-guide-arch ${archetype === id ? "gp-btn-primary gp-guide-arch-active" : ""}" data-arch="${id}" role="tab" aria-selected="${archetype === id}">${t(`guide.arch_${id}`)}</button>`,
        )
        .join("")}
    </div>
    <p class="gp-body" data-testid="guide-swap"><strong>${t("guide.one_swap")}</strong>: ${adapter.swap_slot} → ${adapter.swap_item} — ${adapter.why}</p>

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

    <section class="gp-guide-section" aria-labelledby="guide-stacks-h">
      <h2 id="guide-stacks-h">${t("guide.stack_totals")}</h2>
      <p class="gp-body">${t("guide.stack_totals_help")}</p>
      <ul class="gp-guide-stack-list" data-testid="guide-stack-totals">
        ${stacks.buckets
          .map(
            (b) =>
              `<li class="gp-guide-stack-row"><strong>${b.label}</strong>
                <span class="gp-guide-stack-sources">${b.sources.slice(0, 6).join(" · ")}${b.sources.length > 6 ? "…" : ""}</span></li>`,
          )
          .join("")}
      </ul>
      <p class="gp-guide-icon-disclaimer">${stacks.notes.join(" ")}</p>
      <p class="gp-body" data-testid="guide-firmware-totals"><strong>${t("guide.firmware_totals")}</strong>:
        ${fwLines.map((l) => `${l.label} (${l.sources.join(", ")})`).join(" · ") || "—"}
      </p>
    </section>

    <section class="gp-guide-section" aria-labelledby="guide-gear-h">
      <h2 id="guide-gear-h">${t("guide.gear")}</h2>
      <p class="gp-body gp-guide-com-exact" data-testid="guide-com-exact"><strong>${t("guide.com_godroll")}</strong>:
        ${core.class_mod.search_exact}
      </p>
      <p class="gp-body"><strong>${t("guide.com_skills")}</strong>:
        ${core.class_mod.desired_skills.map((s) => `${s.display_name} — ${s.why}`).join(" · ")}
      </p>
      <ul class="gp-guide-cards gp-guide-gear-cards">
        ${guide.gear
          .map((g) => {
            const label = g.slot_index ? `${g.slot} ${g.slot_index}` : g.slot;
            const highlight =
              g.slot === adapter.swap_slot
                ? `<p class="gp-guide-reason gp-guide-swap-hl">${t("guide.active_swap")}: ${adapter.swap_item}</p>`
                : "";
            return `<li class="gp-guide-card">
              ${iconImg(g.icon_id ?? `slot_${g.slot}`, label)}
              <div class="gp-guide-card-body">
                <strong>${label}</strong>${g.item_hint ? ` — ${g.item_hint}` : ""}
                <p class="gp-guide-reason">${t("guide.want")}: ${g.priorities.join("; ")}</p>
                ${highlight}
                ${g.slot === "grenade" && rec ? `<p class="gp-guide-reason">${t("guide.grenade_rec")}: Waterfall · ${rec.payload}/${rec.payload_augment}/${rec.perk}</p>` : ""}
              </div>
            </li>`;
          })
          .join("")}
      </ul>
    </section>

    ${enhancementsHtml}
    ${godrollHtml}

    <section class="gp-guide-section">
      <h2>${t("mvp.stats.detected")}</h2>
      <ul data-testid="guide-synergies">${hits.map((h) => `<li><strong>${h.title}</strong> — ${h.why}</li>`).join("")}</ul>
    </section>
    <p class="gp-body" data-copy-status role="status" hidden></p>
  `;

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
    root.querySelectorAll<HTMLButtonElement>("[data-arch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        archetype = btn.getAttribute("data-arch") as ArchetypeId;
        render();
      });
    });
  };

  render();
  return root;
}
