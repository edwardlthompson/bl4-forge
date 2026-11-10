#!/usr/bin/env python3
from __future__ import annotations

import re
import urllib.request

UA = {"User-Agent": "BL4-Forge/1.0"}


def get(url: str) -> str:
    return urllib.request.urlopen(
        urllib.request.Request(url, headers=UA), timeout=30
    ).read().decode("utf-8", "replace")


# Lootlemon search / known paths
candidates = [
    "https://www.lootlemon.com/grenade/waterfall-rafa-bl4",
    "https://www.lootlemon.com/grenade/waterfall",
    "https://www.lootlemon.com/ordnance/waterfall-bl4",
    "https://www.lootlemon.com/shield/firewerks-bl4",
    "https://www.lootlemon.com/shield/firewerk",
    "https://www.lootlemon.com/shield/firewerks",
    "https://mentalmars.com/gear/waterfall/",
    "https://mentalmars.com/gear/firewerk/",
    "https://mentalmars.com/gear/grenazerker/",
]
for url in candidates:
    try:
        html = get(url)
    except Exception as exc:  # noqa: BLE001
        print("FAIL", url, exc)
        continue
    print("OK", url, len(html))
    avifs = re.findall(r"https://cdn\.prod\.website-files\.com/[^\"']+\.avif", html)
    imgs = re.findall(r"https://mentalmars\.com/wp-content/uploads/[^\"']+\.(?:png|jpg|webp)", html)
    for u in (avifs + imgs)[:8]:
        print(" ", u[:140])
