# Third-Party Licenses

> Generated and maintained per release. See pre-release gate in `docs/INITIALIZATION_PROMPT.md` Section 7a.

## Project License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).

## Dependencies

Run license audits for active stacks:

```bash
# Web (npm)
cd examples/web && npx license-checker --production --summary

# Python (pip)
cd examples/python && uv run pip-licenses --format=markdown

# Rust / Go (optional stacks — MIT stubs; expand when deps are added)
grep 'license' examples/rust/Cargo.toml
head -1 examples/go/go.mod

```

`[AUTO]` CI runs `scripts/check-license-compliance.sh` on each push.

## Attribution

When bundling dependencies in releases (APK, desktop binary, etc.), include
this file or a generated `NOTICE` file in the distribution artifact.

### monokrome/bl4 (BSD-2-Clause)

- **Project:** [monokrome/bl4](https://github.com/monokrome/bl4) — Borderlands 4 extraction / NCS / parts / drops / serial tooling
- **Pin:** tag `v0.8.5` / commit `ae17c6dc5432364b05933f3a6ceeb739b2b52b07`
- **Use:** Maintainer datamine lane only (`tools/datamine/`). Binary rebuilt into gitignored `tools/bin/`. Not shipped to site visitors.
- **License text:** see upstream `LICENSE` (BSD 2-Clause); SPDX `BSD-2-Clause` in `REUSE.toml`

## Incompatible Licenses

`[HUMAN]` must approve any dependency with copyleft licenses (GPL, AGPL) that
may affect distribution. Document exceptions in `DECISION_LOG.md`.

**Blender (optional stack):** GPL **runtime** only. The template does not vendor
Blender or link `libblender`. See `docs/adr/0006-blender-runtime.md`. NVIDIA OptiX
is a local optional backend, not a CI or FOSS production-path dependency.
