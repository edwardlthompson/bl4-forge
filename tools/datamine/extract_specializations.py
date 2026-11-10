#!/usr/bin/env python3
"""Stub extract for account-wide specializations (separate budget from VH trees)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ATTR = ROOT / "tools" / "datamine" / "out" / "attributes.json"
OUT = ROOT / "data" / "specializations.json"


def main() -> int:
    names: list[str] = []
    if ATTR.exists():
        for block in json.loads(ATTR.read_text(encoding="utf-8")):
            for n in block.get("entry_names") or []:
                if re.search(r"speciali[sz]ation", n, re.I):
                    names.append(n)
    # Dedupe preserve order
    seen: set[str] = set()
    uniq = []
    for n in names:
        if n not in seen:
            seen.add(n)
            uniq.append(n)
    skills = [
        {
            "id": re.sub(r"[^A-Za-z0-9_]+", "_", n)[:80],
            "max_rank": 5,
            "requires": [],
            "effect_text": n,
            "tags": ["specialization", "unparsed"],
        }
        for n in uniq[:40]
    ]
    if not skills:
        skills = [
            {
                "id": "spec_stub_root",
                "max_rank": 1,
                "requires": [],
                "effect_text": "Specialization stub pending deeper extract",
                "tags": ["specialization", "stub"],
            }
        ]
    payload = {
        "version": 1,
        "note": "Account-wide specializations; separate respec from VH trees. Stub/partial extract.",
        "trees": [{"id": "account", "display_name": "Specializations", "skills": skills}],
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"specialization_skills": len(skills)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
