/** Interleave skill spend with augment/capstone beats for the horizontal board. */
import type { BuildGuide, GuideBoardRow, GuideLoadoutEvent } from "./types";

function loadoutLabel(ev: GuideLoadoutEvent): {
  label: string;
  reason: string;
  icon_id?: string;
  noteOnly?: boolean;
} {
  if (ev.replace) {
    return {
      label: `Replace ${ev.replace.from} → ${ev.replace.to}`,
      reason: ev.why ?? ev.replace.why ?? "Augment swap",
      icon_id: "pb_aug_confeti",
    };
  }
  if (ev.equip?.augment) {
    return {
      label: `Equip augment: ${ev.equip.augment}`,
      reason: ev.why ?? "Peacebreaker augment",
      icon_id: ev.equip.augment.toLowerCase().includes("confeti")
        ? "pb_aug_confeti"
        : "pb_aug_sitiar",
    };
  }
  if (ev.equip?.capstone) {
    return {
      label: `Equip capstone: ${ev.equip.capstone}`,
      reason: ev.why ?? "Capstone",
      icon_id: "pb_cap_beam_team",
    };
  }
  return {
    label: ev.note ?? `L${ev.at_level}`,
    reason: ev.why ?? "",
    noteOnly: true,
  };
}

/** Skill points with loadout events inserted when their level is reached. */
export function skillBoardRows(guide: BuildGuide): GuideBoardRow[] {
  const events = [...(guide.loadout_timeline ?? [])].sort((a, b) => a.at_level - b.at_level);
  const used = new Set<number>();
  const rows: GuideBoardRow[] = [];
  for (const step of guide.skill_spend_order) {
    rows.push({ kind: "skill", step });
    for (let i = 0; i < events.length; i++) {
      if (used.has(i)) continue;
      const ev = events[i];
      if (ev.at_level <= step.level) {
        used.add(i);
        const meta = loadoutLabel(ev);
        rows.push({
          kind: "loadout",
          at_level: ev.at_level,
          label: meta.label,
          reason: meta.reason,
          icon_id: meta.icon_id,
          noteOnly: meta.noteOnly,
        });
      }
    }
  }
  for (let i = 0; i < events.length; i++) {
    if (used.has(i)) continue;
    const ev = events[i];
    const meta = loadoutLabel(ev);
    rows.push({
      kind: "loadout",
      at_level: ev.at_level,
      label: meta.label,
      reason: meta.reason,
      icon_id: meta.icon_id,
      noteOnly: meta.noteOnly,
    });
  }
  return rows;
}
