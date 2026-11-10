/** Archetype comparison + stack meters — full sources kept visible. */
import type { ArchetypeId } from "../experimental/loadPacks";
import { loadBuildAdapters, loadBuildCore } from "../experimental/loadPacks";
import { computeStackTotals } from "../experimental/stackTotals";
import { t } from "../i18n";
import type { SkillAllocation } from "../skills/types";
import { iconImg } from "./guideCardHtml";
import {
  type AdapterLoadout,
  adapterFor,
  enhancementIdsFromRolls,
  loadoutPieces,
} from "./guideLoadoutExtras";
import { meterRow } from "./guideVisualHtml";

const ARCHES: ArchetypeId[] = ["balanced", "mobbing", "bossing"];

export function archetypeLoadoutChart(
  adapters: ReturnType<typeof loadBuildAdapters>["adapters"],
): string {
  const cards = ARCHES.map((id) => {
    const a = adapters[id];
    const loadout = a.loadout as AdapterLoadout;
    const keySlots = ["grenade", "shield", "repkit", "enhancement"] as const;
    const tiles = keySlots
      .map((slot) => {
        const p = loadout[slot];
        if (!p) return "";
        return `<li class="gp-guide-mini-gear">
          ${iconImg(p.icon_id ?? `slot_${slot}`, p.item_name)}
          <span class="gp-guide-mini-slot">${slot}</span>
          <strong class="gp-rarity-${p.rarity ?? "legendary"}">${p.item_name}</strong>
        </li>`;
      })
      .join("");
    return `<article class="gp-guide-arch-card" data-arch-card="${id}">
      <h3>${t(`guide.arch_${id}`)}</h3>
      <ul class="gp-guide-mini-gear-row">${tiles}</ul>
      <p class="gp-guide-reason">${a.why}</p>
    </article>`;
  }).join("");
  return `
    <section class="gp-guide-section gp-guide-scan" aria-labelledby="guide-swaps-h" data-testid="guide-swap-chart">
      <h2 id="guide-swaps-h">${t("guide.swap_chart")}</h2>
      <p class="gp-guide-scan-lead">${t("guide.swap_chart_help")}</p>
      <div class="gp-guide-arch-cards">${cards}</div>
    </section>`;
}

export function stacksHtml(allocation: SkillAllocation, arch: ArchetypeId): string {
  const core = loadBuildCore();
  const adapter = adapterFor(arch);
  const loadout = adapter.loadout as AdapterLoadout;
  const pieces = loadoutPieces(loadout).map(({ slot, piece }) => ({
    slot,
    item_name: piece.item_name,
    rolls: piece.rolls,
  }));
  const roll = adapter.grenade_roll;
  const stacks = computeStackTotals({
    allocation,
    firmware: core.firmware.pieces,
    includeComGodroll: true,
    gearPieces: pieces,
    enhancementIds: enhancementIdsFromRolls(loadout.enhancement?.rolls),
    grenadeRoll: roll
      ? {
          grenade_id: roll.grenade_id,
          payload: roll.payload,
          payload_augment: roll.payload_augment,
          perk: roll.perk,
          extra_tags: roll.extra_tags ?? [],
        }
      : undefined,
  });
  const maxPct = Math.max(...stacks.buckets.map((b) => Math.abs(b.pct)), 1);
  const meters = stacks.buckets
    .map((b) =>
      meterRow(
        (b.label.split(":")[0] ?? b.target).trim(),
        b.pct,
        maxPct,
        b.sources.slice(0, 6).join(" · ") + (b.sources.length > 6 ? "…" : ""),
      ),
    )
    .join("");
  return `
    <ul class="gp-guide-meter-list" data-testid="guide-stack-totals">${meters}</ul>
    <p class="gp-guide-icon-disclaimer" data-testid="guide-stack-notes">${stacks.notes.join(" ")}</p>`;
}
