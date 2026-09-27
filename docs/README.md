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
- **Configurable property names** — rename the `created` / `updated` keys to anything you like.
- **One-shot backfill** — a command that adds the properties to all notes you already had in your vault.
- **Excalidraw-aware** — Excalidraw files are skipped.
- **Fully local** — no network calls, no telemetry.

## Quick start

1. Install the plugin from Obsidian's community catalog (**Settings → Community plugins → Browse → Update Time**) and enable it.
2. (Optional) Open **Settings → Community plugins → Update Time** and add any folder paths to exclude (e.g., `Templates`, `_archive`).
3. Start editing notes — `created` and `updated` properties appear automatically in front matter.

**Important:** This plugin modifies files in your vault. Back up your vault before enabling it.

## What the plugin accesses

- **Vault read** — listens for Obsidian's `vault.on('modify')` event. For each modified file, the plugin reads its content once to filter out empty notes and Excalidraw files.
- **Vault write** — only writes two front-matter properties on `.md` files: `created` (when missing) and `updated` (refreshed at most once per minute). The **Backfill created / updated properties in all notes** command iterates every Markdown file in the vault on demand and applies the same fill-missing-only logic.
- **No vault scans on a timer** — the plugin does not iterate over your vault on a schedule; it only reacts to modify events emitted by Obsidian and to the explicit backfill command.
- **No network calls** — no analytics, no remote services. The Buy Me a Coffee badge in the settings tab is bundled inside the plugin and rendered locally.
- **Excluded folders** — any file inside a folder listed in **Settings → Update Time** is skipped entirely (no read, no write).

## About

Created by [Sébastien Dubois](https://dsebastien.net).

To stay up to date, subscribe to [my newsletter](https://dsebastien.net). The best way to support this plugin is to become a paid subscriber or to buy me a coffee at <https://www.buymeacoffee.com/dsebastien>.

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

To stay up to date about this plugin, Obsidian in general, personal knowledge management and note-taking:

- Subscribe to [my newsletter](https://dsebastien.net/newsletter)
- Subscribe to [my YouTube channel](https://youtube.com/@dsebastien)
- Join the [Knowii community](https://www.store.dsebastien.net/product/knowii-community/) and learn to organize your notes and put your knowledge to work, together with fellow knowledge workers

If this plugin is useful to you, here are the best ways to support my work ❤️:

- [Join the Knowii community](https://www.store.dsebastien.net/product/knowii-community/)
- [Become a GitHub Sponsor](https://github.com/sponsors/dsebastien)
- [Buy me a coffee](https://www.buymeacoffee.com/dsebastien)
- [Subscribe to my YouTube channel](https://youtube.com/@dsebastien)
- [Check out my products](https://store.dsebastien.net)
