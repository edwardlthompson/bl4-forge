#!/usr/bin/env python3
"""Manifest / index diff for patch cadence. Detects injected changes."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = ROOT / "data" / "changes"


def load_ids(path: Path) -> set[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "parts" in data:
        return {str(p.get("name") or p.get("id")) for p in data["parts"]}
    if isinstance(data, dict) and "items" in data:
        return {str(i.get("id") or i.get("name")) for i in data["items"]}
    if isinstance(data, list):
        return {str(x.get("id") if isinstance(x, dict) else x) for x in data}
    return set()


def diff(before: Path, after: Path) -> dict:
    a, b = load_ids(before), load_ids(after)
    return {
        "added": sorted(b - a),
        "removed": sorted(a - b),
        "unchanged": len(a & b),
        "changed": sorted((b - a) | (a - b)),
    }


def main() -> int:
    FIXTURES.mkdir(parents=True, exist_ok=True)
    before = FIXTURES / "fixture_before.json"
    after = FIXTURES / "fixture_after.json"
    if not before.exists():
        before.write_text(
            json.dumps({"parts": [{"name": "part_a"}, {"name": "part_b"}]}, indent=2) + "\n",
            encoding="utf-8",
        )
    if not after.exists():
        after.write_text(
            json.dumps(
                {"parts": [{"name": "part_a"}, {"name": "part_c_injected"}]},
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
    result = diff(before, after)
    out = FIXTURES / "diff-result.json"
    out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    detected = "part_c_injected" in result["added"] and "part_b" in result["removed"]
    print(json.dumps({"ok": detected, **{k: result[k] for k in ("added", "removed", "unchanged")}}))
    return 0 if detected else 1


if __name__ == "__main__":
    raise SystemExit(main())
