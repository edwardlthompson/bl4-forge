/** Experimental flat stack contributions from named gear pieces (not card_match). */
import type { SimEffect } from "../sim/types";

export type GearPieceInput = {
  slot: string;
  item_name: string;
  rolls?: string;
};

/** Known additive card-ish bonuses by search name (case-insensitive). */
const BY_NAME: Record<string, SimEffect[]> = {
  waterfall: [{ op: "add", target: "splash_radius", value: 0.1, label: "Waterfall Nuke radius" }],
  firepot: [{ op: "add", target: "ordnance_damage", value: 0.1, label: "Firepot sticky ordnance" }],
  firewerks: [
    { op: "add", target: "splash_damage", value: 0.08, label: "Firewerk on-kill missiles" },
  ],
  firewerk: [
    { op: "add", target: "splash_damage", value: 0.08, label: "Firewerk on-kill missiles" },
  ],
  plasmacoil: [{ op: "add", target: "gun_damage", value: 0.05, label: "PlasmaCoil base" }],
  kickballer: [{ op: "add", target: "splash_damage", value: 0.05, label: "Kickballer splash" }],
  kaleidosplode: [
    { op: "add", target: "splash_damage", value: 0.08, label: "Kaleidosplode pack splash" },
  ],
  anarchy: [{ op: "add", target: "gun_damage", value: 0.05, label: "Anarchy gun damage" }],
  lucian: [{ op: "add", target: "crit_damage", value: 0.05, label: "Lucian crit bias" }],
  heavyturret: [{ op: "add", target: "gun_damage", value: 0.04, label: "HeavyTurret sustain" }],
  rocketreload: [{ op: "add", target: "gun_damage", value: 0.06, label: "RocketReload burst" }],
  kaoson: [{ op: "add", target: "splash_damage", value: 0.05, label: "KaoSon splash" }],
};

/** Amp secondary is burst, not a sustained additive % — recorded as note only via rolls text. */
export function effectsForGearPieces(pieces: GearPieceInput[]): {
  effects: SimEffect[];
  notes: string[];
} {
  const effects: SimEffect[] = [];
  const notes: string[] = [];
  for (const p of pieces) {
    const key = p.item_name.trim().toLowerCase().replace(/\s+/g, "");
    const matched = BY_NAME[key] ?? BY_NAME[p.item_name.toLowerCase()];
    if (matched) {
      for (const e of matched) {
        effects.push({ ...e, label: `${p.slot}: ${e.label ?? p.item_name}` });
      }
    } else if (!/legendary shield|artifact|toile|maliwan dual/i.test(p.item_name)) {
      notes.push(`${p.slot} “${p.item_name}” has no flat stack row yet (tag/proc only).`);
    }
    if (p.rolls && /amp/i.test(p.rolls)) {
      notes.push("Repkit Amp: +200% next shot × charges — burst, not additive stack %.");
    }
    if (p.rolls && /accelerator/i.test(p.rolls)) {
      notes.push("Repkit Accelerator: +50% AS cooldown rate 8s — uptime, not gun %.");
    }
  }
  return { effects, notes };
}
