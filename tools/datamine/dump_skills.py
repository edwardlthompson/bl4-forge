#!/usr/bin/env python3
"""Dump skill / augment / capstone tooltip corpus (long markup allowed)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CARDS = ROOT / "data" / "indexes" / "cards.json"
OUT = ROOT / "data" / "indexes" / "skill-corpus.json"

SKILLISH = re.compile(
    r"(skill|augment|capstone|action.?skill|specialization|passive|trait)",
    re.I,
)
TABLE_OK = re.compile(r"(skill|tooltip|siren|grav|exo|forge|cash|loveless)", re.I)


def main() -> int:
    if not CARDS.exists():
        # Fall back: run localize first path note
        print(json.dumps({"ok": False, "error": "missing cards.json; run localize.py"}))
        return 1
    cards = json.loads(CARDS.read_text(encoding="utf-8")).get("cards") or []
    corpus = []
    for c in cards:
        key = c.get("key") or ""
        table = c.get("table") or ""
        body = c.get("body") or ""
        if not (
            SKILLISH.search(key)
            or SKILLISH.search(table)
            or TABLE_OK.search(table)
            or "tooltips_skills" in table.lower()
        ):
            continue
        corpus.append(
            {
                "key": key,
                "table": table,
                "body": body,
                "raw": c.get("raw"),
                "source": c.get("source"),
            }
        )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"version": 1, "count": len(corpus), "cards": corpus}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"ok": True, "skill_corpus": len(corpus)}))
    return 0 if corpus else 1


if __name__ == "__main__":
    raise SystemExit(main())
