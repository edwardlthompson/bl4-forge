"""Crit chance / crit damage family."""
from __future__ import annotations

import re

MATCH = re.compile(r"crit|critical", re.I)
FAMILY = "crit"


def compile_part(name: str) -> list[dict]:
    lower = name.lower()
    target = "crit_damage" if "damage" in lower or "crit_damage" in lower else "crit_chance"
    if "crit" not in lower and "critical" not in lower:
        return []
    return [
        {
            "op": "mul",
            "target": target,
            "value": 1.1,
            "oracle": "name_inferred",
            "source_part": name,
            "tags": ["family:crit"],
        }
    ]
