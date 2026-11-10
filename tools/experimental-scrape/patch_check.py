#!/usr/bin/env python3
"""Fetch allowlisted patch/skill URLs for offline LLM review (no judgment)."""
from __future__ import annotations

import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out" / "patch_check"
SOURCES = [
    "https://borderlands.2k.com/borderlands-4/update-notes/",
    "https://borderlands.2k.com/borderlands-4/game-info/vault-hunters/rafa/",
    "https://mentalmars.com/borderlands-4/characters/rafa/",
    "https://mentalmars.com/borderlands-4/loot/firmware/",
]


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "BL4-Forge-patch-check/1.0"})
    with urllib.request.urlopen(req, timeout=45) as resp:  # noqa: S310 — allowlisted
        return resp.read().decode("utf-8", errors="replace")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).isoformat()
    results = []
    for url in SOURCES:
        slug = re.sub(r"[^a-zA-Z0-9]+", "_", url)[-80:]
        try:
            html = fetch(url)
            text = re.sub(r"<[^>]+>", "\n", html)
            path = OUT / f"{slug}.txt"
            path.write_text(f"URL: {url}\nscraped_at: {stamp}\n\n{text}", encoding="utf-8")
            results.append({"url": url, "ok": True, "chars": len(text)})
        except Exception as exc:  # noqa: BLE001
            results.append({"url": url, "ok": False, "error": str(exc)})
    (OUT / "index.json").write_text(
        json.dumps({"scraped_at": stamp, "results": results}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"ok": True, "results": results}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
