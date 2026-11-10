export type OwnershipToggles = {
  dlc: string[];
  events: string[];
  farmFree: boolean;
};

export function ownedGatesFromToggles(t: OwnershipToggles): string[] {
  const gates = ["base", ...t.dlc.map((d) => `dlc:${d}`), ...t.events.map((e) => `event:${e}`)];
  return gates;
}

export function applyFarmFree<T extends { dropChance?: number }>(
  items: T[],
  farmFree: boolean,
): T[] {
  if (!farmFree) return items;
  return items.filter((i) => (i.dropChance ?? 1) >= 1);
}
