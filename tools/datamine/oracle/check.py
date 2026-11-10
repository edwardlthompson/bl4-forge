#!/usr/bin/env python3
"""Oracle: compare compiler output vs card-expected modifiers. Fail-closed."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from parse_card import parse_body  # noqa: E402

TOLERANCE = 1e-6


def normalize(effects: list[dict]) -> list[tuple]:
    rows = []
    for e in effects:
        rows.append(
            (
                e.get("op"),
                e.get("target"),
                None if e.get("value") is None else round(float(e["value"]), 6)
                if isinstance(e.get("value"), (int, float))
                else e.get("value"),
            )
        )
    return sorted(rows)


def check_item(card_text: str, compiled: list[dict], *, corrupt: bool = False) -> dict:
    expected = parse_body(card_text)
    if corrupt:
        # Deliberately wrong mapping: flip first mul value if present
        compiled = [dict(e) for e in compiled]
        for e in compiled:
            if e.get("op") == "mul" and isinstance(e.get("value"), (int, float)):
                e["value"] = float(e["value"]) * 1.5
                break
    exp_n = normalize(expected)
    got_n = normalize(compiled)
    ok = exp_n == got_n
    return {
        "pass": ok,
        "expected": expected,
        "compiled": compiled,
        "card_text": card_text,
    }


def main() -> int:
    # Self-test: matching card vs compiler
    card = "+25% Gun Damage"
    compiled = parse_body(card)
    good = check_item(card, compiled)
    bad = check_item(card, compiled, corrupt=True)
    report = {
        "matching": good["pass"],
        "corrupted_rejected": not bad["pass"],
        "tolerance": TOLERANCE,
    }
    out = ROOT / "data" / "indexes" / "oracle-selftest.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report))
    if not (report["matching"] and report["corrupted_rejected"]):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
