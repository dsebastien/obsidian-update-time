# Architecture

Update Time is a small Obsidian plugin with a single responsibility: keep the `created` and `updated` front-matter properties of Markdown notes in sync with the underlying file's `ctime` / `mtime`.

## Entry point & plugin class

- `src/main.ts` — re-exports `UpdateTimePlugin` as the default export, loaded by Obsidian.
- `src/app/plugin.ts` — `UpdateTimePlugin extends Plugin`. Owns lifecycle (`onload`, `onunload`), settings I/O (`loadSettings`, `saveSettings`), event subscription (`setupEventHandlers`), and the file-change handler (`handleFileChange`).
- `src/app/settingTab/index.ts` — `SettingsTab extends PluginSettingTab`. Renders the excluded-folders list, follow button, and support section. Uses `FolderSuggest` for folder autocomplete.

## Event subscription

`setupEventHandlers()` subscribes to a single Obsidian event via `this.registerEvent`:

- `this.app.vault.on('modify', (file) => this.handleFileChange(file))`

The `modify` event fires on any vault file modification (from Obsidian or external tools). The plugin relies on Obsidian cleanup because the listener is registered via `registerEvent`.

## Data flow

1. `modify` event fires with a `TAbstractFile`.
2. `handleFileChange` narrows to `TFile`, then calls `shouldFileBeIgnored`.
3. `shouldFileBeIgnored` rejects the file if: path empty, extension != `md`, name == `Canvas.md`, file is empty, `isExcalidrawFile` returns true, or the path starts with any excluded folder.
4. If the file passes, `app.fileManager.processFrontMatter` is used to read/mutate front matter atomically:
    - Read `file.stat.ctime` and `file.stat.mtime`; parse via `parseDate`.
    - If `frontMatter[created]` missing, set it to the formatted `ctime`.
    - If `frontMatter[updated]` missing/invalid, set it to the formatted `mtime`.
    - Otherwise, if `shouldUpdateMTime` returns true (enough minutes have passed since the last recorded update), overwrite the `updated` value.
5. `YAMLParseError` is caught and logged as a warning; nothing else is thrown.

## Constants

Defined in `src/app/constants.ts`:

- `DATE_FORMAT = "yyyy-MM-dd'T'HH:mm"` — storage format for both properties.
- `PROPERTY_CREATED = 'created'`, `PROPERTY_UPDATED = 'updated'` — property names.
- `MINUTES_BETWEEN_SAVES = 1` — debounce threshold for updating `updated`.
- `MARKDOWN_FILE_EXTENSION = 'md'`, `DEFAULT_CANVAS_FILE_NAME = 'Canvas.md'` — extension/name filters.

## Helpers (`src/app/utils/`)

- `parse-date.fn.ts` — parses a string/number into a `Date` using `date-fns.parse`. Returns `null` on invalid input.
- `is-excalidraw-file.fn.ts` — checks the global `ExcalidrawAutomate` (if the Excalidraw plugin is installed) to detect Excalidraw files and skip them.
- `folder-suggest.ts` — `AbstractInputSuggest<TFolder>` implementation for the excluded-folders input field.
- `only-unique-array.tn.ts` — array-filter helper for de-duplicating user-added folder entries.
- `has-name.fn.ts` — runtime type guard used in the error handler to detect `YAMLParseError`.
- `log.ts` — typed `console.*` wrapper that prefixes messages with the plugin id from `manifest.json`.

## Build & bundling

- Bun bundler via `scripts/build.ts` emits `dist/main.js` + `dist/styles.css` + copied `manifest.json` / `versions.json`.
- `obsidian` and Electron/CodeMirror modules are externalised.
- Dev mode optionally copies the `dist/` output to `$OBSIDIAN_VAULT_LOCATION/.obsidian/plugins/update-time/` and writes `.hotreload`.

## Network policy

The plugin is fully local: no outbound network calls, no telemetry, no third-party services at runtime.
