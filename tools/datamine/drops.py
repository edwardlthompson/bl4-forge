#!/usr/bin/env python3
"""Promote drops manifest from out/ into data/indexes/drops.json."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "tools" / "datamine" / "out" / "manifest" / "drops.json"
OUT = ROOT / "data" / "indexes" / "drops.json"


def main() -> int:
    if not SRC.exists():
        raise SystemExit(f"missing {SRC}; run: bl4 drops generate")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = json.loads(SRC.read_text(encoding="utf-8"))
    OUT.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT} drops={len(data.get('drops', []))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
