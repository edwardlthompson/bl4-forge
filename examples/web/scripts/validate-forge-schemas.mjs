#!/usr/bin/env node
/**
 * Fail-closed CI gate for BL4 Forge schemas + fixtures.
 * Exit 0 only when all required fixtures validate.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = resolve(webRoot, "../..");
const SCHEMAS_DIR = join(REPO_ROOT, "schemas");
const DATA_DIR = join(REPO_ROOT, "data");

const SCHEMA_FILES = [
  "effect.schema.json",
  "evidence.schema.json",
  "item.schema.json",
  "build.schema.json",
  "leaderboard.schema.json",
  "skills.schema.json",
];

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function formatErrors(errors) {
  if (!errors?.length) return "unknown validation error";
  return errors
    .map((e) => `${e.instancePath || "/"} ${e.message ?? ""}`.trim())
    .join("; ");
}

const ajv = new Ajv2020({ allErrors: true, strict: false, validateSchema: true });
addFormats(ajv);
for (const name of SCHEMA_FILES) {
  ajv.addSchema(loadJson(join(SCHEMAS_DIR, name)), name);
}

const failures = [];

function check(schemaName, path) {
  const validate = ajv.getSchema(schemaName);
  if (!validate) {
    failures.push(`missing schema ${schemaName}`);
    return;
  }
  const data = loadJson(path);
  if (!validate(data)) {
    failures.push(`${path}: ${formatErrors(validate.errors)}`);
  }
}

try {
  check("item.schema.json", join(DATA_DIR, "fixtures", "jakobs_pistol_terminus.json"));
  check("build.schema.json", join(DATA_DIR, "fixtures", "sample_build.json"));
  check("leaderboard.schema.json", join(DATA_DIR, "fixtures", "sample_leaderboard.json"));
  check("skills.schema.json", join(DATA_DIR, "skills.json"));
  check("skills.schema.json", join(DATA_DIR, "fixtures", "rules_unlock_hunter.json"));

  for (const rel of [
    "meta.json",
    "rules.json",
    "slots.json",
    "uptime-tables.json",
    "skills.json",
    "items.json",
    "scenarios/mobbing.json",
    "scenarios/bossing.json",
    "scenarios/balanced.json",
  ]) {
    loadJson(join(DATA_DIR, rel));
  }
} catch (err) {
  failures.push(err instanceof Error ? err.message : String(err));
}

if (failures.length) {
  console.error("Forge schema gate FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("Forge schema gate OK (6 schemas + fixtures + baseline data)");
process.exit(0);
