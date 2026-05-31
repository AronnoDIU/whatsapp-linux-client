#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_JSON="$ROOT_DIR/package.json"

VERSION="$(node -e "const fs=require('node:fs'); const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); process.stdout.write(p.version);" "$PACKAGE_JSON")"
SRC_DIR="$ROOT_DIR/release/$VERSION/linux-unpacked"
DEST_DIR="$ROOT_DIR/release/snapcraft/linux-unpacked"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Error: expected unpacked Electron build at '$SRC_DIR'. Run: npm run dist:linux:dir" >&2
  exit 1
fi

rm -rf "$DEST_DIR"
# ensure destination directory exists, then copy the *contents* of the unpacked folder
# (previously we copied the folder itself which produced an extra nested `linux-unpacked/linux-unpacked`)
mkdir -p "$DEST_DIR"
cp -a "$SRC_DIR/." "$DEST_DIR/"

if [[ ! -f "$ROOT_DIR/snap/gui/icon.png" ]]; then
  echo "Error: snap icon not found at 'snap/gui/icon.png'. Run: npm run icons:generate" >&2
  exit 1
fi

echo "Prepared snapcraft source directory at: $DEST_DIR"

