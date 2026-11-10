import { describe, expect, it } from "vitest";
import { godrollFromBuild } from "./godrollFromBuild";
import { loadEnhancementCatalog, loadWeaponGodrolls } from "./loadPacks";
import { scoreEnhancements } from "./scoreEnhancements";

describe("scoreEnhancements + godrollFromBuild", () => {
  it("ranks Mixologist high for PB+CI Maliwan tags", () => {
    const catalog = loadEnhancementCatalog();
    expect(catalog.enhancements.length).toBe(44);
    const ranked = scoreEnhancements(catalog, {
      buildTags: [
        "inactive_element",
        "dual_element",
        "gun_element_bonus",
        "inherit_gun_element",
        "collaborative_ignition",
        "splash",
      ],
      weaponLicenses: ["maliwan"],
      archetype: "balanced",
    });
    expect(ranked[0].enhancement.id).toMatch(/maliwan/);
    const mix = ranked.find((r) => r.enhancement.id === "maliwan_mixologist");
    expect(mix).toBeTruthy();
    expect(mix!.score).toBeGreaterThan(
      ranked.find((r) => r.enhancement.id === "hyperion_bulwark")!.score,
    );
  });

  it("extrapolates Maliwan dual-element god-roll parts", () => {
    const catalog = loadEnhancementCatalog();
    const ranked = scoreEnhancements(catalog, {
      buildTags: ["inactive_element", "dual_element", "inherit_gun_element", "gun_element_bonus"],
      weaponLicenses: ["maliwan"],
      archetype: "mobbing",
    });
    const god = godrollFromBuild(
      ranked,
      loadWeaponGodrolls(),
      ["inactive_element", "dual_element", "inherit_gun_element", "gun_element_bonus"],
      "mobbing",
    );
    expect(god.ideal_profile.licenses[0]).toBe("maliwan");
    expect(god.part_priorities.some((p) => /maliwan|mixologist/i.test(p))).toBe(true);
    expect(god.named_examples.some((e) => e.id === "maliwan_beam_tosser")).toBe(true);
  });
});
