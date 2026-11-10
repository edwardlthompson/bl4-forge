import { describe, expect, it } from "vitest";
import { loadRafaPeacebreakerGuide } from "../guide";
import { loadBuildCore } from "./loadPacks";
import { computeStackTotals } from "./stackTotals";

describe("computeStackTotals", () => {
  it("sums splash radius from firmware and splash damage from COM", () => {
    const guide = loadRafaPeacebreakerGuide();
    const core = loadBuildCore();
    const totals = computeStackTotals({
      allocation: guide.allocation,
      firmware: core.firmware.pieces,
      includeComGodroll: true,
    });
    const splash = totals.buckets.find((b) => b.target === "splash_damage");
    const radius = totals.buckets.find((b) => b.target === "splash_radius");
    expect(splash?.pct).toBeGreaterThanOrEqual(46);
    expect(radius?.pct).toBeGreaterThanOrEqual(40);
    expect(totals.buckets.length).toBeGreaterThan(2);
  });
});
