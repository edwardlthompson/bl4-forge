"""Regenerate FOSS mono placeholders with stronger contrast (no Gearbox art)."""
from __future__ import annotations

from pathlib import Path

MONO = Path(__file__).resolve().parents[2] / "examples" / "web" / "public" / "icons" / "mono"
COLORS = {"pb_": "#3DB8C5", "pp_": "#D4A017", "yg_": "#6BBF59", "slot_": "#C45C4A"}
LABELS = {
    "pb_deadline": "DE",
    "pb_thrill": "TH",
    "pb_las_jaras": "LJ",
    "pb_vitriol": "VI",
    "pb_everdrive": "EV",
    "pb_barrage": "BA",
    "pb_brain_dump": "BD",
    "pb_temerario": "TE",
    "pb_action": "AS",
    "pb_aug_confeti": "CF",
    "pb_aug_sitiar": "SI",
    "pb_cap_beam_team": "BT",
    "pp_rinse": "RI",
    "pp_al_centro": "AC",
    "pp_first_impression": "FI",
    "yg_handshake": "HS",
    "yg_booming_business": "BB",
    "yg_el_paraguas": "EP",
    "yg_midnight": "MN",
    "yg_expedite": "EX",
    "slot_weapon": "W",
    "slot_shield": "S",
    "slot_grenade": "G",
    "slot_class_mod": "CM",
    "slot_artifact": "A",
    "slot_enhancement": "EN",
    "slot_repkit": "RK",
    "collaborative_ignition": "CI",
}
TMPL = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" role="img" aria-hidden="true">
  <rect width="40" height="40" rx="8" fill="{bg}"/>
  <rect x="1.5" y="1.5" width="37" height="37" rx="7" fill="none" stroke="{fg}" stroke-width="2"/>
  <text x="20" y="26" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="{fg}">{label}</text>
</svg>
"""


def main() -> int:
    MONO.mkdir(parents=True, exist_ok=True)
    stems = {p.stem for p in MONO.glob("*.svg")} | set(LABELS)
    for stem in sorted(stems):
        fg = "#9aa7b0"
        for pref, color in COLORS.items():
            if stem.startswith(pref):
                fg = color
                break
        label = LABELS.get(stem, stem.split("_")[-1][:2].upper())
        (MONO / f"{stem}.svg").write_text(
            TMPL.format(bg="#141a1f", fg=fg, label=label),
            encoding="utf-8",
        )
    print({"mono": len(list(MONO.glob("*.svg"))), "path": str(MONO)})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
