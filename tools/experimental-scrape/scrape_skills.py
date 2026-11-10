#!/usr/bin/env python3
"""Fetch allowlisted skill pages into gitignored out/ (experimental only)."""
from __future__ import annotations

import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
SOURCES = json.loads((ROOT / "sources.json").read_text(encoding="utf-8"))


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "BL4-Forge-experimental-scrape/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310 — allowlisted maintainer URLs
        return resp.read().decode("utf-8", errors="replace")


def extract_pct_lines(html: str) -> list[str]:
    text = re.sub(r"<[^>]+>", "\n", html)
    lines = []
    for line in text.splitlines():
        s = " ".join(line.split())
        if re.search(r"\+\d+%", s) and len(s) < 120:
            lines.append(s)
    return lines[:80]


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).isoformat()
    results = []
    for src in SOURCES.get("skills", []):
        url = src["url"]
        try:
            html = fetch(url)
            payload = {
                "id": src["id"],
                "url": url,
                "scraped_at": stamp,
                "oracle": "name_inferred",
                "pct_lines": extract_pct_lines(html),
                "bytes": len(html),
            }
            (OUT / f"{src['id']}.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            results.append({"id": src["id"], "ok": True, "lines": len(payload["pct_lines"])})
        except Exception as exc:  # noqa: BLE001 — fail closed per source
            results.append({"id": src["id"], "ok": False, "error": str(exc)})
    (OUT / "skills_index.json").write_text(json.dumps({"results": results}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ok": True, "results": results}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
