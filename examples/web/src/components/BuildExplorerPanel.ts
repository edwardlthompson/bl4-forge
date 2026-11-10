import { t } from "../i18n";
import { composeBuildStats } from "../mvp/composeBuild";
import { demoCandidates, demoPiecesFor, demoSpecsFor } from "../mvp/demoPool";
import { solve } from "../solver/pipeline";
import type { Candidate, SolverRules } from "../solver/types";

export type BuildExplorerCallbacks = {
  onClose: () => void;
  onOpenStats: (buildId: string) => void;
};

const RULES: SolverRules = {
  beam_width: 16,
  anneal_iterations: 50,
  timeout_ms: 500,
  balanced: { strategy: "maximin", mob_floor: 0.4, boss_floor: 0.4 },
  obtainable_for_published: ["confirmed"],
  obtainable_for_experimental: ["confirmed", "probable", "unverified"],
};

const UPTIME = {
  always: 1,
  ads: 0.5,
  on_crit: 0.52,
  on_kill: 0.55,
  on_melee: 0.18,
  on_ordnance_hit: 0.42,
  while_shield_down: 0.2,
  while_moving: 0.6,
  on_reload: 0.32,
  while_airborne: 0.08,
};

/** Experimental MVP build frontier explorer. */
export function createBuildExplorerPanel(callbacks: BuildExplorerCallbacks): HTMLElement {
  const root = document.createElement("section");
  root.className = "gp-panel gp-build-explorer";
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", t("mvp.builds.title"));

  const out = solve({ pool: demoCandidates(), rules: RULES, experimental: true, rngSeed: 7 });
  const ranked: Candidate[] = out.ranked;

  root.innerHTML = `
    <header class="gp-panel-header">
      <h2>${t("mvp.builds.title")}</h2>
      <button type="button" class="gp-btn" data-close aria-label="${t("nav.back")}">${t("nav.back")}</button>
    </header>
    <p class="gp-body">${t("mvp.builds.disclaimer")}</p>
    <ol class="gp-build-list" data-testid="mvp-build-list">
      ${ranked
        .map((c, i) => {
          const stats = composeBuildStats({
            pieces: demoPiecesFor(c.id),
            specs: demoSpecsFor(c.id),
            uptime: UPTIME,
          });
          return `<li>
            <button type="button" class="gp-settings-row" data-build="${c.id}">
              <strong>#${i + 1} ${c.id}</strong>
              <span class="gp-settings-hint">score ${c.score.toFixed(1)} · DPS ${stats.compose.dps.toFixed(1)} · ${stats.synergyKeys.slice(0, 3).join(", ")}</span>
            </button>
          </li>`;
        })
        .join("")}
    </ol>
  `;

  root.querySelector("[data-close]")?.addEventListener("click", () => callbacks.onClose());
  for (const btn of root.querySelectorAll<HTMLButtonElement>("[data-build]")) {
    btn.addEventListener("click", () => callbacks.onOpenStats(btn.dataset.build!));
  }
  return root;
}
