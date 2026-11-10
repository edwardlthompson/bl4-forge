#!/usr/bin/env python3
"""Oracle must reject a deliberately corrupted attribute mapping."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from check import check_item, parse_body


def test_corrupted_mapping_rejected() -> None:
    card = "+25% Gun Damage"
    compiled = parse_body(card)
    assert check_item(card, compiled)["pass"] is True
    assert check_item(card, compiled, corrupt=True)["pass"] is False


if __name__ == "__main__":
    test_corrupted_mapping_rejected()
    print("corrupted-mapping rejection OK")
