# WhatsApp Linux Client

An Electron-based desktop client for WhatsApp Web, optimized for Linux.
It wraps `web.whatsapp.com` in a native shell and adds convenience features such as tray support, native notifications, external-link handling, and screen-sharing fallbacks.

> This project is currently focused on Linux desktop usage.

## Overview

The application uses:

- **Electron** for the desktop shell
- **React + TypeScript** for the renderer UI
- **Vite / electron-vite** for fast development and builds
- **IPC bridges** for safe communication between renderer and main processes

The app loads WhatsApp Web with a Chrome-like user agent and adds a set of compatibility helpers to improve desktop behavior.

## Features

- Native desktop wrapper for **WhatsApp Web**
- **Tray icon** with quick actions:
  - show / hide the main window
  - open a new window for a separate account
  - toggle dark mode and compact mode
  - quit the application
- **Global shortcut**: `Ctrl + Alt + W` toggles the window visibility
- **Zoom shortcuts**: `Ctrl + =`, `Ctrl + -`, and `Ctrl + 0`
- **Native notifications** from the Electron main process
- **External links** open in the system browser
- **File picker** support via native dialogs
- **Multiple account windows** using separate Electron sessions / partitions
- **Saved window state** so size, position, fullscreen, and zoom are restored on launch
- **Display-capture fallback** for screen sharing on Linux / PipeWire environments
- **Permission handling** for camera, microphone, notifications, and display capture
- **Bengali typography tuning** with bundled Noto Bengali fonts for cleaner Bangla rendering

### 🎨 UI/UX Improvements

- **Dark Mode Toggle** - Automatic system theme detection with manual override options (Auto/Light/Dark)
- **Compact Mode** - Smaller UI elements optimized for laptop users
- **Spell Checker** - Multi-language support including English (en-US), English (UK), Spanish, French, German, Italian, Portuguese, and Russian
- **Settings UI** - Beautiful settings panel accessible from the app or system tray
- **Real-time Updates** - Changes apply instantly without restart

## Prerequisites

- **Node.js 18+** is recommended
- **npm** (or a compatible package manager)
- A Linux desktop environment with Electron runtime dependencies available

If you are using Wayland and want screen sharing to work well, ensure PipeWire / portal support is installed and configured on your system.

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd whatsapp-linux-client
npm install
```

## Development

Start the application in development mode:

```bash
npm run dev
```

This launches the Electron app with the Vite development server and hot reload support.

## Build

Create a production build:

```bash
npm run build
```

The build output is generated under:

- `dist/` for the renderer bundle
- `dist-electron/main/` for the Electron main process bundle
- `dist-electron/preload/` for the preload bundle

## Ubuntu Snap Store / App Center packaging

This repository is configured for both:

- **electron-builder AppImage packaging** (`npm run dist:linux`)
- **snapcraft.yaml-based packaging** (`npm run dist:snap` / `npm run snapcraft:build`)

It also includes CI/CD workflows for automatic Snap build and publish.

### Packaging scripts

- `npm run dist:linux` — build the app and generate the AppImage artifact
- `npm run dist:snap` — build the app and generate the Snap artifact (`whats-tux`) via Snapcraft
- `npm run dist:linux:dir` — build unpacked Linux app output for Snapcraft
- `npm run icons:generate` — generate branded icon assets (`512x512`, `1024x1024`)
- `npm run snapcraft:prepare` — prepare `release/snapcraft/linux-unpacked` from build output
- `npm run snapcraft:build` — build and package the Snap using `snapcraft.yaml`

### Branding assets for store review

Generated branding files:

- `build/icons/icon-512.png`
- `build/icons/icon-1024.png`
- `snap/gui/icon.png` (used by Snap metadata)
- `snap/gui/icon-1024.png` (store-review asset)

Regenerate anytime:

```bash
npm run icons:generate
```

### Build locally (electron-builder)

```bash
npm install
npm run dist:linux
```

The AppImage artifact will be written to the `release/<version>/` folder.

### Build locally (snapcraft.yaml)

Install Snapcraft first (one-time):

```bash
sudo snap install snapcraft --classic
```

Then build using the Snapcraft project file:

```bash
npm install
npm run snapcraft:build
```

This produces a `.snap` inside `release/<version>/`.

### Publish to Snap Store

1. Create/register your Snap name once:

```bash
snapcraft login
snapcraft register whats-tux
```

2. Build the `.snap` artifact (local or CI)
3. Test locally if needed:

```bash
sudo snap install --dangerous release/<version>/*.snap
```

4. Upload and release manually:

```bash
snapcraft upload release/<version>/*.snap --release=stable
```

### Smoother desktop behavior

The app now includes a few quality-of-life improvements:

- restored window size / position / fullscreen state between launches
- zoom controls from the tray menu and keyboard shortcuts
- `Esc` exits fullscreen
- reload / hard-reload actions in the tray menu
- Bengali font fallback injection for WhatsApp Web content

### CI/CD: automatic Snap build and publish

Workflows included:

- `.github/workflows/snap-build.yml` — automatically builds Snap on trusted pushes and uploads artifact
- `.github/workflows/snap-publish.yml` — automatically publishes Snap on trusted pushes (`main`, `v*`) or manual dispatch
- `.github/workflows/snapcraft-pack.yml` — manual Snapcraft pack workflow for review/testing

These Snap workflows run on GitHub-hosted Ubuntu runners and use Snapcraft’s destructive pack mode.

Required GitHub secret for publish workflow:

- `SNAPCRAFT_LOGIN_FILE`

Generate login credentials file locally:

```bash
snapcraft login
snapcraft export-login --snaps whats-tux --channels stable -
```

Copy the exported content and save it as repository secret `SNAPCRAFT_LOGIN_FILE`.

### GitHub-hosted runner notes

See [`docs/github-hosted-snap-ci.md`](docs/github-hosted-snap-ci.md) for the full Ubuntu runner flow, required packages, and verification commands.

### Desktop entry and store-listing polish

This repository now includes:

- polished desktop metadata in `electron-builder.json5` (`Name`, `Comment`, `Categories`, `Keywords`, `StartupWMClass`)
- dedicated Snap desktop entry at `snap/gui/whatsapp-linux-client.desktop`
- cleaned branding metadata in `package.json` (`homepage`, `repository`, `bugs`, `keywords`)

### Notes

- The Linux bundle includes `public/` so tray icons and other runtime assets are available in packaged builds.
- Snap/App Center icon generation is automated from `build/icon.svg`.
- Press `Esc` to leave fullscreen.
- Replace `build/icon.svg` and run `npm run icons:generate` to fully rebrand all icon outputs.
- The Snap workflows now use GitHub-hosted runners and Snapcraft pack, so they do not depend on a self-hosted runner.

## Preview

Preview the production build locally:

```bash
npm run preview
```

## Scripts

The available package scripts are:

- `npm run dev` — start the app in development mode
- `npm run build` — build the application for production
- `npm run dist:linux` — build the AppImage package
- `npm run dist:snap` — build the Snap package via Snapcraft
- `npm run dist:linux:dir` — build unpacked Linux output
- `npm run icons:generate` — generate 512/1024 icon set and packaging icons
- `npm run snapcraft:prepare` — prepare unpacked build for `snapcraft.yaml`
- `npm run snapcraft:build` — package Snap from `snapcraft.yaml`
- `npm run preview` — preview the production build

## Project Structure

```text
whatsapp-linux-client/
├── electron/
│   ├── main.ts        # Main process: window creation, tray, IPC, permissions
│   └── preload.ts     # Safe bridge between Electron and the renderer
├── src/
│   ├── main.tsx       # React entry point
│   ├── App.tsx        # Renderer UI
│   └── App.css        # App styles
├── public/            # Static assets used by Electron and Vite
├── dist-electron/     # Generated Electron bundles
├── electron.vite.config.ts
└── package.json
```

## How It Works

### Main process

`electron/main.ts` is responsible for:

- creating the primary window
- applying a Chrome-like user agent for better WhatsApp compatibility
- configuring permission requests
- handling tray actions and global shortcuts
- opening external links in the default browser
- exposing IPC handlers used by the preload script

### Preload script

`electron/preload.ts` exposes a limited API to the renderer through `contextBridge`.
This includes:

- IPC helpers
- native notifications
- opening external URLs
- file selection dialogs
- application version lookup
- a screen-sharing fallback that uses desktop capture APIs

### Renderer

The renderer is a React application that can consume the bridge exposed by the preload script.

## Account Isolation

This client supports opening additional windows for separate accounts. Each new account window uses a unique Electron session partition, which helps isolate cookies and login state.

## Screen Sharing Notes

Screen sharing on Linux can depend on your desktop session:

- On **Wayland**, ensure portal / PipeWire support is available
- On **X11**, desktop capture should generally work, but the exact behavior depends on your desktop environment

The app includes a native fallback for `getDisplayMedia` to improve compatibility with WhatsApp Web calls and screen sharing.

## Troubleshooting

### Bangla text looks poor

- The app now bundles `fonts-noto-core` in the snap and injects a Bengali-friendly font stack into WhatsApp Web.
- If a specific Bengali font still looks wrong on your system, make sure the installed snap has refreshed to the newest revision.

### The app opens, but screen sharing does not work

- Confirm PipeWire / xdg-desktop-portal is installed on your system
- Try running under an updated desktop environment
- Make sure permissions for camera / microphone / screen capture are not blocked by the OS

### Tray icon does not appear

- Ensure the bundled icon assets exist under `public/`
- Some desktop environments handle tray icons differently; this can vary on Linux

### WhatsApp Web shows a compatibility warning

- The app sets a Chrome-like user agent, but WhatsApp may still change browser checks over time
- Update the Electron version and rebuild if WhatsApp changes its requirements

## Security and Privacy

This application is a desktop wrapper around WhatsApp Web. It does not implement a separate messaging backend.

Important notes:

- Your WhatsApp login session is stored in Electron session data
- External links are opened in your system browser
- Permission requests are handled by the Electron main process

Always review the source code before distributing a production build.

## Roadmap

Potential future improvements:

- packaging for AppImage / deb / rpm
- auto-updates
- settings screen for runtime preferences
- app branding and custom assets
- deeper desktop integration on Wayland

## License

No license file is currently included in the repository. Add one before public distribution.

## Contributing

Contributions are welcome.

Suggested workflow:

1. Fork the repository
2. Create a feature branch
3. Run the app locally with `npm run dev`
4. Test your changes thoroughly
5. Open a pull request with a clear description

## Support

If you encounter an issue, include:

- your Linux distribution and desktop environment
- whether you are using X11 or Wayland
- Electron / Node.js versions
- steps to reproduce the problem

---

If you want, I can also add:

- a `LICENSE`
- a `CONTRIBUTING.md`
- a `CHANGELOG.md`
- badges and screenshots
- packaging instructions for AppImage / Debian / RPM
