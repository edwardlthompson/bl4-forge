import { loadRafaPeacebreakerGuide } from "../guide";
import { t } from "../i18n";
import { composeBuildStats } from "../mvp/composeBuild";
import { demoPiecesFor, demoSpecsFor } from "../mvp/demoPool";

export type BuildStatsCallbacks = {
  onClose: () => void;
  onShare?: (markdown: string) => void;
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
  while_overdrive: 0.72,
};

/** Per-build stats / synergy page (deterministic waterfall + procs + VH effects). */
export function createBuildStatsPanel(
  buildId: string,
  callbacks: BuildStatsCallbacks,
): HTMLElement {
  const root = document.createElement("section");
  root.className = "gp-panel gp-build-stats";
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", t("mvp.stats.title"));

  let skillAllocation;
  let specs = demoSpecsFor(buildId);
  try {
    const guide = loadRafaPeacebreakerGuide();
    skillAllocation = guide.allocation;
    specs = {
      nodePoints: guide.spec.node_points,
      equipped: guide.spec.equipped,
    };
  } catch {
    skillAllocation = undefined;
  }

  const report = composeBuildStats({
    pieces: demoPiecesFor(buildId),
    specs,
    uptime: UPTIME,
    skillAllocation,
  });

  const md = [
    `# ${buildId}`,
    "",
    `DPS: **${report.compose.dps.toFixed(2)}** · damage ${report.compose.damage.toFixed(2)}`,
    "",
    "## Detected synergies (experimental)",
    ...report.synergies.map((h) => `- **${h.title}**: ${h.why}`),
    "",
    "## Synergy keys",
    report.synergyKeys.map((k) => `- ${k}`).join("\n"),
    "",
    "## Gear",
    ...report.pieces.map((p) => `- **${p.slot}**: ${p.label} (${p.synergyKeys.join(", ") || "—"})`),
    "",
    "## Specialization procs",
    ...report.procs.map((p) => `- ${p.skillId} → ${p.proc} (${p.cond})`),
    "",
    "## Contribution waterfall",
    ...report.waterfall.slice(0, 16).map((c) => `- ${c.op} ${c.target}: ${c.effective.toFixed(3)}`),
  ].join("\n");

  root.innerHTML = `
    <header class="gp-panel-header">
      <h2>${t("mvp.stats.title")}</h2>
      <button type="button" class="gp-btn" data-close aria-label="${t("nav.back")}">${t("nav.back")}</button>
    </header>
    <p class="gp-body">${t("mvp.stats.disclaimer")}</p>
    <p class="gp-guide-banner">${t("guide.experimental_mags")}</p>
    <p class="gp-headline" data-testid="mvp-stats-id">${buildId}</p>
    <p class="gp-body">DPS ${report.compose.dps.toFixed(1)} · damage ${report.compose.damage.toFixed(1)}</p>
    <h3>${t("mvp.stats.detected")}</h3>
    <ul data-testid="mvp-synergies">${report.synergies.map((h) => `<li><strong>${h.title}</strong> — ${h.why}</li>`).join("") || `<li>${t("mvp.stats.none")}</li>`}</ul>
    ${
      report.grenadeRecommendation
        ? `<p class="gp-body" data-testid="mvp-grenade-rec">${t("guide.grenade_rec")}: Waterfall · ${report.grenadeRecommendation.payload}/${report.grenadeRecommendation.payload_augment}/${report.grenadeRecommendation.perk}</p>`
        : ""
    }
    <h3>${t("mvp.stats.synergy")}</h3>
    <ul>${report.synergyKeys.map((k) => `<li>${k}</li>`).join("")}</ul>
    <h3>${t("mvp.stats.gear")}</h3>
    <ul>${report.pieces.map((p) => `<li><strong>${p.slot}</strong> ${p.label} — ${p.synergyKeys.join(", ") || "—"}</li>`).join("")}</ul>
    <h3>${t("mvp.stats.procs")}</h3>
    <ul>${report.procs.map((p) => `<li>${p.skillId}: ${p.proc} → ${p.cond}</li>`).join("")}</ul>
    <h3>${t("mvp.stats.waterfall")}</h3>
    <ol data-testid="mvp-waterfall">${report.waterfall
      .slice(0, 16)
      .map((c) => `<li>${c.op} <code>${c.target}</code> ${c.effective.toFixed(3)}</li>`)
      .join("")}</ol>
    <button type="button" class="gp-btn" data-share>${t("mvp.stats.share")}</button>
  `;

  root.querySelector("[data-close]")?.addEventListener("click", () => callbacks.onClose());
  root.querySelector("[data-share]")?.addEventListener("click", async () => {
    callbacks.onShare?.(md);
    try {
      await navigator.clipboard.writeText(md);
    } catch {
      /* ignore */
    }
  });
  return root;
}
