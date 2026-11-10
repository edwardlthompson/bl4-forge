import { describe, expect, it } from "vitest";
import { freezeRafaExperimental } from "./freezeRafaBoard";

describe("freezeRafaExperimental", () => {
  it("freezes ranked entries with frontier disclaimer", () => {
    const board = freezeRafaExperimental(5);
    expect(board.entries.length).toBeGreaterThan(0);
    expect(board.disclaimer).toMatch(/not a certified global optimum/i);
    expect(board.solver_version).toMatch(/rafa/);
  });
});
