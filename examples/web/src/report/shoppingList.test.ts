import { describe, expect, it } from "vitest";
import { farmRouteFromGear } from "./shoppingList";

describe("shoppingList", () => {
  it("lists PlasmaCoil farm with search name", () => {
    const lines = farmRouteFromGear(["MAL_SM.comp_05_legendary_PlasmaCoil"]);
    expect(lines[0]).toMatch(/PlasmaCoil|Plasma Coil/);
    expect(lines[0]).toMatch(/Timekeeper/i);
  });

  it("handles unknown gear id", () => {
    expect(farmRouteFromGear(["nope"])[0]).toMatch(/unknown/i);
  });
});
