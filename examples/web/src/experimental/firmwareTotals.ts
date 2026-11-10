export type FirmwarePieceBonus = {
  count: number;
  target: string;
  value: number;
  label: string;
  tag_only?: boolean;
};

export type FirmwareSet = {
  name: string;
  pieces: FirmwarePieceBonus[];
};

export type FirmwareCatalog = {
  experimental: true;
  sets: Record<string, FirmwareSet>;
};

export type FirmwareLoadoutPiece = { set_id: string; count: number };

export type FirmwareTotalLine = {
  target: string;
  label: string;
  value: number;
  pct: number;
  sources: string[];
};

/** Sum active set bonuses for a loadout (highest unlocked tier per set that count reaches). */
export function sumFirmwareTotals(
  catalog: FirmwareCatalog,
  loadout: FirmwareLoadoutPiece[],
): FirmwareTotalLine[] {
  const byTarget = new Map<string, FirmwareTotalLine>();
  for (const piece of loadout) {
    const set = catalog.sets[piece.set_id];
    if (!set) continue;
    for (const bonus of set.pieces) {
      if (piece.count < bonus.count) continue;
      const existing = byTarget.get(bonus.target);
      if (existing) {
        existing.value += bonus.value;
        existing.pct = Math.round(existing.value * 1000) / 10;
        existing.sources.push(`${set.name} ${bonus.count}pc`);
        existing.label = `${bonus.target}: ${existing.pct >= 0 ? "+" : ""}${existing.pct}%`;
      } else {
        const pct = Math.round(bonus.value * 1000) / 10;
        byTarget.set(bonus.target, {
          target: bonus.target,
          label: bonus.label,
          value: bonus.value,
          pct,
          sources: [`${set.name} ${bonus.count}pc`],
        });
      }
    }
  }
  return [...byTarget.values()].sort((a, b) => a.target.localeCompare(b.target));
}
