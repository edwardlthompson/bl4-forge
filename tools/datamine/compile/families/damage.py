"""Damage modifier family — name_inferred until oracle card_match."""
from __future__ import annotations

import re

_PATTERNS = [
    (re.compile(r"(?:all)?dmg|damage|splashdmg", re.I), "gun_damage"),
    (re.compile(r"dmg_reduction|damage.?taken", re.I), "damage_taken"),
]


def compile_part(name: str) -> list[dict]:
    effects: list[dict] = []
    lower = name.lower()
    if "dmg_reduction" in lower or "damage_taken" in lower:
        effects.append(
            {
                "op": "mul",
                "target": "damage_taken",
                "value": 0.9,
                "oracle": "name_inferred",
                "source_part": name,
                "tags": ["family:damage"],
            }
        )
        return effects
    for pat, target in _PATTERNS:
        if pat.search(name):
            effects.append(
                {
                    "op": "mul",
                    "target": target,
                    "value": 1.1,
                    "oracle": "name_inferred",
                    "source_part": name,
                    "tags": ["family:damage"],
                }
            )
            break
    return effects


FAMILY = "damage"
MATCH = re.compile(r"dmg|damage", re.I)
