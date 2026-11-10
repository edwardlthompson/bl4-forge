# Datamine handoff

## Current stage: Experimental MVP preview (Sprint 19) — HUMAN cards non-blocking

### D0–D7 (gear path)

Build `26007962`, parts 790, drops 300, card parse 100%, oracle + BalanceData bind (142 ranges). **Proxy promotions revoked.** Leaderboard freeze stays until HUMAN spot-check.

### Skills (Sprint 15–17)

| Artifact | Result |
|----------|--------|
| Skill corpus | `data/indexes/skill-corpus.json` |
| Catalog | `data/skills.json` — **6 hunters**, **426** skills (structure seeded) |
| Shards | `data/skills/{amon,rafa,vex,harlowe,c4sh,loveless}.json` |
| Legality + planner | `examples/web/src/skills/` + AppShell `forge` route |
| Fixtures | `data/fixtures/rules_unlock_hunter.json` (public unlock rules; no third-party dump) |

### MVP UI (Sprint 19–22)

Home → **Rafa build guide** (69-pt Peacebreaker fusion) primary; planner/specs/stats secondary. Guide icons: committed FOSS monograms under `examples/web/public/icons/mono/`; optional local extract via `extract_icons.py` → gitignored `tools/datamine/out/icons/` (never scrape Gearbox textures into git).

**Sprint 22 experimental scrape lane (brief override):** community skill/grenade tables may land in `data/experimental/` as `name_inferred` only — see `tools/experimental-scrape/README.md`. Not production packs; not leaderboards.

### MVP UI (Sprint 19)

Home → **Builds** (frontier) → **Build stats & synergy** (waterfall, gear roles, spec procs). **Specializations** planner encodes 4 base + 3 prestige nodes, sockets 1→4 at 0/10/20/30 pts, max 4 equipped.

### Trust (Sprint 18)

| Step | Status |
|------|--------|
| HUMAN 20-item in-game spot-check | **open / non-blocking** for experimental MVP |
| `promote.py` human-only | ready — still required for `confirmed` |
| `coverage_report.py` | experimental boards unfrozen (`green_experimental_mvp`) |
| Published certification | awaiting HUMAN |

### Next human action (optional for preview)

In-game card match for 20 compiled part ids → `promote.py` when ready for published boards.
