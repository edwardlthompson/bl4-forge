#!/usr/bin/env python3
"""Fail if Rafa experimental pack shrinks or weapon catalog ability list shrinks."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAFA = ROOT / "data" / "experimental" / "rafa_skill_effects.json"
WEAPONS = ROOT / "data" / "experimental" / "weapon_catalog.json"
ITEMS = ROOT / "data" / "items.json"

MIN_RAFA_SKILLS = 15
MIN_ABILITY_WEAPONS = 18
MIN_CATALOG_WEAPONS = 87


def main() -> int:
    rafa = json.loads(RAFA.read_text(encoding="utf-8"))
    n_rafa = len(rafa.get("skills") or {})
    weapons = json.loads(WEAPONS.read_text(encoding="utf-8"))
    n_ability = len(weapons.get("weapons") or [])
    items = json.loads(ITEMS.read_text(encoding="utf-8"))
    n_guns = items.get("weapon_count") or sum(
        1 for i in items.get("items") or [] if i.get("slot") == "weapon"
    )
    errors = []
    if n_rafa < MIN_RAFA_SKILLS:
        errors.append(f"rafa skills {n_rafa} < {MIN_RAFA_SKILLS}")
    if n_ability < MIN_ABILITY_WEAPONS:
        errors.append(f"ability weapons {n_ability} < {MIN_ABILITY_WEAPONS}")
    if n_guns < MIN_CATALOG_WEAPONS:
        errors.append(f"items weapons {n_guns} < {MIN_CATALOG_WEAPONS}")
    if errors:
        print("FAIL effect coverage:", "; ".join(errors), file=sys.stderr)
        return 1
    print(f"OK coverage rafa={n_rafa} ability={n_ability} weapons={n_guns}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
