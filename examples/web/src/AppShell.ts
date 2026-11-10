import { createLaunchPromptDialog } from "./about/launchPrompt";
import { createSwUpdatePrompt } from "./about/swUpdatePrompt";
import { mountShellRoute } from "./appShellRoutes";
import type { AppShellCallbacks, AppShellState } from "./appShellTypes";
import { isOnline } from "./greet";
import { t } from "./i18n";
import { current, type GpRoute } from "./nav";

export type { AppShellCallbacks, AppShellState } from "./appShellTypes";

let dialogCleanup: (() => void) | undefined;

export function createAppShell(
  root: HTMLElement,
  state: AppShellState,
  callbacks: AppShellCallbacks,
): void {
  const online = isOnline();
  const statusKey = online ? "app.status.online" : "app.status.offline";
  const route = current(state.nav);
  const atHome = route === "home";
  const wideRoute =
    route === "guide" ||
    route === "stats" ||
    route === "forge" ||
    route === "specs" ||
    route === "builds";
  const mainClass = [
    "gp-forge-home",
    wideRoute ? "gp-route-wide" : "",
    route === "guide" ? "gp-route-guide" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const homeChrome = wideRoute
    ? ""
    : `
      <div class="gp-header" data-shell-header>
        <p class="gp-guide-brand">${t("app.title")}</p>
        <div class="gp-header-actions">
          ${
            atHome
              ? `<button type="button" class="gp-settings-btn" data-settings-open aria-label="${t("settings.open")}">${t("settings.open")}</button>`
              : ""
          }
        </div>
      </div>
      <section class="gp-status-card gp-guide-home-card" data-testid="home-status">
        <h1 class="gp-guide-hunter">${t("guide.home_hunter")}</h1>
        <p class="gp-guide-sub">${t("guide.home_sub")}</p>
        <p class="gp-body" data-testid="status">${t(statusKey)}</p>
        <div class="gp-guide-actions">
          <button type="button" class="gp-btn gp-btn-primary" data-solver-open data-testid="home-solver-cta">${t("solver.open")}</button>
          <button type="button" class="gp-btn" data-guide-open data-testid="home-guide-cta">${t("guide.open")}</button>
        </div>
        <p class="gp-settings-hint">${t("guide.home_more")}</p>
        <div class="gp-guide-secondary">
          <button type="button" class="gp-settings-btn" data-stats-open>${t("guide.stats_secondary")}</button>
          <button type="button" class="gp-settings-btn" data-forge-open>${t("forge.open")}</button>
          <button type="button" class="gp-settings-btn" data-specs-open>${t("mvp.specs.open")}</button>
        </div>
      </section>`;

  root.innerHTML = `
    <main class="${mainClass}">
      ${homeChrome}
      <div data-panel-mount></div>
    </main>
  `;

  root.querySelector("[data-solver-open]")?.addEventListener("click", () => {
    toggleOrPush(route, "builds", callbacks);
  });
  root.querySelector("[data-guide-open]")?.addEventListener("click", () => {
    toggleOrPush(route, "guide", callbacks);
  });
  root.querySelector("[data-stats-open]")?.addEventListener("click", () => {
    callbacks.onPushRoute("stats", undefined, "mvp_crit_stack");
  });
  root.querySelector("[data-forge-open]")?.addEventListener("click", () => {
    toggleOrPush(route, "forge", callbacks);
  });
  root.querySelector("[data-specs-open]")?.addEventListener("click", () => {
    toggleOrPush(route, "specs", callbacks);
  });
  root.querySelector("[data-settings-open]")?.addEventListener("click", () => {
    toggleOrPush(route, "settings", callbacks);
  });

  const mount = root.querySelector("[data-panel-mount]");
  if (!mount) return;

  dialogCleanup?.();
  dialogCleanup = undefined;
  mount.innerHTML = "";

  if (state.nav.promptOpen && state.launchPrompt) {
    const promptDialog = createLaunchPromptDialog(state.launchPrompt, (accepted) => {
      callbacks.onLaunchPrompt?.(accepted);
    });
    mount.appendChild(promptDialog);
    return;
  }

  if (atHome && state.showSwUpdatePrompt) {
    mount.appendChild(
      createSwUpdatePrompt(
        () => {
          callbacks.onApplyUpdate?.();
          callbacks.onState({ showSwUpdatePrompt: false, canApplyUpdate: true });
        },
        () => callbacks.onState({ showSwUpdatePrompt: false }),
      ),
    );
  }

  dialogCleanup = mountShellRoute(root, mount, state, route, callbacks);
}

function toggleOrPush(route: GpRoute, target: GpRoute, callbacks: AppShellCallbacks): void {
  if (route === target) callbacks.onPop();
  else callbacks.onPushRoute(target);
}
