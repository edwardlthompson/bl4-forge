#!/usr/bin/env python3
"""Promote attribute-backed part effects into compiled-parts summary."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BOUND = ROOT / "data" / "indexes" / "parts-bound.json"
OUT = ROOT / "data" / "indexes" / "compiled-attr-summary.json"


def main() -> int:
    if not BOUND.exists():
        print(json.dumps({"ok": False, "error": "missing parts-bound.json"}))
        return 1
    doc = json.loads(BOUND.read_text(encoding="utf-8"))
    effects = 0
    by_target: dict[str, int] = {}
    sample = []
    for part in doc.get("parts") or []:
        for a in part.get("attributes") or []:
            effects += 1
            by_target[a["target"]] = by_target.get(a["target"], 0) + 1
            if len(sample) < 20:
                sample.append(
                    {
                        "part": part.get("name"),
                        "op": a["op"],
                        "target": a["target"],
                        "min": a["min"],
                        "max": a["max"],
                        "oracle": a["oracle"],
                    }
                )
    payload = {
        "version": 1,
        "attribute_effects": effects,
        "by_target": by_target,
        "sample": sample,
        "oracle": "name_inferred",
        "note": "Attribute-backed provisional; not card_match",
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"attribute_effects": effects, "targets": by_target}))
    return 0 if effects else 1


if __name__ == "__main__":
    raise SystemExit(main())
