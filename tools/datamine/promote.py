#!/usr/bin/env python3
"""Promote only HUMAN spot-checked items to confirmed.

Reads data/indexes/spot_check_passed.json (from the example fixture after a real
in-game card pass). Refuses proxy / empty / agent-invented batches.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COMPILED = ROOT / "data" / "indexes" / "compiled-parts.json"
SPOT = ROOT / "data" / "indexes" / "spot_check_passed.json"
OUT = ROOT / "data" / "indexes" / "promoted.json"
META = ROOT / "data" / "meta.json"


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_spot(path: Path) -> dict:
    if not path.exists():
        raise SystemExit(
            f"missing {path.relative_to(ROOT)} — copy fixtures/spot_check_passed.example.json "
            "and fill after a real in-game spot-check (no proxy)"
        )
    data = json.loads(path.read_text(encoding="utf-8"))
    if (data.get("verifier") or "").lower() != "human":
        raise SystemExit("spot_check_passed.verifier must be 'human'")
    batch = data.get("batch") or ""
    if "yolo" in batch.lower() or "proxy" in batch.lower():
        raise SystemExit("refusing proxy/yolo batch id")
    items = data.get("items") or []
    if len(items) < 1:
        raise SystemExit("spot_check_passed.items is empty")
    return data


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--manifest",
        type=Path,
        default=SPOT,
        help="HUMAN spot-check manifest (default: data/indexes/spot_check_passed.json)",
    )
    ap.add_argument(
        "--min-count",
        type=int,
        default=20,
        help="Minimum spot-checked items required (default 20)",
    )
    args = ap.parse_args()

    spot = load_spot(args.manifest)
    items = [i for i in (spot.get("items") or []) if i.get("id") and i.get("card_match") is True]
    if len(items) < args.min_count:
        print(
            json.dumps(
                {
                    "error": "insufficient_spot_checks",
                    "have": len(items),
                    "need": args.min_count,
                }
            ),
            file=sys.stderr,
        )
        return 1

    compiled = json.loads(COMPILED.read_text(encoding="utf-8")) if COMPILED.exists() else {}
    by_name = {r.get("name"): r for r in (compiled.get("parts") or []) if r.get("name")}

    now = _now()
    promoted = []
    missing = []
    for entry in items:
        pid = entry["id"]
        row = by_name.get(pid)
        if not row:
            missing.append(pid)
            continue
        promoted.append(
            {
                "id": pid,
                "obtainable": "confirmed",
                "evidence": [
                    {
                        "kind": "ingame_verified",
                        "by": "human",
                        "batch": spot.get("batch"),
                        "retrieved_at": now,
                        "notes": entry.get("notes") or "",
                    }
                ],
                "effects": row.get("effects") or [],
            }
        )

    if missing:
        print(json.dumps({"error": "unknown_part_ids", "missing": missing}), file=sys.stderr)
        return 1

    payload = {
        "version": 1,
        "promoted_at": now,
        "count": len(promoted),
        "mode": "human_spot_check",
        "batch": spot.get("batch"),
        "items": promoted,
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    if META.exists():
        meta = json.loads(META.read_text(encoding="utf-8"))
        meta["last_promotion"] = {
            "at": now,
            "count": len(promoted),
            "mode": "human_spot_check",
            "batch": spot.get("batch"),
        }
        META.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"promoted": len(promoted), "mode": "human_spot_check"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
