---
title: Configuration
nav_order: 3
---

# Configuration

Open **Settings → Community plugins → Update Time** to access the settings tab.

## Settings

| Setting            | Type       | Default | Description                                                                                                                                                                                                                          |
| ------------------ | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Folders to exclude | `string[]` | `[]`    | Any file whose path starts with one of these folder prefixes is skipped. Use this for templates, archives, plugin-managed folders, or any other location where you don't want `created` / `updated` front-matter properties written. |

Paths are matched with `path.startsWith(folder)`, so adding `Templates` excludes every file inside `Templates/` (and any sibling folder whose name starts with `Templates`, e.g. `Templates-archive/` — use trailing context carefully if that matters).

Each added folder is displayed below the input with a **Remove** button. Duplicates are filtered automatically.

## Internal constants (not configurable)

These are currently hard-coded in the plugin. GitHub issues exist to make them user-configurable in a future release.

| Constant             | Value                | Notes                                                                               |
| -------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| Created property key | `created`            | Tracked in [issue #2](https://github.com/dsebastien/obsidian-update-time/issues/2). |
| Updated property key | `updated`            | Same issue.                                                                         |
| Date format          | `yyyy-MM-dd'T'HH:mm` | Tracked in [issue #3](https://github.com/dsebastien/obsidian-update-time/issues/3). |
| Debounce threshold   | `1` minute           | Tracked in [issue #4](https://github.com/dsebastien/obsidian-update-time/issues/4). |

## Storage

Settings are persisted by Obsidian as `data.json` inside the plugin folder (`.obsidian/plugins/update-time/`). No external storage is used.
