#!/usr/bin/env python3
"""Generate Rafa Peacebreaker 69-point spend rows (Forge-authored / LLM-curated)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "guides" / "rafa_peacebreaker_spend.json"

# RA 40 + PP 10 + YG 19 = 69 (Booming Business + El Paraguas for AFK grenade loop)
BLOCKS: list[tuple[str, str, str, str, int, str]] = [
    ("pb_deadline", "Deadline", "remote_agent", "Remote Agent", 5,
     "Rank {rank}/5: Overdrive Fire Rate + Reload — Peacebreaker uptime."),
    ("pb_thrill", "The Thrill", "remote_agent", "Remote Agent", 5,
     "Rank {rank}/5: Extra Fire Rate (stronger in Overdrive)."),
    ("pb_las_jaras", "Las Jaras", "remote_agent", "Remote Agent", 5,
     "Rank {rank}/5: Ammo regen in Overdrive."),
    ("pb_vitriol", "Vitriol", "remote_agent", "Remote Agent", 5,
     "Rank {rank}/5: First-shot corrosive — status opener."),
    ("pb_everdrive", "Everdrive", "remote_agent", "Remote Agent", 5,
     "Rank {rank}/5: Longer Overdrive windows."),
    ("pb_barrage", "Barrage", "remote_agent", "Remote Agent", 5,
     "Rank {rank}/5: Overdrive splash — feeds Waterfall / Firewerk."),
    ("pb_brain_dump", "Brain Dump", "remote_agent", "Remote Agent", 5,
     "Rank {rank}/5: Overdrive gun crit — fuels Booming Business."),
    ("pb_temerario", "Temerario", "remote_agent", "Remote Agent", 5,
     "Rank {rank}/5: Overdrive gun damage; Capstone row access."),
    ("pp_rinse", "Rinse", "people_person", "People Person", 5,
     "Rank {rank}/5: Reload Speed — magazines for Vitriol + cannons."),
    ("pp_al_centro", "Al Centro", "people_person", "People Person", 5,
     "Rank {rank}/5: Overdrive handling — keep cannons on target."),
    ("yg_handshake", "Handshake Deal", "this_years_gimmick", "This Year's Gimmick", 5,
     "Rank {rank}/5: Flat Gun + Melee damage floor."),
    ("yg_booming_business", "Booming Business", "this_years_gimmick", "This Year's Gimmick", 5,
     "Rank {rank}/5: Crit → free grenade chance — AFK ordnance engine."),
    ("yg_el_paraguas", "El Paraguas", "this_years_gimmick", "This Year's Gimmick", 5,
     "Rank {rank}/5: Splash damage + splash crit — closes grenade crit loop."),
    ("yg_midnight", "Midnight Oil", "this_years_gimmick", "This Year's Gimmick", 4,
     "Rank {rank}/4: Action corrosive over time (stop at 4/5 for 69)."),
]


def main() -> int:
    rows = []
    step = 0
    level = 1
    for skill_id, name, tree_id, tree, ranks, tmpl in BLOCKS:
        for r in range(1, ranks + 1):
            step += 1
            level += 1
            rows.append(
                {
                    "step": step,
                    "level": level,
                    "skill_id": skill_id,
                    "display_name": name,
                    "points": 1,
                    "to_rank": r,
                    "reason": tmpl.format(rank=r),
                    "tree": tree,
                    "tree_id": tree_id,
                    "icon_id": skill_id,
                }
            )
    assert step == 69, f"expected 69 points, got {step}"
    assert sum(b[4] for b in BLOCKS) == 69
    payload = {
        "version": 1,
        "guide_id": "rafa_peacebreaker_leveling",
        "point_budget": 69,
        "count": len(rows),
        "spend": rows,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"spend_rows": len(rows), "out": str(OUT.relative_to(ROOT))}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
