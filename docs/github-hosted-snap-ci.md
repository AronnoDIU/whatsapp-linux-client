# GitHub-hosted Snap CI notes

This project’s Snap workflows now run on **GitHub-hosted Ubuntu runners**.
That keeps the pipeline simple and avoids the extra maintenance of a self-hosted runner.

## What the workflows do

- install `imagemagick` for icon generation
- install `snapcraft` via `snap install snapcraft --classic`
- add `/snap/bin` to `PATH`
- build the Linux app bundle with `electron-vite` + `electron-builder`
- package the Snap with `snapcraft pack --destructive-mode`

## GitHub-hosted runner notes

- no runner registration is needed
- no self-hosted label is required
- the jobs use `ubuntu-latest`
- the Snap publish job still needs the `SNAPCRAFT_LOGIN_FILE` secret

## Useful checks

If you want to mirror the CI flow locally on Ubuntu, make sure these commands work:

```bash
command -v snapcraft
command -v convert
```

## Workflow expectations

The Snap workflows in this repository are configured to use:

```yaml
runs-on: ubuntu-latest
```

That means the same CI path will run on standard GitHub-hosted Ubuntu workers without any runner setup.


