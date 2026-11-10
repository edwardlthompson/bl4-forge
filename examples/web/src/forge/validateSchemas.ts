import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ErrorObject, ValidateFunction } from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(here, "../../../..");
export const SCHEMAS_DIR = join(REPO_ROOT, "schemas");
export const DATA_DIR = join(REPO_ROOT, "data");

const SCHEMA_FILES = [
  "effect.schema.json",
  "evidence.schema.json",
  "item.schema.json",
  "build.schema.json",
  "leaderboard.schema.json",
  "skills.schema.json",
  "specializations.schema.json",
] as const;

export type SchemaName = (typeof SCHEMA_FILES)[number];

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function createForgeAjv() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
  });
  addFormats(ajv);

  for (const name of SCHEMA_FILES) {
    const schema = loadJson(join(SCHEMAS_DIR, name)) as object;
    ajv.addSchema(schema, name);
  }
  return ajv;
}

export function getValidator(
  ajv: ReturnType<typeof createForgeAjv>,
  name: SchemaName,
): ValidateFunction {
  const validate = ajv.getSchema(name);
  if (!validate) {
    throw new Error(`Schema not registered: ${name}`);
  }
  return validate;
}

export function formatErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors?.length) return "unknown validation error";
  return errors.map((e) => `${e.instancePath || "/"} ${e.message ?? ""}`.trim()).join("; ");
}

export function validateOrThrow(validate: ValidateFunction, data: unknown, label: string): void {
  if (!validate(data)) {
    throw new Error(`${label}: ${formatErrors(validate.errors)}`);
  }
}

export function runSchemaGate(): { ok: true } | { ok: false; failures: string[] } {
  const ajv = createForgeAjv();
  const failures: string[] = [];

  const item = getValidator(ajv, "item.schema.json");
  const build = getValidator(ajv, "build.schema.json");
  const board = getValidator(ajv, "leaderboard.schema.json");
  const skills = getValidator(ajv, "skills.schema.json");
  const specs = getValidator(ajv, "specializations.schema.json");

  const checks: Array<{ path: string; validate: ValidateFunction }> = [
    {
      path: join(DATA_DIR, "fixtures", "jakobs_pistol_terminus.json"),
      validate: item,
    },
    {
      path: join(DATA_DIR, "fixtures", "sample_build.json"),
      validate: build,
    },
    {
      path: join(DATA_DIR, "fixtures", "sample_leaderboard.json"),
      validate: board,
    },
    {
      path: join(DATA_DIR, "skills.json"),
      validate: skills,
    },
    {
      path: join(DATA_DIR, "fixtures", "rules_unlock_hunter.json"),
      validate: skills,
    },
    {
      path: join(DATA_DIR, "specializations.json"),
      validate: specs,
    },
  ];

  for (const { path, validate } of checks) {
    try {
      const data = loadJson(path);
      validateOrThrow(validate, data, path);
    } catch (err) {
      failures.push(err instanceof Error ? err.message : String(err));
    }
  }

  // Required baseline data files must parse as JSON.
  const required = [
    "meta.json",
    "rules.json",
    "slots.json",
    "uptime-tables.json",
    "skills.json",
    "items.json",
    "scenarios/mobbing.json",
    "scenarios/bossing.json",
    "scenarios/balanced.json",
  ];
  for (const rel of required) {
    try {
      loadJson(join(DATA_DIR, rel));
    } catch (err) {
      failures.push(`${rel}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return failures.length ? { ok: false, failures } : { ok: true };
}
