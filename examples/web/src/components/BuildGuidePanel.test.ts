import { describe, expect, it, vi } from "vitest";
import { createBuildGuidePanel } from "./BuildGuidePanel";

vi.mock("../i18n", () => ({
  t: (key: string) => key,
}));

describe("BuildGuidePanel", () => {
  it("renders horizontal boards, inline augment, exact COM, swap", () => {
    const root = createBuildGuidePanel({ onClose: vi.fn() });
    expect(root.querySelector(".gp-guide-hero")).toBeNull();
    expect(root.querySelector('[data-testid="guide-hunter"]')?.textContent).toBe("Rafa");
    expect(root.querySelector(".gp-guide-board")).toBeTruthy();
    expect(root.querySelector('[data-testid="guide-skill-steps"]')?.textContent).toMatch(
      /Deadline/,
    );
    expect(root.querySelector('[data-testid="guide-skill-steps"]')?.textContent).toMatch(
      /Confeti|Sitiar|augment/i,
    );
    expect(root.querySelector('[data-testid="guide-spec-steps"]')?.textContent).toMatch(
      /Brute → 1/,
    );
    expect(root.querySelector('[data-testid="guide-spec-steps"]')?.textContent).toMatch(
      /Equip: Now With Caffeine/,
    );
    expect(root.querySelector('[data-testid="guide-com-exact"]')?.textContent).toMatch(
      /\+3 Sinergia|\+4 Confeti|Splash Damage/i,
    );
    expect(root.querySelector('[data-testid="guide-stack-totals"]')?.textContent).toMatch(
      /Splash|Radius|Gun Damage/i,
    );
    expect(root.querySelector(".gp-guide-spec-board")).toBeTruthy();
    expect(root.querySelector('[data-testid="guide-swap"]')?.textContent).toMatch(
      /Waterfall|grenade/i,
    );
    expect(root.querySelector(".gp-guide-topband")).toBeTruthy();
    root.querySelector<HTMLButtonElement>('[data-arch="mobbing"]')?.click();
    expect(root.querySelector('[data-testid="guide-swap"]')?.textContent).toMatch(/Firewerk/i);
  });
});
