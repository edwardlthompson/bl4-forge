import { describe, expect, it } from "vitest";
import { type FirmwareCatalog, sumFirmwareTotals } from "./firmwareTotals";

const catalog: FirmwareCatalog = {
  experimental: true,
  sets: {
    airstrike: {
      name: "Airstrike",
      pieces: [
        { count: 1, target: "splash_radius", value: 0.2, label: "Radius +20%" },
        { count: 2, target: "splash_damage", value: 0.2, label: "Splash +20%" },
      ],
    },
    get_throwin: {
      name: "Get Throwin",
      pieces: [
        { count: 1, target: "ordnance_damage", value: 0.1, label: "Ordnance +10%" },
        { count: 2, target: "splash_radius", value: 0.2, label: "Radius +20%" },
      ],
    },
  },
};

describe("firmwareTotals", () => {
  it("sums 2× Airstrike + 2× Get Throwin radius to +40%", () => {
    const lines = sumFirmwareTotals(catalog, [
      { set_id: "airstrike", count: 2 },
      { set_id: "get_throwin", count: 2 },
    ]);
    const radius = lines.find((l) => l.target === "splash_radius");
    expect(radius?.pct).toBe(40);
    expect(lines.find((l) => l.target === "splash_damage")?.pct).toBe(20);
    expect(lines.find((l) => l.target === "ordnance_damage")?.pct).toBe(10);
  });
});
