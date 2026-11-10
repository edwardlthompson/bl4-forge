#!/usr/bin/env python3
"""Fetch Rafa skill icons from Lootlemon CDN when local bl4 extract is unavailable.

Writes ``examples/web/public/icons/datamine/{id}.avif`` and clears ``pending_extract``
in ``data/experimental/icon_manifest.json``. Experimental / third-party art — not MIT.
"""
from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "examples" / "web" / "public" / "icons" / "datamine"
MANIFEST = ROOT / "data" / "experimental" / "icon_manifest.json"
RAFA_PAGE = "https://www.lootlemon.com/class/rafa"
UA = "BL4-Forge-icon-fetch/1.0 (+https://github.com/edwardlthompson/bl4-forge; local maintainer tool)"

# Lootlemon display name → our icon / skill id
NAME_TO_ID = {
    "Deadline": "pb_deadline",
    "The Thrill": "pb_thrill",
    "Las Jaras": "pb_las_jaras",
    "Vitriol": "pb_vitriol",
    "Everdrive": "pb_everdrive",
    "Barrage": "pb_barrage",
    "Brain Dump": "pb_brain_dump",
    "Temerario": "pb_temerario",
    "Rinse": "pp_rinse",
    "Al Centro": "pp_al_centro",
    "First Impression": "pp_first_impression",
    "Handshake": "yg_handshake",
    "Handshake Deal": "yg_handshake",
    "Booming Business": "yg_booming_business",
    "El Paraguas": "yg_el_paraguas",
    "Midnight": "yg_midnight",
    "Midnight Oil": "yg_midnight",
    "Expedite": "yg_expedite",
    "Collaborative Ignition": "collaborative_ignition",
    "Confeti": "pb_aug_confeti",
    "Confeti Protocol": "pb_aug_confeti",
    "Sitiar": "pb_aug_sitiar",
    "Beam Team": "pb_cap_beam_team",
    "Peacebreaker Cannons": "pb_action",
    "Peacebreaker": "pb_action",
    "Sinergia": "pp_sinergia",
    "Arriba": "pp_arriba",
    "Abajo": "pp_abajo",
}


def _fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def _avif_urls(html: str) -> list[str]:
    found = re.findall(
        r"https://cdn\.prod\.website-files\.com/[^\"'\s]+?_([^\"'\s]+)%2520\(Rafa\)\.avif",
        html,
    )
    # Full URLs
    full = re.findall(
        r"https://cdn\.prod\.website-files\.com/[^\"'\s]+_\S+?\(Rafa\)\.avif",
        html,
    )
    # Dedupe preserving order
    seen: set[str] = set()
    out: list[str] = []
    for u in full:
        u = u.replace("\\u0026", "&")
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def _name_from_url(url: str) -> str | None:
    # .../68bebe_Deadline%2520(Rafa).avif
    m = re.search(r"_([^/]+)%2520\(Rafa\)\.avif$", url)
    if not m:
        m = re.search(r"_([^/]+)\(Rafa\)\.avif$", urllib.parse.unquote(url))
    if not m:
        return None
    raw = urllib.parse.unquote(m.group(1).replace("%2520", " ").replace("%20", " "))
    return raw.strip()


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    html = _fetch(RAFA_PAGE).decode("utf-8", "replace")
    urls = _avif_urls(html)
    if not urls:
        # Fallback: scrape a known skill page for neighboring icon links
        html = _fetch("https://www.lootlemon.com/skill/rafa-deadline").decode("utf-8", "replace")
        urls = _avif_urls(html)
    saved: list[str] = []
    for url in urls:
        name = _name_from_url(url)
        if not name:
            continue
        sid = NAME_TO_ID.get(name)
        if not sid:
            # fuzzy: strip punctuation
            sid = NAME_TO_ID.get(name.replace("’", "'"))
        if not sid:
            continue
        dest = OUT / f"{sid}.avif"
        try:
            dest.write_bytes(_fetch(url))
            saved.append(sid)
        except Exception as exc:  # noqa: BLE001
            print({"fail": sid, "error": str(exc)})
    man = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.is_file() else {"icons": {}}
    icons = man.setdefault("icons", {})
    for sid in saved:
        icons[sid] = {
            "path": f"/icons/datamine/{sid}.avif",
            "pending_extract": False,
            "source": "lootlemon_cdn",
        }
    man["note"] = "Icons from Lootlemon CDN when bl4 extract unavailable. © Gearbox art via third party."
    MANIFEST.write_text(json.dumps(man, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"saved": sorted(set(saved)), "count": len(set(saved)), "out": str(OUT)}))
    return 0 if saved else 1


if __name__ == "__main__":
    raise SystemExit(main())
