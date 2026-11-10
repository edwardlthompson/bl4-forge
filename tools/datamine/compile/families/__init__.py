"""Modifier family modules — each returns Effect-like dicts for a part name."""
from __future__ import annotations

from . import crit, damage, elemental, fire_rate, reload_mag, shield

FAMILIES = (
    damage,
    crit,
    fire_rate,
    reload_mag,
    shield,
    elemental,
)

__all__ = ["FAMILIES"]
