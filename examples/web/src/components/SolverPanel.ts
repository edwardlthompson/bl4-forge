import { t } from "../i18n";
import { loadItemCatalog } from "../items/catalog";
import { humanizeTitle } from "../items/naming";
import { farmRouteFromGear } from "../report/shoppingList";
import { coverageBanner, loadHunterIndex } from "../skills/huntersCatalog";
import { type RafaSolveResult, solveRafa } from "../solver/solveRafa";

export type SolverPanelCallbacks = {
  onClose: () => void;
  onOpenGuide: () => void;
};

function gearLabel(id: string): string {
  const item = loadItemCatalog().items.find((i) => i.id === id);
  if (item) {
    const search =
      item.synergy_keys.find((k) => !k.includes(":") && /[A-Za-z]/.test(k)) ?? item.name;
    return `${item.name} · search “${search}”`;
  }
  const title = id.includes("legendary_") ? id.split("legendary_").pop()! : id;
  return `${humanizeTitle(title)} · search “${title}”`;
}

function renderResult(out: RafaSolveResult): string {
  const best = out.best;
  if (!best) {
    return `<p class="gp-body" data-testid="solver-empty">${t("solver.empty")}</p>`;
  }
  const scored = out.scored.get(best.id);
  const delta =
    out.deltaVsPeacebreaker == null
      ? t("solver.delta_na")
      : `${t("solver.delta_prefix")} ${out.deltaVsPeacebreaker.toFixed(1)}`;
  const farms = farmRouteFromGear(best.gear);
  return `
    <div data-testid="solver-results" tabindex="-1">
      <h3 class="gp-guide-hunter">${t("solver.best_heading")}</h3>
      <p class="gp-body">${t("solver.stamp")}: ${out.solverVersion} · seed ${out.seed}</p>
      <p class="gp-body">${t("solver.scores")}: mob ${best.mobScore.toFixed(1)} / boss ${best.bossScore.toFixed(1)} / maximin ${best.score.toFixed(1)}</p>
      <p class="gp-body">${delta}</p>
      <ul class="gp-build-list">
        ${best.gear.map((g) => `<li><code>${gearLabel(g)}</code></li>`).join("")}
      </ul>
      <h4>${t("solver.farm_heading")}</h4>
      <ol>${farms.map((f) => `<li>${f}</li>`).join("")}</ol>
      <p class="gp-body">${t("solver.coverage")}</p>
      ${scored ? `<p class="gp-body">${t("solver.search_hint")}: ${scored.weaponId}</p>` : ""}
    </div>`;
}

/** Primary Rafa discovery solver panel. */
export function createSolverPanel(callbacks: SolverPanelCallbacks): HTMLElement {
  const root = document.createElement("section");
  root.className = "gp-panel gp-solver-panel";
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", t("solver.title"));

  let last: RafaSolveResult | null = null;

  const paint = (status: "idle" | "loading" | "done" | "error", err?: string) => {
    root.innerHTML = `
      <header class="gp-panel-header">
        <h2>${t("solver.title")}</h2>
        <button type="button" class="gp-btn" data-close aria-label="${t("nav.back")}">${t("nav.back")}</button>
      </header>
      <p class="gp-body">${t("solver.subtitle")}</p>
      <p class="gp-body" data-testid="solver-coverage">${coverageBanner("rafa")}</p>
      <label class="gp-body">${t("solver.hunter_label")}
        <select data-hunter disabled>
          ${loadHunterIndex()
            .map(
              (h) =>
                `<option value="${h.id}"${h.id === "rafa" ? " selected" : ""}${
                  h.id !== "rafa" ? " disabled" : ""
                }>${h.display_name}${h.id !== "rafa" ? " (soon)" : ""}</option>`,
            )
            .join("")}
        </select>
      </label>
      <div class="gp-guide-actions">
        <button type="button" class="gp-btn gp-btn-primary" data-solve data-testid="solver-run"${
          status === "loading" ? " disabled" : ""
        }>${status === "loading" ? t("solver.running") : t("solver.run")}</button>
        <button type="button" class="gp-btn" data-guide>${t("solver.open_guide")}</button>
      </div>
      <div data-solver-body>
        ${status === "idle" ? `<p class="gp-body">${t("solver.idle")}</p>` : ""}
        ${status === "loading" ? `<p class="gp-body" data-testid="solver-loading">${t("solver.running")}</p>` : ""}
        ${status === "error" ? `<p class="gp-body" role="alert">${err ?? t("solver.error")}</p>` : ""}
        ${status === "done" && last ? renderResult(last) : ""}
      </div>`;
    root.querySelector("[data-close]")?.addEventListener("click", () => callbacks.onClose());
    root.querySelector("[data-guide]")?.addEventListener("click", () => callbacks.onOpenGuide());
    root.querySelector("[data-solve]")?.addEventListener("click", () => {
      paint("loading");
      queueMicrotask(() => {
        try {
          last = solveRafa(42);
          paint("done");
          (root.querySelector("[data-testid=solver-results]") as HTMLElement | null)?.focus();
        } catch (e) {
          paint("error", e instanceof Error ? e.message : String(e));
        }
      });
    });
  };

  paint("idle");
  return root;
}
