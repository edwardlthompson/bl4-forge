"""Elemental affinity family (shock/fire/cryo/corrosive/radiation)."""
from __future__ import annotations

import re

_ELEMS = ("shock", "fire", "cryo", "corrosive", "radiation", "incendiary")
MATCH = re.compile(r"elem|element|" + "|".join(_ELEMS), re.I)
FAMILY = "elemental"


def compile_part(name: str) -> list[dict]:
    lower = name.lower()
    found = [e for e in _ELEMS if e in lower]
    if not found and "elem" not in lower and "element" not in lower:
        return []
    effects = []
    for e in found or ["elemental"]:
        effects.append(
            {
                "op": "flag",
                "target": e if e != "fire" else "incendiary",
                "value": True,
                "oracle": "name_inferred",
                "source_part": name,
                "tags": ["family:elemental"],
            }
        )
    return effects
