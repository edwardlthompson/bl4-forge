/** Parse BL4 NCS legendary item ids and humanize search titles. */

export type WeaponTypeCode = "PS" | "SG" | "SM" | "AR" | "SR" | "HW";

export type MfgCode = "JAK" | "MAL" | "VLA" | "TOR" | "TED" | "ORD" | "DAD" | "BOR";

export type ParsedItemId = {
  mfg: string;
  type: string;
  rarityTier: number | null;
  rarity: "legendary" | "unknown";
  title: string;
  blackMarket: boolean;
};

const MFG_DISPLAY: Record<string, string> = {
  JAK: "Jakobs",
  MAL: "Maliwan",
  VLA: "Vladof",
  TOR: "Torgue",
  TED: "Tediore",
  ORD: "Order",
  DAD: "Daedalus",
  BOR: "BOR/Ripper (pending locres)",
};

const TYPE_TO_WEAPON: Record<string, string> = {
  PS: "pistol",
  SG: "shotgun",
  SM: "smg",
  AR: "assault_rifle",
  SR: "sniper",
  HW: "heavy",
};

const GEAR_TO_SLOT: Record<string, string> = {
  PS: "weapon",
  SG: "weapon",
  SM: "weapon",
  AR: "weapon",
  SR: "weapon",
  HW: "weapon",
  SHIELD: "shield",
  GRENADE_GADGET: "grenade",
};

const LEGENDARY_RE =
  /^([A-Za-z0-9]+)_([A-Za-z0-9]+)\.comp_(\d+)_(legendary|epic|rare|uncommon|common|pearl)_(.+)$/i;
const BLACK_MARKET_RE = /^([A-Za-z0-9]+)_([A-Za-z0-9]+)\.comp_blackmarket$/i;

/** Parse NCS item_id into manufacturer, type, rarity tier, and title. */
export function parseItemId(itemId: string): ParsedItemId {
  const bm = BLACK_MARKET_RE.exec(itemId);
  if (bm) {
    return {
      mfg: bm[1]!.toUpperCase(),
      type: bm[2]!.toUpperCase(),
      rarityTier: null,
      rarity: "legendary",
      title: "DiscJockey",
      blackMarket: true,
    };
  }
  const m = LEGENDARY_RE.exec(itemId);
  if (m) {
    const rarityWord = m[4]!.toLowerCase();
    return {
      mfg: m[1]!.toUpperCase(),
      type: m[2]!.toUpperCase(),
      rarityTier: Number(m[3]),
      rarity: rarityWord === "legendary" ? "legendary" : "unknown",
      title: m[5]!,
      blackMarket: false,
    };
  }
  // Non-weapon: vla_grenade_gadget.comp_05_legendary_Waterfall
  const dot = itemId.indexOf(".comp_");
  if (dot > 0) {
    const prefix = itemId.slice(0, dot);
    const rest = itemId.slice(dot + ".comp_".length);
    const mfg = prefix.split("_")[0]!.toUpperCase();
    const titleM = /(?:legendary|epic|rare)_(.+)$/i.exec(rest);
    return {
      mfg,
      type: prefix.toUpperCase(),
      rarityTier: null,
      rarity: "legendary",
      title: titleM?.[1] ?? rest,
      blackMarket: false,
    };
  }
  throw new Error(`unrecognized item_id: ${itemId}`);
}

/** Humanize CamelCase / snake titles for UI (keep exact item_name for search). */
export function humanizeTitle(title: string): string {
  const spaced = title
    .replace(/_/g, " ")
    // Split only on lower/digit → Upper (keeps TKsWave → TKs Wave, not T Ks Wave)
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  return spaced
    .split(" ")
    .map((w) => (w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export function manufacturerDisplay(mfg: string): string {
  return MFG_DISPLAY[mfg.toUpperCase()] ?? mfg;
}

export function weaponTypeFromCode(type: string): string | undefined {
  return TYPE_TO_WEAPON[type.toUpperCase()];
}

export function slotFromGearType(gearType: string): string {
  return GEAR_TO_SLOT[gearType.toUpperCase()] ?? "weapon";
}
