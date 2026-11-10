import { describe, expect, it } from "vitest";
import { EXPERIMENTAL_BOARD_DISCLAIMER, PUBLISHED_BOARD_BLOCKED } from "./leaderboardCopy";

describe("leaderboardCopy", () => {
  it("states frontier not certified and published blocked", () => {
    expect(EXPERIMENTAL_BOARD_DISCLAIMER).toMatch(/not a certified global optimum/i);
    expect(PUBLISHED_BOARD_BLOCKED).toMatch(/HUMAN/i);
  });
});
