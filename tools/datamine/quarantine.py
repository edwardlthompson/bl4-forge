#!/usr/bin/env python3
"""Export quarantine set: unparsed / tag_only / name_inferred-only parts."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COMPILED = ROOT / "data" / "indexes" / "compiled-parts.json"
REPORT = ROOT / "data" / "indexes" / "card-parse-report.json"
OUT = ROOT / "data" / "indexes" / "quarantine.json"


def main() -> int:
    compiled = {}
    if COMPILED.exists():
        compiled = json.loads(COMPILED.read_text(encoding="utf-8"))
    misses = []
    if REPORT.exists():
        misses = json.loads(REPORT.read_text(encoding="utf-8")).get("misses") or []

    quarantine = []
    for row in compiled.get("parts") or []:
        effects = row.get("effects") or []
        if not effects:
            quarantine.append(
                {
                    "id": row.get("name"),
                    "reason": "no_effects",
                    "obtainable": "unverified",
                }
            )
            continue
        if all(e.get("oracle") == "name_inferred" for e in effects):
            quarantine.append(
                {
                    "id": row.get("name"),
                    "reason": "name_inferred_only",
                    "obtainable": "probable",
                    "effects": effects,
                }
            )
    for m in misses:
        quarantine.append(
            {
                "id": m.get("key"),
                "reason": "card_unparsed",
                "obtainable": "unverified",
                "body": m.get("body"),
            }
        )

    payload = {
        "version": 1,
        "rule": "Nothing datamine-derived is confirmed until human spot-check",
        "count": len(quarantine),
        "items": quarantine,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"quarantine_count": payload["count"]}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
