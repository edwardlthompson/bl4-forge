# /patch-review

Offline LLM patch curation for BL4 Forge static builds. **No LLM in the runtime site.**

1. Read `docs/PATCH_REVIEW.md` and `.agent/DECISION_LOG.md` (LLM offline ≠ runtime).
2. Run `python3 tools/experimental-scrape/patch_check.py` (fetch assist).
3. Research procs/synergies across Gearbox, community, and local data — do **not** wait for the human to name combos.
4. Update experimental packs:
   - `data/experimental/builds/core.json`
   - `data/experimental/builds/adapters.json` (balanced / mobbing / bossing; one-slot swaps)
   - `data/experimental/procs.json`
   - `data/experimental/synergy_rules.json`
5. Prefer **one core** skill/spec path; archetypes differ by **one** gear/weapon swap.
6. Sync: `python3 scripts/sync_experimental_web.py` (+ guide fixture sync if spend changed).
7. Draft Unreleased changelog; leave commit to human unless asked.

Never write API keys, never add LLM calls to `examples/web` runtime.
