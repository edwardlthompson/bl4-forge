import { describe, expect, it } from "vitest";
import { formatSkillSpendOrder, loadRafaPeacebreakerGuide } from "./loadGuide";
import { validateGuide } from "./validateGuide";

describe("Rafa build guide", () => {
  const guide = loadRafaPeacebreakerGuide();

  it("names Rafa and Peacebreaker at 69 pts", () => {
    expect(guide.hunter_display_name).toBe("Rafa");
    expect(guide.action_skill_name).toMatch(/Peacebreaker/i);
    expect(guide.point_budget).toBe(69);
    expect(guide.action_tree).toBe("remote_agent");
    expect(guide.skill_spend_order).toHaveLength(69);
    expect(guide.skill_spend_order[0]?.display_name).toBe("Deadline");
    expect(guide.skill_spend_order.some((s) => s.skill_id === "yg_booming_business")).toBe(true);
    expect(guide.skill_spend_order.some((s) => s.skill_id === "yg_el_paraguas")).toBe(true);
    expect(guide.skill_spend_order.every((s) => s.reason.length > 0)).toBe(true);
  });

  it("passes skill + specialization legality and action-tree lock", () => {
    expect(validateGuide(guide)).toEqual([]);
  });

  it("formats a stable spend-order copy blob", () => {
    const text = formatSkillSpendOrder(guide);
    expect(text).toContain("Rafa — Peacebreaker Cannons");
    expect(text).toContain("1. [L2] Deadline");
    expect(text).toContain("Equip: A Honed Mind");
    expect(text).toMatch(/Replace Sitiar/);
  });

  it("lists repkit desired rolls and multi-tree summary", () => {
    expect(guide.gear.some((g) => g.slot === "repkit" && g.priorities.length > 0)).toBe(true);
    const total = guide.tree_summary.reduce((n, t) => n + t.points, 0);
    expect(total).toBe(69);
  });
});
