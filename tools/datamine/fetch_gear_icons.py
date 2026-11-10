#!/usr/bin/env python3
"""Fetch legendary/pearl gear icons + generate mono placeholders for every catalog item.

Writes ``examples/web/public/icons/datamine/`` and ``icons/mono/gear_*.svg``.
Third-party / Gearbox art — MIT covers our code only.
"""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "examples" / "web" / "public" / "icons" / "datamine"
MONO = ROOT / "examples" / "web" / "public" / "icons" / "mono"
ITEMS = ROOT / "data" / "items.json"
MANIFEST = ROOT / "data" / "experimental" / "icon_manifest.json"
MANIFEST_WEB = ROOT / "examples" / "web" / "src" / "experimental" / "icon_manifest.json"
UA = {"User-Agent": "BL4-Forge-gear-icons/1.0 (+local maintainer tool)"}

# Known CDN / MentalMars card art for recommended loadout pieces
JOBS = [
    {
        "id": "gear_waterfall",
        "url": "https://mentalmars.com/wp-content/uploads/2025/09/BL4-Grenade-Ordnance-Waterfall-Item-Card.jpg",
        "ext": "jpg",
    },
    {
        "id": "gear_firewerk",
        "url": "https://cdn.prod.website-files.com/5ff36780a1084987868ce198/6a22d7ba8cda3938772f2798_Firewerks%2520%2528BL4%2529.avif",
        "ext": "avif",
    },
    {
        "id": "gear_grenazerker",
        "url": "https://cdn.prod.website-files.com/5ff36780a1084987868ce198/68dd849b54595784f4e935e3_Grenazerker%2520(Rafa-BL4).avif",
        "ext": "avif",
    },
]

TMPL = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" role="img" aria-hidden="true">
  <rect width="40" height="40" rx="8" fill="#141a1f"/>
  <rect x="1.5" y="1.5" width="37" height="37" rx="7" fill="none" stroke="{fg}" stroke-width="2"/>
  <text x="20" y="26" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="11" font-weight="700" fill="{fg}">{label}</text>
</svg>
"""

SLOT_FG = {
    "weapon": "#E8B84A",
    "shield": "#5B9BD5",
    "grenade": "#C45C4A",
    "class_mod": "#9B59B6",
    "repkit": "#2ECC71",
    "enhancement": "#1ABC9C",
    "artifact": "#F39C12",
    "pearlescent": "#F5D76E",
}


def _safe(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "_", name)


def _label(name: str) -> str:
    parts = re.findall(r"[A-Z]+[a-z]*|[a-z]+|\d+", name) or [name]
    chars = "".join(p[0] for p in parts if p)[:3].upper()
    return chars or name[:2].upper()


def _mono(stem: str, slot: str, rarity: str) -> None:
    fg = SLOT_FG.get("pearlescent" if "pearl" in rarity.lower() else slot, "#E8B84A")
    label = _label(stem.replace("gear_", ""))
    (MONO / f"{stem}.svg").write_text(TMPL.format(fg=fg, label=label), encoding="utf-8")


def _update_manifest(entries: dict[str, dict]) -> None:
    for path in (MANIFEST, MANIFEST_WEB):
        if not path.is_file():
            continue
        man = json.loads(path.read_text(encoding="utf-8"))
        icons = man.setdefault("icons", {})
        icons.update(entries)
        path.write_text(json.dumps(man, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    MONO.mkdir(parents=True, exist_ok=True)
    saved: list[str] = []
    manifest_entries: dict[str, dict] = {}

    for job in JOBS:
        dest = OUT / f"{job['id']}.{job['ext']}"
        try:
            data = urllib.request.urlopen(
                urllib.request.Request(job["url"], headers=UA), timeout=60
            ).read()
            dest.write_bytes(data)
            saved.append(dest.name)
            manifest_entries[job["id"]] = {
                "path": f"/icons/datamine/{dest.name}",
                "pending_extract": False,
                "source": "wiki_cdn",
            }
        except Exception as exc:  # noqa: BLE001
            print({"fail": job["id"], "error": str(exc)})

    # Every legendary (+ pearlescent if present) → mono gear_* icon
    mono_count = 0
    if ITEMS.is_file():
        payload = json.loads(ITEMS.read_text(encoding="utf-8"))
        items = payload["items"] if isinstance(payload, dict) and "items" in payload else payload
        for item in items:
            rarity = str(item.get("rarity", "")).lower()
            if rarity not in ("legendary", "pearlescent", "pearl"):
                continue
            name = item.get("name") or item.get("item_name") or ""
            if not name:
                continue
            stem = f"gear_{_safe(name)}"
            slot = str(item.get("slot") or item.get("gear_type") or "weapon")
            _mono(stem, slot, rarity)
            mono_count += 1
            if stem not in manifest_entries:
                manifest_entries[stem] = {
                    "path": f"/icons/mono/{stem}.svg",
                    "pending_extract": True,
                    "source": "mono_placeholder",
                }

    # Adapter / guide extras not in items.json
    for extra, slot in (
        ("TripleBypass", "repkit"),
        ("Grenazerker", "class_mod"),
        ("Toile", "enhancement"),
        ("firepot", "grenade"),
        ("HeavyTurret", "weapon"),
        ("PlasmaCoil", "weapon"),
        ("KaoSon", "weapon"),
        ("RocketReload", "weapon"),
    ):
        stem = f"gear_{_safe(extra)}"
        if not (MONO / f"{stem}.svg").is_file():
            _mono(stem, slot, "legendary")
            mono_count += 1
            manifest_entries.setdefault(
                stem,
                {
                    "path": f"/icons/mono/{stem}.svg",
                    "pending_extract": True,
                    "source": "mono_placeholder",
                },
            )

    _update_manifest(manifest_entries)
    print({"saved_cdn": saved, "mono": mono_count, "manifest": len(manifest_entries)})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
