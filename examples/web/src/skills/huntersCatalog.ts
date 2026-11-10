import huntersIndex from "./hunters_index.json";

export type HunterIndexEntry = {
  id: string;
  display_name: string;
  skill_count: number;
  effects_nonempty: number;
  coverage: "numeric" | "structure_only" | string;
};

export function loadHunterIndex(): HunterIndexEntry[] {
  const hunters = (huntersIndex as { hunters: HunterIndexEntry[] }).hunters;
  if (hunters.length < 6) throw new Error(`expected 6 hunters, got ${hunters.length}`);
  return hunters;
}

export function hunterIds(): string[] {
  return loadHunterIndex().map((h) => h.id);
}

export function coverageBanner(hunterId: string): string {
  const h = loadHunterIndex().find((x) => x.id === hunterId);
  if (!h) return "Unknown hunter";
  if (h.coverage === "experimental_pack") {
    return `${h.display_name}: experimental effect pack (${h.effects_nonempty} skills) — unverified`;
  }
  if (h.coverage === "structure_only" || h.effects_nonempty === 0) {
    return `${h.display_name}: structure only — tag-weight scoring until effect pack lands`;
  }
  return `${h.display_name}: ${h.effects_nonempty}/${h.skill_count} skills with numeric effects`;
}
