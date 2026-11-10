# Build Plan

<!-- remaining-tally -->
**Remaining:** AGENT 2 · LOCAL 2 · CLOUD 0 · AUTO 4 · HUMAN 3 · ADB 0 · **9 open**
<!-- /remaining-tally -->

Live board for a product repo. Finished work: [`COMPLETED_TASKS.md`](COMPLETED_TASKS.md).

**Who:** `AGENT` code · `HUMAN` person · `ADB` device · `AUTO` CI/scripts
**Venue (AGENT only):** `[LOCAL]` This Computer · `[CLOUD]` Cursor Cloud — [`docs/adr/0008-agent-venue.md`](docs/adr/0008-agent-venue.md)
**State:** 🔲 open · ✅ done · ❌ blocked — reason

Format: `🔲 [AGENT][LOCAL] Short task — scope: path/prefix` (or `[CLOUD]`). Sequential `[AGENT]` first. Parallel scopes: [`docs/PARALLEL_AGENT_SCOPES.md`](docs/PARALLEL_AGENT_SCOPES.md). `/build` on This Computer picks LOCAL only; Cloud picks CLOUD only. HUMAN/ADB after automation → `HUMAN_BACKLOG.md`.

Product board for **BL4 Forge**. Source brief: [`AGENT.md`](AGENT.md). Process law: [`AGENTS.md`](AGENTS.md).

## Smoke gate (hard stop)

After every `[AGENT]` row: `python3 scripts/agent-run.py watch-agent-gates --once --autofix --scope auto`

After the **last** `[AGENT]`/`[AUTO]` row in a sprint is ✅, do **not** start the next sprint until this exits 0:

```bash
python3 scripts/agent-run.py smoke-sprint --require

```

That command re-smokes **every** ✅ row: no errors or crashes, plus startup time and load order. Details: [`docs/SPRINT_SMOKE.md`](docs/SPRINT_SMOKE.md). Fail → leave the last row open or ❌; fix; re-run. `/gates` wrap-up includes the same check.

---

## Product

Copy this shape when you add sprints: `### Sprint N — title`, then numbered rows. Keep it this short.

### Product (do not drift)

> Auto-managed from `AGENT.md` after init. Do not hand-edit inside markers. Read `AGENT.md` before any sprint row.

<!-- product-brief-sync:begin -->
> Read `AGENT.md` before any sprint row.

**One-liner:** Deterministic Borderlands 4 min/max build solver and public build leaderboard. No LLM in the loop.
**Do not drift:** borderlands, build-planner, solver, leaderboard, datamine, deterministic, github-pages
<!-- product-brief-sync:end -->

### Sprint 0 — Scaffold

<!-- parallel_exception: scaffold is sequential lock -->

1. ✅ [AGENT][LOCAL] Init script (`--stack web --profile full`), verify, repo baseline — scope: scripts/
2. ✅ [HUMAN] Pages source set to GitHub Actions (`build_type=workflow`, not Deploy from `/docs`) — scope: .github/workflows/pages.yml
3. ✅ [AGENT][LOCAL] `/tour` completed (tour-verify passed) — scope: docs/
4. 🔲 [AUTO] Sprint 0 sign-off on `main`: `validate-bootstrap --quick` · `feature-gate --stack web` · `check-github-ci --wait 300` · `check-license-compliance`

> **Sprint 1 — Contracts** archived in COMPLETED_TASKS.md @ `c42cdf3` (local; commit pending).

> **Sprint 2 — Simulator** archived in COMPLETED_TASKS.md @ `c42cdf3` (local; commit pending).

> **Sprint 3 — Datamine D0** archived in COMPLETED_TASKS.md (agent-verified extract).

> **Sprint 4 — Datamine D1** archived in COMPLETED_TASKS.md (parts 790 · drops 300 · card parse 100%).

> **Sprint 5 — Datamine D2** archived in COMPLETED_TASKS.md @ `c42cdf3` (oracle + coverage).

> **Sprint 6 — Datamine D3–D5** archived in COMPLETED_TASKS.md (6 families · 394 compiled · quarantine).

> **Sprint 7 — Datamine D6–D7** archived in COMPLETED_TASKS.md (diff + proxy spot-check + promote 20).

> **Sprint 8 — Solver** archived in COMPLETED_TASKS.md (prune→beam→anneal→Pareto/maximin).

> **Sprint 9 — Sweep** archived in COMPLETED_TASKS.md (seeds→matrix→dedupe→rescore→freeze).

> **Sprint 10 — Reporting** archived in COMPLETED_TASKS.md (waterfall/diff/sensitivity/provenance/routes).

> **Sprint 11 — Site** archived in COMPLETED_TASKS.md (workers/site logic; UX-001..003 planned).

> **Sprint 12 — Ops** archived in COMPLETED_TASKS.md (forge-golden + a11y CI + ingest report).

### Sprint 13 — Ship

<!-- parallel_exception: sequential lock for Sprint 13 — Ship -->

1. ❌ [AGENT][LOCAL] `pre-release-gate.sh` — scope: scripts/ — local fail: WSL1/npm path + license check env; needs `/ship` on healthy shell after commit
2. 🔲 [AGENT][LOCAL] `check-github-ci.sh --wait 300` — scope: scripts/ — blocked until commit + `[HUMAN]` `/push`
3. ✅ [AGENT][LOCAL] Release notes, tag — scope: CHANGELOG.md — Unreleased forge bullets drafted (tag deferred to human)

> Sprint 13 remains blocked on commit/`/push`. Gap-closure Sprints 14–18 run next (product-critical).

> **Sprint 14 — Skill contracts + legality** archived in COMPLETED_TASKS.md.

> **Sprint 15 — Skill dump + six hunters** archived in COMPLETED_TASKS.md (6 hunters · 426 skills · quarantined effects).

> **Sprint 16 — BalanceData bind + god-roll** archived in COMPLETED_TASKS.md (142 parts bound · god-roll in pipeline).

> **Sprint 17 — Designer parity UI** archived in COMPLETED_TASKS.md (forge planner + parity tests; UX-001 done).

> **Sprint 18 — Trust + unquarantine path** AGENT rows archived; HUMAN spot-check stays open but **non-blocking** for experimental MVP.

> **Sprint 19 — MVP preview** archived (stub frontier demoted by Sprint 20 Rafa guide).

### Sprint 20 — Rafa Build Guide

<!-- parallel_exception: sequential lock for Sprint 20 — Rafa Build Guide -->

1. ✅ [AGENT][LOCAL] Rafa name overlay + curated guide fixture + `repkit` slot — scope: data/
2. ✅ [AGENT][LOCAL] Spend-order + desired-rolls models + tests — scope: examples/web/src/guide/
3. ✅ [AGENT][LOCAL] Build Guide page (Rafa) as primary AppShell route — scope: examples/web/src/
4. ✅ [AGENT][LOCAL] Demote stub MVP frontier; Stats secondary only — scope: examples/web/src/
5. ✅ [AGENT][LOCAL] UX inventory + gates/smoke for Sprint 20 — scope: BUILD_PLAN.md

### Sprint 21 — Rafa 69-pt guide + FOSS icons

<!-- parallel_exception: sequential lock for Sprint 21 — Rafa 69-pt guide + icons -->

1. ✅ [AGENT][LOCAL] rules.json → level 70 / 69 pts; multi-tree Rafa guide (69 reasoned points, Action-tree lock, augment swaps) — scope: data/, examples/web/src/guide/
2. ✅ [AGENT][LOCAL] FOSS monogram icons + tree color tokens + resolver — scope: examples/web/public/icons/, examples/web/src/
3. ✅ [AGENT][LOCAL] Guide panel redesign (tree-colored titles, cards, timeline, gear icons) — scope: examples/web/src/components/, style.css
4. ✅ [AGENT][LOCAL] Optional datamine icon extract stub (gitignored out) + docs — scope: tools/datamine/
5. ✅ [AGENT][LOCAL] Tests + gates/smoke — scope: examples/web/, BUILD_PLAN.md

### Sprint 22 — Per-rank effects + grenade synergy (experimental scrape)

<!-- parallel_exception: sequential lock for Sprint 22 — effects + grenade synergy -->

1. ✅ [AGENT][LOCAL] Effect schema + while_overdrive + rank resolver + tests — scope: schemas/, examples/web/src/skills/, examples/web/src/sim/
2. ✅ [AGENT][LOCAL] Experimental scrape toolchain + Rafa skill magnitudes (name_inferred) — scope: tools/experimental-scrape/, data/experimental/
3. ✅ [AGENT][LOCAL] Guide spend cards show per-rank % + cumulative; validateGuide effect coverage — scope: examples/web/src/guide/, components/BuildGuidePanel*
4. ✅ [AGENT][LOCAL] Wire VH+spec effects into composeBuildStats / BuildStatsPanel waterfall — scope: examples/web/src/mvp/, components/BuildStatsPanel*
5. ✅ [AGENT][LOCAL] Grenade experimental catalog (payloads/augments/perks) scrape + schema — scope: tools/experimental-scrape/, data/experimental/, schemas/
6. ✅ [AGENT][LOCAL] Synergy detect rules + UI + guide grenade recommendation — scope: examples/web/src/synergy/, stats/guide panels
7. ✅ [AGENT][LOCAL] Gates/smoke + DECISION_LOG brief override — scope: BUILD_PLAN.md, .agent/

### Sprint 23 — LLM offline curation → static Pages builds

<!-- parallel_exception: sequential lock for Sprint 23 — static curated builds -->

1. ✅ [AGENT][LOCAL] DECISION_LOG + patch-review docs/command + build/adapter schemas — scope: .agent/, docs/, schemas/, tools/experimental-scrape/
2. ✅ [AGENT][LOCAL] Static core + mob/boss/balanced adapters (BB, El Paraguas, Firewerk, firmware, Grenazerker) — scope: data/experimental/, data/guides/
3. ✅ [AGENT][LOCAL] Guide UI: hero removal, top bar, two-column spend, archetype swap — scope: BuildGuidePanel.ts, style.css, locales
4. ✅ [AGENT][LOCAL] Firmware totals + COM skill recommendations — scope: examples/web/src/experimental/
5. ✅ [AGENT][LOCAL] Tests + gates/smoke — scope: examples/web/, BUILD_PLAN.md

### Sprint 24 — Icons, precise math, full enhancements → god-roll weapons

<!-- parallel_exception: sequential lock for Sprint 24 — icons + damage order + enhancements -->

1. 🔲 [HUMAN] AES + install for icon extract (IP override chosen: publish datamine icons) — scope: tools/datamine/
2. ✅ [AGENT][LOCAL] Icon extract→promote, manifest, disclaimer, monogram demotion — scope: tools/datamine/, examples/web/public/icons/, guide icons
3. ✅ [AGENT][LOCAL] On-shot × on-hit compose + stages + tests — scope: examples/web/src/sim/, schemas/
4. ✅ [AGENT][LOCAL] Full enhancement catalog + scoreEnhancements + tests — scope: data/experimental/, examples/web/src/experimental/
5. ✅ [AGENT][LOCAL] godrollFromBuild + weapon_godrolls + guide sections — scope: data/experimental/, guide UI
6. ✅ [AGENT][LOCAL] Guide chrome (wide gutters, topband) — scope: BuildGuidePanel.ts, style.css, locales
7. ✅ [AGENT][LOCAL] Gates/smoke + DECISION_LOG — scope: BUILD_PLAN.md, .agent/

### Sprint 25 — Legendary catalog + Rafa discovery solver

<!-- parallel_exception: sequential lock for Sprint 25 — legendary catalog + Rafa solver -->

1. ✅ [AGENT][LOCAL] Naming module + compile 87 legendaries (+ priority shield/grenade) from drops → items.json — scope: examples/web/src/items/, tools/datamine/, data/
2. ✅ [AGENT][LOCAL] Weapon roll_slots catalog + ability flags; wire enumerateGodRolls to part pools — scope: data/experimental/, examples/web/src/solver/
3. ✅ [AGENT][LOCAL] Rafa candidate factory + dual-scenario score + anneal skills/loadout + worker primary UI — scope: examples/web/src/
4. ✅ [AGENT][LOCAL] Tests + gates/smoke for Sprint 25 — scope: examples/web/, BUILD_PLAN.md

### Sprint 26 — Farms UX + six hunters

<!-- parallel_exception: sequential lock for Sprint 26 — farms + multi-hunter -->

1. ✅ [AGENT][LOCAL] Boss→map location join + shopping list farmRoute from solver gear — scope: data/indexes/, examples/web/src/report/, components/
2. ✅ [AGENT][LOCAL] Bundle six skill trees + hunter picker + coverage banners — scope: examples/web/src/
3. ✅ [AGENT][LOCAL] Tests + gates/smoke for Sprint 26 — scope: examples/web/, BUILD_PLAN.md

### Sprint 27 — Red text / oracle / skill packs

<!-- parallel_exception: sequential lock for Sprint 27 — effects honesty -->

1. ✅ [AGENT][LOCAL] Legendary red-text/effect bind + quarantine; remaining hunter skill packs stubs — scope: data/, tools/, examples/web/src/
2. ✅ [AGENT][LOCAL] Coverage CI gate for numeric regression — scope: scripts/, .github/
3. ✅ [AGENT][LOCAL] Tests + gates/smoke for Sprint 27 — scope: examples/web/, BUILD_PLAN.md

### Sprint 28 — Sweep + experimental boards

<!-- parallel_exception: sequential lock for Sprint 28 — sweep freeze -->

1. ✅ [AGENT][LOCAL] Wire real factory into sweep; dedupe/diversity; freeze experimental leaderboards — scope: examples/web/src/sweep/, leaderboards/
2. ✅ [AGENT][LOCAL] Page copy: frontier not certified; published blocked on HUMAN spot-check — scope: examples/web/src/, leaderboards/
3. ✅ [AGENT][LOCAL] Tests + gates/smoke for Sprint 28 — scope: examples/web/, BUILD_PLAN.md

> **Sprint 19 — MVP preview** archived in COMPLETED_TASKS.md (experimental unfreeze; stub frontier demoted).

### Waiting on a person

1. 🔲 [HUMAN] 20-item **in-game** card spot-check (no proxy) — scope: tools/datamine/ — non-blocking; required only for `confirmed` / published boards
2. 🔲 [HUMAN] Run `extract_icons.py` (+ `--promote`) when AES/install ready so `icon_manifest` clears `pending_extract` — scope: tools/datamine/

### Open PRs (synced)

> Auto-managed on product repos too. Do not hand-edit rows inside the markers.

<!-- open-prs-sync:begin -->
- 🔲 [AUTO] Merge Dependabot [#4](https://github.com/edwardlthompson/bl4-forge/pull/4) (Bump the github-actions group with 2 updates)
- 🔲 [AUTO] Merge Dependabot [#2](https://github.com/edwardlthompson/bl4-forge/pull/2) (Bump the node-dependencies group in /examples/node with 6 updates)
- 🔲 [AUTO] Merge Dependabot [#1](https://github.com/edwardlthompson/bl4-forge/pull/1) (Bump the web-dependencies group in /examples/web with 4 updates)
<!-- open-prs-sync:end -->

### Template gaps (synced)

> Auto-managed Monday cron + `sync-template-gaps-build-plan`. Do not hand-edit inside markers. Plan-only — run `/upgrade` then name item numbers.

<!-- template-gaps-sync:begin -->
_No template gaps; .template-version matches upstream (or template maintainer N/A)._
<!-- template-gaps-sync:end -->

### UX & UI inventory

Complete list from construction gaps and `/ux-review`. Status is only planned / in_progress / done. `/build` does not execute these until `/ux-apply UX-NNN` (or a Sequential row). Follow [`docs/ux-ui-guidelines.md`](docs/ux-ui-guidelines.md) when shipping UI.

<!-- ux-inventory:begin -->
### UX-006 — Interactive skill-tree canvas

- **Status:** planned
- **Source:** /ux-review guide surface
- **Severity:** medium
- **Effort:** L
- **Impact:** high
- **Where:** `examples/web` forge guide / skill planner
- **What's wrong:** Spend order is list/pill only; no Maxroll-class interactive tree canvas.
- **Why:** Players need spatial tree navigation to understand fusion and augment adjacency.
- **Fix:** Add an interactive skill-tree canvas with tree colors, legality, and spend sync.
- **Pattern:** One composition; brand tokens; no card spam; keyboard focus + empty/error/loading.
- **Success:** Canvas shows Action/Augment/Capstone paths and stays in sync with spend order.
<!-- ux-inventory:end -->

### Local agent (This Computer)

Standing queue for This Computer. Rows: `🔲 [AGENT][LOCAL] … — scope: path`. `/build` claims these only. See [`docs/adr/0008-agent-venue.md`](docs/adr/0008-agent-venue.md).

<!-- local-agent-lane:begin -->
_No local agent items._
<!-- local-agent-lane:end -->

### Cloud agent (Cursor Cloud)

Standing queue for Cursor Cloud. Rows: `🔲 [AGENT][CLOUD] … — scope: path`. Cloud claims these only (`cursor/*`). Never edit Local lane or `[LOCAL]` rows.

<!-- cloud-agent-lane:begin -->
_No cloud agent items._
<!-- cloud-agent-lane:end -->

---

## Ongoing Maintenance

Not a checklist. GitHub Monday cron (`.github/workflows/weekly-health-check.yml`) already runs CI wait, security triage, parent template-gap BUILD_PLAN sync (this child board), radar, `update-deps` dry-run, Dependabot leftover list, open-PR BUILD_PLAN sync, and latest-release SBOM. Upgrade-sim stays on the template maintainer repo. `/ship` owns pre-release and the release tag.

If Monday cron is red: Cursor Automation `weekly-maintain`, then Grok Bot 4–5. Do not put those chores back on this board. [`docs/GROK_BOTS.md`](docs/GROK_BOTS.md) · [`docs/CURSOR_AUTOMATIONS.commercial.md`](docs/CURSOR_AUTOMATIONS.commercial.md)

---

## Archive

Older sprints: [`COMPLETED_TASKS.md`](COMPLETED_TASKS.md).

| Sprint | Complete | Archive |
|--------|----------|---------|
| Sprint 1 — Contracts | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 2 — Simulator | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 3 — Datamine D0 | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 4 — Datamine D1 | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 5 — Datamine D2 | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 6 — Datamine D3–D5 | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 7 — Datamine D6–D7 | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 8 — Solver | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 9 — Sweep | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 10 — Reporting | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 11 — Site | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 12 — Ops | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 14 — Skill contracts + legality | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 15 — Skill dump + six hunters | 2026-11-09 | COMPLETED_TASKS.md |
| Sprint 16 — BalanceData bind + god-roll | 2026-11-09 | COMPLETED_TASKS.md |
