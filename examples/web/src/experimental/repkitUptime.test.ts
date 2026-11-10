import { describe, expect, it } from "vitest";
import {
  actionSkillUptime,
  LEGENDARY_REPKITS,
  rankRepkits,
  remainingCdFraction,
} from "./repkitUptime";

describe("repkitUptime", () => {
  it("3×25% caffeine dump leaves 25% CD; 1 charge leaves 75%", () => {
    expect(remainingCdFraction(3)).toBeCloseTo(0.25);
    expect(remainingCdFraction(1)).toBeCloseTo(0.75);
    expect(remainingCdFraction(4)).toBe(0);
  });

  it("ranks TripleBypass highest for Peacebreaker cycle", () => {
    const ranked = rankRepkits(LEGENDARY_REPKITS, 20, 40);
    expect(ranked[0]!.search_name).toBe("TripleBypass");
    // D=20, C=40 → no dump 33%; 1ch 40%; 3ch 66.7%
    expect(actionSkillUptime(20, 40, 0)).toBeCloseTo(20 / 60);
    expect(actionSkillUptime(20, 40, 1)).toBeCloseTo(20 / 50);
    expect(actionSkillUptime(20, 40, 3)).toBeCloseTo(20 / 30);
    expect(ranked[0]!.uptime).toBeGreaterThan(ranked[1]!.uptime);
  });
});
