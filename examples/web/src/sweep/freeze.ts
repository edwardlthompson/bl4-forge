import type { Candidate } from "../solver/types";

export type BoardFreeze = {
  patch: string;
  game_build: string;
  solver_version: string;
  scenario_hash: string;
  frozen_at: string;
  disclaimer: string;
  entries: Candidate[];
};

export function freezeBoard(
  entries: Candidate[],
  meta: {
    patch: string;
    game_build: string;
    solver_version: string;
    scenario_hash: string;
    frozen_at?: string;
  },
): BoardFreeze {
  return {
    ...meta,
    frozen_at: meta.frozen_at ?? new Date().toISOString(),
    disclaimer: "Frontier of a sweep, not a certified global optimum. Skill axis is approximate.",
    entries,
  };
}
