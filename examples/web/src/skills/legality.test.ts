import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "../forge/validateSchemas";
import { isLegal, validateAllocation } from "./legality";
import type { HunterDef, SkillAllocation, SkillsCatalog } from "./types";

const catalog = JSON.parse(
  readFileSync(join(REPO_ROOT, "data/fixtures/rules_unlock_hunter.json"), "utf8"),
) as SkillsCatalog;

function hunter(id: string): HunterDef {
  const h = catalog.hunters.find((x) => x.id === id);
  if (!h) throw new Error(`missing ${id}`);
  return h;
}

describe("skill legality — public unlock rules", () => {
  const rf = hunter("rules_fixture");

  it("allows common row 0 immediately", () => {
    const alloc: SkillAllocation = {
      hunterId: "rules_fixture",
      ranks: [{ id: "rf_c0a", rank: 5 }],
      actionSkillId: "rf_action",
      augmentIds: [],
      capstoneId: null,
      pointBudget: 69,
    };
    expect(isLegal(rf, alloc)).toBe(true);
  });

  it("blocks common row 1 until 5 prior common points", () => {
    const locked: SkillAllocation = {
      hunterId: "rules_fixture",
      ranks: [{ id: "rf_c1a", rank: 1 }],
      actionSkillId: null,
      augmentIds: [],
      capstoneId: null,
      pointBudget: 69,
    };
    expect(validateAllocation(rf, locked).some((i) => i.code === "row_locked")).toBe(true);

    const unlocked: SkillAllocation = {
      ...locked,
      ranks: [
        { id: "rf_c0a", rank: 5 },
        { id: "rf_c1a", rank: 1 },
      ],
    };
    expect(isLegal(rf, unlocked)).toBe(true);
  });

  it("blocks branches until 15 common points", () => {
    const alloc: SkillAllocation = {
      hunterId: "rules_fixture",
      ranks: [
        { id: "rf_c0a", rank: 5 },
        { id: "rf_c1a", rank: 5 },
        { id: "rf_c2a", rank: 4 },
        { id: "rf_bl0", rank: 1 },
      ],
      actionSkillId: null,
      augmentIds: [],
      capstoneId: null,
      pointBudget: 69,
    };
    expect(validateAllocation(rf, alloc).some((i) => i.code === "row_locked")).toBe(true);

    const ok: SkillAllocation = {
      ...alloc,
      ranks: [
        { id: "rf_c0a", rank: 5 },
        { id: "rf_c1a", rank: 5 },
        { id: "rf_c2a", rank: 5 },
        { id: "rf_bl0", rank: 1 },
      ],
    };
    expect(isLegal(rf, ok)).toBe(true);
  });

  it("rejects augment from wrong tree", () => {
    const alloc: SkillAllocation = {
      hunterId: "rules_fixture",
      ranks: [],
      actionSkillId: "rf_action",
      augmentIds: ["rf_beta_aug"],
      capstoneId: null,
      pointBudget: 69,
    };
    expect(validateAllocation(rf, alloc).some((i) => i.code === "augment_tree")).toBe(true);
  });

  it("allows matching augment + capstone", () => {
    const alloc: SkillAllocation = {
      hunterId: "rules_fixture",
      ranks: [
        { id: "rf_c0a", rank: 5 },
        { id: "rf_c1a", rank: 5 },
        { id: "rf_c2a", rank: 5 },
        { id: "rf_bl0", rank: 5 },
        { id: "rf_bl1", rank: 5 },
      ],
      actionSkillId: "rf_action",
      augmentIds: ["rf_augment"],
      capstoneId: "rf_capstone",
      pointBudget: 69,
    };
    expect(isLegal(rf, alloc)).toBe(true);
  });

  it("C4SH: no capstones; Devil's Tines adds augment slot", () => {
    const c4 = hunter("c4sh_fixture");
    const withCap: SkillAllocation = {
      hunterId: "c4sh_fixture",
      ranks: [],
      actionSkillId: "c4_action",
      augmentIds: [],
      capstoneId: "rf_capstone",
      pointBudget: 69,
    };
    expect(validateAllocation(c4, withCap).some((i) => i.code === "no_capstones")).toBe(true);

    const twoAugNoTines: SkillAllocation = {
      hunterId: "c4sh_fixture",
      ranks: [],
      actionSkillId: "c4_action",
      augmentIds: ["c4_aug1", "c4_aug2"],
      capstoneId: null,
      pointBudget: 69,
    };
    expect(validateAllocation(c4, twoAugNoTines).some((i) => i.code === "augment_slots")).toBe(
      true,
    );

    const twoAugWithTines: SkillAllocation = {
      ...twoAugNoTines,
      ranks: [{ id: "c4_tines_a", rank: 1 }],
    };
    expect(isLegal(c4, twoAugWithTines)).toBe(true);
  });
});
