import weaponCatalogJson from "./weapon_catalog.json";

export type WeaponCatalogEntry = {
  id: string;
  search_name: string;
  slot?: string;
  behavior_tags: string[];
  ability_flags: string[];
  synergy_keys: string[];
  roll_slots?: string[];
};

export type WeaponCatalogPack = {
  experimental: true;
  obtainable: string;
  rolls: string;
  default_roll_slots: string[];
  mfg_extra_slots: Record<string, string[]>;
  weapons: WeaponCatalogEntry[];
};

export function loadWeaponCatalog(): WeaponCatalogPack {
  const pack = weaponCatalogJson as WeaponCatalogPack;
  if (pack.experimental !== true) throw new Error("weapon_catalog must be experimental");
  return pack;
}

export function abilityWeapons(pack = loadWeaponCatalog()): WeaponCatalogEntry[] {
  return pack.weapons.filter((w) => (w.ability_flags?.length ?? 0) > 0);
}
