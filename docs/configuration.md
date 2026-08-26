---
title: Configuration
nav_order: 3
---

# Configuration

Open **Settings → Community plugins → Update Time** to access the settings tab.

## Settings

| Setting               | Type       | Default   | Description                                                                                                                                                                                                                                           |
| --------------------- | ---------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Created property name | `string`   | `created` | Front-matter key used to record the creation time. Change this if you prefer a different name (e.g. `createdAt`, `date created`). Leave the field empty to use the default. Renaming affects future writes only — existing notes are not migrated.    |
| Updated property name | `string`   | `updated` | Front-matter key used to record the last-update time. Same rules as above (leave empty to use the default; no migration of existing notes).                                                                                                           |
| Save delay (seconds)  | `number`   | `2`       | How long to wait after you stop typing before the plugin updates the front matter. The timer resets on every keystroke, so updates happen only once you pause. Raise it if you lose your cursor while editing (for example inside tables). See below. |
| Folders to exclude    | `string[]` | `[]`      | Any file whose path starts with one of these folder prefixes is skipped. Use this for templates, archives, plugin-managed folders, or any other location where you don't want creation / update front-matter properties written.                      |

### Save delay

Writing front matter means rewriting the file, and Obsidian reacts to that by refreshing the editor. A refresh can move your cursor. In **Live Preview tables** it reliably does: you are typing in a cell, the plugin writes `updated`, and the cursor jumps out of the cell mid-word.

So the write waits for you to stop. **Save delay** is how many seconds of inactivity to wait first, counted per file, with the countdown restarting on every keystroke. Nothing is written while you are actively typing, and by the time the write lands a cursor jump costs you nothing.

- Default is `2` seconds.
- If you still lose focus while editing (for example because you pause often inside tables), raise it to `5` or more.
- `0` writes as soon as Obsidian reports the change. That is the behavior the plugin had before the save delay existed, and it will move your cursor in tables.

Changing this setting cancels anything currently pending, so the new value applies from the next keystroke onwards.

On top of the delay, the plugin skips the write entirely when nothing would change. It compares the timestamps it is about to write against what the note already has, and leaves the file alone when they match. See [When the write happens](usage.md#when-the-write-happens) for how this fits together.

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

| Constant                      | Value                | Notes                                                                                                                                                                               |
| ----------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date format                   | `yyyy-MM-dd'T'HH:mm` | Tracked in [issue #3](https://github.com/dsebastien/obsidian-update-time/issues/3).                                                                                                 |
| Minimum minutes between saves | `1` minute           | How stale `updated` has to be before it is refreshed again. Separate from the save delay above. Tracked in [issue #4](https://github.com/dsebastien/obsidian-update-time/issues/4). |

## Storage

Settings are persisted by Obsidian as `data.json` inside the plugin folder (`.obsidian/plugins/update-time/`). No external storage is used.
