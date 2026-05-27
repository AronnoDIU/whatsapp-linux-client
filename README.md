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
  - quit the application
- **Global shortcut**: `Ctrl + Alt + W` toggles the window visibility
- **Native notifications** from the Electron main process
- **External links** open in the system browser
- **File picker** support via native dialogs
- **Multiple account windows** using separate Electron sessions / partitions
- **Display-capture fallback** for screen sharing on Linux / PipeWire environments
- **Permission handling** for camera, microphone, notifications, and display capture

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

## Preview

Preview the production build locally:

```bash
npm run preview
```

## Scripts

The available package scripts are:

- `npm run dev` — start the app in development mode
- `npm run build` — build the application for production
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
