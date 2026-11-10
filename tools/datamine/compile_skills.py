#!/usr/bin/env python3
"""Compile per-hunter skill shards from Gearbox-documented trees + attribute hints.

Tree *structure* and Action Skill names: official Gearbox hunter pages / public rules
(manual evidence). Attribute names from datamine seed augment/capstone id hints.
Effects stay empty/unparsed until oracle bind — quarantine incomplete trees.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ATTR = ROOT / "tools" / "datamine" / "out" / "attributes.json"
CORPUS = ROOT / "data" / "indexes" / "skill-corpus.json"
OUT_DIR = ROOT / "data" / "skills"
INDEX = ROOT / "data" / "skills.json"
SUMMARY = ROOT / "data" / "indexes" / "skills-summary.json"

# Official Action Skills (Gearbox / public tree docs — not third-party dumps).
HUNTERS = [
    {
        "id": "amon",
        "display_name": "Amon",
        "no_capstones": False,
        "trees": [
            ("calamity", "Onslaughter"),
            ("vengeance", "Scourge"),
            ("cybernetics", "Crucible"),
        ],
        "attr_hints": ("Forge", "Amon", "forge"),
    },
    {
        "id": "rafa",
        "display_name": "Rafa",
        "no_capstones": False,
        "trees": [
            ("people_person", "Apophis_Lance"),
            ("remote_agent", "Peacebreaker_Cannons"),
            ("this_years_gimmick", "Arc_Knives"),
        ],
        "attr_hints": ("ExoSoldier", "Exo", "Rafa"),
    },
    {
        "id": "vex",
        "display_name": "Vex",
        "no_capstones": False,
        "trees": [
            ("the_fourth_seal", "Dead_Ringer"),
            ("vexcalation", "Incarnate"),
            ("here_comes_trouble", "Phase_Phamiliar"),
        ],
        "attr_hints": ("DarkSiren", "Siren", "Vex"),
    },
    {
        "id": "harlowe",
        "display_name": "Harlowe",
        "no_capstones": False,
        "trees": [
            ("creative_bursts", "Chroma_Accelerator"),
            ("seize_the_day", "Zero_Point"),
            ("cosmic_brilliance", "Flux_Generator"),
        ],
        "attr_hints": ("Gravitar", "Grav", "Harlowe"),
    },
    {
        "id": "c4sh",
        "display_name": "C4SH",
        "no_capstones": True,
        "trees": [
            ("chaos_walking", "Cross_Fire"),
            ("luck_of_the_draw", "Sleight_Of_Hand"),
            ("roll_the_bones", "Cleromancy"),
        ],
        "attr_hints": ("Cash", "C4SH", "Windfall", "Fortune"),
    },
    {
        "id": "loveless",
        "display_name": "Loveless",
        "no_capstones": False,
        "trees": [
            ("manifestation", "Malignant_Construct"),
            ("hack_slash", "Visual_Paradox_Nexus"),
            ("virology", "Plague_Star"),
        ],
        "attr_hints": ("Loveless", "RAM", "Wyrm"),
    },
]

LANES_BRANCH = ("branch_left", "branch_center", "branch_right")


def load_attr_names() -> list[str]:
    if not ATTR.exists():
        return []
    names: list[str] = []
    for block in json.loads(ATTR.read_text(encoding="utf-8")):
        names.extend(block.get("entry_names") or [])
    return names


def hint_matches(name: str, hints: tuple[str, ...]) -> bool:
    return any(h.lower() in name.lower() for h in hints)


def pick_augments(names: list[str], hints: tuple[str, ...], tree: str, limit: int = 5) -> list[str]:
    out = []
    for n in names:
        if not hint_matches(n, hints):
            continue
        if "augment" not in n.lower():
            continue
        slug = re.sub(r"[^A-Za-z0-9_]+", "_", n)[:64]
        out.append(slug)
        if len(out) >= limit:
            break
    while len(out) < limit:
        out.append(f"{tree}_augment_{len(out)+1}")
    return out


def pick_capstones(names: list[str], hints: tuple[str, ...], tree: str) -> list[str]:
    out = []
    for n in names:
        if not hint_matches(n, hints):
            continue
        if "capstone" not in n.lower():
            continue
        out.append(re.sub(r"[^A-Za-z0-9_]+", "_", n)[:64])
        if len(out) >= 3:
            break
    while len(out) < 3:
        out.append(f"{tree}_capstone_{len(out)+1}")
    return out[:3]


def skill(
    *,
    sid: str,
    character: str,
    tree: str,
    tier: int,
    row: int,
    lane: str,
    kind: str,
    max_rank: int,
    text: str,
    tags: list[str],
    activator: bool = False,
    point_cost: int | None = None,
    requires: list[str] | None = None,
    devils_tines: bool = False,
) -> dict:
    row_d: dict = {
        "id": sid,
        "character": character,
        "tree": tree,
        "tier": tier,
        "row": row,
        "lane": lane,
        "kind": kind,
        "max_rank": max_rank,
        "requires": requires or [],
        "effect_text": text,
        "effects": [],
        "tags": tags,
        "activator": activator,
    }
    if point_cost is not None:
        row_d["point_cost"] = point_cost
    if devils_tines:
        row_d["devils_tines"] = True
    return row_d


def build_hunter(spec: dict, attr_names: list[str]) -> dict:
    hid = spec["id"]
    skills: list[dict] = []
    for tree, action_name in spec["trees"]:
        action_id = f"{hid}_{tree}_action"
        skills.append(
            skill(
                sid=action_id,
                character=hid,
                tree=tree,
                tier=0,
                row=0,
                lane="common",
                kind="action",
                max_rank=1,
                text=action_name.replace("_", " "),
                tags=["action"],
                activator=True,
                point_cost=0,
            )
        )
        # Common trunk rows 0..2 (5 ranks each)
        for row in range(3):
            for slot in range(2):
                skills.append(
                    skill(
                        sid=f"{hid}_{tree}_c{row}_{slot}",
                        character=hid,
                        tree=tree,
                        tier=row,
                        row=row,
                        lane="common",
                        kind="passive",
                        max_rank=5,
                        text=f"{spec['display_name']} {tree} common r{row}",
                        tags=["passive", "common", "unparsed"],
                    )
                )
        if spec["no_capstones"]:
            skills.append(
                skill(
                    sid=f"{hid}_{tree}_devils_tines",
                    character=hid,
                    tree=tree,
                    tier=0,
                    row=0,
                    lane="common",
                    kind="passive",
                    max_rank=1,
                    text="Devil's Tines",
                    tags=["devils_tines"],
                    devils_tines=True,
                )
            )
        augs = pick_augments(attr_names, tuple(spec["attr_hints"]), tree)
        for i, aug in enumerate(augs):
            skills.append(
                skill(
                    sid=f"{hid}_{tree}_aug_{i}_{aug}"[:80],
                    character=hid,
                    tree=tree,
                    tier=1,
                    row=1,
                    lane="common",
                    kind="augment",
                    max_rank=1,
                    text=aug.replace("_", " "),
                    tags=["augment", "unparsed"],
                    point_cost=0,
                )
            )
        for bi, lane in enumerate(LANES_BRANCH):
            for row in range(3):
                skills.append(
                    skill(
                        sid=f"{hid}_{tree}_{lane}_r{row}",
                        character=hid,
                        tree=tree,
                        tier=row,
                        row=row,
                        lane=lane,
                        kind="passive",
                        max_rank=5,
                        text=f"{tree} {lane} row {row}",
                        tags=["passive", "branch", "unparsed"],
                    )
                )
            if not spec["no_capstones"]:
                caps = pick_capstones(attr_names, tuple(spec["attr_hints"]), tree)
                skills.append(
                    skill(
                        sid=f"{hid}_{tree}_cap_{bi}_{caps[bi]}"[:80],
                        character=hid,
                        tree=tree,
                        tier=2,
                        row=2,
                        lane=lane,
                        kind="capstone",
                        max_rank=1,
                        text=caps[bi].replace("_", " "),
                        tags=["capstone", "unparsed"],
                        point_cost=0,
                    )
                )
    return {
        "id": hid,
        "display_name": spec["display_name"],
        "no_capstones": spec["no_capstones"],
        "skills": skills,
        "quarantine": {
            "incomplete": True,
            "reason": "structure_seeded_effects_empty_pending_oracle",
        },
    }


def main() -> int:
    attr_names = load_attr_names()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    hunters = []
    for spec in HUNTERS:
        h = build_hunter(spec, attr_names)
        shard = OUT_DIR / f"{h['id']}.json"
        shard.write_text(json.dumps({"hunters": [h]}, indent=2) + "\n", encoding="utf-8")
        hunters.append({k: v for k, v in h.items() if k != "quarantine"})
        # keep quarantine only in shard meta via separate field stripped for schema
    catalog = {"hunters": hunters}
    INDEX.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    summary = {
        "hunters": len(hunters),
        "skills_total": sum(len(h["skills"]) for h in hunters),
        "attr_names": len(attr_names),
        "corpus": 0,
        "quarantine": "all_hunters_structure_seeded_effects_empty",
    }
    if CORPUS.exists():
        summary["corpus"] = json.loads(CORPUS.read_text(encoding="utf-8")).get("count") or 0
    SUMMARY.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary))
    return 0 if hunters else 1


if __name__ == "__main__":
    raise SystemExit(main())
