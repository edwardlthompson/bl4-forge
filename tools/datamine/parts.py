#!/usr/bin/env python3
"""Promote parts-manifest from out/ into data/indexes/parts.json."""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "tools" / "datamine" / "out" / "parts-manifest.json"
OUT = ROOT / "data" / "indexes" / "parts.json"
CAT = ROOT / "tools" / "datamine" / "out" / "category_names.json"


def main() -> int:
    if not SRC.exists():
        raise SystemExit(f"missing {SRC}; run: bl4 ncs extract -t manifest")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = json.loads(SRC.read_text(encoding="utf-8"))
    if CAT.exists():
        data["categories"] = json.loads(CAT.read_text(encoding="utf-8"))
    OUT.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT} parts={len(data.get('parts', []))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
