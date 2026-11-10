import { loadRafaPeacebreakerGuide } from "../../guide/loadGuide";
import type { SkillAllocation } from "../../skills/types";
import { godRollSeedFromParts } from "../partsPool";
import { defaultAbilityWeaponIds, type ScoredBuild, scoreRafaLoadout } from "../scoreCandidate";
import type { Candidate } from "../types";

const WATERFALL = "vla_grenade_gadget.comp_05_legendary_Waterfall";
const FIREWERKS = "tor_shield.comp_05_legendary_firewerks";
const FIREPOT = "tor_grenade_gadget.comp_05_legendary_firepot";
const PEACEBREAKER_ID = "seed_peacebreaker";

function cloneAlloc(a: SkillAllocation): SkillAllocation {
  return {
    ...a,
    ranks: a.ranks.map((r) => ({ ...r })),
    augmentIds: [...a.augmentIds],
  };
}

/** Swap Confeti ↔ Sitiar when present — skill neighbor. */
function augmentSwap(alloc: SkillAllocation): SkillAllocation | null {
  const next = cloneAlloc(alloc);
  const i = next.augmentIds.indexOf("pb_aug_confeti");
  if (i >= 0) {
    next.augmentIds[i] = "pb_aug_sitiar";
    return next;
  }
  const j = next.augmentIds.indexOf("pb_aug_sitiar");
  if (j >= 0) {
    next.augmentIds[j] = "pb_aug_confeti";
    return next;
  }
  return null;
}

/** Build scored Rafa pool: Peacebreaker seed + ability weapons × shield/grenade swaps. */
export function buildRafaPool(): {
  scored: ScoredBuild[];
  pool: Candidate[];
  peacebreakerId: string;
} {
  const guide = loadRafaPeacebreakerGuide();
  const alloc = guide.allocation;
  const weapons = defaultAbilityWeaponIds();
  const scored: ScoredBuild[] = [];

  // Curated Peacebreaker seed (Waterfall + high-cap shield stand-in via Firewerks off)
  scored.push(
    scoreRafaLoadout(
      PEACEBREAKER_ID,
      alloc,
      weapons[0] ?? "MAL_SM.comp_05_legendary_PlasmaCoil",
      FIREWERKS,
      WATERFALL,
    ),
  );

  let n = 0;
  for (const w of weapons) {
    for (const shield of [FIREWERKS, "shield_generic"]) {
      for (const grenade of [WATERFALL, FIREPOT]) {
        const id = `rafa_${n++}_${w.split(".").pop()}_${grenade.includes("firepot") ? "fp" : "wf"}`;
        const shieldId = shield === "shield_generic" ? FIREWERKS : shield;
        scored.push(scoreRafaLoadout(id, alloc, w, shieldId, grenade));
      }
    }
  }

  const swapped = augmentSwap(alloc);
  if (swapped) {
    scored.push(
      scoreRafaLoadout(
        "rafa_aug_swap",
        swapped,
        "MAL_SM.comp_05_legendary_PlasmaCoil",
        FIREWERKS,
        WATERFALL,
      ),
    );
  }

  const gr = godRollSeedFromParts("max", "godroll_parts");
  const pool = [...scored.map((s) => s.candidate), gr];
  return { scored, pool, peacebreakerId: PEACEBREAKER_ID };
}

export function rafaNeighbors(scoredById: Map<string, ScoredBuild>): (c: Candidate) => Candidate[] {
  const weapons = defaultAbilityWeaponIds();
  return (c: Candidate) => {
    const base = scoredById.get(c.id);
    if (!base) return [];
    const out: Candidate[] = [];
    for (const w of weapons.slice(0, 6)) {
      if (w === base.weaponId) continue;
      const id = `${c.id}__w_${w.split(".").pop()}`;
      if (scoredById.has(id)) {
        out.push(scoredById.get(id)!.candidate);
        continue;
      }
      const s = scoreRafaLoadout(id, base.allocation, w, base.shieldId, base.grenadeId);
      scoredById.set(id, s);
      out.push(s.candidate);
    }
    const otherGrenade = base.grenadeId === WATERFALL ? FIREPOT : WATERFALL;
    const gid = `${c.id}__g`;
    if (!scoredById.has(gid)) {
      const s = scoreRafaLoadout(gid, base.allocation, base.weaponId, base.shieldId, otherGrenade);
      scoredById.set(gid, s);
    }
    out.push(scoredById.get(gid)!.candidate);
    return out;
  };
}

export { FIREPOT, FIREWERKS, PEACEBREAKER_ID, WATERFALL };
