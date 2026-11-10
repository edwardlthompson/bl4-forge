import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "../forge/validateSchemas";
import { isLegal, validateAllocation } from "./legality";
import type { HunterDef, SkillAllocation, SkillsCatalog } from "./types";

const catalog = JSON.parse(
  readFileSync(join(REPO_ROOT, "data/fixtures/rules_unlock_hunter.json"), "utf8"),
) as SkillsCatalog;

describe("designer parity vs public unlock rules", () => {
  const rf = catalog.hunters.find((h) => h.id === "rules_fixture") as HunterDef;

  it("rejects illegal sample the UI must grey out", () => {
    const bad: SkillAllocation = {
      hunterId: "rules_fixture",
      ranks: [{ id: "rf_bl0", rank: 1 }],
      actionSkillId: "rf_action",
      augmentIds: ["rf_beta_aug"],
      capstoneId: null,
      pointBudget: 69,
    };
    const codes = validateAllocation(rf, bad).map((i) => i.code);
    expect(codes).toEqual(expect.arrayContaining(["row_locked", "augment_tree"]));
  });

  it("accepts legal sample matching planner fixtures", () => {
    const good: SkillAllocation = {
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
    expect(isLegal(rf, good)).toBe(true);
  });
});
