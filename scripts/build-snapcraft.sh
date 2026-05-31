#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_JSON="$ROOT_DIR/package.json"
VERSION="$(node -e "const fs=require('node:fs'); const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); process.stdout.write(p.version);" "$PACKAGE_JSON")"
RELEASE_DIR="$ROOT_DIR/release/$VERSION"

rm -f "$ROOT_DIR"/*.snap
snapcraft pack --destructive-mode

SNAP_FILE="$(find "$ROOT_DIR" -maxdepth 1 -type f -name '*.snap' | head -n 1)"
if [[ -z "$SNAP_FILE" ]]; then
  echo "Error: snapcraft did not produce a .snap file" >&2
  exit 1
fi

mkdir -p "$RELEASE_DIR"
mv "$SNAP_FILE" "$RELEASE_DIR/"

echo "Built snap artifact: $RELEASE_DIR/$(basename "$SNAP_FILE")"

