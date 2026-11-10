import partsSlim from "../items/parts_bound_slim.json";
import type { BoundPart } from "./godroll";
import { enumerateGodRolls, godRollCandidate } from "./godroll";
import type { Candidate } from "./types";

type SlimPart = {
  name: string;
  attributes?: Array<{
    target: string;
    op: "add" | "mul" | "set" | "flag";
    min: number;
    max: number;
    median: number;
  }>;
};

/** Approximate manufacturer/type pools until per-legendary legality exists. */
export function boundPartsForPool(filter?: { nameIncludes?: string[] }): BoundPart[] {
  const parts = (partsSlim as { parts: SlimPart[] }).parts;
  const out: BoundPart[] = [];
  for (const p of parts) {
    if (!p.attributes?.length) continue;
    if (filter?.nameIncludes?.length) {
      const hit = filter.nameIncludes.some((n) => p.name.toLowerCase().includes(n.toLowerCase()));
      if (!hit) continue;
    }
    out.push({ name: p.name, attributes: p.attributes });
  }
  return out;
}

/** Farm-free god-roll seed from approximate part pool. */
export function godRollSeedFromParts(
  mode: "max" | "min" = "max",
  id = "godroll_approx",
): Candidate {
  const parts = boundPartsForPool();
  const picks = enumerateGodRolls(parts, mode);
  const c = godRollCandidate(picks, id);
  c.obtainable = "unverified";
  c.synergyKeys = [...c.synergyKeys, "rolls:approximate"];
  return c;
}
