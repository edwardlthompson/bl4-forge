import catalogJson from "./catalog.json";

export type ForgeItem = {
  id: string;
  name: string;
  slot: string;
  rarity: string;
  manufacturer?: string;
  weapon_type?: string;
  tag_only: boolean;
  synergy_keys: string[];
  obtainable: string;
  has_location: boolean;
  drop?: { boss?: string; location?: string; rate_band?: string };
  effects: unknown[];
  unparsed: boolean;
  game_build: string;
};

export type ItemCatalog = {
  version: number;
  weapon_count: number;
  item_count: number;
  items: ForgeItem[];
};

export function loadItemCatalog(): ItemCatalog {
  const pack = catalogJson as ItemCatalog;
  if ((pack.weapon_count ?? 0) < 87) {
    throw new Error(`item catalog weapon_count ${pack.weapon_count} < 87`);
  }
  return pack;
}

export function weaponsFromCatalog(catalog = loadItemCatalog()): ForgeItem[] {
  return catalog.items.filter((i) => i.slot === "weapon");
}
