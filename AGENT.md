# AGENT.md — original product brief (Sacred)

Copy this file to `AGENT.md` after clone and **before** `init-project`. Paste the
human’s original prompt **verbatim**. Bootstrap stamps `AGENTS.md` only and will
not overwrite this file. Later sessions: read this before any BUILD_PLAN sprint row.

<!-- agent-brief:one-liner -->
Deterministic Borderlands 4 min/max build solver and public build leaderboard. No LLM in the loop.
<!-- /agent-brief:one-liner -->

<!-- agent-brief:keywords -->
borderlands, build-planner, solver, leaderboard, datamine, deterministic, github-pages
<!-- /agent-brief:keywords -->

# BL4 FORGE — Agent Build Brief

**Project:** `bl4-forge` — a deterministic, no-LLM Borderlands 4 min/max build planner and public build leaderboard.
**Owner:** edwardlthompson
**Host:** GitHub Pages (project site)
**Target repo:** `edwardlthompson/bl4-forge`
**Revision:** v2 — datamine-only data acquisition. Public database scraping removed.

---

## 0. How to use this file

Read it fully before touching anything. Then:

1. Read the parent template's own rules, in this order:
   - `AGENTS.md`
   - `docs/START_HERE.md`
   - `docs/INITIALIZATION_PROMPT.md`
   - `docs/CURSOR_MODES.md`
   - `docs/ux-ui-guidelines.md`
   - `docs/WEB_PROJECT_LAYOUT.md`
   - `BUILD_PLAN_TEMPLATE.md`
2. Scaffold per Section 1.
3. Run `/tour`.
4. Copy `BUILD_PLAN_TEMPLATE.md` onto `BUILD_PLAN.md` and populate it from Section 13.
5. Work the board in order. Do not skip ahead across phases.

This file is the product spec. The template's `AGENTS.md` is the process law. Where they conflict on **process**, the template wins. Where they conflict on **product**, this file wins.

---

## 1. Bootstrap sequence

Do this exactly. Stop and report if any step fails.

```
# 1. Create the repo from the template (web UI: "Use this template" -> edwardlthompson/bl4-forge)
#    Or from a shell with gh:
gh repo create edwardlthompson/bl4-forge --template edwardlthompson/agent-project-bootstrap --public

# 2. Clone it
git clone git@github.com:edwardlthompson/bl4-forge.git
cd bl4-forge

# 3. Init with the web golden path, non-interactive
./scripts/init-project.sh \
  --non-interactive \
  --stack web \
  --project-name "BL4 Forge" \
  --purpose "Deterministic Borderlands 4 min/max build solver and public build leaderboard. No LLM in the loop." \
  --license MIT

# 4. Verify scaffold
bash scripts/verify.sh

# 5. Repo security baseline
bash scripts/setup-github-repo.sh
```

**Post-init checks:**

- Pages source must be **GitHub Actions**, never "Deploy from `/docs`". Confirm `.github/workflows/pages.yml` targets `examples/web/dist`.
- Confirm `VITE_BASE_PATH` is set for project-site hosting (`/bl4-forge/`).
- `docs/` is agent documentation only. It is not the website.
- Keep the generated adapters (`.cursor/rules/main.mdc`, `CLAUDE.md`, etc.). Do not hand-edit them; regenerate via `scripts/bootstrap-lifecycle.sh --sync-adapters`.

After every push to `main` that touches workflows or dependencies:

```
bash scripts/check-github-ci.sh --wait 300
```

Before any release tag: `bash scripts/pre-release-gate.sh`.

---

## 2. What this product is

A static site that computes optimal Borderlands 4 builds for a chosen Vault Hunter across three archetypes — **mobbing**, **bossing**, and **balanced** — and publishes a ranked leaderboard of builds for every hunter and archetype.

**It is:**

- A solver. Deterministic, seeded, reproducible.
- A shopping list generator: skill perks in level order, gear per slot, drop sources, farm route.
- An explanation engine: every score decomposes into clickable, attributed contributors.
- A leaderboard over the solver's own output, frozen per game patch.

**It is not:**

- A hand-builder. The user picks hunter + archetype + constraints. They do not allocate points.
- An LLM app. No model calls at runtime. Everything is arithmetic.
- A scraper aggregator. There is exactly one data source: the game files.

---

## 3. Hard invariants

Violating any of these is a bug, not a design choice.

1. **No LLM anywhere in the runtime path.** No API keys, no tokens, no prompts. If a feature needs judgment, it needs a rule.
2. **Datamining is a maintainer lane, not a user requirement.** A visitor needs nothing but a browser. A maintainer needs a legitimate game install, the AES key, and a Rust toolchain. The two audiences never mix.
3. **Datamined data alone never reaches `confirmed`.** Correctness comes from the card oracle; obtainability comes from a location record plus maintainer confirmation. See Section 5.4.
4. **Every number has a scenario.** Scores are relative to a named spec in `scenarios/`. No scenario, no score.
5. **Every build is stamped.** Each published build JSON carries `patch`, `game_build`, `solver_version`, `scenario_hash`, `seed`, `generated_at`.
6. **Determinism.** Same inputs plus same seed plus same solver version must produce byte-identical output. Pin RNG. Sort all collections before serializing.
7. **Packs are regenerated, never hand-edited.** A patch rerun overwrites. Manual edits are lost by design.
8. **No stubs in shipped paths.** Any parser or compiler branch that can't resolve a value must emit an explicit `unparsed: true` / `tag_only: true` and increment a coverage counter. It must never return a plausible default.
9. **No secrets in the repo.** The site has no runtime secrets. The AES key and install path are configuration, not committed values.
10. **No network dependency at runtime.** The site must work fully from committed JSON.

---

## 4. Repo layout

Extends the template. Do not relocate template directories.

```
data/
  slots.json              # slot manifest, counts are data not constants
  rules.json              # point budget, level cap, thresholds
  items.json              # gated item records
  skills.json             # skill DAG per hunter
  meta.json               # patch, game_build, key id, mapping version, tool commit, coverage
  scenarios/
    mobbing.json
    bossing.json
    balanced.json
  uptime-tables.json
  changes/
    {patch}.json          # manifest diff, review queue source
schemas/
  item.schema.json
  evidence.schema.json
  effect.schema.json
  build.schema.json
  leaderboard.schema.json
tools/datamine/
  README.md               # the maintainer run-book
  acquire.sh              # key + build resolve, extraction, manifest hash
  manifest.ts             # hash + diff
  localize.ts             # locres + card string dump
  parts.ts                # parts manifest index
  drops.ts                # drop table index
  oracle/
    parse-card.ts         # card text -> expected modifiers
    check.ts              # compiler output vs card, tolerance, fail-closed
  compile/
    families/             # one module per modifier family
    index.ts
  report-coverage.ts
src/
  sim/            # composition, uptime, variance, tests
  solver/         # pruner, beam, anneal, pareto, maximin, substitution
  sweep/          # leaderboard seed gen, dedupe, diversity, freeze
  report/         # waterfall, diff, sensitivity, routes
  decode/         # serial decoder (clean-room)
  ui/             # pages, components, workers
  workers/        # solver.worker.ts, score.worker.ts
build-packs/
  {patch}/{hunter}/{archetype}/{rank}.json
leaderboards/
  {patch}/index.json
```

**`examples/web/` is the site source.** Keep it there per `docs/WEB_PROJECT_LAYOUT.md`. `src/` above maps inside it.

`tools/datamine/` never ships. It is excluded from the build.

---

## 5. Schema bundle — build this first

Sprint 1 ships schemas plus one hand-written fixture that validates. Nothing else starts until `ajv` (or equivalent) passes in CI.

### 5.1 Item record

```json
{
  "id": "jakobs_pistol_terminus",
  "name": "Terminus",
  "slot": "weapon",
  "weapon_type": "pistol",
  "manufacturer": "jakobs",
  "rarity": "legendary",
  "elements": ["incendiary", "none"],
  "stat_range": { "damage": [1180, 1310], "damage_median": 1240, "fire_rate": [4.0, 4.4] },
  "firmware_sensitive": true,
  "red_text": "…",
  "effects": [ /* see 5.2 */ ],
  "tag_only": false,
  "synergy_keys": ["crit", "incendiary_dot", "sustained"],
  "obtainable": "probable",
  "gate": "base",
  "has_location": true,
  "evidence": [
    { "kind": "datamine_drop", "ref": "drops:1234", "game_build": "…", "retrieved_at": "2026-11-08" },
    { "kind": "card_oracle", "ref": "oracle:jakobs_pistol_terminus", "result": "pass", "retrieved_at": "2026-11-08" },
    { "kind": "ingame_verified", "by": "maintainer", "batch": "2026-11-09-a", "retrieved_at": "2026-11-09" }
  ],
  "drop": { "boss": "…", "location": "…", "rate_band": "rare" },
  "unparsed": false,
  "stale": false
}
```

`obtainable` enum: `confirmed | probable | unverified | cut | dev_only`.
`gate` enum: `base | dlc: | event:`.

### 5.2 Effect DSL

Effects are machine-readable modifiers, never prose.

```json
{
  "op": "add | mul | set | flag",
  "target": "gun_damage",
  "value": 1.25,
  "cond": { "type": "on_kill", "window_s": 5 },
  "stack_max": 10,
  "tags": ["dps", "sustained"],
  "source_part": "part_dmg_mult_02",
  "oracle": "card_match"
}
```

- `op`: `add | mul | set | flag`.
- `cond.type`: `always | on_kill | on_crit | on_reload | while_shield_down | while_moving | while_airborne | ads | on_ordnance_hit | on_melee`.
- `oracle`: `card_match | name_inferred | manual`. Anything not `card_match` is provisional.
- Unknown `op` or `cond.type` from a new patch must degrade to a tag weight, never throw.

### 5.3 Skill record

`id, character, tree, tier, max_rank, requires[], effect_text, effects[], tags[], activator: bool`.

`requires` forms a DAG. Cycles fail validation.

### 5.4 Promotion rules (code, not documentation)

There is one data source, so promotion is by evidence class, not source count:

| State | Requirements |
|---|---|
| `confirmed` | `has_location: true` **and** card-oracle pass on all effects **and** `ingame_verified` evidence present |
| `probable` | `has_location: true` and card-oracle pass, no maintainer confirmation yet |
| `unverified` | in files with no location record, or any effect failed the oracle |
| `cut` | present in a prior manifest, absent from current |

- A drop row without a location is a stub, not evidence. `has_location` stays false.
- Any `tag_only: true` or `unparsed: true` item is capped at `probable` regardless of other evidence.
- `confirmed` is the only state admitted to published packs. `probable` sits behind the experimental toggle.
- Downgrade is automatic: an oracle failure demotes to `unverified` on the spot.

### 5.5 Provenance block

`data/meta.json` records, per ingest run: `patch`, `game_build`, `aes_key_id`, `usmap_version`, `bl4_commit`, `retrieved_at`, `coverage: { parsed, tag_only, unparsed, total }`.

Every item carries the `game_build` its data came from. A patch mismatch between item and pack is a validation error.

---

## 6. Data acquisition — datamining

### 6.1 Toolchain

Vendored, pinned, never auto-updated. [`monokrome/bl4`](https://github.com/monokrome/bl4) is BSD-2-Clause: attribution in `THIRD_PARTY_LICENSES.md`, binary in `tools/bin/`, commit pinned in `tools/datamine/README.md`.

| Need | Command |
|---|---|
| Extract assets | `uextract /path/to/Paks -f "ItemSerialPart" -o parts/` |
| Decompress config | `bl4 ncs decompress game.pak -o ./ncs/ --raw` |
| Parts manifest | `bl4 ncs extract -t manifest` / `bl4 parts "Jakobs Pistol"` |
| Drop table | `bl4 drops list --sources` / `drops find "Terminus"` |
| Legality | `bl4 serial validate` |

`FModel` and the [UE4/UE5 AES key guide](https://github.com/Cracko298/UE4-AES-Key-Extracting-Guide) cover the extraction prerequisites. UE version target is `UE5_4`.

### 6.2 Three human touchpoints

The agent cannot do these and must not fake them:

1. **Game install path** — the agent has no install.
2. **AES key** — from the published key list or a memory scan with the game open.
3. **Spot-check 20 random compiled items against the in-game card.** This catches a systematically wrong attribute map, which the oracle can miss if the card parser shares the compiler's misunderstanding.

### 6.3 Stage gates

Each stage ends with a written handoff artifact in `tools/datamine/HANDOFF.md`: what was tried, what passed, what is quarantined, and the next stage's entry condition. This is mandatory — the work exceeds one agent context, and without handoffs a fresh context re-derives everything and starts stubbing around hour five.

| Stage | Work | Gate |
|---|---|---|
| D0 | Build `bl4`, resolve key, extract filtered assets, pin usmap + build ID | Extraction completes; `game_build` recorded |
| D1 | Locres + card string dump; parts index; drops index | Card corpus parses to modifiers at >90% |
| D2 | Card oracle harness + coverage reporter | Oracle correctly rejects a deliberately corrupted mapping |
| D3–D5 | Compiler, one modifier family per pass, oracle-gated | Each family passes before the next begins |
| D6 | `changes/` diff tool + synthetic fixtures | Diff detects an injected change |
| D7 | Coverage report, quarantine export, handoff | Human spot-check of 20 items clears |

**Oracle before compiler.** An agent given the compiler first builds one, declares success, and backfills tests that confirm its own assumptions.

### 6.4 The oracle

1. Parse the card string into expected modifiers (`+25% Gun Damage` -> `mul gun_damage 1.25`).
2. Run the compiler on that item's parts.
3. Compare within tolerance.
4. Pass -> `oracle: "card_match"`. Fail -> `tag_only: true`, increment counter, demote.

Part names (`part_dmg_mult_02`, `part_crit_bonus`) seed candidate mappings but never promote on their own. Names alone produce `oracle: "name_inferred"`, which is provisional.

### 6.5 Quarantine rules

- Nothing datamine-derived is `confirmed` on day one. Everything lands `probable` or lower.
- No leaderboard generation until the human spot-check clears. A frozen board built on unverified data poisons the archive.
- Quarantined items are excluded from packs exactly like an unparsed red text.

### 6.6 Patch cadence

Runs locally on the maintainer's machine, output committed. Never in CI — CI has no game install.

Per patch: re-resolve key, re-extract, diff manifest, review the queue. Budget 1–4 hours; more when the key rotates or mappings break. Extraction fails loudly rather than silently continuing on a stale manifest.

---

## 7. Simulator

Damage composes as:

```
D = base * (1 + SUM(additive)) * PRODUCT(1 + multiplicative) * element * crit * scenario_mods
```

Effective contribution of a conditional modifier = `value * uptime(cond, archetype)`.

Uptime tables live in `data/uptime-tables.json` and are per-archetype. Mobbing `on_kill` ~0.9, bossing ~0.2. Tables are user-adjustable in the UI and every report shows the values used.

Required unit tests before any solver work:

- additive and multiplicative compose in the correct order
- fire-rate cap is respected
- reload cancellation modeled
- magazine vs DPS distinction holds
- splash self-damage applied
- elemental resist table applied
- variance band from `stat_range` is emitted, and `damage_median` is the point estimate
- conditional modifier with `uptime: 0` contributes exactly nothing
- an `unparsed` effect contributes its tag weight and never a numeric default

---

## 8. Solver

Pipeline: prune -> beam over skill DAG -> anneal over loadout -> Pareto filter -> rank.

- Pruner hard-filters `obtainable` and `gate` first, then legality, then prereq feasibility.
- Beam width and iteration caps come from `rules.json`.
- Anytime: always return best-so-far on timeout.
- Seeded RNG. Same seed, same output.
- **Balanced is maximin**, not an average: maximize `min(mob_score, boss_score)` with floors on both.
- Substitution engine: on gate conflict, swap to the next candidate sharing >=1 synergy key, re-simulate, report the delta.

---

## 9. Leaderboard

Boards: per hunter x per archetype (18), per hunter all-around (6), per boss, one global cross-hunter board, one experimental board, one archive per patch.

Sweep, as a sharded Actions matrix (public repos get free minutes; keep each shard under 5h):

1. Multi-seed generation — greedy per synergy key, random restarts, curated seeds.
2. Wide-beam search per shard.
3. Collect local optima as artifacts.
4. Dedupe by skill-set + loadout hash, cluster near-duplicates, keep one.
5. Diversity clamp: adjacent entries share <=70% skill points and <=60% gear.
6. High-fidelity re-score across many scenario samples.
7. Pareto filter, then rank.
8. Robustness tiebreak: mean score under +/-20% perturbation of every assumption.
9. Freeze with patch, game build, solver version, scenario hash.

Cross-hunter normalization: each entry is scored relative to that hunter's own best (100.0), with absolute numbers shown alongside.

The page must state plainly that this is the frontier of a sweep, not a certified global optimum. Gear sub-problems get a certification pass (exhaustive with pruning, or ILP); the skill axis stays approximate.

---

## 10. Reporting

Deterministic, no prose generation:

- **Contribution waterfall** — every modifier's effective contribution, sorted, linked to source.
- **Why not the runner-up** — diff against rank 2 with the score delta.
- **Sensitivity panel** — which assumption flips the ranking, at what threshold.
- **Provenance drawer** — evidence entries, oracle results, game build, nerf/buff history.
- **Shopping list** — skills in level order with respec checkpoints, gear per slot, drops, farm route clustered by map.
- **Coverage indicator** — parsed / tag-only / unparsed percentage per slot, publicly shown.

---

## 11. UI

- Web Worker for solving and scoring. Main thread never blocks.
- Serial paste verification: decode up to four weapon serials, map to build slots, report matches and misses.
- Inventory import and "closest to what you own".
- DLC and event ownership toggles, farm-free mode.
- Frontier explorer with a draggable point (reduced beam, labelled approximate).
- Pinned-patch permalinks. Old links render with their original patch data.
- Markdown and PNG export. Embed card.
- Accessibility: element and rarity coded by icon and shape as well as hue; keyboard-navigable tree with proper tree roles; reduced-motion mode; phone-sized tap targets.
- PWA installable with a downloadable data pack for offline browse.

Meet `docs/ux-ui-guidelines.md`. Run `/ux-review` before calling any UI sprint done.

---

## 12. Licensing and legal

- Project is MIT.
- Item names, red text, and marks belong to Gearbox / 2K. Unaffiliated disclaimer in README and footer. Ship derived JSON only, never extracted assets.
- `bl4` is BSD-2-Clause: attribution in `THIRD_PARTY_LICENSES.md`, record in `REUSE.toml`, binary pinned.
- The serial format is documented at `github.com/Nicnl/borderlands4-serials` (AGPL-3.0). Write a clean-room TypeScript decoder from the published format description rather than vendoring the Go library, so MIT holds. Log the decision in `.agent/DECISION_LOG.md`.

---

## 13. BUILD_PLAN sprints

Copy `BUILD_PLAN_TEMPLATE.md` to `BUILD_PLAN.md`, then populate. Use the template's labels (`[AGENT]`, `[HUMAN]`, `[AUTO]`) and status markers (`🔲`, `✅`, `❌`). No `- [ ]` checkboxes.

**Sprint 0 — Scaffold** `[AGENT]`
🔲 init script, verify, repo baseline
🔲 Pages source set to Actions `[HUMAN]`
🔲 `/tour` completed

**Sprint 1 — Contracts** `[AGENT]`
🔲 all five schemas including `has_location`, `tag_only`, `unparsed`, `oracle`
🔲 one validating item fixture
🔲 `rules.json`, `slots.json`, three scenario specs, uptime tables
🔲 schema CI gate

**Sprint 2 — Simulator** `[AGENT]`
🔲 composition function
🔲 all nine unit tests from Section 7
🔲 variance band output
🔲 published formula doc

**Sprint 3 — Datamine D0** `[AGENT]` + `[HUMAN]`
🔲 vendor pinned `bl4`, `tools/bin/`, attribution `[AGENT]`
🔲 install path + AES key supplied `[HUMAN]`
🔲 `acquire.sh`: key resolve, extract, manifest hash `[AGENT]`
🔲 `game_build` recorded in `meta.json` `[AGENT]`
🔲 extraction verified complete `[HUMAN]`

**Sprint 4 — Datamine D1** `[AGENT]`
🔲 locres + card string dump
🔲 parts index
🔲 drops index
🔲 card corpus parse at >90%

**Sprint 5 — Datamine D2** `[AGENT]`
🔲 card oracle harness
🔲 coverage reporter
🔲 corrupted-mapping rejection test

**Sprint 6 — Datamine D3–D5** `[AGENT]`
🔲 one module per modifier family, oracle-gated
🔲 coverage report committed
🔲 quarantine export

**Sprint 7 — Datamine D6–D7** `[AGENT]` + `[HUMAN]`
🔲 `changes/` diff tool + fixtures
🔲 handoff doc
🔲 20-item in-game spot-check `[HUMAN]`
🔲 promotion pass to `confirmed`

**Sprint 8 — Solver** `[AGENT]`
🔲 pruner
🔲 beam over DAG
🔲 anneal over loadout
🔲 Pareto + maximin
🔲 substitution engine
🔲 determinism test

**Sprint 9 — Sweep** `[AGENT]`
🔲 seed generator
🔲 sharded matrix workflow
🔲 dedupe + diversity clamp
🔲 high-fidelity rescore
🔲 robustness tiebreak
🔲 freeze + archive

**Sprint 10 — Reporting** `[AGENT]`
🔲 waterfall, diff, sensitivity, provenance, routes

**Sprint 11 — Site** `[AGENT]`
🔲 pages and worker wiring
🔲 serial verify, inventory import
🔲 toggles, frontier explorer
🔲 permalinks, exports, embed
🔲 a11y pass, PWA
🔲 `/ux-review`

**Sprint 12 — Ops** `[AGENT]`
🔲 golden-build regression CI
🔲 coverage gate in CI (fail on coverage regression)
🔲 ingest validation report
🔲 a11y and screenshot diff CI

**Sprint 13 — Ship** `[AGENT]`
🔲 `pre-release-gate.sh`
🔲 `check-github-ci.sh --wait 300`
🔲 release notes, tag

---

## 14. Definition of done, per sprint

A sprint is done only when:

- `bash scripts/verify.sh` passes
- CI is green, including the schema gate
- tests cover the new behavior
- the sprint's rows are marked `✅` with a commit reference
- no invariant in Section 3 regressed
- for datamine sprints: a handoff artifact exists and the coverage counter moved or held

---

## 15. Risk register

| Risk | Mitigation |
|---|---|
| Agent emits confident garbage from a wrong attribute map | Oracle before compiler; fail-closed; coverage counter |
| Card parser and compiler share a misunderstanding | Human spot-check of 20 items before any promotion |
| AES key rotation | Documented memory-scan procedure; fail loudly on stale key |
| `.usmap` mapping breakage | Mapping version pinned per patch; extraction aborts |
| NCS/asset format shift | Fixture regression tests against a known patch |
| Overwhelming asset volume | Path filters only, never full-tree export |
| Unobtainable flood | `has_location` precondition; `cut` detection via manifest diff |
| Pre-alpha tool churn | Pinned commit, vendored binary, no auto-update |
| Agent stubs around hour five | Mandatory handoffs; no-stubs invariant; coverage gate |
| Patch-day staleness | Version banner, packs regenerated, boards archived |
| Legal | Derived JSON only, disclaimer, attribution |

---

## 16. Non-goals and cut order

Never build: user-authored builds, accounts, server-side anything, LLM calls, item trading, save editing, public-database scraping.

If scope slips, cut in this order: per-boss boards -> embed cards -> community submissions -> frontier explorer -> screenshot diffing.

Never cut: the card oracle, the obtainability gate, golden-build regression CI, the robustness tiebreak.

---

## Appendix A — Tooling references

- `https://github.com/monokrome/bl4` — BSD-2, extraction, NCS, parts, drops, serial codec
- `https://www.rocket-props.com/tutorials/bl4-extract` — FModel setup, UE5_4 target
- `https://github.com/Cracko298/UE4-AES-Key-Extracting-Guide` — key extraction
- `https://github.com/FModel/Unreal-Game-Keys` — published key list
- `https://github.com/Nicnl/borderlands4-serials` — serial format documentation

## Appendix B — First actions

1. Scaffold (Section 1).
2. `/tour`.
3. Fill `BUILD_PLAN.md` from Section 13.
4. Sprint 1 only. Stop and report when the schema gate is green.

## Appendix C — Maintainer quick reference

```
# One-time
cargo build --release -p bl4-cli   # -> tools/bin/bl4
# AES key + install path into tools/datamine/.env (gitignored)

# Per patch
bash tools/datamine/acquire.sh
node tools/datamine/manifest.ts diff
node tools/datamine/report-coverage.ts
# review data/changes/{patch}.json, annotate, commit
```

Definition of a good datamine day: pipeline proven, oracle rejecting bad mappings, gaps enumerated. Not: all items mapped.
