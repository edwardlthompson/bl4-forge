import { describe, expect, it } from "vitest";
import { solve } from "../solver/pipeline";
import type { SolverRules } from "../solver/types";
import { composeBuildStats } from "./composeBuild";
import { demoCandidates, demoPiecesFor, demoSpecsFor } from "./demoPool";

const rules: SolverRules = {
  beam_width: 8,
  anneal_iterations: 10,
  timeout_ms: 100,
  balanced: { strategy: "maximin", mob_floor: 0.4, boss_floor: 0.4 },
  obtainable_for_published: ["confirmed"],
  obtainable_for_experimental: ["confirmed", "probable", "unverified"],
};

describe("MVP build compose", () => {
  it("ranks demo pool experimentally", () => {
    const out = solve({ pool: demoCandidates(), rules, experimental: true });
    expect(out.best?.id).toBeTruthy();
    expect(out.ranked.length).toBeGreaterThan(0);
  });

  it("builds stats waterfall with specialization procs", () => {
    const id = "mvp_crit_stack";
    const report = composeBuildStats({
      pieces: demoPiecesFor(id),
      specs: demoSpecsFor(id),
      uptime: {
        always: 1,
        ads: 0.5,
        on_crit: 0.5,
        on_kill: 0.4,
        on_melee: 0.2,
        on_ordnance_hit: 0.4,
        while_shield_down: 0.1,
        while_moving: 0.5,
      },
    });
    expect(report.experimental).toBe(true);
    expect(report.waterfall.length).toBeGreaterThan(0);
    expect(report.synergyKeys).toEqual(expect.arrayContaining(["crit", "ads"]));
    expect(report.procs.length).toBe(4);
    expect(report.compose.dps).toBeGreaterThan(0);
    expect(report.synergies.some((h) => h.id === "waterfall_nuke_splash")).toBe(true);
    expect(report.grenadeRecommendation?.perk).toBe("nuke");
  });
});
