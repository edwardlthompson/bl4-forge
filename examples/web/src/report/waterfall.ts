import type { ComposeResult } from "../sim/types";

/** Contribution waterfall sorted by |effective| descending. */
export function contributionWaterfall(result: ComposeResult) {
  return [...result.contributions].sort((a, b) => Math.abs(b.effective) - Math.abs(a.effective));
}
