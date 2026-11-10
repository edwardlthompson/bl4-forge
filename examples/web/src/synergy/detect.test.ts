import { describe, expect, it } from "vitest";
import { collectTags, detectSynergies, type GrenadeCatalog, type SynergyRulesPack } from "./detect";

const catalog: GrenadeCatalog = {
  experimental: true,
  grenades: [
    {
      id: "waterfall",
      name: "Waterfall",
      behavior_tags: ["chain_explode", "splash", "ordnance"],
      payloads: [
        {
          id: "lingering",
          behavior_tags: ["lingering", "splash"],
          augments: [{ id: "pulsing", behavior_tags: ["pulse", "radius"] }],
        },
      ],
      perks: [{ id: "nuke", behavior_tags: ["nuke", "splash", "radius"] }],
    },
  ],
};

const rules: SynergyRulesPack = {
  experimental: true,
  obtainable: "unverified",
  rules: [
    {
      id: "waterfall_nuke_splash",
      title: "Waterfall + Nuke",
      why: "radius enables hops",
      require_all: ["chain_explode", "nuke", "splash"],
      require_any: ["radius"],
      effects: [{ op: "add", target: "ordnance_damage", value: 0.2 }],
      recommend_grenade: {
        grenade_id: "waterfall",
        payload: "lingering",
        payload_augment: "pulsing",
        perk: "nuke",
      },
    },
  ],
};

describe("synergy detect", () => {
  it("matches Waterfall + Nuke + radius", () => {
    const hits = detectSynergies(
      rules,
      catalog,
      { grenade_id: "waterfall", payload: "lingering", payload_augment: "pulsing", perk: "nuke" },
      ["splash"],
    );
    expect(hits.map((h) => h.id)).toContain("waterfall_nuke_splash");
  });

  it("rejects missing Nuke", () => {
    const hits = detectSynergies(
      rules,
      catalog,
      { grenade_id: "waterfall", payload: "lingering", payload_augment: "pulsing" },
      ["splash"],
    );
    expect(hits).toHaveLength(0);
  });

  it("collects airdrop extra tags", () => {
    const tags = collectTags(catalog, { grenade_id: "waterfall", extra_tags: ["airdrop"] }, []);
    expect(tags.has("airdrop")).toBe(true);
    expect(tags.has("chain_explode")).toBe(true);
  });
});
