import type { ComposeInput, ComposeResult } from "../sim/types";
import type { Candidate, SolverRules } from "../solver/types";
import type { ScoreWorkerRequest, ScoreWorkerResponse } from "./score.worker";
import type { SolverWorkerRequest, SolverWorkerResponse } from "./solver.worker";

/** Fallback in-process when Worker is unavailable (tests / SSR). */
export async function scoreViaWorker(input: ComposeInput): Promise<ComposeResult> {
  if (typeof Worker === "undefined") {
    const { composeDamage } = await import("../sim/compose");
    return composeDamage(input);
  }
  const worker = new Worker(new URL("./score.worker.ts", import.meta.url), {
    type: "module",
  });
  return new Promise((resolve, reject) => {
    worker.onmessage = (ev: MessageEvent<ScoreWorkerResponse>) => {
      worker.terminate();
      resolve(ev.data.result);
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };
    const msg: ScoreWorkerRequest = { type: "score", input };
    worker.postMessage(msg);
  });
}

export async function solveViaWorker(
  pool: Candidate[],
  rules: SolverRules,
  opts?: { rngSeed?: number; experimental?: boolean },
): Promise<{ bestId: string | null; rankedIds: string[] }> {
  if (typeof Worker === "undefined") {
    const { solve } = await import("../solver/pipeline");
    const out = solve({
      pool,
      rules,
      rngSeed: opts?.rngSeed,
      experimental: opts?.experimental,
    });
    return { bestId: out.best?.id ?? null, rankedIds: out.ranked.map((c) => c.id) };
  }
  const worker = new Worker(new URL("./solver.worker.ts", import.meta.url), {
    type: "module",
  });
  return new Promise((resolve, reject) => {
    worker.onmessage = (ev: MessageEvent<SolverWorkerResponse>) => {
      worker.terminate();
      resolve({ bestId: ev.data.bestId, rankedIds: ev.data.rankedIds });
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };
    const msg: SolverWorkerRequest = {
      type: "solve",
      pool,
      rules,
      rngSeed: opts?.rngSeed,
      experimental: opts?.experimental,
    };
    worker.postMessage(msg);
  });
}
