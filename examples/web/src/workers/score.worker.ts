/// <reference lib="webworker" />
import { composeDamage } from "../sim/compose";
import type { ComposeInput, ComposeResult } from "../sim/types";

export type ScoreWorkerRequest = { type: "score"; input: ComposeInput };
export type ScoreWorkerResponse = { type: "score-result"; result: ComposeResult };

self.onmessage = (ev: MessageEvent<ScoreWorkerRequest>) => {
  const msg = ev.data;
  if (msg.type !== "score") return;
  const result = composeDamage(msg.input);
  const res: ScoreWorkerResponse = { type: "score-result", result };
  self.postMessage(res);
};
