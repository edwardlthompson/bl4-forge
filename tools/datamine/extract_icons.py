#!/usr/bin/env python3
"""Extract/promote guide icons for Pages (HUMAN IP override — Gearbox textures).

Writes under ``tools/datamine/out/icons/``. With ``--promote``, copies webp/png into
``examples/web/public/icons/datamine/`` for commit/publish. Requires install + AES
in ``tools/datamine/.env`` when wired to ``bl4``. Until extract is wired, scaffolds
out tree and leaves ``pending_extract`` entries in the icon manifest.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "out" / "icons"
ENV = Path(__file__).resolve().parent / ".env"
WEB_DATAMINE = ROOT / "examples" / "web" / "public" / "icons" / "datamine"
MANIFEST = ROOT / "data" / "experimental" / "icon_manifest.json"


def _env_present() -> bool:
    if os.environ.get("BL4_INSTALL_PATH") and os.environ.get("BL4_AES_KEY"):
        return True
    if not ENV.is_file():
        return False
    text = ENV.read_text(encoding="utf-8")
    return "BL4_INSTALL_PATH=" in text and "BL4_AES_KEY=" in text


def _load_manifest() -> dict:
    if MANIFEST.is_file():
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {"experimental": True, "icons": {}}


def promote_out_to_web() -> list[str]:
    WEB_DATAMINE.mkdir(parents=True, exist_ok=True)
    promoted: list[str] = []
    for src in list(OUT.glob("*.webp")) + list(OUT.glob("*.png")):
        dst = WEB_DATAMINE / (src.stem + ".webp" if src.suffix == ".png" else src.name)
        if src.suffix == ".png":
            # Keep png if no converter; web resolver prefers .webp — copy as-is name.
            dst = WEB_DATAMINE / src.name
        shutil.copy2(src, dst)
        promoted.append(dst.name)
    return promoted


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Scaffold only")
    parser.add_argument(
        "--promote",
        action="store_true",
        help="Copy out/icons assets into examples/web/public/icons/datamine/",
    )
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    WEB_DATAMINE.mkdir(parents=True, exist_ok=True)
    meta = {
        "status": "ready_for_extract",
        "policy": "HUMAN override: datamine icons may be committed for Pages; © Gearbox/2K",
        "out": str(OUT.relative_to(ROOT)).replace("\\", "/"),
        "web_datamine": str(WEB_DATAMINE.relative_to(ROOT)).replace("\\", "/"),
        "manifest": str(MANIFEST.relative_to(ROOT)).replace("\\", "/"),
        "mono_fallback": "examples/web/public/icons/mono/",
    }
    (OUT / "README.txt").write_text(
        "Icon extract output.\n"
        "Promote with: python tools/datamine/extract_icons.py --promote\n"
        "Committed UI prefers /icons/datamine/{id}.webp; mono SVG is last-resort onerror.\n",
        encoding="utf-8",
    )
    (OUT / "manifest.stub.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")

    if args.dry_run:
        print(json.dumps({**meta, "extract": "dry_run"}))
        return 0

    # Prefer local bl4 when env present; otherwise auto-fetch Lootlemon CDN icons (no human).
    extract_note = "not_implemented_wire_bl4_when_ready"
    promoted: list[str] = []
    if _env_present():
        if args.promote:
            promoted = promote_out_to_web()
    else:
        extract_note = "wiki_cdn_fallback"
        wiki = Path(__file__).resolve().parent / "fetch_wiki_icons.py"
        if wiki.is_file():
            import subprocess

            subprocess.run([sys.executable, str(wiki)], check=False)
            promoted = [p.name for p in WEB_DATAMINE.glob("*.avif")] + [
                p.name for p in WEB_DATAMINE.glob("*.webp")
            ]

    if args.promote and promoted and _env_present():
        man = _load_manifest()
        icons = man.setdefault("icons", {})
        for name in promoted:
            stem = Path(name).stem
            icons[stem] = {
                "path": f"/icons/datamine/{name}",
                "pending_extract": False,
            }
        MANIFEST.write_text(json.dumps(man, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({**meta, "extract": extract_note, "promoted_count": len(promoted)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
