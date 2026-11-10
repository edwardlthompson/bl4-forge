import { describe, expect, it } from "vitest";
import { PEACEBREAKER_ID, solveRafa } from "./solveRafa";

describe("solveRafa", () => {
  it("is deterministic for fixed seed and includes Peacebreaker", () => {
    const a = solveRafa(7);
    const b = solveRafa(7);
    expect(a.best?.id).toBe(b.best?.id);
    expect(a.scored.has(PEACEBREAKER_ID)).toBe(true);
    expect(a.best).toBeTruthy();
    expect(a.experimental).toBe(true);
  });

  it("scores mob and boss differently for some candidates", () => {
    const out = solveRafa(3);
    const varied = [...out.scored.values()].some((s) => Math.abs(s.mobDps - s.bossDps) > 1e-6);
    expect(varied).toBe(true);
  });

  it("pool can pick ability weapons like PlasmaCoil / HeavyTurret", () => {
    const out = solveRafa(1);
    const gears = [...out.scored.values()].flatMap((s) => s.candidate.gear);
    expect(gears.some((g) => g.includes("PlasmaCoil"))).toBe(true);
    expect(gears.some((g) => g.includes("HeavyTurret"))).toBe(true);
  });
});
