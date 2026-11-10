#!/usr/bin/env python3
"""Agent-owned D0 smoke verification (automates HUMAN extract confirm when possible)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    balance = list((ROOT / "tools/datamine/out/balance").rglob("*.json"))
    ncs = list((ROOT / "tools/datamine/out/ncs").glob("*.bin"))
    meta = json.loads((ROOT / "data/meta.json").read_text(encoding="utf-8"))
    errors = []
    if len(balance) < 20:
        errors.append(f"balance json too few: {len(balance)}")
    for p in balance[:5]:
        json.loads(p.read_text(encoding="utf-8"))
    if len(ncs) < 1:
        errors.append("no ncs bins")
    if not meta.get("game_build") or meta["game_build"] in ("unknown", ""):
        errors.append("meta.game_build missing")
    if errors:
        print("D0 VERIFY FAIL:", "; ".join(errors))
        return 1
    print(
        f"D0 VERIFY OK balance_json={len(balance)} ncs={len(ncs)} game_build={meta['game_build']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
