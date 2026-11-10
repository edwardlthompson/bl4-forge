import type { Candidate } from "../solver/types";

export type OwnedItem = { id: string; synergyKeys: string[] };

/** Closest owned candidate by shared synergy-key overlap. */
export function closestOwned(
  target: Candidate,
  owned: OwnedItem[],
): { id: string; overlap: number } | null {
  let best: { id: string; overlap: number } | null = null;
  const keys = new Set(target.synergyKeys);
  for (const o of owned) {
    const overlap = o.synergyKeys.filter((k) => keys.has(k)).length;
    if (!best || overlap > best.overlap) best = { id: o.id, overlap };
  }
  return best;
}

export function importInventoryJson(raw: string): OwnedItem[] {
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) throw new Error("inventory must be an array");
  return data.map((row) => {
    const r = row as OwnedItem;
    if (!r?.id) throw new Error("inventory row missing id");
    return { id: String(r.id), synergyKeys: [...(r.synergyKeys ?? [])] };
  });
}
