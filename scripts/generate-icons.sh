#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SOURCE_SVG="$ROOT_DIR/build/icon.svg"
ICON_DIR="$ROOT_DIR/build/icons"
SNAP_GUI_DIR="$ROOT_DIR/snap/gui"

if ! command -v convert >/dev/null 2>&1; then
  echo "Error: ImageMagick 'convert' is required to generate icons." >&2
  exit 1
fi

mkdir -p "$ICON_DIR" "$SNAP_GUI_DIR"

# Generate high-resolution PNG assets for Snap/App Center listing and desktop integrations.
convert "$SOURCE_SVG" -resize 512x512 "$ICON_DIR/icon-512.png"
convert "$SOURCE_SVG" -resize 1024x1024 "$ICON_DIR/icon-1024.png"

cp "$ICON_DIR/icon-512.png" "$ROOT_DIR/build/icon.png"
cp "$ICON_DIR/icon-512.png" "$ROOT_DIR/public/tray-icon.png"
cp "$ICON_DIR/icon-512.png" "$ROOT_DIR/public/app-icon.png"
cp "$ICON_DIR/icon-512.png" "$SNAP_GUI_DIR/icon.png"
cp "$ICON_DIR/icon-1024.png" "$SNAP_GUI_DIR/icon-1024.png"

echo "Generated icon set:"
ls -lh "$ICON_DIR/icon-512.png" "$ICON_DIR/icon-1024.png" "$ROOT_DIR/build/icon.png" "$ROOT_DIR/public/tray-icon.png" "$ROOT_DIR/public/app-icon.png" "$SNAP_GUI_DIR/icon.png" "$SNAP_GUI_DIR/icon-1024.png"

