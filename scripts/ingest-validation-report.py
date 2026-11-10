#!/usr/bin/env python3
"""Emit ingest validation report from datamine indexes + meta."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
META = ROOT / "data" / "meta.json"
COVERAGE = ROOT / "data" / "indexes" / "coverage.json"
REPORT = ROOT / "data" / "indexes" / "ingest-validation.json"


def main() -> int:
    meta = json.loads(META.read_text(encoding="utf-8")) if META.exists() else {}
    cov = json.loads(COVERAGE.read_text(encoding="utf-8")) if COVERAGE.exists() else {}
    ok = bool(meta.get("game_build")) and float(cov.get("card_parse_rate") or 0) >= 0.9
    payload = {
        "ok": ok,
        "game_build": meta.get("game_build"),
        "coverage": cov,
        "checks": {
            "game_build_present": bool(meta.get("game_build")),
            "card_parse_ge_90": float(cov.get("card_parse_rate") or 0) >= 0.9,
        },
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
