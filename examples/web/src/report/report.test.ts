import { describe, expect, it } from "vitest";
import type { Candidate } from "../solver/types";
import { whyNotRunnerUp } from "./diff";
import { provenanceDrawer } from "./provenance";
import { farmRoute } from "./routes";
import { sensitivityFlip } from "./sensitivity";
import { contributionWaterfall } from "./waterfall";

const cand = (id: string, score: number, mob = score, boss = score): Candidate => ({
  id,
  score,
  mobScore: mob,
  bossScore: boss,
  obtainable: "confirmed",
  gate: "base",
  legal: true,
  prereqsMet: true,
  skills: [],
  gear: [],
  synergyKeys: [],
});

describe("report", () => {
  it("sorts waterfall by magnitude", () => {
    const rows = contributionWaterfall({
      damage: 1,
      dps: 1,
      magazineDps: 1,
      sustainedDps: 1,
      additiveSum: 0,
      multiplicativeProduct: 1,
      variance: null,
      contributions: [
        { target: "a", op: "add", effective: 0.1 },
        { target: "b", op: "mul", effective: -0.5 },
      ],
    });
    expect(rows[0]!.target).toBe("b");
  });

  it("diffs runner-up and sensitivity", () => {
    const ranked = [cand("best", 0.9, 0.9, 0.85), cand("second", 0.8, 0.95, 0.8)];
    const d = whyNotRunnerUp(ranked);
    expect(d.delta).toBeCloseTo(0.1);
    const s = sensitivityFlip(ranked[0]!, ranked[1]!, "mob");
    expect(s.threshold).toBeCloseTo(0.95 / 0.9);
  });

  it("provenance + farm route", () => {
    const p = provenanceDrawer({
      game_build: "26007962",
      patch: "0.0.0",
      oracle: "card_match",
      evidence: [{ kind: "datamine_drop", ref: "drops:1" }],
    });
    expect(p.evidence).toHaveLength(1);
    const route = farmRoute([
      { boss: "Arjay", location: "map_a", item: "Fisheye" },
      { boss: "X", location: "map_a", item: "Y" },
    ]);
    expect(route.map_a).toHaveLength(2);
  });
});
