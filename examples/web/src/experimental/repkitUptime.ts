/** Action-skill uptime math for repkit × Now With Caffeine (25% max-CD removed per use). */

export const CAFFEINE_CDR_FRACTION = 0.25;

/** Representative Peacebreaker cycle (seconds). Duration ≈ Overdrive window; CD after end. */
export const DEFAULT_PEACEBREAKER_DURATION_S = 20;
export const DEFAULT_PEACEBREAKER_COOLDOWN_S = 40;

export type RepkitCandidate = {
  id: string;
  search_name: string;
  charges: number;
  /** Heart Pump-style: P(recover a charge) on kill. */
  charge_return_on_kill?: number;
  farm_boss: string;
};

export type RepkitUptimeRow = {
  id: string;
  search_name: string;
  charges: number;
  remainingCdFraction: number;
  uptime: number;
  cycleS: number;
  dumpsToClearCd: number;
};

/** Remaining cooldown fraction after dumping all charges under Caffeine. */
export function remainingCdFraction(charges: number, cdrPerUse = CAFFEINE_CDR_FRACTION): number {
  return Math.max(0, 1 - charges * cdrPerUse);
}

/** Action-skill uptime = duration / (duration + cooldown × remainingFraction). */
export function actionSkillUptime(
  durationS: number,
  cooldownS: number,
  charges: number,
  cdrPerUse = CAFFEINE_CDR_FRACTION,
): number {
  const rem = remainingCdFraction(charges, cdrPerUse);
  const cycle = durationS + cooldownS * rem;
  return cycle > 0 ? durationS / cycle : 0;
}

export function rankRepkits(
  kits: RepkitCandidate[],
  durationS = DEFAULT_PEACEBREAKER_DURATION_S,
  cooldownS = DEFAULT_PEACEBREAKER_COOLDOWN_S,
): RepkitUptimeRow[] {
  return kits
    .map((k) => {
      const rem = remainingCdFraction(k.charges);
      const uptime = actionSkillUptime(durationS, cooldownS, k.charges);
      return {
        id: k.id,
        search_name: k.search_name,
        charges: k.charges,
        remainingCdFraction: rem,
        uptime,
        cycleS: durationS + cooldownS * rem,
        dumpsToClearCd: Math.ceil(1 / CAFFEINE_CDR_FRACTION),
      };
    })
    .sort((a, b) => b.uptime - a.uptime || b.charges - a.charges);
}

/** Built-in legendary repkit set from drops (charges from unique identity). */
export const LEGENDARY_REPKITS: RepkitCandidate[] = [
  {
    id: "ord_repair_kit.comp_05_legendary_TripleBypass",
    search_name: "TripleBypass",
    charges: 3,
    charge_return_on_kill: 0.3,
    farm_boss: "Backhive",
  },
  {
    id: "ted_repair_kit.comp_05_legendary_KillSpring",
    search_name: "KillSpring",
    charges: 1,
    farm_boss: "Axemaul",
  },
  {
    id: "dad_repair_kit.comp_05_legendary_Pacemaker",
    search_name: "Pacemaker",
    charges: 1,
    farm_boss: "Horace",
  },
  {
    id: "jak_repair_kit.comp_05_legendary_Defibrillator",
    search_name: "Defibrillator",
    charges: 1,
    farm_boss: "Core Observer",
  },
  {
    id: "vla_repair_kit.comp_05_legendary_AdrenalinePUmp",
    search_name: "AdrenalinePUmp",
    charges: 1,
    farm_boss: "Shatterlands Guardian",
  },
  {
    id: "tor_repair_kit.comp_05_legendary_ShinyWarPaint",
    search_name: "ShinyWarPaint",
    charges: 1,
    farm_boss: "Jockey",
  },
];
