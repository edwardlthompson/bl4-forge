import { describe, expect, it } from "vitest";
import type { Candidate } from "../solver/types";
import { prefersReducedMotion, rarityCue } from "./a11y";
import { embedCardHtml, exportMarkdown } from "./export";
import { approximateFrontier } from "./frontier";
import { closestOwned, importInventoryJson } from "./inventory";
import {
  decodePermalink,
  decodeSkillPermalink,
  encodePermalink,
  encodeSkillPermalink,
} from "./permalink";
import { mapSerialsToSlots, splitSerialPaste, verifySerialTokens } from "./serial";
import { applyFarmFree, ownedGatesFromToggles } from "./toggles";

const c = (id: string): Candidate => ({
  id,
  score: 1,
  mobScore: 1,
  bossScore: 1,
  obtainable: "confirmed",
  gate: "base",
  legal: true,
  prereqsMet: true,
  skills: ["a"],
  gear: ["g"],
  synergyKeys: ["crit"],
});

describe("site", () => {
  it("verifies serial paste mapping", () => {
    const parts = splitSerialPaste("AAAAAAAA, BBBBBBBB; bad");
    expect(mapSerialsToSlots(parts).weapon1).toBe("AAAAAAAA");
    const v = verifySerialTokens(parts);
    expect(v.matches).toContain("AAAAAAAA");
    expect(v.misses).toContain("bad");
  });

  it("imports inventory and finds closest", () => {
    const owned = importInventoryJson(JSON.stringify([{ id: "x", synergyKeys: ["crit", "fire"] }]));
    expect(closestOwned(c("t"), owned)?.id).toBe("x");
  });

  it("toggles gates and farm-free", () => {
    expect(ownedGatesFromToggles({ dlc: ["1"], events: [], farmFree: false })).toContain("dlc:1");
    expect(applyFarmFree([{ dropChance: 0.1 }, { dropChance: 1 }], true)).toHaveLength(1);
  });

  it("frontier + permalink + export", () => {
    expect(approximateFrontier([c("a"), c("b")], 1)?.id).toMatch(/^approx-/);
    const link = encodePermalink({ patch: "p", seed: 3, experimental: true });
    expect(decodePermalink(link)?.seed).toBe(3);
    expect(exportMarkdown(c("z"), "p")).toContain("z");
    expect(embedCardHtml("Hi <x>", 1)).toContain("&lt;x&gt;");
  });

  it("a11y cues honor reduced motion + rarity shape", () => {
    expect(prefersReducedMotion({ matches: true })).toBe(true);
    expect(rarityCue("legendary").shape).toBe("diamond");
  });

  it("encodes and decodes skill allocation permalinks", () => {
    const link = encodeSkillPermalink({
      hunterId: "rules_fixture",
      ranks: [{ id: "rf_c0a", rank: 5 }],
      actionSkillId: "rf_action",
      augmentIds: ["rf_augment"],
      capstoneId: null,
      pointBudget: 69,
    });
    const back = decodeSkillPermalink(link);
    expect(back?.hunterId).toBe("rules_fixture");
    expect(back?.actionSkillId).toBe("rf_action");
    expect(back?.ranks[0]?.rank).toBe(5);
  });
});
