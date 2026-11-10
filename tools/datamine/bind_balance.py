#!/usr/bin/env python3
"""Bind BalanceData property names → part attribute range hints on parts index."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BALANCE = ROOT / "tools" / "datamine" / "out" / "balance"
PARTS = ROOT / "data" / "indexes" / "parts.json"
OUT = ROOT / "data" / "indexes" / "parts-bound.json"
SUMMARY = ROOT / "data" / "indexes" / "balance-bind-summary.json"

PROP_MAP = [
    (re.compile(r"Damage_Scale|GunDamage|WeaponDamage|AllDamage", re.I), "gun_damage", "mul"),
    (re.compile(r"CritDamage|Critical", re.I), "crit_damage", "mul"),
    (re.compile(r"CritChance|CriticalHitChance", re.I), "crit_chance", "add"),
    (re.compile(r"FireRate", re.I), "fire_rate", "mul"),
    (re.compile(r"Reload", re.I), "reload_speed", "mul"),
    (re.compile(r"Magazine|MagSize|Clip", re.I), "magazine_size", "mul"),
    (re.compile(r"Shield.*(Capacity|Max)|MaxShield", re.I), "shield_capacity", "mul"),
    (re.compile(r"Shield.*(Regen|Recharge|Charge)", re.I), "shield_recharge", "mul"),
]


def harvest_props() -> list[dict]:
    props = []
    if not BALANCE.exists():
        return props
    for path in BALANCE.rglob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        names = data.get("names") or []
        for n in names:
            if not isinstance(n, str):
                continue
            for pat, target, op in PROP_MAP:
                if pat.search(n):
                    props.append(
                        {
                            "name": n,
                            "target": target,
                            "op": op,
                            "package": data.get("package_name"),
                            "file": str(path.relative_to(BALANCE)),
                        }
                    )
                    break
    return props


def bind_parts(parts: list[dict], props: list[dict]) -> list[dict]:
    # Index props by coarse target for fallback ranges.
    by_target: dict[str, list[dict]] = {}
    for p in props:
        by_target.setdefault(p["target"], []).append(p)

    bound = []
    for part in parts:
        name = part.get("name") or ""
        attrs = []
        # Name-inferred target from part id
        for pat, target, op in PROP_MAP:
            if pat.search(name):
                # Provisional range until numeric tables land in extract
                lo, hi = (1.05, 1.25) if op == "mul" else (0.02, 0.15)
                attrs.append(
                    {
                        "target": target,
                        "op": op,
                        "min": lo,
                        "max": hi,
                        "median": (lo + hi) / 2,
                        "oracle": "name_inferred",
                        "source": "part_name+balance_prop_presence",
                        "balance_hits": len(by_target.get(target, [])),
                    }
                )
        row = {**part, "attributes": attrs}
        bound.append(row)
    return bound


def main() -> int:
    parts_doc = json.loads(PARTS.read_text(encoding="utf-8")) if PARTS.exists() else {"parts": []}
    parts = parts_doc.get("parts") or []
    props = harvest_props()
    bound = bind_parts(parts, props)
    with_attrs = sum(1 for p in bound if p.get("attributes"))
    OUT.write_text(
        json.dumps({"version": 1, "parts": bound, "prop_count": len(props)}, indent=2) + "\n",
        encoding="utf-8",
    )
    # Slim committed summary; full bind can be large
    summary = {
        "parts": len(bound),
        "with_attributes": with_attrs,
        "balance_props_harvested": len(props),
        "targets": sorted({p["target"] for p in props}),
        "note": "Numeric ranges provisional (name+prop presence); deepen when table values extract cleanly",
    }
    SUMMARY.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    # Merge attributes onto parts.json slimly (only parts with attrs sample in meta)
    print(json.dumps(summary))
    return 0 if props else 1


if __name__ == "__main__":
    raise SystemExit(main())
