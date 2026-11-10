#!/usr/bin/env python3
"""Copy data/experimental packs into examples/web for Vite import."""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "experimental"
DST = ROOT / "examples" / "web" / "src" / "experimental"
FILES = (
    "rafa_skill_effects.json",
    "grenade_catalog.json",
    "synergy_rules.json",
    "firmware_catalog.json",
    "procs.json",
    "enhancement_catalog.json",
    "enhancement_catalog_a.json",
    "enhancement_catalog_b.json",
    "weapon_godrolls.json",
    "icon_manifest.json",
)
BUILD_FILES = ("core.json", "adapters.json")
ENH_DIR = "enhancements"


def main() -> int:
    DST.mkdir(parents=True, exist_ok=True)
    (DST / "builds").mkdir(parents=True, exist_ok=True)
    copied = []
    for name in FILES:
        src = SRC / name
        if not src.is_file():
            continue
        shutil.copy2(src, DST / name)
        copied.append(name)
    for name in BUILD_FILES:
        shutil.copy2(SRC / "builds" / name, DST / "builds" / name)
        copied.append(f"builds/{name}")
    enh_src = SRC / ENH_DIR
    if enh_src.is_dir():
        enh_dst = DST / ENH_DIR
        if enh_dst.exists():
            shutil.rmtree(enh_dst)
        shutil.copytree(enh_src, enh_dst)
        copied.append(f"{ENH_DIR}/")
    print({"synced": copied, "to": str(DST)})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
