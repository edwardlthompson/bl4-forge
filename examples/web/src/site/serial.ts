/** Clean-room serial paste helpers (format tokens only — not a full decoder). */

export type SerialSlot = "weapon1" | "weapon2" | "weapon3" | "weapon4";

const SLOT_ORDER: SerialSlot[] = ["weapon1", "weapon2", "weapon3", "weapon4"];

export function splitSerialPaste(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function mapSerialsToSlots(serials: string[]): Record<SerialSlot, string | null> {
  const out: Record<SerialSlot, string | null> = {
    weapon1: null,
    weapon2: null,
    weapon3: null,
    weapon4: null,
  };
  serials.forEach((s, i) => {
    const slot = SLOT_ORDER[i];
    if (slot) out[slot] = s;
  });
  return out;
}

export function verifySerialTokens(serials: string[]): {
  matches: string[];
  misses: string[];
} {
  const matches: string[] = [];
  const misses: string[] = [];
  for (const s of serials) {
    // Provisional: non-empty alphanumeric / @ / - tokens count as structured.
    if (/^[A-Za-z0-9@_\-+.]{8,}$/.test(s)) matches.push(s);
    else misses.push(s);
  }
  return { matches, misses };
}
