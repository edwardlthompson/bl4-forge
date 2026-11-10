#!/usr/bin/env python3
"""Expand specialization spend_order to point-by-point + equip/replace steps."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
META = ROOT / "data" / "guides" / "rafa_peacebreaker_leveling.json"
CORE = ROOT / "data" / "experimental" / "builds" / "core.json"


def points(node: str, start: int, end: int, unlock: str | None = None) -> list[dict]:
    rows = []
    for n in range(start, end + 1):
        reason = f"Invest {node} to {n}."
        if n == end and unlock:
            reason = f"Invest {node} to {n} — {unlock}"
        rows.append(
            {
                "kind": "node",
                "node": node.lower(),
                "to": n,
                "display_name": f"{node} → {n}",
                "reason": reason,
            }
        )
    return rows


def main() -> int:
    seq: list[dict] = []
    seq += points("Brute", 1, 10, "opens Killer prestige path")
    seq += points("Sharpshooter", 1, 10, "reload/accuracy bridge; unlocks Killer + Daredevil")
    seq += points("Runner", 1, 10, "with Sharpshooter 10 unlocks Daredevil prestige")
    seq.append(
        {
            "kind": "equip",
            "socket": 1,
            "skill_id": "now_with_caffeine",
            "display_name": "Equip: Now With Caffeine",
            "reason": "Socket 1 unlocks — Action Skill cooldown for Peacebreaker uptime. No replace.",
        }
    )
    seq += points("Brute", 11, 20, "unlocks Riddle You This")
    seq.append(
        {
            "kind": "equip",
            "socket": 2,
            "skill_id": "riddle_you_this",
            "display_name": "Equip: Riddle You This",
            "reason": "Socket 2 — gun-damage stacks while shooting feed Booming Business crits. Keep Caffeine.",
        }
    )
    seq += points("Daredevil", 1, 10, "opens I Am A Gun")
    seq.append(
        {
            "kind": "equip",
            "socket": 3,
            "skill_id": "i_am_a_gun",
            "display_name": "Equip: I Am A Gun",
            "reason": "Socket 3 — Peacebreaker scales with gun bonuses. Keep Caffeine + Riddle.",
        }
    )
    seq += points("Daredevil", 11, 20, "unlocks A Honed Mind")
    seq.append(
        {
            "kind": "equip",
            "socket": 4,
            "skill_id": "a_honed_mind",
            "display_name": "Equip: A Honed Mind",
            "reason": "Socket 4 (full) — Action Skill crit for more Booming Business. Keep prior three; do not replace.",
        }
    )
    seq += points("Killer", 1, 10, "crit/status path — sockets already full, no equip/replace")

    numbered = []
    for i, row in enumerate(seq, start=1):
        numbered.append({"step": i, **row})

    meta = json.loads(META.read_text(encoding="utf-8"))
    meta["spec"]["spend_order"] = numbered
    META.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    core = json.loads(CORE.read_text(encoding="utf-8"))
    core["class_mod"] = {
        "name": "Grenazerker",
        "rarity": "Legendary",
        "level": 70,
        "farm": "Radix (Primordial Guardian, Carcadia Burn) — play as Rafa",
        "unique": "Whenever Rafa throws a Grenade or Tediore gun, throw an additional one.",
        "search_exact": "Grenazerker · +3 Sinergia · +4 Confeti · +46% Splash Damage · Gadget Ahoy",
        "skill_bonuses": [
            {
                "id": "sinergia",
                "display_name": "Sinergia",
                "points": 3,
                "max": 3,
                "why": "Ordnance damage stacks gun + melee damage — mandatory max on this COM.",
            },
            {
                "id": "confeti",
                "display_name": "Confeti",
                "points": 4,
                "max": 5,
                "why": "Ordnance bonus damage in current gun element — pairs with Peacebreaker inherit + Collaborative Ignition.",
            },
        ],
        "skill_bonuses_total": 7,
        "fixed_stat": "+35% Gun Damage",
        "rolled_stat": "+46% Splash Damage",
        "firmware": "1× Gadget Ahoy",
        "reject_if": [
            "Any Arriba or Abajo points (wastes the 7-pt pool vs Sinergia/Confeti)",
            "Sinergia below +3",
            "Confeti below +4",
            "Random passive that is not Splash Damage",
        ],
        "desired_rolls": ["Splash Damage"],
        "desired_skills": [
            {
                "id": "sinergia",
                "display_name": "Sinergia +3",
                "why": "Exact: all 3 available Sinergia points.",
            },
            {
                "id": "confeti",
                "display_name": "Confeti +4",
                "why": "Exact: remaining 4 of 7 COM points into Confeti (not Arriba/Abajo).",
            },
        ],
        "note": "Grenazerker can ONLY roll Sinergia/Arriba/Abajo/Confeti — never Booming Business or El Paraguas.",
    }
    # Mirror into guide gear class_mod hint
    for g in meta.get("gear", []):
        if g.get("slot") == "class_mod":
            g["item_hint"] = "Grenazerker L70 — search: +3 Sinergia / +4 Confeti / Splash Damage / Gadget Ahoy"
            g["priorities"] = [
                "+3 Sinergia",
                "+4 Confeti",
                "+46% Splash Damage",
                "Gadget Ahoy firmware",
                "Fixed +35% Gun Damage",
            ]
            g["avoid"] = ["Arriba points", "Abajo points", "Sinergia <3", "Confeti <4", "non-Splash random passive"]
    meta["spec"]["equipped"] = [
        "now_with_caffeine",
        "riddle_you_this",
        "i_am_a_gun",
        "a_honed_mind",
    ]
    CORE.write_text(json.dumps(core, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    META.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print({"spec_steps": len(numbered), "com": core["class_mod"]["search_exact"]})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
