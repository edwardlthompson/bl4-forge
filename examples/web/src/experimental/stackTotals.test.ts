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

  it("folds gear pieces + Mixologist into gun/splash stacks", () => {
    const guide = loadRafaPeacebreakerGuide();
    const core = loadBuildCore();
    const totals = computeStackTotals({
      allocation: guide.allocation,
      firmware: core.firmware.pieces,
      includeComGodroll: true,
      enhancementIds: ["maliwan_mixologist", "maliwan_transfuser"],
      gearPieces: [
        { slot: "weapon_1", item_name: "PlasmaCoil" },
        { slot: "grenade", item_name: "Waterfall" },
        { slot: "shield", item_name: "firewerks" },
        { slot: "repkit", item_name: "TripleBypass", rolls: "Accelerator" },
      ],
    });
    const gun = totals.buckets.find((b) => b.target === "gun_damage");
    expect(gun?.pct).toBeGreaterThanOrEqual(45); // COM 35 + Mixologist 10 + PlasmaCoil 5
    expect(totals.notes.some((n) => /Loadout gear counted/i.test(n))).toBe(true);
    expect(totals.notes.some((n) => /Accelerator/i.test(n))).toBe(true);
  });
});
