"""Reload speed + magazine size family."""
from __future__ import annotations

import re

MATCH = re.compile(r"reload|mag(?:azine)?|clip", re.I)
FAMILY = "reload_mag"


def compile_part(name: str) -> list[dict]:
    lower = name.lower()
    if "reload" in lower:
        target = "reload_speed"
    elif "mag" in lower or "clip" in lower:
        target = "magazine_size"
    else:
        return []
    return [
        {
            "op": "mul",
            "target": target,
            "value": 1.1,
            "oracle": "name_inferred",
            "source_part": name,
            "tags": ["family:reload_mag"],
        }
    ]
