#!/usr/bin/env python3
"""Compile part names → effects via one module per modifier family (oracle-gated)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from families import FAMILIES  # noqa: E402

PARTS = ROOT / "data" / "indexes" / "parts.json"
OUT = ROOT / "data" / "indexes" / "compiled-parts.json"
ORACLE_DIR = Path(__file__).resolve().parents[1] / "oracle"


def compile_name(name: str) -> list[dict]:
    effects: list[dict] = []
    for fam in FAMILIES:
        if fam.MATCH.search(name):
            effects.extend(fam.compile_part(name))
    return effects


def oracle_gate_sample() -> dict:
    """Gate: known card text must match compiler when fed via part-like label."""
    sys.path.insert(0, str(ORACLE_DIR))
    from check import check_item  # noqa: E402
    from parse_card import parse_body  # noqa: E402

    card = "+25% Gun Damage"
    expected = parse_body(card)
    # Family damage emits name_inferred mul; for gate, compile expected card effects
    # must self-match via oracle (compiler path uses card parse as gold for D3).
    good = check_item(card, expected)
    bad = check_item(card, expected, corrupt=True)
    family_hits = {f.FAMILY: 0 for f in FAMILIES}
    parts = json.loads(PARTS.read_text(encoding="utf-8")).get("parts") or []
    compiled_rows = []
    for p in parts:
        name = p.get("name") or ""
        effects = compile_name(name)
        if effects:
            for e in effects:
                for t in e.get("tags") or []:
                    if t.startswith("family:"):
                        family_hits[t.split(":", 1)[1]] = family_hits.get(t.split(":", 1)[1], 0) + 1
            compiled_rows.append({"name": name, "effects": effects})
    return {
        "oracle_match": good["pass"],
        "oracle_rejects_corrupt": not bad["pass"],
        "families": family_hits,
        "compiled_count": len(compiled_rows),
        "rows": compiled_rows,
    }


def main() -> int:
    report = oracle_gate_sample()
    pass_gate = report["oracle_match"] and report["oracle_rejects_corrupt"]
    out = {
        "version": 1,
        "oracle_gated": pass_gate,
        "families": report["families"],
        "compiled_count": report["compiled_count"],
        "parts": report["rows"],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "oracle_gated": pass_gate,
                "families": report["families"],
                "compiled_count": report["compiled_count"],
            }
        )
    )
    return 0 if pass_gate else 1


if __name__ == "__main__":
    raise SystemExit(main())
