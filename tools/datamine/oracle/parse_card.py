"""Card text → expected modifiers (shared with tools/datamine/parse_card.py logic)."""
from __future__ import annotations

import importlib.util
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
_SPEC = importlib.util.spec_from_file_location(
    "parse_card_mod", _ROOT / "parse_card.py"
)
_MOD = importlib.util.module_from_spec(_SPEC)
assert _SPEC and _SPEC.loader
_SPEC.loader.exec_module(_MOD)
parse_body = _MOD.parse_body

__all__ = ["parse_body"]
