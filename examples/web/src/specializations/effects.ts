import type { CondType, SimEffect } from "../sim/types";
import type { SpecAllocation, SpecCatalog, SpecEffectBundle } from "./types";

/** Map public proc labels → sim CondType used by uptime tables. */
const PROC_COND: Record<string, CondType> = {
  always: "always",
  on_ffyl: "while_shield_down",
  while_healthy: "always",
  on_melee_taken: "on_melee",
  on_gun_hit: "on_crit",
  ads: "ads",
  on_overkill: "on_kill",
  on_melee: "on_melee",
  while_moving: "while_moving",
  on_action_skill: "always",
  on_ordnance_hit: "on_ordnance_hit",
  on_status: "on_crit",
  on_crit: "on_crit",
};

/** Provisional numeric effects for equipped specialization skills (MVP / manual). */
const SKILL_EFFECTS: Record<string, SimEffect[]> = {
  sturdy_stuff: [
    { op: "add", target: "ffyl_duration", value: 0.15, cond: { type: "while_shield_down" } },
  ],
  bullets_are_scared_of_me: [
    { op: "mul", target: "damage_taken", value: 0.92, cond: { type: "always" } },
  ],
  the_best_defense: [{ op: "mul", target: "gun_damage", value: 1.08, cond: { type: "always" } }],
  lead_or_alive: [
    { op: "flag", target: "reload_on_ffyl", value: 1, cond: { type: "while_shield_down" } },
  ],
  cqc: [{ op: "mul", target: "fire_rate", value: 1.12, cond: { type: "on_melee" } }],
  riddle_you_this: [{ op: "mul", target: "gun_damage", value: 1.1, cond: { type: "on_crit" } }],
  down_but_not_out: [
    { op: "flag", target: "ads_in_ffyl", value: 1, cond: { type: "while_shield_down" } },
  ],
  in_the_zone: [
    { op: "mul", target: "gun_damage", value: 1.12, cond: { type: "ads" } },
    { op: "mul", target: "crit_damage", value: 1.1, cond: { type: "ads" } },
  ],
  one_shot_one_kill: [
    { op: "add", target: "stored_shot_damage", value: 0.2, cond: { type: "on_kill" } },
  ],
  bear_arms: [{ op: "mul", target: "melee_damage", value: 1.15, cond: { type: "on_melee" } }],
  bullet_train: [
    { op: "flag", target: "sprint_hipfire", value: 1, cond: { type: "while_moving" } },
  ],
  groundbreaker: [{ op: "mul", target: "melee_damage", value: 1.2, cond: { type: "on_melee" } }],
  tripwire: [{ op: "mul", target: "ordnance_cooldown", value: 1.1, cond: { type: "always" } }],
  full_spectrum_arsenal: [
    { op: "mul", target: "ordnance_damage", value: 1.12, cond: { type: "on_ordnance_hit" } },
  ],
  fragmentation_payload: [
    { op: "mul", target: "splash_damage", value: 1.15, cond: { type: "on_ordnance_hit" } },
  ],
  contamination: [{ op: "mul", target: "status_damage", value: 1.1, cond: { type: "on_crit" } }],
  compounding_affliction: [
    { op: "mul", target: "status_damage", value: 1.15, cond: { type: "on_crit" } },
  ],
  overkill: [{ op: "mul", target: "crit_damage", value: 1.12, cond: { type: "on_crit" } }],
  now_with_caffeine: [
    { op: "mul", target: "action_skill_cooldown", value: 1.1, cond: { type: "always" } },
  ],
  i_am_a_gun: [{ op: "mul", target: "action_skill_damage", value: 1.12, cond: { type: "always" } }],
  a_honed_mind: [
    { op: "add", target: "action_skill_crit_chance", value: 0.05, cond: { type: "always" } },
    { op: "mul", target: "action_skill_crit_damage", value: 1.5, cond: { type: "on_crit" } },
  ],
};

/** Collect sim effects + synergy keys + proc map for an allocation. */
export function specializationEffects(
  catalog: SpecCatalog,
  alloc: SpecAllocation,
): SpecEffectBundle {
  const effects: SimEffect[] = [];
  const synergyKeys = new Set<string>();
  const procs: SpecEffectBundle["procs"] = [];

  for (const node of catalog.nodes) {
    const pts = alloc.nodePoints[node.id] ?? 0;
    if (pts <= 0) continue;
    for (const [target, perPoint] of Object.entries(node.node_bonus ?? {})) {
      effects.push({
        op: "mul",
        target,
        value: 1 + perPoint * pts,
        cond: { type: "always" },
        tags: ["spec_node", node.id],
      });
    }
  }

  for (const id of alloc.equipped) {
    const node = catalog.nodes.find((n) => n.skills.some((s) => s.id === id));
    const skill = node?.skills.find((s) => s.id === id);
    for (const k of skill?.synergy ?? []) synergyKeys.add(k);
    const proc = skill?.proc ?? "always";
    procs.push({ skillId: id, proc, cond: PROC_COND[proc] ?? "always" });
    for (const e of SKILL_EFFECTS[id] ?? []) {
      effects.push({ ...e, tags: [...(e.tags ?? []), "spec_skill", id] });
    }
  }

  return { effects, synergyKeys: [...synergyKeys], procs };
}
