# Experimental community scrape + patch fetch (not production)

**Policy:** Allowlisted fetches into **experimental** fixtures only (`oracle: name_inferred`). Never promote into `confirmed`, leaderboards, or `data/indexes/`.

**Sprint 23:** Judgment is offline LLM via `/patch-review` (see `docs/PATCH_REVIEW.md`). Runtime Pages site stays no-LLM.

```bash
python3 tools/experimental-scrape/patch_check.py
python3 tools/experimental-scrape/scrape_skills.py
python3 tools/experimental-scrape/scrape_grenades.py
python3 tools/experimental-scrape/promote_experimental.py
python3 scripts/sync_experimental_web.py
```

- Raw HTML extracts → gitignored `tools/experimental-scrape/out/`
- Curated packs → `data/experimental/*.json` (+ `builds/`) committed with `"experimental": true`
