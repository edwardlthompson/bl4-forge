"""Shield capacity / regen family."""
from __future__ import annotations

import re

MATCH = re.compile(r"shield|overshield", re.I)
FAMILY = "shield"


def compile_part(name: str) -> list[dict]:
    lower = name.lower()
    if not MATCH.search(name):
        return []
    target = "shield_recharge" if "regen" in lower or "charge" in lower else "shield_capacity"
    return [
        {
            "op": "mul",
            "target": target,
            "value": 1.1,
            "oracle": "name_inferred",
            "source_part": name,
            "tags": ["family:shield"],
        }
    ]
