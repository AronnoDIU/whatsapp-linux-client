# DEPRECATED: Self-hosted runner guide (archived)

This document has been archived. The project no longer requires a self-hosted runner for Snap CI — the workflows now run on GitHub-hosted Ubuntu runners.

See `docs/github-hosted-snap-ci.md` for the current, supported CI instructions.

Archived contents (kept for historical reference):

```
This project’s Snap workflows are designed to run on a **self-hosted Linux x64 GitHub Actions runner** with the label `snap-builder`.

Why this was originally included:

`electron-builder --linux snap` previously depended on Multipass-based Snap tooling which failed on some GitHub-hosted runners. The self-hosted runner instructions were provided as an option to avoid those failures.

This file was archived on 2026-05-31. Use `docs/github-hosted-snap-ci.md` instead.
```


