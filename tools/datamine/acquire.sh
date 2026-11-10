#!/usr/bin/env bash
# D0 acquire: resolve install (+ optional AES), extract filtered assets, record meta.
# Fails loudly when install path is missing. Never runs in CI.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT/tools/datamine/.env"
OUT="$ROOT/tools/datamine/out"
META="$ROOT/data/meta.json"

BL4_BIN="$ROOT/tools/bin/bl4"
[[ -f "$BL4_BIN.exe" ]] && BL4_BIN="$BL4_BIN.exe"
UEXTRACT="$ROOT/tools/bin/uextract"
[[ -f "$UEXTRACT.exe" ]] && UEXTRACT="$UEXTRACT.exe"
[[ -f "$UEXTRACT" ]] || UEXTRACT="$ROOT/tools/vendor/bl4/target/release/uextract"
[[ -f "$UEXTRACT.exe" ]] && UEXTRACT="$UEXTRACT.exe"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "MISSING: $ENV_FILE — copy .env.example and set BL4_INSTALL_PATH" >&2
  exit 2
fi
# shellcheck disable=SC1090
set -a
# Convert Windows path separators for bash when needed
# shellcheck disable=SC1091
source "$ENV_FILE"
set +a

: "${BL4_INSTALL_PATH:?BL4_INSTALL_PATH unset}"

# Git-Bash / WSL path fix
INSTALL="$BL4_INSTALL_PATH"
if [[ ! -d "$INSTALL" && -d "/mnt/d/SteamLibrary/steamapps/common/Borderlands 4" ]]; then
  INSTALL="/mnt/d/SteamLibrary/steamapps/common/Borderlands 4"
fi
if [[ ! -d "$INSTALL" ]]; then
  echo "MISSING install path: $BL4_INSTALL_PATH" >&2
  exit 2
fi

PAKS="$INSTALL/OakGame/Content/Paks"
if [[ ! -d "$PAKS" ]]; then
  echo "MISSING Paks directory: $PAKS" >&2
  exit 2
fi

if [[ ! -f "$BL4_BIN" && ! -x "$BL4_BIN" ]]; then
  echo "MISSING bl4 binary — run tools/datamine/install-bl4.sh first" >&2
  exit 2
fi

mkdir -p "$OUT/parts" "$OUT/ncs" "$OUT/balance"

AES_ARGS=()
if [[ -n "${BL4_AES_KEY:-}" ]]; then
  AES_ARGS=(--aes-key "$BL4_AES_KEY")
  echo "acquire: using AES key id=${BL4_AES_KEY_ID:-set}"
else
  echo "acquire: no BL4_AES_KEY set — attempting unencrypted / tool-default extract"
fi

echo "acquire: install=$INSTALL"
echo "acquire: paks=$PAKS"

if [[ -f "$UEXTRACT" || -f "${UEXTRACT}.exe" ]]; then
  UX="$UEXTRACT"
  [[ -f "${UEXTRACT}.exe" ]] && UX="${UEXTRACT}.exe"
  echo "acquire: uextract balance filter..."
  "$UX" "$PAKS" -f "BalanceData" -o "$OUT/balance" -j 4 "${AES_ARGS[@]}" || true
  echo "acquire: uextract Gear filter..."
  "$UX" "$PAKS" -f "Gear/" -o "$OUT/parts" -j 4 --format json "${AES_ARGS[@]}" || true
else
  echo "WARN: uextract not found; skipping asset extract" >&2
fi

# Decompress NCS from a small pak first (smoke), then attempt larger if present
SAMPLE_PAK="$(ls "$PAKS"/pakchunk0-Windows_1_P.pak 2>/dev/null | head -1 || true)"
if [[ -n "$SAMPLE_PAK" ]]; then
  echo "acquire: ncs decompress sample $SAMPLE_PAK"
  "$BL4_BIN" ncs decompress "$SAMPLE_PAK" -o "$OUT/ncs" --raw || true
fi

BUILD_ID="${BL4_STEAM_BUILD_ID:-unknown}"
KEY_ID="${BL4_AES_KEY_ID:-}"
RETRIEVED="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%d)"
BL4_COMMIT="$(cd "$ROOT/tools/vendor/bl4" 2>/dev/null && git rev-parse HEAD || echo ae17c6dc5432364b05933f3a6ceeb739b2b52b07)"

python3 - "$META" "$BUILD_ID" "$KEY_ID" "$RETRIEVED" "$BL4_COMMIT" <<'PY'
import json, sys
from pathlib import Path
meta_path, build_id, key_id, retrieved, bl4_commit = sys.argv[1:6]
path = Path(meta_path)
data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
data.update({
    "patch": data.get("patch") or "0.0.0-scaffold",
    "game_build": str(build_id),
    "aes_key_id": key_id or "none",
    "usmap_version": data.get("usmap_version") or "",
    "bl4_commit": bl4_commit,
    "retrieved_at": retrieved,
    "coverage": data.get("coverage") or {"parsed": 0, "tag_only": 0, "unparsed": 0, "total": 0},
})
path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"wrote {path} game_build={build_id}")
PY

echo "acquire: done (see tools/datamine/out/ and data/meta.json)"
