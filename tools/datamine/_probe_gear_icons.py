#!/usr/bin/env python3
from __future__ import annotations

import re
import urllib.request

UA = {"User-Agent": "BL4-Forge/1.0"}
PAGES = [
    "https://www.lootlemon.com/grenade/waterfall-bl4",
    "https://www.lootlemon.com/shield/firewerk-bl4",
    "https://www.lootlemon.com/class-mod/grenazerker-rafa-bl4",
    "https://mentalmars.com/borderlands-4/loot/grenades/",
]
for url in PAGES:
    try:
        html = urllib.request.urlopen(
            urllib.request.Request(url, headers=UA), timeout=30
        ).read().decode("utf-8", "replace")
    except Exception as exc:  # noqa: BLE001
        print({"url": url, "err": str(exc)})
        continue
    imgs = re.findall(r"https://[^\"']+\.(?:png|webp|avif|jpg)", html, re.I)
    print(url, "imgs", len(imgs))
    for u in imgs[:12]:
        if any(k in u.lower() for k in ("waterfall", "firewerk", "grenade", "shield", "grenazer", "weapon", "class")):
            print(" ", u[:120])
