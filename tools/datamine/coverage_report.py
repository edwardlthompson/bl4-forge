#!/usr/bin/env python3
"""Coverage / quarantine report + leaderboard freeze status.

Experimental MVP boards are unfrozen by default. HUMAN spot-check remains
required only for published/`confirmed` promotion — not an MVP blocker.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
META = ROOT / "data" / "meta.json"
QUAR = ROOT / "data" / "indexes" / "quarantine.json"
QUAR_SUM = ROOT / "data" / "indexes" / "quarantine-summary.json"
PROMOTED = ROOT / "data" / "indexes" / "promoted.json"
SPOT = ROOT / "data" / "indexes" / "spot_check_passed.json"
PARTS = ROOT / "data" / "indexes" / "parts.json"
BOARD = ROOT / "leaderboards" / "scaffold" / "index.json"
OUT = ROOT / "data" / "indexes" / "coverage-report.json"


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def main() -> int:
    meta = json.loads(META.read_text(encoding="utf-8")) if META.exists() else {}
    parts = json.loads(PARTS.read_text(encoding="utf-8")) if PARTS.exists() else {}
    part_rows = parts.get("parts") or parts.get("items") or []
    if isinstance(parts, list):
        part_rows = parts

    quarantine_count = 0
    if QUAR.exists():
        quarantine_count = len(json.loads(QUAR.read_text(encoding="utf-8")).get("items") or [])
    elif QUAR_SUM.exists():
        quarantine_count = int(json.loads(QUAR_SUM.read_text(encoding="utf-8")).get("count") or 0)

    promoted = json.loads(PROMOTED.read_text(encoding="utf-8")) if PROMOTED.exists() else {}
    promo_mode = promoted.get("mode") or (meta.get("last_promotion") or {}).get("mode")
    promo_count = int(promoted.get("count") or 0)
    spot_ok = SPOT.exists()
    human_ready = promo_mode == "human_spot_check" and promo_count >= 20 and spot_ok

    # MVP: always lift experimental freeze; published certification still needs HUMAN.
    freeze_lifted = True
    board = json.loads(BOARD.read_text(encoding="utf-8")) if BOARD.exists() else {}
    board["freeze_lifted"] = True
    board["freeze_lifted_at"] = board.get("freeze_lifted_at") or _now()
    board["board_mode"] = "experimental_mvp" if not human_ready else "human_spot_check"
    board["disclaimer"] = (
        "Experimental MVP frontier — not a certified global optimum. "
        "HUMAN in-game spot-check still required before published/confirmed boards."
        if not human_ready
        else "Frontier of a sweep after HUMAN spot-check; not a certified global optimum."
    )
    if BOARD.exists():
        BOARD.write_text(json.dumps(board, indent=2) + "\n", encoding="utf-8")

    bound = sum(
        1
        for p in part_rows
        if isinstance(p, dict)
        and (p.get("attr_bind") or p.get("attribute_ranges") or p.get("effects"))
    )
    report = {
        "version": 2,
        "generated_at": _now(),
        "game_build": meta.get("game_build"),
        "parts_indexed": len(part_rows) or meta.get("coverage", {}).get("parts_indexed"),
        "parts_bound_estimate": bound,
        "quarantine_count": quarantine_count,
        "promoted_count": promo_count,
        "promotion_mode": promo_mode or "none",
        "spot_check_manifest_present": spot_ok,
        "leaderboard_freeze_lifted": freeze_lifted,
        "published_certification": "ready" if human_ready else "awaiting_human_spot_check",
        "gate": "green_experimental_mvp",
    }
    OUT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    QUAR_SUM.write_text(
        json.dumps(
            {
                "version": 1,
                "rule": "confirmed/published still needs human spot-check; experimental MVP is unfrozen",
                "count": quarantine_count,
                "coverage_gate": report["gate"],
                "note": "Full export gitignored as quarantine.json; regenerate via quarantine.py",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
