import { APP_VERSION } from "./about/aboutSession";
import type { AppShellCallbacks, AppShellState } from "./appShellTypes";
import { createAboutPanel } from "./components/AboutPanel";
import { createBuildGuidePanel } from "./components/BuildGuidePanel";
import { createBuildStatsPanel } from "./components/BuildStatsPanel";
import { createFeedbackPanel } from "./components/FeedbackPanel";
import { createSettingsPanel } from "./components/SettingsPanel";
import { createSkillPlannerPanel } from "./components/SkillPlannerPanel";
import { createSolverPanel } from "./components/SolverPanel";
import { createSpecPlannerPanel } from "./components/SpecPlannerPanel";
import { applyPanelScroll, type GpRoute } from "./nav";
import { bindPanelDialog } from "./panelDialog";
import { getPlannerHunters } from "./skills/catalog";

function finish(
  root: HTMLElement,
  mount: Element,
  state: AppShellState,
  panel: HTMLElement,
  onClose: () => void,
): () => void {
  mount.appendChild(panel);
  const cleanup = bindPanelDialog(panel, onClose);
  applyPanelScroll(root, state.nav);
  return cleanup;
}

/** Mount route panels into the shell mount node; returns dialog cleanup. */
export function mountShellRoute(
  root: HTMLElement,
  mount: Element,
  state: AppShellState,
  route: GpRoute,
  callbacks: AppShellCallbacks,
): (() => void) | undefined {
  if (route === "feedback") {
    return finish(
      root,
      mount,
      state,
      createFeedbackPanel(state.nav.feedbackKind ?? "bug", {
        onClose: callbacks.onPop,
        releaseRepo: state.releaseRepo ?? "",
        description: state.feedbackPrefill,
      }),
      callbacks.onPop,
    );
  }
  if (route === "settings") {
    return finish(
      root,
      mount,
      state,
      createSettingsPanel({
        onClose: callbacks.onPop,
        onOpenAbout: () => callbacks.onPushRoute("about"),
      }),
      callbacks.onPop,
    );
  }
  if (route === "forge") {
    return finish(
      root,
      mount,
      state,
      createSkillPlannerPanel(getPlannerHunters(), null, { onClose: callbacks.onPop }),
      callbacks.onPop,
    );
  }
  if (route === "builds") {
    return finish(
      root,
      mount,
      state,
      createSolverPanel({
        onClose: callbacks.onPop,
        onOpenGuide: () => callbacks.onPushRoute("guide"),
      }),
      callbacks.onPop,
    );
  }
  if (route === "guide") {
    return finish(
      root,
      mount,
      state,
      createBuildGuidePanel({
        onClose: callbacks.onPop,
        onOpenStats: () => callbacks.onPushRoute("stats", undefined, "mvp_crit_stack"),
      }),
      callbacks.onPop,
    );
  }
  if (route === "stats") {
    const id = state.nav.buildId ?? "mvp_crit_stack";
    return finish(
      root,
      mount,
      state,
      createBuildStatsPanel(id, { onClose: callbacks.onPop }),
      callbacks.onPop,
    );
  }
  if (route === "specs") {
    return finish(
      root,
      mount,
      state,
      createSpecPlannerPanel({ onClose: callbacks.onPop }),
      callbacks.onPop,
    );
  }
  if (route !== "about") return undefined;
  mount.appendChild(
    createAboutPanel(
      {
        version: APP_VERSION,
        updateStatus: state.updateStatus,
        donations: state.donations,
        canApplyUpdate: state.canApplyUpdate ?? callbacks.canApplyUpdate,
      },
      callbacks.onPop,
      callbacks.onApplyUpdate,
      () => callbacks.onPushRoute("feedback", "bug"),
      () => callbacks.onPushRoute("feedback", "feature"),
    ),
  );
  const aboutPanel = mount.lastElementChild as HTMLElement;
  const cleanup = bindPanelDialog(aboutPanel, callbacks.onPop);
  applyPanelScroll(root, state.nav);
  return cleanup;
}
