import { onSaveCrashesChanged } from "../crash-capture/pendingCrash";
import { getSaveCrashes, setSaveCrashes } from "../feedback/saveCrashes";
import { t } from "../i18n";
import { applySettingsBundle, parseSettings, snapshotSettings } from "../settings/export";
import { applySettingsThemeMode, getSettingsThemeMode } from "../settings/preferences";
import { applySettingsSearch } from "../settings/search";
import { splitSerialPaste, verifySerialTokens } from "../site/serial";
import type { ThemeMode } from "../theme";

export type SettingsPanelCallbacks = {
  onClose: () => void;
  onOpenAbout?: () => void;
};

export function createSettingsPanel(callbacks: SettingsPanelCallbacks): HTMLElement {
  const panel = document.createElement("section");
  panel.className = "gp-settings-panel";
  panel.setAttribute("aria-label", t("settings.title"));
  panel.dataset.testid = "settings-panel";

  const themeMode = getSettingsThemeMode();

  panel.innerHTML = `
    <header class="gp-settings-header">
      <h2>${t("settings.title")}</h2>
      <button type="button" class="gp-settings-close" aria-label="${t("settings.close")}">×</button>
    </header>
    <label class="gp-settings-search">
      <input type="search" data-settings-search data-testid="settings-search" aria-label="${t("settings.search")}" placeholder="${t("settings.search")}" />
    </label>
    <p hidden class="gp-settings-search-empty" data-settings-search-empty data-testid="settings-search-empty">${t("settings.search.empty")}</p>
    <section class="gp-settings-group" data-settings-haystack="${t("settings.section.appearance")} ${t("settings.theme.label")} ${t("settings.theme.mode.system")} ${t("settings.theme.mode.light")} ${t("settings.theme.mode.dark")}">
      <h3>${t("settings.section.appearance")}</h3>
      <label class="gp-settings-row">
        <span>${t("settings.theme.label")}</span>
        <select data-settings-theme>
          <option value="system">${t("settings.theme.mode.system")}</option>
          <option value="light">${t("settings.theme.mode.light")}</option>
          <option value="dark">${t("settings.theme.mode.dark")}</option>
        </select>
      </label>
    </section>
    <section class="gp-settings-group" data-settings-haystack="${t("settings.section.privacy")} ${t("settings.feedback.save_crashes")}">
      <h3>${t("settings.section.privacy")}</h3>
      <label class="gp-settings-row">
        <span>${t("settings.feedback.save_crashes")}</span>
        <input type="checkbox" data-save-crashes />
      </label>
    </section>
    <section class="gp-settings-group" data-settings-haystack="${t("settings.section.data")} ${t("settings.export")} ${t("settings.import")} ${t("mvp.serial.label")} ${t("mvp.share.label")}">
      <h3>${t("settings.section.data")}</h3>
      <label class="gp-settings-row">
        <span>${t("mvp.serial.label")}</span>
        <textarea data-serial-paste rows="3" aria-label="${t("mvp.serial.label")}" placeholder="${t("mvp.serial.placeholder")}"></textarea>
      </label>
      <p class="gp-settings-hint" data-serial-status role="status">${t("mvp.serial.empty")}</p>
      <div class="gp-settings-row gp-settings-actions">
        <button type="button" data-serial-check>${t("mvp.serial.check")}</button>
        <button type="button" data-share-md>${t("mvp.share.copy")}</button>
        <button type="button" data-settings-export>${t("settings.export")}</button>
        <button type="button" data-settings-import>${t("settings.import")}</button>
        <input type="file" accept="application/json" hidden data-settings-import-file />
      </div>
    </section>
    <section class="gp-settings-group" data-settings-haystack="${t("settings.section.about")} ${t("settings.about")} ${t("settings.about_hint")}">
      <h3>${t("settings.section.about")}</h3>
      <button type="button" class="gp-settings-nav" data-settings-about>
        <span>${t("settings.about")}</span>
        <span class="gp-settings-hint">${t("settings.about_hint")}</span>
      </button>
    </section>
  `;

  const themeSelect = panel.querySelector<HTMLSelectElement>("[data-settings-theme]");
  if (themeSelect) {
    themeSelect.value = themeMode;
    themeSelect.addEventListener("change", () => {
      applySettingsThemeMode(themeSelect.value as ThemeMode);
    });
  }

  const save = panel.querySelector<HTMLInputElement>("[data-save-crashes]");
  if (save) {
    save.checked = getSaveCrashes();
    save.addEventListener("change", () => {
      setSaveCrashes(save.checked);
      onSaveCrashesChanged(save.checked);
    });
  }

  const search = panel.querySelector<HTMLInputElement>("[data-settings-search]");
  const empty = panel.querySelector<HTMLElement>("[data-settings-search-empty]");
  const groups = panel.querySelectorAll<HTMLElement>("[data-settings-haystack]");
  search?.addEventListener("input", () => {
    applySettingsSearch(search.value, groups, empty);
  });
  panel.querySelector(".gp-settings-close")?.addEventListener("click", callbacks.onClose);
  panel.querySelector("[data-settings-about]")?.addEventListener("click", () => {
    callbacks.onOpenAbout?.();
  });

  const fileInput = panel.querySelector<HTMLInputElement>("[data-settings-import-file]");
  panel.querySelector("[data-settings-export]")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(snapshotSettings(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "golden-path-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  });
  panel.querySelector("[data-settings-import]")?.addEventListener("click", () => {
    fileInput?.click();
  });
  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    void file.text().then((raw) => {
      const bundle = parseSettings(raw);
      if (bundle) applySettingsBundle(bundle);
    });
  });

  const serialStatus = panel.querySelector<HTMLElement>("[data-serial-status]");
  panel.querySelector("[data-serial-check]")?.addEventListener("click", () => {
    const raw = panel.querySelector<HTMLTextAreaElement>("[data-serial-paste]")?.value ?? "";
    const parts = splitSerialPaste(raw);
    if (!parts.length) {
      if (serialStatus) serialStatus.textContent = t("mvp.serial.empty");
      return;
    }
    const verified = verifySerialTokens(parts);
    if (serialStatus) {
      serialStatus.textContent = t("mvp.serial.result").replace(
        "{n}",
        String(verified.matches.length),
      );
    }
  });
  panel.querySelector("[data-share-md]")?.addEventListener("click", () => {
    const md = `# BL4 Forge MVP\n\n${t("mvp.share.body")}\n`;
    void navigator.clipboard?.writeText(md);
    if (serialStatus) serialStatus.textContent = t("mvp.share.copied");
  });
  return panel;
}
