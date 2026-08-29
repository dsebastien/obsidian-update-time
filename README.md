# Obsidian Update Time

Automatically update front matter to include creation and last update times.

This Obsidian plugin keeps the `created` and `updated` front-matter properties of your notes in sync with the file's actual creation (`ctime`) and modification (`mtime`) timestamps. Once installed and enabled, it runs in the background — no commands to click, no manual housekeeping.

This plugin is a simplified reimplementation of the [update-time-on-edit plugin](https://github.com/beaussan/update-time-on-edit-obsidian). It was originally created to work around the fact that the original plugin did not integrate well with Obsidian Publish (see [beaussan/update-time-on-edit-obsidian#75](https://github.com/beaussan/update-time-on-edit-obsidian/issues/75)).

## Features

- **Automatic** — front matter updates happen whenever a note is modified (from Obsidian or from external tools).
- **Accurate** — values come from the file's underlying `ctime` and `mtime`.
- **Respects existing values** — `created` is never overwritten; `updated` is debounced (`MINUTES_BETWEEN_SAVES` = 1 minute) to avoid fighting active edits.
- **Configurable property names** — pick the front-matter keys for the creation and last-update timestamps (defaults: `created`, `updated`).
- **Edit-friendly** — updates are delayed until you stop typing (configurable **Save delay**), so they don't refresh the editor mid-edit or knock your cursor out of a table.
- **One-shot backfill** — a command to add the front-matter properties to all existing notes that don't have them yet.
- **Folder exclusions** — skip templates, archives, or any other folder.
- **Excalidraw-aware** — Excalidraw files are detected and skipped.
- **Canvas-safe** — `Canvas.md` and non-Markdown files are skipped.
- **Fully local** — no network calls, no telemetry.

## Installation

### Community plugins (recommended)

1. In Obsidian, go to **Settings → Community plugins**.
2. Disable **Restricted mode** if it's enabled.
3. Select **Browse**, search for **Update Time**, install it, then enable it.

> Requires Obsidian **1.13.0 or newer** (the settings pane uses the declarative settings API introduced there). On older versions, install the last release that supported them — Obsidian resolves this automatically through `versions.json`.

You can also browse the catalog on the [Obsidian Community](https://community.obsidian.md/) website.

### Manual installation

If the plugin isn't listed in the community catalog yet (or you want a specific version):

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/dsebastien/obsidian-update-time/releases).
2. Copy them into `<Vault>/.obsidian/plugins/update-time/`.
3. Reload Obsidian and enable **Update Time** in **Settings → Community plugins**.

### BRAT (bleeding edge)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewers Auto-update Tool) installs plugins straight from a GitHub repo and keeps them updated automatically. Use this if you want the latest commits — **things might break**.

1. Install **Obsidian42 - BRAT** from **Settings → Community plugins → Browse** and enable it.
2. Run **BRAT: Add a beta plugin for testing** from the command palette.
3. Paste `https://github.com/dsebastien/obsidian-update-time`.
4. Select the latest version and confirm.
5. Enable **Update Time** in **Settings → Community plugins**.

## Configuration

Open **Settings → Community plugins → Update Time** to:

- Customize the front-matter keys used for the creation and last-update timestamps (defaults: `created`, `updated`).
- Set the **Save delay** — how long to wait after you stop typing before updating the front matter (default: 2 seconds). Raise it if you lose your cursor while editing, e.g. inside tables.
- Add folders to the exclusion list. Any note inside a listed folder will not be touched.

Full settings reference: [docs/configuration.md](./docs/configuration.md). User guide: [docs/](./docs/).

**Important:** this plugin modifies files in your vault. **Back up your vault before enabling it.**

## What the plugin accesses

- **Vault read** — listens for `vault.on('modify')`. For each modified file, the plugin reads the file's content once (to skip empty notes and Excalidraw files).
- **Vault write** — only sets two front-matter properties on `.md` files: `created` (when missing) and `updated` (debounced, every minute at most). No other file content is touched.
- **No file enumeration loops** — the plugin does not iterate the vault on a schedule. It only reacts to Obsidian's own `modify` events.
- **No network** — no `fetch`, no analytics, no remote services. The Buy Me a Coffee badge image in the settings tab is bundled with the plugin and rendered locally.
- **Excluded folders** — files inside any folder listed in **Settings → Update Time** are skipped entirely (no read, no write).
- **What's new after updates.** After a plugin update, a one-time dialog shows the release notes you just received (including skipped versions) with ways to support development. Never shown on fresh installs or regular restarts.

## Known issues

### Multi-device sync conflicts

The plugin reacts to all file modifications — including writes made by sync tools (Obsidian Sync, Syncthing, etc.). If Obsidian is open on two devices at the same time, each device can trigger front-matter updates in response to the other's syncs, producing conflict files.

Mitigations: only leave Obsidian running on one device at a time, or enable the plugin on a single device.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE).

<!-- other-plugins:start -->

## My other Obsidian plugins

| Plugin                                                                                                        | What it does                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [Agentic Resource Discovery Server](https://github.com/dsebastien/obsidian-agentic-resource-discovery-server) | Local-first Agentic Resource Discovery publisher and registry that serves your AI skills and tools to agents over a local HTTP and MCP server |
| [Book Exporter](https://github.com/dsebastien/obsidian-book-exporter)                                         | Export books (one manifest note + linked chapter notes) to EPUB and PDF via Pandoc                                                            |
| [Bookshelf Base](https://github.com/dsebastien/obsidian-bookshelf)                                            | Display your notes as a visual bookshelf via a custom Bases view                                                                              |
| [Dataview Serializer](https://github.com/dsebastien/obsidian-dataview-serializer)                             | Serialize Dataview queries to Markdown, and keep the Markdown representation up to date                                                       |
| [Expander](https://github.com/dsebastien/obsidian-expander)                                                   | Replace variables across your vault using HTML comment markers. Supports static values and dynamic functions                                  |
| [Ghost Publish](https://github.com/dsebastien/obsidian-ghost-publish)                                         | Publish your vault notes to a Ghost blog with configurable presets for tags, newsletters, and frontmatter conventions                         |
| [Graph Explorer Base View](https://github.com/dsebastien/obsidian-graph-explorer-base-view)                   | A custom Bases view that renders notes as an interactive force-directed graph with explored/unexplored tracking                               |
| [Hidden Folders Access](https://github.com/dsebastien/obsidian-hidden-folders-access)                         | Index hidden root-level folders (e.g. .claude) so they appear in the file tree, metadata cache, and Bases                                     |
| [Journal Bases](https://github.com/dsebastien/obsidian-journal-base)                                          | Custom Base views for journaling and periodic reviews                                                                                         |
| [Kanban Action Planner](https://github.com/dsebastien/obsidian-kanban-action-planner)                         | Render your notes as configurable Kanban boards and calendars inside Bases, with statuses, ordering, relationships, and scheduling            |
| [Life Tracker](https://github.com/dsebastien/obsidian-life-tracker-base-view)                                 | Capture and visualize the data that matters in your life                                                                                      |
| [Note Village](https://github.com/dsebastien/obsidian-note-village)                                           | A 2D pixel art village where your notes become villagers you can explore and chat with using AI                                               |
| [Obsidian Starter Kit](https://github.com/DeveloPassion/obsidian-starter-kit-plugin)                          | Adds strong typing support and powerful automation support for notes                                                                          |
| [Remarkable Synchronizer](https://github.com/dsebastien/obsidian-remarkable-sync)                             | Connect to the reMarkable cloud, list, download, and sync notebook pages as images                                                            |
| [Replicate](https://github.com/dsebastien/obsidian-replicate)                                                 | Use AI models with ease via the Replicate.com integration                                                                                     |
| [REST and MCP server](https://github.com/dsebastien/obsidian-cli-rest)                                        | Exposes CLI commands as RESTful API endpoints and an MCP server for AI tool integration                                                       |
| [Time Machine](https://github.com/dsebastien/obsidian-time-machine)                                           | Browse, compare, and restore previous versions of your notes using built-in file-recovery snapshots                                           |
| [Transcriber](https://github.com/dsebastien/obsidian-transcriber)                                             | Transcribe images to markdown using Ollama vision models                                                                                      |
| [Typefully](https://github.com/dsebastien/obsidian-typefully)                                                 | Publish social media posts with ease using the Typefully integration                                                                          |

Everything I build is documented in [my newsletter](https://dsebastien.net/newsletter) and on [my YouTube channel](https://youtube.com/@dsebastien).

<!-- other-plugins:end -->

<!-- support-cta -->

## News & support

To stay up to date about this plugin, Obsidian in general, Personal Knowledge Management and note-taking:

- Subscribe to [my newsletter](https://dsebastien.net/newsletter)
- Subscribe to [my YouTube channel](https://youtube.com/@dsebastien)
- Join the [Knowii community](https://www.store.dsebastien.net/product/knowii-community/) and learn to organize your notes and put your knowledge to work, together with fellow knowledge workers

If this plugin is useful to you, here are the best ways to support my work ❤️:

- [Join the Knowii community](https://www.store.dsebastien.net/product/knowii-community/)
- [Become a GitHub Sponsor](https://github.com/sponsors/dsebastien)
- [Buy me a coffee](https://www.buymeacoffee.com/dsebastien)
- [Subscribe to my YouTube channel](https://youtube.com/@dsebastien)
- [Check out my products](https://store.dsebastien.net)

Found a bug or have an idea? [Open an issue](https://github.com/dsebastien/obsidian-update-time/issues).
