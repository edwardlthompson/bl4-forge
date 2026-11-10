#!/usr/bin/env python3
"""Fetch allowlisted grenade pages into gitignored out/ (experimental only)."""
from __future__ import annotations

import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
SOURCES = json.loads((ROOT / "sources.json").read_text(encoding="utf-8"))

KEYWORDS = (
    "Nuke",
    "Expansive",
    "Lingering",
    "Pulsing",
    "MIRV",
    "Waterfall",
    "Payload",
    "Augment",
    "Airdrop",
)


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "BL4-Forge-experimental-scrape/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
        return resp.read().decode("utf-8", errors="replace")


def extract_hits(html: str) -> list[str]:
    text = re.sub(r"<[^>]+>", "\n", html)
    hits = []
    for line in text.splitlines():
        s = " ".join(line.split())
        if any(k.lower() in s.lower() for k in KEYWORDS) and 3 < len(s) < 160:
            hits.append(s)
    # de-dupe preserve order
    seen: set[str] = set()
    out: list[str] = []
    for h in hits:
        if h not in seen:
            seen.add(h)
            out.append(h)
    return out[:120]


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).isoformat()
    results = []
    for src in SOURCES.get("grenades", []):
        url = src["url"]
        try:
            html = fetch(url)
            payload = {
                "id": src["id"],
                "url": url,
                "grenade_id": src.get("grenade_id"),
                "scraped_at": stamp,
                "oracle": "name_inferred",
                "hits": extract_hits(html),
                "bytes": len(html),
            }
            (OUT / f"{src['id']}.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            results.append({"id": src["id"], "ok": True, "hits": len(payload["hits"])})
        except Exception as exc:  # noqa: BLE001
            results.append({"id": src["id"], "ok": False, "error": str(exc)})
    (OUT / "grenades_index.json").write_text(json.dumps({"results": results}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ok": True, "results": results}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
