/// <reference lib="webworker" />
import { solve } from "../solver/pipeline";
import type { Candidate, SolverRules } from "../solver/types";

export type SolverWorkerRequest = {
  type: "solve";
  pool: Candidate[];
  rules: SolverRules;
  rngSeed?: number;
  experimental?: boolean;
};

export type SolverWorkerResponse = {
  type: "solve-result";
  bestId: string | null;
  rankedIds: string[];
};

self.onmessage = (ev: MessageEvent<SolverWorkerRequest>) => {
  const msg = ev.data;
  if (msg.type !== "solve") return;
  const out = solve({
    pool: msg.pool,
    rules: msg.rules,
    rngSeed: msg.rngSeed,
    experimental: msg.experimental,
  });
  const res: SolverWorkerResponse = {
    type: "solve-result",
    bestId: out.best?.id ?? null,
    rankedIds: out.ranked.map((c) => c.id),
  };
  self.postMessage(res);
};
