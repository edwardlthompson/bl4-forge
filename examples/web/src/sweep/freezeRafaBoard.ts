import { solveRafa } from "../solver/solveRafa";
import { freezeBoard } from "./freeze";

/** Freeze experimental Rafa balanced board from a local solve. */
export function freezeRafaExperimental(seed = 42) {
  const out = solveRafa(seed);
  const entries = out.ranked.slice(0, 10);
  return freezeBoard(entries, {
    patch: "experimental",
    game_build: "26007962",
    solver_version: out.solverVersion,
    scenario_hash: "mobbing+bossing-maximin",
  });
}
