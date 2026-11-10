import rafaGuide from "./fixture.json";
import type { BuildGuide } from "./types";

/** Load the Rafa Peacebreaker leveling guide (fail closed if empty). */
export function loadRafaPeacebreakerGuide(): BuildGuide {
  const g = rafaGuide as BuildGuide;
  if (!g?.hunter_display_name || !g.skill_spend_order?.length) {
    throw new Error("Rafa build guide fixture missing or empty");
  }
  return g;
}

export function formatSkillSpendOrder(guide: BuildGuide): string {
  const lines = [
    `${guide.hunter_display_name} — ${guide.action_skill_name}`,
    `Budget ${guide.point_budget}/${guide.point_budget} · L${guide.level_cap ?? "?"} · ${guide.archetype ?? "Build"}`,
    `Action tree: ${guide.action_tree}`,
    "",
    "Skill spend order:",
  ];
  for (const s of guide.skill_spend_order) {
    lines.push(
      `${s.step}. [L${s.level}] ${s.display_name} → ${s.to_rank} (${s.tree}) — ${s.reason}`,
    );
  }
  if (guide.loadout_timeline?.length) {
    lines.push("", "Augment / Capstone timeline:");
    for (const ev of guide.loadout_timeline) {
      if (ev.replace) {
        lines.push(
          `L${ev.at_level}: Replace ${ev.replace.from} → ${ev.replace.to}${ev.why || ev.replace.why ? ` — ${ev.why ?? ev.replace.why}` : ""}`,
        );
      } else if (ev.equip?.augment) {
        lines.push(
          `L${ev.at_level}: Equip augment ${ev.equip.augment}${ev.why ? ` — ${ev.why}` : ""}`,
        );
      } else if (ev.equip?.capstone) {
        lines.push(
          `L${ev.at_level}: Equip capstone ${ev.equip.capstone}${ev.why ? ` — ${ev.why}` : ""}`,
        );
      } else if (ev.note) {
        lines.push(`L${ev.at_level}: ${ev.note}`);
      }
    }
  }
  lines.push("", "Specialization spend order:");
  for (const s of guide.spec.spend_order) {
    const why = s.reason ?? s.note;
    lines.push(`${s.step}. ${s.display_name}${why ? ` — ${why}` : ""}`);
  }
  return lines.join("\n");
}
