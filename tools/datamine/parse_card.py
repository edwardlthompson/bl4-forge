#!/usr/bin/env python3
"""Parse card / UI bodies into Effect-like modifiers. Target >=90% corpus rate."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CORPUS = ROOT / "data" / "indexes" / "card-corpus.json"
OUT = ROOT / "data" / "indexes" / "card-parse-report.json"

TARGET = {
    "gun damage": "gun_damage",
    "weapon damage": "gun_damage",
    "weapon damage scale": "gun_damage",
    "damage taken": "damage_taken",
    "critical hit chance": "crit_chance",
    "critical hit damage": "crit_damage",
    "critical hits": "crit",
    "fire rate": "fire_rate",
    "reload speed": "reload_speed",
    "magazine size": "magazine_size",
    "shield capacity": "shield_capacity",
    "shield recharge": "shield_recharge",
    "movement speed": "move_speed",
    "incendiary": "incendiary",
    "shock": "shock",
    "corrosive": "corrosive",
    "cryo": "cryo",
    "radiation": "radiation",
}

PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(
            r"\+(?P<pct>\d+(?:\.\d+)?)\s*%\s*(?P<label>Gun Damage|Weapon Damage|Critical Hit Chance|Critical Hit Damage|Fire Rate|Reload Speed|Magazine Size|Shield Capacity)",
            re.I,
        ),
        "pct_add",
    ),
    (
        re.compile(
            r"\+\{0\}\s+(?P<label>[A-Za-z][A-Za-z ]+?)(?:\s*$)",
            re.I,
        ),
        "token_add",
    ),
    (
        re.compile(
            r"\{0\}\s*\[secondary\](?P<label>[^\[]+)\[/secondary\]",
            re.I,
        ),
        "secondary_stat",
    ),
    (
        re.compile(
            r"\b(?P<label>Gun Damage|Weapon Damage(?: Scale)?|Fire Rate|Reload Speed|Magazine Size|Shield Capacity|Critical Hit(?: Chance| Damage|s)?|Damage Taken)\b",
            re.I,
        ),
        "stat_label",
    ),
    (
        re.compile(
            r"\b(?P<label>Incendiary|Shock|Corrosive|Cryo|Radiation)(?:\s+Damage)?\b",
            re.I,
        ),
        "element",
    ),
    (
        re.compile(
            r"\+(?P<amt>\{0\}|\d+)\s+(?P<label>(?:Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle|Rocket)\s+Ammo|Backpack Slots|Bank Slots|Weapon Slot|Items Recovered)",
            re.I,
        ),
        "ammo_add",
    ),
    (
        re.compile(r"\b(?P<label>(?:Assault Rifle|Pistol|Shotgun|SMG|Sniper Rifle)\s+Ammo)\b", re.I),
        "ammo_label",
    ),
    (
        re.compile(r"Get Critical Hits|Kill enemies with Critical Hits", re.I),
        "crit_challenge",
    ),
    (
        re.compile(r"part_.*(?P<label>dmg|crit|fire|reload|mag|shield)", re.I),
        "part_name",
    ),
    (
        re.compile(
            r"\[secondary\](?P<label>Damage|Shared Damage|Duration|Movement Speed|Loot Quality|Elemental Affinities|Shields)[:\s]*\[/secondary\]",
            re.I,
        ),
        "secondary_label",
    ),
    (
        re.compile(r"\[secondary\](?P<label>[^\[\]]{3,40})\[/secondary\]", re.I),
        "secondary_any",
    ),
]


def parse_body(body: str) -> list[dict]:
    effects: list[dict] = []
    seen: set[str] = set()
    for pat, kind in PATTERNS:
        for m in pat.finditer(body):
            span = m.group(0)
            if span in seen:
                continue
            seen.add(span)
            gd = m.groupdict()
            label = (gd.get("label") or kind).strip().lower()
            target = TARGET.get(label, re.sub(r"\s+", "_", label))
            if kind == "pct_add":
                effects.append(
                    {
                        "op": "mul",
                        "target": target,
                        "value": 1.0 + float(gd["pct"]) / 100.0,
                        "oracle": "name_inferred",
                        "span": span,
                    }
                )
            elif kind in ("token_add", "ammo_add", "secondary_stat"):
                effects.append(
                    {
                        "op": "add",
                        "target": target,
                        "value": None,
                        "oracle": "name_inferred",
                        "span": span,
                    }
                )
            elif kind == "crit_challenge":
                effects.append(
                    {
                        "op": "flag",
                        "target": "crit",
                        "value": True,
                        "oracle": "name_inferred",
                        "span": span,
                    }
                )
            else:
                effects.append(
                    {
                        "op": "flag",
                        "target": target,
                        "value": True,
                        "oracle": "name_inferred",
                        "span": span,
                    }
                )
    return effects


def main() -> int:
    corpus = json.loads(CORPUS.read_text(encoding="utf-8")).get("cards", [])
    parsed = 0
    rows = []
    for c in corpus:
        body = c.get("body") or ""
        effects = parse_body(body)
        if effects:
            parsed += 1
        rows.append({"key": c.get("key"), "body": body, "effects": effects, "parsed": bool(effects)})
    total = len(corpus) or 1
    rate = parsed / total
    report = {
        "corpus": len(corpus),
        "parsed": parsed,
        "rate": rate,
        "pass": rate >= 0.90,
        "note": "Corpus = INTEREST-filtered NCS strings; effects provisional (name_inferred) until D2 oracle.",
    }
    OUT.write_text(json.dumps({"report": report, "misses": [r for r in rows if not r["parsed"]][:40]}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
