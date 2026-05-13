# Architecture

Update Time is a small Obsidian plugin with a single responsibility: keep the `created` and `updated` front-matter properties of Markdown notes in sync with the underlying file's `ctime` / `mtime`.

## Entry point & plugin class

- `src/main.ts` — re-exports `UpdateTimePlugin` as the default export, loaded by Obsidian.
- `src/app/plugin.ts` — `UpdateTimePlugin extends Plugin`. Owns lifecycle (`onload`, `onunload`), settings I/O (`loadSettings`, `saveSettings`), event subscription (`setupEventHandlers`), command registration (`registerCommands`), and the file-change handler (`handleFileChange`).
- `src/app/settingTab/index.ts` — `SettingsTab extends PluginSettingTab`. Renders the property-name inputs, excluded-folders list, follow button, and support section. Uses `FolderSuggest` for folder autocomplete.
- `src/app/commands/index.ts` — `registerCommands(plugin)`. Single entry point invoked from `onload`; delegates to per-command registration helpers.
- `src/app/commands/backfill-properties.ts` — backfill command implementation. Exports `registerBackfillPropertiesCommand`, `runBackfillProperties`, and the `BackfillResult` type.
- `src/app/ui/backfill-confirm-modal.ts` — `BackfillConfirmModal extends Modal`. Confirmation dialog shown before the backfill runs.

## Event subscription

`setupEventHandlers()` subscribes to a single Obsidian event via `this.registerEvent`:

- `this.app.vault.on('modify', (file) => this.handleFileChange(file))`

The `modify` event fires on any vault file modification (from Obsidian or external tools). The plugin relies on Obsidian cleanup because the listener is registered via `registerEvent`.

## Data flow

1. `modify` event fires with a `TAbstractFile`.
2. `handleFileChange` narrows to `TFile`, then calls `shouldFileBeIgnored`.
3. `shouldFileBeIgnored` rejects the file if: path empty, extension != `md`, name == `Canvas.md`, file is empty, `isExcalidrawFile` returns true, or the path starts with any excluded folder.
4. If the file passes, `app.fileManager.processFrontMatter` is used to read/mutate front matter atomically:
    - Resolve `createdKey` / `updatedKey` from `settings.createdPropertyName` / `settings.updatedPropertyName` via `resolvePropertyName` (trim + fallback to `PROPERTY_CREATED` / `PROPERTY_UPDATED` when empty).
    - Read `file.stat.ctime` and `file.stat.mtime`; parse via `parseDate`.
    - If `frontMatter[createdKey]` missing, set it to the formatted `ctime`.
    - If `frontMatter[updatedKey]` missing/invalid, set it to the formatted `mtime`.
    - Otherwise, if `shouldUpdateMTime` returns true (enough minutes have passed since the last recorded update), overwrite the `updatedKey` value.
5. `YAMLParseError` is caught and logged as a warning; nothing else is thrown.

## Commands

Registered via `registerCommands(plugin)` from `src/app/commands/index.ts`:

- `update-time:backfill-properties` — **Backfill created / updated properties in all notes**.
    - Opens `BackfillConfirmModal` (file count + Run/Cancel) before doing anything.
    - On confirm, `runBackfillProperties(plugin)` iterates `app.vault.getMarkdownFiles()`.
    - For each file: narrows to `TFile`, calls `plugin.shouldFileBeIgnored(file)` (same filters as the live handler), parses `ctime` / `mtime`, then runs `applyBackfillToFrontMatter(...)` inside `app.fileManager.processFrontMatter`.
    - "Fill missing only" semantics: `created` is written only when missing (business rule #2); `updated` is written when missing or unparsable. Debounce is NOT consulted — stale-but-valid `updated` values are left alone.
    - Tracks `total`, `processed`, `updated`, `skipped`, `errors` and returns the `BackfillResult`.
    - Two `Notice` toasts bracket the run (start: "backfilling N notes…"; end: counters).
    - `YAMLParseError` and any other write failure increment `errors` and the loop continues with the next file.

## Constants

Defined in `src/app/constants.ts`:

- `DATE_FORMAT = "yyyy-MM-dd'T'HH:mm"` — storage format for both properties.
- `PROPERTY_CREATED = 'created'`, `PROPERTY_UPDATED = 'updated'` — **defaults** for the front-matter property names. The effective names are read from `settings.createdPropertyName` / `settings.updatedPropertyName` and resolved through `resolvePropertyName` (trim + fallback to default on empty input).
- `MINUTES_BETWEEN_SAVES = 1` — debounce threshold for updating `updated`.
- `MARKDOWN_FILE_EXTENSION = 'md'`, `DEFAULT_CANVAS_FILE_NAME = 'Canvas.md'` — extension/name filters.

## Helpers (`src/app/utils/`)

- `parse-date.fn.ts` — parses a string/number into a `Date` using `date-fns.parse`. Returns `null` on invalid input.
- `resolve-property-name.fn.ts` — trims a user-configured property name and falls back to the supplied default when the trimmed value is empty or the input is not a string. Used in `handleFileChange` to derive the effective `created` / `updated` keys per write.
- `apply-backfill-to-front-matter.fn.ts` — pure mutator used by the backfill command. Applies the "fill missing only" rules to a `frontMatter` object and returns whether anything changed.
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
