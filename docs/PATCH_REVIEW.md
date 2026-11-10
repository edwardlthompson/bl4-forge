# Patch review (offline LLM curation → static Pages)

**Runtime has no LLM.** Visitors only see frozen JSON on GitHub Pages.

## When to run

After a Borderlands 4 patch, datamine refresh, or when skill/gear text looks stale.

## Steps

1. Human: say `/patch-review` (or “run update check”) in Cursor Agent on this repo.
2. Optional fetch assist (no judgment):

   ```bash
   python3 tools/experimental-scrape/patch_check.py
   ```

   Writes allowlisted HTML/text under gitignored `tools/experimental-scrape/out/`.

3. LLM (maintainer session): search Gearbox + community + local `data/` / scrape out; list new/changed procs; recompute:
   - `data/experimental/builds/core.json` — one skill/spec core (Peacebreaker Action)
   - `data/experimental/builds/adapters.json` — mobbing / bossing / balanced **one-slot** swaps only
   - `data/experimental/procs.json` — structured procs found this pass
   - `data/experimental/synergy_rules.json` — verified loops
   - Guide fixture sync (`scripts/sync_rafa_guide_fixture.py` / spend generator as needed)
4. Sync web mirrors: `python3 scripts/sync_experimental_web.py`
5. Human reviews diff → commit → Pages deploy.

## Invariants

- Packs must set `"experimental": true` and `"obtainable": "unverified"`.
- Adapters must not require a full respec; `swap_slot` + `swap_item` only.
- Never promote these packs to `confirmed` / leaderboards without the human spot-check path.
- Do not call LLM APIs from the browser or CI score jobs.
