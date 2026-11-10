import { describe, expect, it, vi } from "vitest";
import { createBuildGuidePanel } from "./BuildGuidePanel";

vi.mock("../i18n", () => ({
  t: (key: string) => key,
}));

describe("BuildGuidePanel", () => {
  it("renders how-it-works, boards, arch loadouts, dual enhancements, gear stacks", () => {
    const root = createBuildGuidePanel({ onClose: vi.fn() });
    expect(root.querySelector(".gp-guide-hero")).toBeNull();
    expect(root.querySelector('[data-testid="guide-hunter"]')?.textContent).toBe("Rafa");
    expect(root.querySelector('[data-testid="guide-how"]')?.textContent).toMatch(
      /guide\.how_body|Peacebreaker|Overdrive/i,
    );
    expect(root.querySelector(".gp-guide-board")).toBeTruthy();
    expect(root.querySelector('[data-testid="guide-skill-steps"]')?.textContent).toMatch(
      /Deadline/,
    );
    expect(root.querySelector('[data-testid="guide-spec-steps"]')?.textContent).toMatch(
      /Brute → 1/,
    );
    expect(root.querySelector('[data-testid="guide-arch-tabs"]')).toBeTruthy();
    expect(root.querySelectorAll("[data-arch]").length).toBe(3);
    expect(root.querySelector('[data-testid="guide-com-exact"]')?.textContent).toMatch(
      /Grenazerker|\+3 Sinergia|\+4 Confeti|Splash Damage/i,
    );
    expect(root.querySelector('[data-testid="guide-gear-name"]')?.className).toMatch(
      /gp-rarity-legendary|gp-rarity-epic/,
    );
    expect(root.querySelector('[data-testid="guide-gear-farm"]')?.textContent).toMatch(
      /Farm|farm/i,
    );
    expect(root.querySelector('[data-testid="guide-purple-why"]')?.textContent).toMatch(
      /Order|Accelerator|2 charges/i,
    );
    expect(root.querySelector('[data-testid="guide-repkit-perks"]')?.textContent).toMatch(
      /Accelerator/,
    );
    expect(root.querySelector('[data-testid="guide-stack-totals"]')?.textContent).toMatch(
      /Splash|Radius|Gun Damage/i,
    );
    expect(root.querySelector('[data-testid="guide-stack-notes"]')?.textContent).toMatch(
      /Loadout gear counted|Enhancement/i,
    );
    expect(root.querySelector('[data-testid="guide-dual-best"]')?.textContent).toMatch(
      /Mixologist/i,
    );
    const chart = root.querySelector('[data-testid="guide-swap-chart"]');
    expect(chart?.textContent).toMatch(/Waterfall/i);
    expect(chart?.textContent).toMatch(/Firewerk|firewerks/i);
    expect(chart?.textContent).toMatch(/firepot|Firepot/i);
    expect(chart?.textContent).toMatch(/Amp|Accelerator|TripleBypass/i);
    expect(root.querySelector('[data-testid="guide-legendaries"]')?.textContent).toMatch(
      /PlasmaCoil/,
    );
    expect(root.querySelector('[data-testid="guide-repkit-winner"]')?.textContent).toMatch(
      /TripleBypass/,
    );

    // Switch to bossing → Amp + Primed Potency path
    const bossBtn = root.querySelector('[data-arch="bossing"]') as HTMLButtonElement;
    bossBtn.click();
    expect(root.querySelector('[data-testid="guide-arch-why"]')?.textContent).toMatch(/boss/i);
    expect(root.querySelector('[data-testid="guide-loadout-repkit"]')?.textContent).toMatch(/Amp/i);
    expect(root.querySelector('[data-testid="guide-dual-best"]')?.textContent).toMatch(
      /Mixologist/i,
    );
  });
});
