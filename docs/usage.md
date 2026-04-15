---
title: Usage
nav_order: 2
---

# Usage

Once the plugin is installed and enabled, there is nothing to click. It runs automatically in the background.

## What it does

Whenever a Markdown file in your vault is modified — by you editing it in Obsidian, by a sync tool writing to disk, or by any other process — the plugin reads the file's `ctime` and `mtime` and writes them into the front matter as two properties:

- `created` — set once, on the first update after the plugin sees the file. It is never overwritten afterwards.
- `updated` — refreshed whenever the file's `mtime` moves ahead of the current value by more than one minute.

Values use the format `yyyy-MM-dd'T'HH:mm`, for example:

```yaml
---
created: 2024-10-27T14:12
updated: 2024-10-28T09:33
---
```

## What triggers an update

The plugin listens to Obsidian's vault `modify` event. Any write to a `.md` file inside your vault triggers the handler. The handler skips the file when any of the following is true:

- The file is not a Markdown file (extension != `.md`).
- The file is named `Canvas.md`.
- The file body is empty.
- The Excalidraw plugin is installed and reports the file as an Excalidraw drawing.
- The file path starts with any folder listed in the plugin's **Folders to exclude** setting.

## Excluding folders

Open **Settings → Community plugins → Update Time**. Under **Folders to exclude**:

1. Start typing a folder path; the autocomplete lists matching vault folders.
2. Press the **+** button to add it.
3. Added folders appear below, each with a **Remove** button.

A file is excluded as soon as its path starts with any listed prefix. For example, adding `Templates` excludes `Templates/Daily.md` and `Templates/nested/Meeting.md`.

Changes take effect immediately — no reload required.

## Manual front matter

You can always edit `created` and `updated` manually. The plugin will not overwrite your `created` value. It will only overwrite `updated` when the file's `mtime` is more than one minute ahead of the value you wrote — that is, after you actually modify the file again.
