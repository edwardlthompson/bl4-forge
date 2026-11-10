# Datamine maintainer run-book

Visitor path: browser only. Maintainer path: legitimate game install + AES key + Rust toolchain.

## Pinned `bl4` toolchain

| Field | Value |
|-------|--------|
| Upstream | https://github.com/monokrome/bl4 |
| License | BSD-2-Clause |
| Pin | tag `v0.8.5` / commit `ae17c6dc5432364b05933f3a6ceeb739b2b52b07` |
| Binary path | `tools/bin/bl4` (Unix) or `tools/bin/bl4.exe` (Windows) — **gitignored**, never auto-updated |

Do not bump the pin without a deliberate patch ingest. Attribution: [`THIRD_PARTY_LICENSES.md`](../../THIRD_PARTY_LICENSES.md), [`REUSE.toml`](../../REUSE.toml).

### Install / rebuild

```bash
# From repo root (requires cargo)
bash tools/datamine/install-bl4.sh
# or PowerShell:
pwsh tools/datamine/install-bl4.ps1
```

Manual:

```bash
git clone --depth 1 --branch v0.8.5 https://github.com/monokrome/bl4.git tools/vendor/bl4
cargo build --release -p bl4-cli --manifest-path tools/vendor/bl4/Cargo.toml
# copy target/release/bl4(.exe) → tools/bin/
```

`tools/vendor/` is gitignored. The binary stays local; CI never runs extraction (no game install).

## Human touchpoints (agent must not fake)

1. Game install path → `tools/datamine/.env` (`BL4_INSTALL_PATH`)
2. AES key → same `.env` (`BL4_AES_KEY`); never commit
3. Spot-check **20** compiled items against **in-game** cards before any `confirmed` promotion (no proxy)

Copy `.env.example` → `.env` (gitignored).

## Skill + gear re-ingest (maintainer)

After a game patch or when trees/parts look stale:

```bash
# Gear extract → indexes (requires install + key)
python3 tools/datamine/localize.py
python3 tools/datamine/bind_balance.py
python3 tools/datamine/compile/promote_attrs.py   # if present
python3 tools/datamine/quarantine.py

# Skills (NCS + compile shards)
python3 tools/datamine/dump_skills.py
python3 tools/datamine/compile_skills.py
python3 tools/datamine/extract_specializations.py
```

Validate schemas via web gates / `ajv` on `schemas/skills.schema.json`. Planner legality lives in `examples/web/src/skills/legality.ts` (fixtures under `data/fixtures/`).

## Guide icons (HUMAN IP override — Sprint 24)

**Policy:** Commit/publish real game UI icons under `examples/web/public/icons/datamine/` for GitHub Pages. MIT covers *our* code only; icons remain © Gearbox/2K. See `.agent/DECISION_LOG.md` and guide footer disclaimer. FOSS monograms stay as `onerror` last resort only.

```bash
python3 tools/datamine/extract_icons.py --dry-run
# with install + AES in tools/datamine/.env:
python3 tools/datamine/extract_icons.py
python3 tools/datamine/extract_icons.py --promote
```

Manifest: `data/experimental/icon_manifest.json` (`pending_extract: true` until textures exist). Do **not** scrape bl4tools/Maxroll.

### HUMAN → confirmed → unfreeze

1. Copy `data/fixtures/spot_check_passed.example.json` → `data/indexes/spot_check_passed.json` (gitignored).
2. Fill ≥20 `{ id, card_match: true }` rows from real card tooltips.
3. `python3 tools/datamine/promote.py` (refuses proxy/yolo/empty).
4. `python3 tools/datamine/coverage_report.py` — lifts `leaderboards/scaffold` freeze only when mode is `human_spot_check`.

## Stage gates

Each stage ends with an update to [`HANDOFF.md`](HANDOFF.md). Oracle before compiler.

| Stage | Entry |
|-------|--------|
| D0 | `install-bl4` + key + extract + `game_build` in `data/meta.json` |
| D1+ | See `AGENT.md` §6.3 |
| Trust | HUMAN 20-card spot-check → `promote.py` → `coverage_report.py` |
