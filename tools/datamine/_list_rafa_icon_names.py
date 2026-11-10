#!/usr/bin/env python3
from __future__ import annotations

import re
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "examples" / "web" / "public" / "icons" / "datamine"
html = urllib.request.urlopen(
    urllib.request.Request("https://www.lootlemon.com/class/rafa", headers={"User-Agent": "BL4-Forge/1.0"}),
    timeout=30,
).read().decode("utf-8", "replace")
names = []
for u in re.findall(r"https://cdn\.prod\.website-files\.com/[^\"']+_\S+?\(Rafa\)\.avif", html):
    m = re.search(r"_([^/]+)%2520\(Rafa\)\.avif$", u)
    if m:
        names.append(urllib.parse.unquote(m.group(1).replace("%2520", " ")))
print("cdn", sorted(set(names)))
print("local", sorted(p.name for p in OUT.glob("*.avif")))
