#!/usr/bin/env python3
from __future__ import annotations

import re
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "examples" / "web" / "public" / "icons" / "datamine"
UA = {"User-Agent": "BL4-Forge/1.0"}
JOBS = [
    ("rafa-handshake", "yg_handshake", "Handshake"),
    ("rafa-midnight", "yg_midnight", "Midnight"),
]


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, sid, needle in JOBS:
        url = f"https://www.lootlemon.com/skill/{slug}"
        req = urllib.request.Request(url, headers=UA)
        html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
        urls = re.findall(
            r"https://cdn\.prod\.website-files\.com/[^\"']+_\S+?\(Rafa\)\.avif",
            html,
        )
        pick = next((u for u in urls if needle.replace(" ", "%2520") in u or needle in u), None)
        if not pick and urls:
            pick = urls[0]
        if not pick:
            print({"miss": sid})
            continue
        dest = OUT / f"{sid}.avif"
        dest.write_bytes(urllib.request.urlopen(urllib.request.Request(pick, headers=UA), timeout=30).read())
        print({"ok": sid, "file": dest.name})
    print({"avif_total": len(list(OUT.glob("*.avif")))})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
