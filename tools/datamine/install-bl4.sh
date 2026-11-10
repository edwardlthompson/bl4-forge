#!/usr/bin/env bash
# Build pinned bl4-cli into tools/bin/. Never auto-updates the pin.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PIN_TAG="v0.8.5"
PIN_COMMIT="ae17c6dc5432364b05933f3a6ceeb739b2b52b07"
VENDOR="$ROOT/tools/vendor/bl4"
BIN_DIR="$ROOT/tools/bin"
mkdir -p "$BIN_DIR" "$ROOT/tools/vendor"

if [[ ! -d "$VENDOR/.git" ]]; then
  git clone --depth 1 --branch "$PIN_TAG" https://github.com/monokrome/bl4.git "$VENDOR"
fi
cd "$VENDOR"
HEAD="$(git rev-parse HEAD)"
if [[ "$HEAD" != "$PIN_COMMIT" ]]; then
  echo "WARN: HEAD $HEAD != pinned $PIN_COMMIT (tag $PIN_TAG)" >&2
fi

cargo build --release -p bl4-cli
if [[ -f target/release/bl4.exe ]]; then
  cp -f target/release/bl4.exe "$BIN_DIR/bl4.exe"
  echo "Installed $BIN_DIR/bl4.exe"
elif [[ -f target/release/bl4 ]]; then
  cp -f target/release/bl4 "$BIN_DIR/bl4"
  chmod +x "$BIN_DIR/bl4"
  echo "Installed $BIN_DIR/bl4"
else
  echo "bl4 binary not found under target/release/" >&2
  exit 1
fi
