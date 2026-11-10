import { describe, expect, it } from "vitest";
import { buildRafaPool, rafaNeighbors } from "./rafaFactory";

describe("rafaFactory", () => {
  it("builds pool with Peacebreaker and ability weapons", () => {
    const { scored, pool, peacebreakerId } = buildRafaPool();
    expect(scored.some((s) => s.candidate.id === peacebreakerId)).toBe(true);
    expect(pool.length).toBeGreaterThan(10);
    expect(scored.some((s) => s.weaponId.includes("PlasmaCoil"))).toBe(true);
  });

  it("neighbors swap weapon and grenade", () => {
    const { scored } = buildRafaPool();
    const map = new Map(scored.map((s) => [s.candidate.id, s]));
    const seed = scored.find((s) => s.candidate.id === "seed_peacebreaker")!;
    const neighbors = rafaNeighbors(map)(seed.candidate);
    expect(neighbors.length).toBeGreaterThan(0);
    expect(neighbors.some((n) => n.gear[2] !== seed.grenadeId || n.gear[0] !== seed.weaponId)).toBe(
      true,
    );
  });
});
