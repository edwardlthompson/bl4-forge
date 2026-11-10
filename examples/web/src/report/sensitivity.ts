import type { Candidate } from "../solver/types";

/** Which assumption flip changes rank-1 at threshold. */
export function sensitivityFlip(
  best: Candidate,
  runnerUp: Candidate,
  axis: "mob" | "boss",
): { axis: "mob" | "boss"; threshold: number | null } {
  const b = axis === "mob" ? best.mobScore : best.bossScore;
  const r = axis === "mob" ? runnerUp.mobScore : runnerUp.bossScore;
  if (b <= 0) return { axis, threshold: null };
  // Scale needed so runnerUp.min path beats best when that axis is scaled.
  const threshold = r / b;
  return { axis, threshold: Number.isFinite(threshold) ? threshold : null };
}
