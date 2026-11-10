#!/usr/bin/env python3
"""Merge data/guides Rafa meta + spend into examples/web fixture."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
META = ROOT / "data" / "guides" / "rafa_peacebreaker_leveling.json"
SPEND = ROOT / "data" / "guides" / "rafa_peacebreaker_spend.json"
OUT = ROOT / "examples" / "web" / "src" / "guide" / "fixture.json"


def main() -> int:
    meta = json.loads(META.read_text(encoding="utf-8"))
    spend = json.loads(SPEND.read_text(encoding="utf-8"))
    meta["skill_spend_order"] = spend["spend"]
    meta.pop("spend_file", None)
    OUT.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"rows": len(meta["skill_spend_order"]), "out": str(OUT)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
