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

The property names default to `created` and `updated` but are configurable — see [Configuration](./configuration.md).

Values use the format `yyyy-MM-dd'T'HH:mm`, for example:

```yaml
---
created: 2024-10-27T14:12
updated: 2024-10-28T09:33
---
```

## What triggers an update

The plugin listens to Obsidian's vault `modify` event. Any write to a `.md` file inside your vault schedules that file for processing (see [When the write happens](#when-the-write-happens) below). The file is then skipped when any of the following is true:

- The file is not a Markdown file (extension != `.md`).
- The file is named `Canvas.md`.
- The file body is empty.
- The Excalidraw plugin is installed and reports the file as an Excalidraw drawing.
- The file is inside any folder listed in the plugin's **Folders to exclude** setting.

## When the write happens

Not immediately. Each changed file gets its own timer, and the front matter is only written once that file has been quiet for a couple of seconds. The countdown restarts on every keystroke, so nothing is written while you are still typing. The delay is configurable through the **Save delay** setting and defaults to 2 seconds.

### Why the delay exists

Writing front matter means rewriting the file. Obsidian reacts to that by refreshing the editor, and a refresh can move your cursor. In Live Preview tables it reliably does: you are typing in a cell, the plugin writes `updated`, and the cursor jumps out of the cell mid-word. The same thing happened often enough while editing long notes to make the plugin genuinely annoying to use.

Waiting for a pause solves it. By the time the write lands you have already stopped typing, so a cursor jump costs you nothing.

Two other things reduce the number of writes:

- **Nothing to change means nothing is written.** The plugin builds the new front matter first and compares. If neither `created` nor `updated` would change, the file is left alone and no refresh happens at all.
- **`updated` only moves once a minute.** Even when you edit continuously, the timestamp is refreshed at most once per minute, so a long editing session produces one write per minute rather than one every few seconds.

The timers are per file, so editing several notes in parallel works as expected. Changing the **Save delay** setting cancels anything currently pending and takes effect right away.

## Excluding folders

Open **Settings → Community plugins → Update Time**. Under **Folders to exclude**:

1. Start typing a folder path; the autocomplete lists matching vault folders.
2. Press the **+** button to add it.
3. Added folders appear below, each with a **Remove** button.

A file is excluded as soon as its path starts with any listed prefix. For example, adding `Templates` excludes `Templates/Daily.md` and `Templates/nested/Meeting.md`.

Changes take effect immediately — no reload required.

## Backfilling existing notes

When you first install the plugin, notes you already had in your vault don't have the `created` / `updated` properties yet — those properties only get added on the next modification. To populate them all in one go:

1. Open the command palette (`Ctrl/Cmd + P`).
2. Run **Update Time: Backfill created / updated properties in all notes**.
3. Confirm in the modal.

The command iterates every Markdown file in your vault. For each file it:

- Skips files that match the same rules as the live handler (Canvas, Excalidraw, empty notes, excluded folders, non-Markdown).
- Adds `created` from the file's `ctime` only if the property is missing.
- Adds `updated` from the file's `mtime` only if the property is missing or unparsable.
- Never overwrites a valid existing value.

A notice at the top of the screen reports the start and the end of the run, with the number of files updated, skipped, and errored.

**Back up your vault before running it.** The plugin writes to many files in one pass.

## Manual front matter

You can always edit `created` and `updated` manually. The plugin will not overwrite your `created` value. It will only overwrite `updated` when the file's `mtime` is more than one minute ahead of the value you wrote — that is, after you actually modify the file again.

If you have renamed the properties in the settings tab, the same rules apply to your custom names.
