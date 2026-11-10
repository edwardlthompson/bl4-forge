#!/usr/bin/env python3
"""Dump loc/card-like strings from NCS display_data + binary string harvest."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NCS = ROOT / "tools" / "datamine" / "out" / "ncs"
OUT = ROOT / "data" / "indexes"
BL4 = ROOT / "tools" / "bin" / "bl4.exe"
if not BL4.exists():
    BL4 = ROOT / "tools" / "bin" / "bl4"

TEXT_RE = re.compile(
    r"(?P<table>[A-Za-z0-9_]+),\s*(?P<guid>[A-F0-9]{32}|[A-Za-z0-9_]+),\s*(?P<body>.+)$"
)
INTEREST = re.compile(
    r"(Gun Damage|Weapon Damage|Fire Rate|Critical Hit|Reload|Magazine|Shield|"
    r"Incendiary|Shock|Corrosive|Cryo|Radiation|\+\s*\{?0\}?|\+\d+\s*%|"
    r"\[secondary\]|Ammo|Damage Taken|Damage Scale)",
    re.I,
)
ASCII_RE = re.compile(rb"[\x20-\x7e]{6,140}")


def dump_display_data() -> list[dict]:
    src = NCS / "display_data.bin"
    if not src.exists():
        raise SystemExit(f"missing {src}; run acquire / ncs decompress first")
    tmp = ROOT / "tools" / "datamine" / "out" / "display_show.json"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    with tmp.open("w", encoding="utf-8") as fh:
        proc = subprocess.run(
            [str(BL4), "ncs", "show", str(src), "--json"],
            stdout=fh,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
            encoding="utf-8",
            errors="replace",
        )
    if proc.returncode != 0:
        raise SystemExit(proc.stderr or f"bl4 ncs show failed ({proc.returncode})")
    payload = json.loads(tmp.read_text(encoding="utf-8"))
    cards: list[dict] = []
    records = payload.get("tables", {}).get("display_data", {}).get("records", [])
    for rec in records:
        for entry in rec.get("entries", []):
            val = entry.get("value") or {}
            text = val.get("text") or ""
            if not text:
                continue
            m = TEXT_RE.match(text)
            body = m.group("body").strip() if m else text.strip()
            cards.append(
                {
                    "key": entry.get("key"),
                    "display_data": val.get("display_data"),
                    "raw": text,
                    "body": body,
                    "table": m.group("table") if m else None,
                    "source": "display_data",
                }
            )
    return cards


def harvest_ncs_strings() -> list[dict]:
    cards: list[dict] = []
    seen: set[str] = set()
    for path in sorted(NCS.glob("*.bin")):
        blob = path.read_bytes()
        for m in ASCII_RE.finditer(blob):
            s = m.group().decode("ascii", errors="ignore")
            if not INTEREST.search(s):
                continue
            body = s
            table = None
            tm = TEXT_RE.match(s)
            if tm:
                table = tm.group("table")
                body = tm.group("body").strip()
            if body in seen:
                continue
            seen.add(body)
            cards.append(
                {
                    "key": None,
                    "display_data": None,
                    "raw": s,
                    "body": body,
                    "table": table,
                    "source": f"ncs:{path.name}",
                }
            )
    return cards


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    cards = dump_display_data()
    harvested = harvest_ncs_strings()
    # Merge unique by body
    by_body = {c["body"]: c for c in cards}
    for h in harvested:
        by_body.setdefault(h["body"], h)
    merged = list(by_body.values())
    path = OUT / "cards.json"
    path.write_text(
        json.dumps(
            {
                "version": 1,
                "source": "ncs:display_data+string_harvest",
                "cards": merged,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    # Strict modifier corpus (D1 gate): templates / card stats, not every UI mention.
    CORPUS_RE = re.compile(
        r"(^\+\{0\})|(^\+\d+(\.\d+)?\s*%)|(\[secondary\])|"
        r"(^(Gun Damage|Weapon Damage(?: Scale)?|Fire Rate|Reload Speed|Magazine Size|"
        r"Critical Hit(?: Chance| Damage)?|Damage Taken)$)|"
        r"(Get Critical Hits|Kill enemies with Critical Hits)|"
        r"(^\+\{0\}\s+.*Ammo)|"
        r"(part_.*(dmg|crit|fire|reload|mag|shield))",
        re.I,
    )
    corpus = []
    for c in merged:
        body = c.get("body") or ""
        if not CORPUS_RE.search(body):
            continue
        # Item/stat cards are short; long skill markup goes to dump_skills.py.
        if len(body) > 120 or "[newline]" in body or body.count("[secondary]") > 2:
            continue
        corpus.append(c)
    (OUT / "card-corpus.json").write_text(
        json.dumps({"version": 1, "cards": corpus}, indent=2) + "\n",
        encoding="utf-8",
    )
    # Skill corpus companion (does not affect D1 card-parse gate).
    try:
        import dump_skills as _dump_skills

        _dump_skills.main()
    except Exception as exc:  # noqa: BLE001 — best-effort companion
        print(f"skill dump skipped: {exc}")
    print(f"wrote {path} cards={len(merged)} corpus={len(corpus)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
