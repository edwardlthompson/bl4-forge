import type { StatRange, VarianceBand } from "./types";

/**
 * Emit a variance band from stat_range. damage_median is the point estimate
 * relative to the composed damage at the median base.
 */
export function varianceBand(
  composedAtMedian: number,
  medianBase: number,
  range: StatRange,
): VarianceBand {
  const median = typeof range.damage_median === "number" ? range.damage_median : medianBase;
  const pair = range.damage;
  if (!pair || pair.length !== 2) {
    return { low: composedAtMedian, high: composedAtMedian, median };
  }
  const [lowBase, highBase] = pair;
  const scale = medianBase === 0 ? 0 : composedAtMedian / medianBase;
  return {
    low: lowBase * scale,
    high: highBase * scale,
    median,
  };
}
