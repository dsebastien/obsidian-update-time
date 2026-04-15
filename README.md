# Obsidian Update Time

Automatically update front matter to include creation and last update times.

This Obsidian plugin keeps the `created` and `updated` front-matter properties of your notes in sync with the file's actual creation (`ctime`) and modification (`mtime`) timestamps. Once installed and enabled, it runs in the background — no commands to click, no manual housekeeping.

This plugin is a simplified reimplementation of the [update-time-on-edit plugin](https://github.com/beaussan/update-time-on-edit-obsidian). It was originally created to work around the fact that the original plugin did not integrate well with Obsidian Publish (see [beaussan/update-time-on-edit-obsidian#75](https://github.com/beaussan/update-time-on-edit-obsidian/issues/75)).

## Features

- **Automatic** — front matter updates happen whenever a note is modified (from Obsidian or from external tools).
- **Accurate** — values come from the file's underlying `ctime` and `mtime`.
- **Respects existing values** — `created` is never overwritten; `updated` is debounced (`MINUTES_BETWEEN_SAVES` = 1 minute) to avoid fighting active edits.
- **Folder exclusions** — skip templates, archives, or any other folder.
- **Excalidraw-aware** — Excalidraw files are detected and skipped.
- **Canvas-safe** — `Canvas.md` and non-Markdown files are skipped.
- **Fully local** — no network calls, no telemetry.

## Installation

### From the Obsidian community catalog (recommended)

1. In Obsidian, go to **Settings → Community plugins**.
2. Disable **Restricted mode** if you have not already.
3. Select **Browse**, search for **Update Time**, install it, and then enable it.

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub release](https://github.com/dsebastien/obsidian-update-time/releases).
2. Copy them into `<YourVault>/.obsidian/plugins/update-time/` (create the folder if it does not exist).
3. Reload Obsidian and enable the plugin in **Settings → Community plugins**.

## Configuration

Open **Settings → Community plugins → Update Time** to add folders to the exclusion list. Any note whose path starts with an excluded folder will not be touched.

Full settings reference: [docs/configuration.md](./docs/configuration.md). User guide: [docs/](./docs/).

**Important:** this plugin modifies files in your vault. **Back up your vault before enabling it.**

## Known issues

### Multi-device sync conflicts

The plugin reacts to all file modifications — including writes made by sync tools (Obsidian Sync, Syncthing, etc.). If Obsidian is open on two devices at the same time, each device can trigger front-matter updates in response to the other's syncs, producing conflict files.

Mitigations: only leave Obsidian running on one device at a time, or enable the plugin on a single device.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE).

## News & support

To stay up to date about this plugin, Obsidian in general, personal knowledge management, and note-taking, subscribe to [my newsletter](https://dsebastien.net). The best way to support my work is to become a paid subscriber, or to buy me a coffee at <https://www.buymeacoffee.com/dsebastien> ❤️.
