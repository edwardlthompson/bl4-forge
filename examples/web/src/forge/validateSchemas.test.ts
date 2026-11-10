import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertAcyclicSkills, findSkillCycle } from "./skillDag";
import {
  createForgeAjv,
  DATA_DIR,
  getValidator,
  runSchemaGate,
  validateOrThrow,
} from "./validateSchemas";

describe("forge schema gate", () => {
  it("registers schemas including skills and specializations", () => {
    const ajv = createForgeAjv();
    for (const name of [
      "effect.schema.json",
      "evidence.schema.json",
      "item.schema.json",
      "build.schema.json",
      "leaderboard.schema.json",
      "skills.schema.json",
      "specializations.schema.json",
    ] as const) {
      expect(getValidator(ajv, name)).toBeTypeOf("function");
    }
  });

  it("validates the Terminus item fixture", () => {
    const ajv = createForgeAjv();
    const validate = getValidator(ajv, "item.schema.json");
    const item = JSON.parse(
      readFileSync(join(DATA_DIR, "fixtures", "jakobs_pistol_terminus.json"), "utf8"),
    );
    validateOrThrow(validate, item, "terminus");
    expect(item.has_location).toBe(true);
    expect(item.tag_only).toBe(false);
    expect(item.unparsed).toBe(false);
    expect(item.effects[0].oracle).toBe("card_match");
  });

  it("rejects an item missing has_location", () => {
    const ajv = createForgeAjv();
    const validate = getValidator(ajv, "item.schema.json");
    const item = JSON.parse(
      readFileSync(join(DATA_DIR, "fixtures", "jakobs_pistol_terminus.json"), "utf8"),
    );
    delete item.has_location;
    expect(validate(item)).toBe(false);
  });

  it("validates sample build and leaderboard fixtures", () => {
    const ajv = createForgeAjv();
    const build = JSON.parse(readFileSync(join(DATA_DIR, "fixtures", "sample_build.json"), "utf8"));
    const board = JSON.parse(
      readFileSync(join(DATA_DIR, "fixtures", "sample_leaderboard.json"), "utf8"),
    );
    validateOrThrow(getValidator(ajv, "build.schema.json"), build, "build");
    validateOrThrow(getValidator(ajv, "leaderboard.schema.json"), board, "board");
  });

  it("runs the fail-closed schema gate", () => {
    const result = runSchemaGate();
    expect(result).toEqual({ ok: true });
  });
});

describe("skill DAG", () => {
  it("accepts the scaffold skills.json DAG", () => {
    const data = JSON.parse(readFileSync(join(DATA_DIR, "skills.json"), "utf8")) as {
      hunters: Array<{ skills: Array<{ id: string; requires?: string[] }> }>;
    };
    const skills = data.hunters.flatMap((h) => h.skills);
    expect(findSkillCycle(skills)).toBeNull();
    assertAcyclicSkills(skills);
  });

  it("rejects a cyclic requires graph", () => {
    expect(
      findSkillCycle([
        { id: "a", requires: ["b"] },
        { id: "b", requires: ["a"] },
      ]),
    ).toEqual(["a", "b", "a"]);
    expect(() =>
      assertAcyclicSkills([
        { id: "a", requires: ["b"] },
        { id: "b", requires: ["a"] },
      ]),
    ).toThrow(/cycle/i);
  });
});
