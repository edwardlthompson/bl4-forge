#!/usr/bin/env python3
"""Coverage reporter: parsed / tag_only / unparsed counters → data/meta.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
META = ROOT / "data" / "meta.json"
REPORT = ROOT / "data" / "indexes" / "card-parse-report.json"
PARTS = ROOT / "data" / "indexes" / "parts.json"
DROPS = ROOT / "data" / "indexes" / "drops.json"


def main() -> int:
    meta = json.loads(META.read_text(encoding="utf-8")) if META.exists() else {}
    rep = {}
    if REPORT.exists():
        rep = json.loads(REPORT.read_text(encoding="utf-8")).get("report") or {}
    parts_n = 0
    if PARTS.exists():
        parts_n = len(json.loads(PARTS.read_text(encoding="utf-8")).get("parts") or [])
    drops_n = 0
    if DROPS.exists():
        drops_n = len(json.loads(DROPS.read_text(encoding="utf-8")).get("drops") or [])

    parsed = int(rep.get("parsed") or 0)
    total = int(rep.get("corpus") or parsed)
    tag_only = 0
    unparsed = max(0, total - parsed)
    coverage = {
        "parsed": parsed,
        "tag_only": tag_only,
        "unparsed": unparsed,
        "total": total,
        "parts_indexed": parts_n,
        "drops_indexed": drops_n,
        "card_parse_rate": rep.get("rate"),
    }
    meta["coverage"] = coverage
    META.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    out = ROOT / "data" / "indexes" / "coverage.json"
    out.write_text(json.dumps(coverage, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(coverage))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
