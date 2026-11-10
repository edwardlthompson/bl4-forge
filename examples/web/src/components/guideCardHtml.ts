import { iconCandidates } from "../guide";
import { loadRafaSkillEffects } from "../experimental/loadPacks";
import { cumulativeStatLines, type RankedEffectDef } from "../skills/effects";

export function iconImg(id: string, alt: string): string {
  const { primary, fallback, tertiary, quaternary } = iconCandidates(id);
  return `<img class="gp-guide-icon" src="${primary}" alt="${alt}" width="44" height="44" loading="lazy" data-s1="${fallback}" data-s2="${tertiary}" data-s3="${quaternary}" onerror="const n=+this.dataset.n||0;this.dataset.n=String(n+1);if(n===0)this.src=this.dataset.s1;else if(n===1)this.src=this.dataset.s2;else if(n===2){this.src=this.dataset.s3;this.onerror=null;}else this.onerror=null;"/>`;
}

export function specCard(s: {
  kind?: string;
  display_name: string;
  reason?: string;
  note?: string;
  socket?: number;
  to?: number;
}): string {
  const isEquip = s.kind === "equip" || s.kind === "replace";
  const meta = s.socket ? `S${s.socket}` : s.to ? `→${s.to}` : "";
  return `<li class="gp-guide-spec-pill ${isEquip ? "gp-guide-spec-equip" : ""}">
    <span class="gp-guide-spec-name">${s.display_name}</span>
    ${meta ? `<span class="gp-guide-spec-meta">${meta}</span>` : ""}
    <span class="gp-guide-spec-why">${s.reason ?? s.note ?? ""}</span>
  </li>`;
}

export function formatLines(skillId: string, toRank: number): string {
  const pack = loadRafaSkillEffects();
  const entry = pack.skills[skillId];
  if (!entry?.effects?.length) return "";
  return cumulativeStatLines(entry.effects as RankedEffectDef[], toRank)
    .map((l) => {
      const sign = l.pct >= 0 ? "+" : "";
      const dSign = l.delta >= 0 ? "+" : "";
      return `<span class="gp-guide-stat">${l.label} ${sign}${l.pct}% <em>Δ ${dSign}${l.delta}%</em></span>`;
    })
    .join(" ");
}

export function spendCard(
  titleClass: string,
  displayName: string,
  rankOrEmpty: string,
  levelOrEmpty: string,
  statsHtml: string,
  reason: string,
  iconHtml: string,
): string {
  return `<li class="gp-guide-card">
    ${iconHtml}
    <div class="gp-guide-card-body">
      <div class="gp-guide-card-title">
        <strong class="${titleClass}">${displayName}</strong>
        ${rankOrEmpty ? `<span class="gp-guide-rank">${rankOrEmpty}</span>` : ""}
        ${levelOrEmpty ? `<span class="gp-guide-levels">${levelOrEmpty}</span>` : ""}
      </div>
      ${statsHtml}
      <p class="gp-guide-reason">${reason}</p>
    </div>
  </li>`;
}
