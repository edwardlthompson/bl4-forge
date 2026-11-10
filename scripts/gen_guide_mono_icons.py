#!/usr/bin/env python3
"""Generate FOSS monogram SVGs for the Rafa guide (deterministic, no scrape)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MONO = ROOT / "examples" / "web" / "public" / "icons" / "mono"
DATAMINE = ROOT / "examples" / "web" / "public" / "icons" / "datamine"
FIXTURE = ROOT / "examples" / "web" / "src" / "guide" / "fixture.json"

COLORS = {
    "remote_agent": "#3DB8C5",
    "people_person": "#D4A017",
    "this_years_gimmick": "#6BBF59",
    "slot": "#8B9AAB",
}


def mono_svg(name: str, color: str) -> str:
    letters = re.sub(r"[^A-Za-z0-9]", "", name)
    for prefix in ("pb_", "pp_", "yg_", "slot_"):
        if letters.lower().startswith(prefix.replace("_", "")):
            break
    compact = name
    for prefix in ("pb_", "pp_", "yg_", "slot_"):
        if compact.startswith(prefix):
            compact = compact[len(prefix) :]
            break
    letters = re.sub(r"[^A-Za-z0-9]", "", compact)[:2].upper() or "??"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" role="img" aria-hidden="true">
  <rect width="40" height="40" rx="6" fill="#1a2228"/>
  <rect x="2" y="2" width="36" height="36" rx="5" fill="none" stroke="{color}" stroke-width="2"/>
  <text x="20" y="26" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="14" font-weight="700" fill="{color}">{letters}</text>
</svg>
"""


def main() -> int:
    MONO.mkdir(parents=True, exist_ok=True)
    DATAMINE.mkdir(parents=True, exist_ok=True)
    (DATAMINE / ".gitkeep").write_text("", encoding="utf-8")
    fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
    ids: dict[str, str] = {}
    for s in fixture["skill_spend_order"]:
        ids[s["icon_id"]] = s["tree_id"]
    for sk in fixture["hunter"]["skills"]:
        ids[sk["id"]] = sk["tree"]
    for g in fixture["gear"]:
        ids[g.get("icon_id") or f"slot_{g['slot']}"] = "slot"
    for extra in (
        "slot_weapon",
        "slot_shield",
        "slot_grenade",
        "slot_class_mod",
        "slot_artifact",
        "slot_enhancement",
        "slot_repkit",
        "pb_action",
        "pb_aug_sitiar",
        "pb_aug_confeti",
        "pb_cap_beam_team",
    ):
        ids.setdefault(extra, "slot" if extra.startswith("slot_") else "remote_agent")

    for iid, tid in sorted(ids.items()):
        color = COLORS.get(tid, COLORS["slot"])
        (MONO / f"{iid}.svg").write_text(mono_svg(iid, color), encoding="utf-8")
    print(json.dumps({"monos": len(ids), "out": str(MONO)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
