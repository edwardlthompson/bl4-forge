"""Attempt BUILD_PLAN HUMAN/ADB rows via scripts and automation."""
from __future__ import annotations

import json
from pathlib import Path

from human_task_core import AttemptResult, mark_build_plan_row, resolve_config
from human_task_rows import automate_approve_adr
from human_task_rules import ADB_RULES, HUMAN_RULES


def attempt_row(root: Path, owner: str, task: str, sprint: str) -> AttemptResult:
    cfg = resolve_config(root)
    owner_u = owner.upper()
    rules = HUMAN_RULES if owner_u == "HUMAN" else ADB_RULES if owner_u == "ADB" else []
    for pattern, _kind, handler in rules:
        if not pattern.search(task):
            continue
        if handler is automate_approve_adr:
            return handler(root, cfg, task)
        return handler(root, cfg)  # type: ignore[operator]
    return AttemptResult(1, "no-match", f"No automation rule for {owner} task in sprint {sprint}", True)


def main() -> int:
    import argparse

    from build_backlog import add_item, remove_item

    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--owner", required=True)
    parser.add_argument("--task", required=True)
    parser.add_argument("--sprint", default="")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    result = attempt_row(root, args.owner, args.task, args.sprint)
    if result.exit_code == 0:
        marked = mark_build_plan_row(root, args.owner, args.task)
        if args.sprint:
            remove_item(root, args.owner, args.task, args.sprint)
        if not args.json:
            print(f"marked_build_plan={marked}")
    elif result.backlog:
        add_item(root, args.owner, args.task, args.sprint or "Waiting", result.reason)
    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print(f"{result.method}: exit={result.exit_code} {result.reason}")
    return result.exit_code


if __name__ == "__main__":
    raise SystemExit(main())
