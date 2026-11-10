"""Fire rate family."""
from __future__ import annotations

import re

MATCH = re.compile(r"firerate|fire_rate|fire.?rate", re.I)
FAMILY = "fire_rate"


def compile_part(name: str) -> list[dict]:
    if not MATCH.search(name):
        return []
    return [
        {
            "op": "mul",
            "target": "fire_rate",
            "value": 1.1,
            "oracle": "name_inferred",
            "source_part": name,
            "tags": ["family:fire_rate"],
        }
    ]
