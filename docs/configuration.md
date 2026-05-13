---
title: Configuration
nav_order: 3
---

# Configuration

Open **Settings → Community plugins → Update Time** to access the settings tab.

## Settings

| Setting               | Type       | Default   | Description                                                                                                                                                                                                                                        |
| --------------------- | ---------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Created property name | `string`   | `created` | Front-matter key used to record the creation time. Change this if you prefer a different name (e.g. `createdAt`, `date created`). Leave the field empty to use the default. Renaming affects future writes only — existing notes are not migrated. |
| Updated property name | `string`   | `updated` | Front-matter key used to record the last-update time. Same rules as above (leave empty to use the default; no migration of existing notes).                                                                                                        |
| Folders to exclude    | `string[]` | `[]`      | Any file whose path starts with one of these folder prefixes is skipped. Use this for templates, archives, plugin-managed folders, or any other location where you don't want creation / update front-matter properties written.                   |

### Property names

You can pick any valid YAML key. If you change a name after some notes already have front matter with the old name:

- The plugin will **not** rewrite the old property on those notes.
- The plugin will create the new property on the next write that matches its rules (debounce, file filters).
- You may end up with both keys on some notes for a while. Clean them up manually if needed, or leave them — they don't cause errors.

If you leave the field empty (or fill it with only whitespace), the plugin uses the default (`created` or `updated`).

### Folders to exclude

Paths are matched with `path.startsWith(folder)`, so adding `Templates` excludes every file inside `Templates/` (and any sibling folder whose name starts with `Templates`, e.g. `Templates-archive/` — use trailing context carefully if that matters).

Each added folder is displayed below the input with a **Remove** button. Duplicates are filtered automatically.

## Internal constants (not configurable)

These are currently hard-coded in the plugin. GitHub issues exist to make them user-configurable in a future release.

| Constant           | Value                | Notes                                                                               |
| ------------------ | -------------------- | ----------------------------------------------------------------------------------- |
| Date format        | `yyyy-MM-dd'T'HH:mm` | Tracked in [issue #3](https://github.com/dsebastien/obsidian-update-time/issues/3). |
| Debounce threshold | `1` minute           | Tracked in [issue #4](https://github.com/dsebastien/obsidian-update-time/issues/4). |

## Storage

Settings are persisted by Obsidian as `data.json` inside the plugin folder (`.obsidian/plugins/update-time/`). No external storage is used.
