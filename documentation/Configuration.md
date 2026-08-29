# Configuration

Internal reference for the plugin's settings. For user-facing copy, see [docs/configuration.md](../docs/configuration.md).

## Settings interface

Defined in `src/app/types/index.ts`:

```ts
export interface PluginSettings {
    ignoredFolders: string[]
    createdPropertyName: string
    updatedPropertyName: string
    saveDelayInSeconds: number
}

export const DEFAULT_SETTINGS: PluginSettings = {
    ignoredFolders: [],
    createdPropertyName: PROPERTY_CREATED, // 'created'
    updatedPropertyName: PROPERTY_UPDATED, // 'updated'
    saveDelayInSeconds: DEFAULT_SAVE_DELAY_IN_SECONDS // 2
}
```

## Settings persisted

| Key                   | Type       | Default     | Description                                                                                                                                                                                                                                                                                                                                |
| --------------------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ignoredFolders`      | `string[]` | `[]`        | Folder-path prefixes to exclude from automatic front-matter updates. A file is skipped if `file.path.startsWith(ignoredFolder)` for any entry. Order-agnostic.                                                                                                                                                                             |
| `createdPropertyName` | `string`   | `'created'` | Front-matter key written for the creation time. Resolved through `resolvePropertyName`: trimmed; empty/whitespace-only falls back to `PROPERTY_CREATED`. Changes only affect future writes.                                                                                                                                                |
| `updatedPropertyName` | `string`   | `'updated'` | Front-matter key written for the last-update time. Same resolution rules. Changes only affect future writes (no migration of existing notes).                                                                                                                                                                                              |
| `saveDelayInSeconds`  | `number`   | `2`         | Idle delay before a changed file's front matter is written. Each `modify` event resets a per-file debounce timer; the write fires only once typing pauses for this long. Higher values reduce write frequency and prevent losing cursor focus while editing (issue #7). Validated on load: non-numeric/negative falls back to the default. |

Persisted via `Plugin.saveData(settings)` and loaded via `Plugin.loadData()`. `loadSettings()` merges into the immer draft; missing fields fall back to `DEFAULT_SETTINGS` and the merged object is re-saved. Settings stored by older versions of the plugin without the property-name or save-delay fields are migrated transparently on next load.

## Constants (not user-configurable)

Defined in `src/app/constants.ts`:

| Constant                        | Value                  | Purpose                                                                                     |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| `PROPERTY_CREATED`              | `'created'`            | Default front-matter key for creation time. User-overridable via `createdPropertyName`.     |
| `PROPERTY_UPDATED`              | `'updated'`            | Default front-matter key for last-update time. User-overridable via `updatedPropertyName`.  |
| `DATE_FORMAT`                   | `"yyyy-MM-dd'T'HH:mm"` | Stored/displayed date format.                                                               |
| `MINUTES_BETWEEN_SAVES`         | `1`                    | Value debounce: `updated` is refreshed only when mtime is this far ahead.                   |
| `DEFAULT_SAVE_DELAY_IN_SECONDS` | `2`                    | Default for `saveDelayInSeconds` (user-overridable). Invocation debounce before processing. |
| `MARKDOWN_FILE_EXTENSION`       | `'md'`                 | Only Markdown files are processed.                                                          |
| `DEFAULT_CANVAS_FILE_NAME`      | `'Canvas.md'`          | Explicitly excluded Canvas file.                                                            |

Existing GitHub issues track making the remaining constants user-configurable:

- Customizable date/time format: https://github.com/dsebastien/obsidian-update-time/issues/3
- Customizable minutes-between-saves: https://github.com/dsebastien/obsidian-update-time/issues/4

## Settings UI

`src/app/settingTab/index.ts` DECLARES the pane (Obsidian 1.13+): it implements `getSettingDefinitions()`, and `display()` is never called. Adding a control means adding a definition and a case in `getControlValue`/`setControlValue` — never an imperative `onChange` that saves for itself.

- **Front-matter properties** — group with two `text` controls: `createdPropertyName` and `updatedPropertyName`. Empty/whitespace input is preserved in storage but resolved to the default at write time via `resolvePropertyName`.
- **Behavior** — group with the **Save delay (seconds)** `number` control (`saveDelayInSeconds`), constrained by `min: 0`. An unparseable or emptied field resolves to the declared `defaultValue` (`DEFAULT_SAVE_DELAY_IN_SECONDS`) before validation runs — without that declaration the fallback would be `0`, i.e. a rewrite on every keystroke. A negative value is refused with an inline error, and `setControlValue` rejects it too because that method is also a public write surface.
- **Folders to exclude** — a top-level `type: 'list'` (a group's `items` cannot host a list) with an inline `FolderSuggest` add row. `resolveFolderInput` decides which value the click meant: the suggester can clear the field before the handler reads it, so the `onChange` mirror is the fallback, and a blank result is refused — a blank entry matches every path and would disable timestamp updates vault-wide. `onDelete` resolves the entry by value before writing, because the index refers to the list as it was drawn.
- **About** — the follow CTA and the support section.

### Writing settings

Every mutation goes through `UpdateTimePlugin.updateSettings(mutator)`: serialized (each mutation derives from the previously committed state) and persist-then-commit (memory swaps only after `saveData` succeeds, so a rejected write rolls the control back to the stored truth). The post-migration save in `loadSettings` uses it too — a fire-and-forget save could otherwise finish after a user edit and overwrite it. The per-file debouncers are reset strictly after a successful commit, so a failed write cannot make a changed delay look applied. Adding a folder de-duplicates via `onlyUniqueArray` INSIDE the mutator, so two concurrent additions cannot both build on a stale list.

## Commands

Registered in `src/app/commands/index.ts` via `registerCommands(plugin)` (called from `onload`):

| Command ID                        | Display name                                       | Trigger                                                                                                                               |
| --------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `update-time:backfill-properties` | Backfill created / updated properties in all notes | Manual (command palette). Opens `BackfillConfirmModal`; on confirm runs `runBackfillProperties(plugin)` with fill-missing-only logic. |

The command ID prefix is added by Obsidian (`<plugin-id>:<command-id>`); the source defines only the suffix (`backfill-properties`).
