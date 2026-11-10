import rulesFixture from "./rules_fixture.json";
import type { HunterDef } from "./types";

/** Hunters available to the planner UI (fixtures always; catalog when bundled). */
export function getPlannerHunters(): HunterDef[] {
  const fromFixture = (rulesFixture as { hunters: HunterDef[] }).hunters;
  return fromFixture.length ? fromFixture : [];
}
