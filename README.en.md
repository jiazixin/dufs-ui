<h1 align="center">dufs-ui · Modern Minimal File Drop Hub</h1>

<p align="center">
  A custom Vue 3 + TypeScript frontend for <a href="https://github.com/sigoden/dufs">sigoden/dufs</a>:<br>
  Drop-hub layout, thin-line icons, obsidian accent, drag-and-drop uploads with progress &amp; resume, Quick Look previews, and offline QR sharing.
</p>

<p align="center">
  <a href="https://github.com/jiazixin/dufs-ui/actions/workflows/ci.yml"><img src="https://github.com/jiazixin/dufs-ui/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://github.com/jiazixin/dufs-ui/releases/latest"><img src="https://img.shields.io/github/v/release/jiazixin/dufs-ui?sort=semver" alt="Release"></a>
  <img src="https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white" alt="Vue 3.5">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/dufs---assets-18181b" alt="dufs --assets">
</p>

<p align="center">
  <a href="README.md">简体中文</a> · <b>English</b>
</p>

---

dufs-ui compiles into a self-contained static bundle (`index.html`, `index.css`, `index.js`) designed to be served directly via `dufs --assets`. It loads zero external CDNs, fonts, or third-party QR APIs—making it fast and reliable on air-gapped LANs and self-hosted servers as a lightweight temporary file sharing hub.

> [!IMPORTANT]
>
> - When running `dufs -A` (or `--allow-delete`), **deleting a file or folder is permanent** and bypasses any recycle bin. Scope your shared directory and permissions carefully.
> - `dufs` uploads use standard single-request streaming `PUT` / `PATCH`. If placed behind Cloudflare's free proxy (100 MiB request body limit), larger uploads will fail with `413`; connect directly, use over LAN, or adjust body size and timeouts on your reverse proxy.

## Features

- **Drop-Hub Layout**: Collapsible top drag-and-drop zone paired with a quick QR card for the current folder; light/dark theme toggle and list/grid view switching.
- **Drag-and-Drop & Clipboard Paste**: Drop multiple files or entire nested folders (preserving directory structure), or press `Ctrl+V` to upload clipboard screenshots and files directly.
- **Live Upload Progress Queue**: Floating bottom-right queue showing per-file percentage, transferred size, smoothed transfer speed (`KiB/s`, `MiB/s`), and ETA; supports cancelling active uploads and resumable retry (`HEAD` + `PATCH`).
- **Quick Look Modal Preview**: Built on native `<dialog>`—image zoom/rotate with `←`/`→` keyboard navigation, native video/audio streaming, embedded PDF viewer, and text/code preview with one-click copy and inline editing when write permissions are enabled.
- **Offline QR Code Sharing**: Built-in ISO/IEC 18004 QR encoder with zero network calls; generate QR codes for any file or folder, download as PNG, copy direct links, or mint temporary `tokengen` links when authenticated.
- **Compact Table & Sorting**: Sortable Name, Last Modified, and Size columns synced with URL query parameters; full compatibility with `dufs` permissions, `?zip` folder archives, search (`/` or `Ctrl+K`), auth login/logout, and `?edit` / `?view` pages.

## Requirements

| Item              | Requirement                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| Server            | [sigoden/dufs](https://github.com/sigoden/dufs) with `--assets` support |
| Browsers          | Chrome / Edge 110+, Safari 16+, Firefox 115+                            |
| Build from source | Node.js ≥ 22.0, npm                                                     |

## Quick Start

### 1. Download a Prebuilt Release (Recommended)

Grab the latest `dufs-ui-<tag>.zip` or `dufs-ui-<tag>.tar.gz` from [Releases](https://github.com/jiazixin/dufs-ui/releases/latest), extract it, and pass the folder to `dufs --assets`:

```bash
# Using .zip
unzip dufs-ui-v1.0.0.zip -d dufs-ui
dufs /path/to/share -A --assets ./dufs-ui

# Or using .tar.gz
mkdir -p dufs-ui && tar -xzf dufs-ui-v1.0.0.tar.gz -C dufs-ui
dufs /path/to/share -A --assets ./dufs-ui
```

### 2. Docker Compose

```yaml
services:
  dufs:
    image: sigoden/dufs:latest
    ports:
      - '5000:5000'
    volumes:
      - ./shared:/data
      - ./dufs-ui:/assets:ro
    command: /data -A --assets /assets
    restart: unless-stopped
```

### 3. Build from Source

```bash
git clone https://github.com/jiazixin/dufs-ui.git
cd dufs-ui
npm ci
npm run build
dufs /path/to/share -A --assets ./dist
```

## Development

Running `npm run dev` without a `dufs` backend automatically starts in interactive demo mode (sample files, simulated upload progress, and offline QR codes).

| Script                                    | Description                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `npm run dev`                             | Start the Vite dev server (auto demo mode)                                  |
| `npm run format` / `npm run format:check` | Format and verify code style with Prettier                                  |
| `npm run lint`                            | Run ESLint (`strictTypeChecked` + Vue 3.5) and Stylelint with zero warnings |
| `npm run typecheck`                       | Run `vue-tsc --noEmit`                                                      |
| `npm run test`                            | Run Vitest + Testing Library unit tests                                     |
| `npm run build`                           | Build production assets into `dist/`                                        |

### Cutting a Release

Pushing any `v*` tag triggers the [Release workflow](.github/workflows/release.yml), which runs all verification checks, packages `.zip`, `.tar.gz`, and `SHA256SUMS.txt`, and publishes a GitHub Release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Project Structure

```text
.github/workflows/       GitHub Actions CI and tag-triggered release workflows
src/
  app/                   App-level singletons & core infra (api, errors, toast, dialog, theme)
  components/            Shared layout components (AppHeader, AppDialog, AppToast)
  features/files/        File browser, upload queue, preview modal, and QR share domain
  lib/                   Pure utilities (1024-based formatters, offline QR encoder, URL helpers)
  styles/                Centralized CSS design tokens (tokens.css) and base styles (base.css)
  test/                  Vitest test setup
AGENTS.md                Repository engineering rules for contributors and agents
Web代码规范.md            Web TypeScript coding standard
Vue代码规范.md            Vue 3.5+ coding standard
```

## Contributing

Issues and Pull Requests are welcome. Before submitting:

1. Read [AGENTS.md](AGENTS.md), [Web代码规范.md](Web代码规范.md), and [Vue代码规范.md](Vue代码规范.md).
2. Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`, ensuring all checks pass with zero warnings.
