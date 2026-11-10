#!/usr/bin/env python3
"""Compile legendary weapons (+ priority shield/grenade) from drops into data/items.json."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DROPS = ROOT / "data" / "indexes" / "drops.json"
META = ROOT / "data" / "meta.json"
BOSS_LOCS = ROOT / "data" / "indexes" / "boss_locations.json"
OUT = ROOT / "data" / "items.json"
WEB_OUT = ROOT / "examples" / "web" / "src" / "items" / "catalog.json"

WEAPON_TYPES = {"PS", "SG", "SM", "AR", "SR", "HW"}
PRIORITY_NON_WEAPON = {
    "firewerks": "shield",
    "Waterfall": "grenade",
    "firepot": "grenade",
}
MFG_DISPLAY = {
    "JAK": "jakobs",
    "MAL": "maliwan",
    "VLA": "vladof",
    "TOR": "torgue",
    "TED": "tediore",
    "ORD": "order",
    "DAD": "daedalus",
    "BOR": "ripper",  # code BOR; display pending locres
}
TYPE_WEAPON = {
    "PS": "pistol",
    "SG": "shotgun",
    "SM": "smg",
    "AR": "assault_rifle",
    "SR": "sniper",
    "HW": "heavy",
}
LEGENDARY_RE = re.compile(
    r"^([A-Za-z0-9]+)_([A-Za-z0-9]+)\.comp_(\d+)_(legendary|epic|rare|uncommon|common|pearl)_(.+)$",
    re.I,
)
BLACK_MARKET_RE = re.compile(r"^([A-Za-z0-9]+)_([A-Za-z0-9]+)\.comp_blackmarket$", re.I)
WORLD_DROP_RE = re.compile(r"^World Drop", re.I)


def humanize(title: str) -> str:
    spaced = re.sub(r"_", " ", title)
    spaced = re.sub(r"([a-z\d])([A-Z])", r"\1 \2", spaced)
    spaced = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", spaced)
    parts = []
    for w in spaced.split():
        parts.append(w if w.isupper() else w[:1].upper() + w[1:])
    return " ".join(parts)


def parse_id(item_id: str) -> dict:
    bm = BLACK_MARKET_RE.match(item_id)
    if bm:
        return {
            "mfg": bm.group(1).upper(),
            "type": bm.group(2).upper(),
            "title": "DiscJockey",
            "black_market": True,
        }
    m = LEGENDARY_RE.match(item_id)
    if m:
        return {
            "mfg": m.group(1).upper(),
            "type": m.group(2).upper(),
            "title": m.group(5),
            "black_market": False,
        }
    # Non-weapon: vla_grenade_gadget.comp_05_legendary_Waterfall / tor_shield.comp_05_...
    if ".comp_" in item_id:
        prefix, rest = item_id.split(".comp_", 1)
        mfg = prefix.split("_", 1)[0].upper()
        title_m = re.search(r"(?:legendary|epic|rare)_(.+)$", rest, re.I)
        title = title_m.group(1) if title_m else rest
        return {"mfg": mfg, "type": prefix.upper(), "title": title, "black_market": False}
    raise ValueError(f"unrecognized item_id: {item_id}")


def preferred_boss(rows: list[dict]) -> str:
    dedicated = [
        r.get("source") or r.get("source_display") or ""
        for r in rows
        if not WORLD_DROP_RE.match(str(r.get("source_display") or r.get("source") or ""))
    ]
    dedicated = [s for s in dedicated if s]
    if dedicated:
        # Prefer non-_True / non-Nightmare pool labels when possible
        dedicated.sort(key=lambda s: ("Nightmare" in s, s.endswith("_True"), s))
        return dedicated[0]
    return rows[0].get("source") or rows[0].get("source_display") or "unknown"


def build_item(item_id: str, item_name: str, gear_type: str, rows: list[dict], game_build: str) -> dict:
    parsed = parse_id(item_id)
    mfg = parsed["mfg"]
    gtype = gear_type.upper()
    if gtype in WEAPON_TYPES:
        slot = "weapon"
        weapon_type = TYPE_WEAPON.get(gtype)
    elif gtype == "SHIELD":
        slot = "shield"
        weapon_type = None
    elif gtype == "GRENADE_GADGET":
        slot = "grenade"
        weapon_type = None
    else:
        slot = "weapon"
        weapon_type = None

    boss = preferred_boss(rows)
    evidence_refs = []
    for i, _r in enumerate(rows[:3]):
        evidence_refs.append(
            {
                "kind": "datamine_drop",
                "ref": f"drops:{item_name}:{i}",
                "game_build": game_build,
                "retrieved_at": "2026-11-10",
            }
        )

    drop: dict = {"boss": boss, "rate_band": "rare"}
    if BOSS_LOCS.exists():
        locs = json.loads(BOSS_LOCS.read_text(encoding="utf-8")).get("locations") or {}
        if boss in locs:
            loc = locs[boss]
            drop["location"] = f"{loc.get('map', '?')} / {loc.get('area', '?')}"
            drop["boss"] = loc.get("display") or boss
    # AGENT §5.4: has_location stays false until HUMAN-confirmed map evidence

    item: dict = {
        "id": item_id,
        "name": humanize(item_name),
        "slot": slot,
        "rarity": "legendary",
        "effects": [],
        "tag_only": True,
        "synergy_keys": [item_name.lower()],
        "obtainable": "unverified",
        "gate": "base",
        "has_location": False,
        "evidence": evidence_refs[:3],
        "drop": drop,
        "unparsed": True,
        "stale": False,
        "game_build": game_build,
        "manufacturer": MFG_DISPLAY.get(mfg, mfg.lower()),
        "red_text": "",
        "firmware_sensitive": True,
    }
    if weapon_type:
        item["weapon_type"] = weapon_type
    # Preserve exact search token
    item["synergy_keys"] = sorted(set(item["synergy_keys"] + [item_name]))
    return item


def main() -> int:
    raw = json.loads(DROPS.read_text(encoding="utf-8"))
    drops = raw.get("drops") or []
    meta = json.loads(META.read_text(encoding="utf-8")) if META.exists() else {}
    game_build = str(meta.get("game_build") or "unknown")

    groups: dict[str, list[dict]] = {}
    for row in drops:
        name = row.get("item_name") or ""
        gtype = row.get("gear_type") or ""
        if gtype in WEAPON_TYPES or name in PRIORITY_NON_WEAPON:
            key = row.get("item_id") or f"{name}:{gtype}"
            # Prefer canonical legendary id over blackmarket when grouping by name+type
            groups.setdefault(f"{name}::{gtype}", []).append(row)

    # Collapse to one item per name+gear_type, prefer non-blackmarket id
    items: list[dict] = []
    weapon_names: set[str] = set()
    for key, rows in sorted(groups.items()):
        name, gtype = key.split("::", 1)
        ids = sorted(
            {r["item_id"] for r in rows},
            key=lambda i: (".comp_blackmarket" in i.lower(), i),
        )
        item_id = ids[0]
        # Prefer matching legendary id for DiscJockey if both exist
        for cand in ids:
            if "legendary" in cand.lower():
                item_id = cand
                break
        item = build_item(item_id, name, gtype, rows, game_build)
        items.append(item)
        if gtype in WEAPON_TYPES:
            weapon_names.add(name)

    if len(weapon_names) < 87:
        print(f"FAIL: weapon unique names={len(weapon_names)} < 87", file=sys.stderr)
        return 1

    items.sort(key=lambda x: x["id"].lower())
    payload = {
        "version": 1,
        "experimental": True,
        "obtainable": "unverified",
        "compiled_from": "data/indexes/drops.json",
        "game_build": game_build,
        "weapon_count": len(weapon_names),
        "item_count": len(items),
        "items": items,
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    WEB_OUT.parent.mkdir(parents=True, exist_ok=True)
    WEB_OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT} weapons={len(weapon_names)} items={len(items)}")
    print(f"wrote {WEB_OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
