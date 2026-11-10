import { t } from "../i18n";
import {
  getSpecCatalog,
  type SpecAllocation,
  socketCount,
  totalPoints,
  validateSpecAllocation,
} from "../specializations";

export type SpecPlannerCallbacks = { onClose: () => void };

/** Specialization tree: node points + up to 4 equipped passives. */
export function createSpecPlannerPanel(callbacks: SpecPlannerCallbacks): HTMLElement {
  const root = document.createElement("section");
  root.className = "gp-panel gp-spec-planner";
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", t("mvp.specs.title"));
  const catalog = getSpecCatalog();
  let alloc: SpecAllocation = {
    nodePoints: { survivor: 10, brute: 10, sharpshooter: 10 },
    equipped: [],
  };

  const render = () => {
    const issues = validateSpecAllocation(catalog, alloc);
    const sockets = socketCount(catalog, alloc);
    const skills = catalog.nodes.flatMap((n) =>
      n.skills.map((s) => ({
        ...s,
        nodeId: n.id,
        locked: (alloc.nodePoints[n.id] ?? 0) < s.unlock_points,
      })),
    );
    root.innerHTML = `
      <header class="gp-panel-header">
        <h2>${t("mvp.specs.title")}</h2>
        <button type="button" class="gp-btn" data-close>${t("nav.back")}</button>
      </header>
      <p class="gp-body">${t("mvp.specs.help")} (${totalPoints(alloc)} pts · ${sockets} sockets)</p>
      <fieldset class="gp-field"><legend>${t("mvp.specs.nodes")}</legend>
        ${catalog.nodes
          .map(
            (n) =>
              `<label>${n.display_name ?? n.id} (${n.kind})
                <input type="number" min="0" max="40" value="${alloc.nodePoints[n.id] ?? 0}" data-node="${n.id}"/></label>`,
          )
          .join("")}
      </fieldset>
      <fieldset class="gp-field"><legend>${t("mvp.specs.equip")}</legend>
        ${skills
          .slice(0, 21)
          .map((s) => {
            const checked = alloc.equipped.includes(s.id);
            return `<label class="${s.locked ? "gp-locked" : ""}">
              <input type="checkbox" data-eq="${s.id}" ${checked ? "checked" : ""} ${s.locked ? "disabled" : ""}/>
              ${s.id} <span class="gp-settings-hint">${s.proc ?? ""}</span></label>`;
          })
          .join("")}
      </fieldset>
      <p class="gp-body" role="status">${
        issues.length ? `${t("mvp.specs.illegal")}: ${issues[0]?.message}` : t("mvp.specs.legal")
      }</p>
    `;
    root.querySelector("[data-close]")?.addEventListener("click", () => callbacks.onClose());
    for (const input of root.querySelectorAll<HTMLInputElement>("[data-node]")) {
      input.addEventListener("change", () => {
        alloc = {
          ...alloc,
          nodePoints: { ...alloc.nodePoints, [input.dataset.node!]: Number(input.value) || 0 },
        };
        render();
      });
    }
    for (const box of root.querySelectorAll<HTMLInputElement>("[data-eq]")) {
      box.addEventListener("change", () => {
        const id = box.dataset.eq!;
        const set = new Set(alloc.equipped);
        if (box.checked) set.add(id);
        else set.delete(id);
        alloc = { ...alloc, equipped: [...set] };
        render();
      });
    }
  };
  render();
  return root;
}
