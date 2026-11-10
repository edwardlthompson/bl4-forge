/** A11y helpers: reduced motion + icon+shape rarity coding notes. */

export function prefersReducedMotion(
  mq: { matches: boolean } = typeof matchMedia !== "undefined"
    ? matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false },
): boolean {
  return mq.matches;
}

export type RarityCue = { icon: string; shape: "circle" | "square" | "diamond" | "hex" };

const RARITY: Record<string, RarityCue> = {
  common: { icon: "dot", shape: "circle" },
  uncommon: { icon: "leaf", shape: "square" },
  rare: { icon: "star", shape: "diamond" },
  epic: { icon: "bolt", shape: "hex" },
  legendary: { icon: "crown", shape: "diamond" },
};

export function rarityCue(rarity: string): RarityCue {
  return RARITY[rarity.toLowerCase()] ?? { icon: "dot", shape: "circle" };
}
