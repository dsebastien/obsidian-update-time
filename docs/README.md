---
title: Overview
nav_order: 1
permalink: /
---

# Update Time

Update Time automatically maintains `created` and `updated` front-matter properties on your Obsidian notes. Once enabled, it watches for file modifications (from Obsidian or external tools) and keeps those properties in sync with the file's actual creation and last-modification times.

## Key features

- **Automatic** — no commands to run. Whenever a note changes, its front matter is updated in the background.
- **Accurate** — values come from the file's underlying `ctime` and `mtime`, not from Obsidian-internal state.
- **Non-destructive for existing values** — `created` is only set when missing; `updated` is debounced to avoid fighting your edits.
- **Folder exclusions** — exclude templates, daily notes, or any other folder from automatic updates.
- **Excalidraw-aware** — Excalidraw files are skipped.
- **Fully local** — no network calls, no telemetry.

## Quick start

1. Install the plugin from Obsidian's community catalog (**Settings → Community plugins → Browse → Update Time**) and enable it.
2. (Optional) Open **Settings → Community plugins → Update Time** and add any folder paths to exclude (e.g., `Templates`, `_archive`).
3. Start editing notes — `created` and `updated` properties appear automatically in front matter.

**Important:** This plugin modifies files in your vault. Back up your vault before enabling it.

## What the plugin accesses

- **Vault read** — listens for Obsidian's `vault.on('modify')` event. For each modified file, the plugin reads its content once to filter out empty notes and Excalidraw files.
- **Vault write** — only writes two front-matter properties on `.md` files: `created` (when missing) and `updated` (refreshed at most once per minute).
- **No vault scans** — the plugin does not iterate over your vault on a timer; it only reacts to modify events emitted by Obsidian.
- **No network calls** — no analytics, no remote services. The Buy Me a Coffee badge in the settings tab is bundled inside the plugin and rendered locally.
- **Excluded folders** — any file whose path starts with a folder listed in **Settings → Update Time** is skipped entirely (no read, no write).

## About

Created by [Sébastien Dubois](https://dsebastien.net).

To stay up to date, subscribe to [my newsletter](https://dsebastien.net). The best way to support this plugin is to become a paid subscriber or to buy me a coffee at <https://www.buymeacoffee.com/dsebastien>.
