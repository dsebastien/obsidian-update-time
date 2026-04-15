---
title: Tips & troubleshooting
nav_order: 90
---

# Tips & troubleshooting

## Back up your vault

This plugin writes to every Markdown file it sees. Before enabling it on a real vault, take a backup (Obsidian Sync snapshot, git commit, filesystem copy, or whatever you normally use). Unexpected interactions with other plugins or sync tools could produce changes you didn't intend.

## Multi-device sync conflicts

When enabled on multiple devices at once, this plugin can create sync conflicts. It reacts to **all** file modifications — including those produced by your sync tool writing remote changes to disk. If Obsidian is open on two devices simultaneously, each one can trigger front-matter updates in response to the other's syncs, leading to conflict files.

Recommended workarounds:

- Only leave Obsidian running on one device at a time, or
- Enable the plugin on a single device (typically the one where you do most of your editing), or
- Disable the plugin and re-enable it only when you need a bulk update pass.

Relevant context: the original issue that inspired this simplified reimplementation is [beaussan/update-time-on-edit-obsidian#75](https://github.com/beaussan/update-time-on-edit-obsidian/issues/75).

## Excalidraw files are skipped

If you use the Excalidraw plugin, its `.excalidraw.md` files are detected via the plugin's `ExcalidrawAutomate` global and excluded automatically. No extra configuration is required.

## Troubleshooting

### The `updated` / `created` properties are not being written

Check, in order:

1. **The plugin is enabled** — **Settings → Community plugins → Update Time** toggle is on.
2. **The file is not in an excluded folder** — look at the **Folders to exclude** list in the plugin settings; any file whose path starts with one of those entries is skipped.
3. **The file is Markdown** — `.md` only. `.canvas`, `.excalidraw.md`, and `Canvas.md` are skipped.
4. **The file is not empty** — an empty body short-circuits the handler.
5. **The file's front matter is valid YAML** — malformed YAML is logged as a warning (open the developer console: **View → Toggle developer tools**) and the file is left untouched.

### The `updated` value doesn't change on every edit

That is intentional. `updated` is only refreshed when the file's `mtime` moves ahead of the recorded value by more than one minute. This debounce avoids fighting active edits and reduces diff churn.

### Property names don't match my existing notes

Currently the property names are hard-coded (`created`, `updated`). Customization is tracked in [issue #2](https://github.com/dsebastien/obsidian-update-time/issues/2).

## Reporting issues

Issues and feature requests: <https://github.com/dsebastien/obsidian-update-time/issues>.
