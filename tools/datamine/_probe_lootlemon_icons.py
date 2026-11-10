#!/usr/bin/env python3
from __future__ import annotations

import re
import urllib.request

url = "https://www.lootlemon.com/skill/rafa-deadline"
html = urllib.request.urlopen(url, timeout=30).read().decode("utf-8", "replace")
imgs = re.findall(r"https://[^\"']+\.(?:png|webp|avif|jpg)", html, re.I)
print("count", len(imgs))
for u in imgs[:40]:
    print(u)
og = re.findall(r'property="og:image" content="([^"]+)"', html)
print("og", og[:5])
# relative img src
rels = re.findall(r'src="([^"]+)"', html)
print("rel samples", [r for r in rels if "icon" in r.lower() or "skill" in r.lower()][:20])
