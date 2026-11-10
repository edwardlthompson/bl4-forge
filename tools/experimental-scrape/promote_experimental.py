#!/usr/bin/env python3
"""Validate experimental packs; never writes confirmed/indexes."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXP = ROOT / "data" / "experimental"
REQUIRED = (
    "rafa_skill_effects.json",
    "grenade_catalog.json",
    "synergy_rules.json",
    "firmware_catalog.json",
    "procs.json",
    "builds/core.json",
    "builds/adapters.json",
)


def check_pack(path: Path) -> list[str]:
    errors: list[str] = []
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("experimental") is not True:
        errors.append(f"{path.name}: experimental must be true")
    if data.get("obtainable") != "unverified":
        errors.append(f"{path.name}: obtainable must be unverified")
    blob = json.dumps(data)
    if '"card_match"' in blob:
        errors.append(f"{path.name}: card_match forbidden in experimental packs")
    if path.name == "adapters.json":
        for key in ("balanced", "mobbing", "bossing"):
            ad = data.get("adapters", {}).get(key)
            if not ad or "swap_slot" not in ad or "swap_item" not in ad:
                errors.append(f"adapters missing swap fields for {key}")
    return errors


def main() -> int:
    errors: list[str] = []
    for name in REQUIRED:
        path = EXP / name
        if not path.is_file():
            errors.append(f"missing {name}")
            continue
        errors.extend(check_pack(path))
    if errors:
        print(json.dumps({"ok": False, "errors": errors}))
        return 1
    print(json.dumps({"ok": True, "packs": list(REQUIRED)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
