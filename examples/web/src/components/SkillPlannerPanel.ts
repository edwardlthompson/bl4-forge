import { t } from "../i18n";
import { encodeSkillPermalink } from "../site/permalink";
import { validateAllocation } from "../skills/legality";
import type { HunterDef, SkillAllocation } from "../skills/types";

export type SkillPlannerCallbacks = {
  onClose: () => void;
  onAllocChange?: (alloc: SkillAllocation) => void;
};

function emptyAlloc(hunterId: string): SkillAllocation {
  return {
    hunterId,
    ranks: [],
    actionSkillId: null,
    augmentIds: [],
    capstoneId: null,
    pointBudget: 69,
  };
}

/** Vault hunter skill planner with live legality validation. */
export function createSkillPlannerPanel(
  hunters: HunterDef[],
  initial: SkillAllocation | null,
  callbacks: SkillPlannerCallbacks,
): HTMLElement {
  const root = document.createElement("section");
  root.className = "gp-panel gp-skill-planner";
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", t("forge.planner.title"));

  let hunter = hunters[0] ?? null;
  let alloc: SkillAllocation = initial ?? emptyAlloc(hunter?.id ?? "none");

  const render = () => {
    if (!hunter) {
      root.innerHTML = `<p class="gp-body">${t("forge.planner.empty")}</p>`;
      return;
    }
    const actions = hunter.skills.filter((s) => s.kind === "action");
    const passives = hunter.skills.filter((s) => s.kind === "passive").slice(0, 24);
    const augments = hunter.skills.filter((s) => s.kind === "augment");
    const capstones = hunter.skills.filter((s) => s.kind === "capstone");
    const issues = validateAllocation(hunter, alloc);
    const legal = issues.length === 0;

    root.innerHTML = `
      <header class="gp-panel-header">
        <h2>${t("forge.planner.title")}</h2>
        <button type="button" class="gp-btn" data-close aria-label="${t("nav.back")}">${t("nav.back")}</button>
      </header>
      <label class="gp-field">
        <span>${t("forge.planner.hunter")}</span>
        <select data-hunter>
          ${hunters.map((h) => `<option value="${h.id}" ${h.id === hunter!.id ? "selected" : ""}>${h.display_name ?? h.id}</option>`).join("")}
        </select>
      </label>
      <fieldset class="gp-field">
        <legend>${t("forge.planner.action")}</legend>
        ${actions
          .map(
            (a) =>
              `<label><input type="radio" name="action" value="${a.id}" ${alloc.actionSkillId === a.id ? "checked" : ""}/> ${a.effect_text || a.id}</label>`,
          )
          .join("")}
      </fieldset>
      <fieldset class="gp-field">
        <legend>${t("forge.planner.passives")}</legend>
        ${passives
          .map((p) => {
            const rank = alloc.ranks.find((r) => r.id === p.id)?.rank ?? 0;
            const locked = issues.some((i) => i.skillId === p.id && i.code === "row_locked");
            return `<label class="${locked ? "gp-locked" : ""}" title="${locked ? t("forge.planner.locked") : ""}">
              <input type="number" min="0" max="${p.max_rank}" value="${rank}" data-rank="${p.id}" ${locked && rank === 0 ? "disabled" : ""}/>
              ${p.id}</label>`;
          })
          .join("")}
      </fieldset>
      <fieldset class="gp-field">
        <legend>${t("forge.planner.augment")}</legend>
        ${augments
          .slice(0, 8)
          .map(
            (a) =>
              `<label><input type="checkbox" data-aug="${a.id}" ${alloc.augmentIds.includes(a.id) ? "checked" : ""}/> ${a.id}</label>`,
          )
          .join("")}
      </fieldset>
      ${
        hunter.no_capstones
          ? `<p class="gp-body">${t("forge.planner.no_capstones")}</p>`
          : `<fieldset class="gp-field"><legend>${t("forge.planner.capstone")}</legend>${capstones
              .slice(0, 6)
              .map(
                (c) =>
                  `<label><input type="radio" name="cap" value="${c.id}" ${alloc.capstoneId === c.id ? "checked" : ""}/> ${c.id}</label>`,
              )
              .join("")}</fieldset>`
      }
      <p class="gp-body" data-legal data-testid="forge-legal" role="status">${
        legal
          ? t("forge.planner.legal")
          : `${t("forge.planner.illegal")}: ${issues[0]?.message ?? ""}`
      }</p>
      <p class="gp-body" data-permalink>${encodeSkillPermalink(alloc)}</p>
    `;

    root.querySelector("[data-close]")?.addEventListener("click", () => callbacks.onClose());
    root.querySelector("[data-hunter]")?.addEventListener("change", (ev) => {
      const id = (ev.target as HTMLSelectElement).value;
      hunter = hunters.find((h) => h.id === id) ?? hunter;
      alloc = emptyAlloc(hunter!.id);
      callbacks.onAllocChange?.(alloc);
      render();
    });
    for (const radio of root.querySelectorAll<HTMLInputElement>('input[name="action"]')) {
      radio.addEventListener("change", () => {
        alloc = { ...alloc, actionSkillId: radio.value };
        callbacks.onAllocChange?.(alloc);
        render();
      });
    }
    for (const input of root.querySelectorAll<HTMLInputElement>("[data-rank]")) {
      input.addEventListener("change", () => {
        const id = input.dataset.rank!;
        const rank = Number(input.value) || 0;
        const ranks = alloc.ranks.filter((r) => r.id !== id);
        if (rank > 0) ranks.push({ id, rank });
        alloc = { ...alloc, ranks };
        callbacks.onAllocChange?.(alloc);
        render();
      });
    }
    for (const box of root.querySelectorAll<HTMLInputElement>("[data-aug]")) {
      box.addEventListener("change", () => {
        const id = box.dataset.aug!;
        const set = new Set(alloc.augmentIds);
        if (box.checked) set.add(id);
        else set.delete(id);
        alloc = { ...alloc, augmentIds: [...set] };
        callbacks.onAllocChange?.(alloc);
        render();
      });
    }
    for (const radio of root.querySelectorAll<HTMLInputElement>('input[name="cap"]')) {
      radio.addEventListener("change", () => {
        alloc = { ...alloc, capstoneId: radio.value };
        callbacks.onAllocChange?.(alloc);
        render();
      });
    }
  };

  render();
  return root;
}
