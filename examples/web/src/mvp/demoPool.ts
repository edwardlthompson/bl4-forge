import type { Candidate } from "../solver/types";
import type { SpecAllocation } from "../specializations";
import type { BuildPiece } from "./composeBuild";

/** Deterministic demo candidates for experimental MVP preview. */
export function demoCandidates(): Candidate[] {
  return [
    {
      id: "mvp_crit_stack",
      score: 12,
      mobScore: 11,
      bossScore: 13,
      obtainable: "unverified",
      gate: "base",
      legal: true,
      prereqsMet: true,
      skills: ["in_the_zone", "overkill"],
      gear: ["demo_ar", "demo_shield"],
      synergyKeys: ["crit", "ads", "gun_damage"],
    },
    {
      id: "mvp_status_ordnance",
      score: 10,
      mobScore: 12,
      bossScore: 9,
      obtainable: "probable",
      gate: "base",
      legal: true,
      prereqsMet: true,
      skills: ["contamination", "tripwire"],
      gear: ["demo_nade", "demo_ar"],
      synergyKeys: ["status", "ordnance", "dot"],
    },
    {
      id: "mvp_melee_runner",
      score: 9,
      mobScore: 10,
      bossScore: 8,
      obtainable: "unverified",
      gate: "base",
      legal: true,
      prereqsMet: true,
      skills: ["bear_arms", "groundbreaker"],
      gear: ["demo_melee_mod"],
      synergyKeys: ["melee", "kinetic"],
    },
  ];
}

export function demoPiecesFor(candidateId: string): BuildPiece[] {
  const shared: BuildPiece[] = [
    {
      id: "demo_ar",
      slot: "weapon",
      label: "Demo Assault Rifle",
      synergyKeys: ["gun_damage", "crit"],
      effects: [
        { op: "mul", target: "gun_damage", value: 1.2, cond: { type: "always" } },
        { op: "mul", target: "crit_damage", value: 1.15, cond: { type: "on_crit" } },
      ],
    },
    {
      id: "demo_shield",
      slot: "shield",
      label: "Demo Shield",
      synergyKeys: ["survivability"],
      effects: [{ op: "add", target: "max_shield", value: 0.2, cond: { type: "always" } }],
    },
  ];
  if (candidateId === "mvp_status_ordnance") {
    return [
      ...shared,
      {
        id: "demo_nade",
        slot: "grenade",
        label: "Demo Ordnance",
        synergyKeys: ["ordnance", "status"],
        effects: [
          { op: "mul", target: "ordnance_damage", value: 1.25, cond: { type: "on_ordnance_hit" } },
          { op: "mul", target: "status_damage", value: 1.1, cond: { type: "on_crit" } },
        ],
      },
    ];
  }
  if (candidateId === "mvp_melee_runner") {
    return [
      {
        id: "demo_melee_mod",
        slot: "class_mod",
        label: "Demo Melee Class Mod",
        synergyKeys: ["melee"],
        effects: [{ op: "mul", target: "melee_damage", value: 1.3, cond: { type: "on_melee" } }],
      },
    ];
  }
  return shared;
}

export function demoSpecsFor(candidateId: string): SpecAllocation {
  if (candidateId === "mvp_status_ordnance") {
    return {
      nodePoints: { survivor: 10, brute: 10, gadgeteer: 20, killer: 10 },
      equipped: ["tripwire", "fragmentation_payload", "contamination", "lead_or_alive"],
    };
  }
  if (candidateId === "mvp_melee_runner") {
    return {
      nodePoints: { runner: 20, sharpshooter: 10, daredevil: 10 },
      equipped: ["bear_arms", "groundbreaker", "bullet_train", "now_with_caffeine"],
    };
  }
  return {
    nodePoints: { brute: 10, sharpshooter: 20, killer: 20 },
    equipped: ["in_the_zone", "one_shot_one_kill", "overkill", "riddle_you_this"],
  };
}
