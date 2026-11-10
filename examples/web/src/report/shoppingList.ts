import { loadItemCatalog } from "../items/catalog";

/** Build farm route lines from gear ids (boss stub until map join). */
export function farmRouteFromGear(gearIds: string[]): string[] {
  const cat = loadItemCatalog();
  const lines: string[] = [];
  for (const id of gearIds) {
    const item = cat.items.find((i) => i.id === id);
    if (!item) {
      lines.push(`${id} — farm unknown`);
      continue;
    }
    const search =
      item.synergy_keys.find((k) => k === k && !k.includes(":") && k.length > 2) ?? item.name;
    const boss = item.drop?.boss ?? "unknown";
    const loc = item.drop?.location;
    if (loc) {
      lines.push(
        `Search “${search}” — ${boss} @ ${loc} (has_location=${item.has_location ? "true" : "stub"})`,
      );
    } else {
      lines.push(`Search “${search}” — dedicated boss ${boss} (map pending; world-drop backup)`);
    }
  }
  return lines;
}
