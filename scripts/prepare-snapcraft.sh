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

# Remove host system libraries that may have been bundled into the unpacked app.
# These libraries are linked against the host's glibc and can cause symbol
# version mismatches (e.g. GLIBC_2.38) when the snap runs on systems with an
# older glibc. Snaps should rely on the base snap for core system libraries.
# Delete common system library folders if they were accidentally copied.
if [[ -d "$DEST_DIR/usr/lib/x86_64-linux-gnu" ]]; then
  echo "Removing bundled host system libs from $DEST_DIR/usr/lib/x86_64-linux-gnu"
  rm -rf "$DEST_DIR/usr/lib/x86_64-linux-gnu"
fi
if [[ -d "$DEST_DIR/lib/x86_64-linux-gnu" ]]; then
  echo "Removing bundled host system libs from $DEST_DIR/lib/x86_64-linux-gnu"
  rm -rf "$DEST_DIR/lib/x86_64-linux-gnu"
fi

if [[ ! -f "$ROOT_DIR/snap/gui/icon.png" ]]; then
  echo "Error: snap icon not found at 'snap/gui/icon.png'. Run: npm run icons:generate" >&2
  exit 1
fi

# Snapcraft expects the desktop entry to exist inside the prepared source tree.
# Copy the desktop file and icon into the staged snap/gui directory so core24
# packaging can resolve snap/gui/whats-tux.desktop during validation.
mkdir -p "$DEST_DIR/snap/gui"
cp -a "$ROOT_DIR/snap/gui/whats-tux.desktop" "$DEST_DIR/snap/gui/whats-tux.desktop"
cp -a "$ROOT_DIR/snap/gui/icon.png" "$DEST_DIR/snap/gui/icon.png"

# Some snap templates expect the application to be inside a directory named after the
# repository (e.g. "whatsapp-linux-client"). Ensure that name exists alongside the
# unpacked contents so `snapcraft pack` can find the expected path.
REPO_NAME="$(basename "$ROOT_DIR")"
if [[ ! -e "$DEST_DIR/$REPO_NAME" ]]; then
  mkdir -p "$DEST_DIR/$REPO_NAME"
  # copy from the original unpacked source (not from DEST_DIR which may already contain REPO_NAME)
  cp -a "$SRC_DIR/." "$DEST_DIR/$REPO_NAME/"
fi
echo "Prepared snapcraft source directory at: $DEST_DIR"

# Create an explicit OSS compatibility symlink in the staged filesystem.
# The package we stage provides `oss4-libsalsa/libOSSlib.so`, but the runtime
# loader is searching for a flat `/usr/lib/x86_64-linux-gnu/libOSSlib.so` path.
# Point the flat path at the package-provided filename without overriding ALSA.
mkdir -p "$DEST_DIR/usr/lib/x86_64-linux-gnu"
if [[ ! -e "$DEST_DIR/usr/lib/x86_64-linux-gnu/libOSSlib.so" ]]; then
  echo "Creating OSS compatibility symlink: $DEST_DIR/usr/lib/x86_64-linux-gnu/libOSSlib.so -> oss4-libsalsa/libOSSlib.so"
  mkdir -p "$DEST_DIR/usr/lib/x86_64-linux-gnu/oss4-libsalsa"
  ln -s "oss4-libsalsa/libOSSlib.so" "$DEST_DIR/usr/lib/x86_64-linux-gnu/libOSSlib.so"
fi

