/** Solver candidate and pipeline types. */

export type Obtainable = "confirmed" | "probable" | "unverified" | "cut" | "dev_only";

export type Candidate = {
  id: string;
  score: number;
  mobScore: number;
  bossScore: number;
  obtainable: Obtainable;
  gate: string;
  legal: boolean;
  prereqsMet: boolean;
  skills: string[];
  gear: string[];
  synergyKeys: string[];
};

export type SolverRules = {
  beam_width: number;
  anneal_iterations: number;
  timeout_ms: number;
  balanced: { strategy: "maximin"; mob_floor: number; boss_floor: number };
  obtainable_for_published: Obtainable[];
  obtainable_for_experimental: Obtainable[];
};

export type ScorePair = { mob: number; boss: number };

export type SubstituteResult = {
  from: Candidate;
  to: Candidate;
  delta: number;
};
