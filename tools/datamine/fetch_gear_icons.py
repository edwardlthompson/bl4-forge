#!/usr/bin/env python3
"""Fetch legendary gear icons (grenade/shield/COM) into public/icons/datamine."""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "examples" / "web" / "public" / "icons" / "datamine"
MANIFEST = ROOT / "data" / "experimental" / "icon_manifest.json"
UA = {"User-Agent": "BL4-Forge-gear-icons/1.0"}

JOBS = [
    {
        "id": "gear_waterfall",
        "slot": "slot_grenade",
        "url": "https://mentalmars.com/wp-content/uploads/2025/09/BL4-Grenade-Ordnance-Waterfall-Item-Card.jpg",
        "ext": "jpg",
    },
    {
        "id": "gear_firewerk",
        "slot": "slot_shield",
        "url": "https://cdn.prod.website-files.com/5ff36780a1084987868ce198/6a22d7ba8cda3938772f2798_Firewerks%2520%2528BL4%2529.avif",
        "ext": "avif",
    },
    {
        "id": "gear_grenazerker",
        "slot": "slot_class_mod",
        "url": "https://cdn.prod.website-files.com/5ff36780a1084987868ce198/68dd849b54595784f4e935e3_Grenazerker%2520(Rafa-BL4).avif",
        "ext": "avif",
    },
    {
        "id": "gear_firewerks_alt",
        "slot": None,
        "url": "https://mentalmars.com/wp-content/uploads/2025/09/BL4-Legendary-Armor-Firewerks.jpg",
        "ext": "jpg",
    },
]


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    saved = []
    for job in JOBS:
        dest = OUT / f"{job['id']}.{job['ext']}"
        try:
            data = urllib.request.urlopen(
                urllib.request.Request(job["url"], headers=UA), timeout=60
            ).read()
            dest.write_bytes(data)
            saved.append(dest.name)
            if job.get("slot"):
                # Also alias as slot_* for gear cards
                alias = OUT / f"{job['slot']}.{job['ext']}"
                alias.write_bytes(data)
                saved.append(alias.name)
        except Exception as exc:  # noqa: BLE001
            print({"fail": job["id"], "error": str(exc)})
    if MANIFEST.is_file():
        man = json.loads(MANIFEST.read_text(encoding="utf-8"))
        icons = man.setdefault("icons", {})
        for name in saved:
            stem = Path(name).stem
            icons[stem] = {
                "path": f"/icons/datamine/{name}",
                "pending_extract": False,
                "source": "wiki_cdn",
            }
        MANIFEST.write_text(json.dumps(man, indent=2) + "\n", encoding="utf-8")
    print({"saved": saved, "count": len(saved)})
    return 0 if saved else 1


if __name__ == "__main__":
    raise SystemExit(main())
