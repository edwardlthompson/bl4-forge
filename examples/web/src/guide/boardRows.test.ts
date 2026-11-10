import { describe, expect, it } from "vitest";
import { skillBoardRows } from "./boardRows";
import { loadRafaPeacebreakerGuide } from "./loadGuide";

describe("skillBoardRows", () => {
  it("inserts augment/capstone beats into the skill stream", () => {
    const rows = skillBoardRows(loadRafaPeacebreakerGuide());
    expect(rows.some((r) => r.kind === "skill")).toBe(true);
    expect(rows.some((r) => r.kind === "loadout" && /Sitiar|Confeti|Beam/i.test(r.label))).toBe(
      true,
    );
  });
});
