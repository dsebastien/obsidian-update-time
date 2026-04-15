# Configuration

Internal reference for the plugin's settings. For user-facing copy, see [docs/configuration.md](../docs/configuration.md).

## Settings interface

Defined in `src/app/types/index.ts`:

```ts
export interface PluginSettings {
    ignoredFolders: string[]
}

export const DEFAULT_SETTINGS: PluginSettings = {
    ignoredFolders: []
}
```

## Settings persisted

| Key              | Type       | Default | Description                                                                                                                                                    |
| ---------------- | ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ignoredFolders` | `string[]` | `[]`    | Folder-path prefixes to exclude from automatic front-matter updates. A file is skipped if `file.path.startsWith(ignoredFolder)` for any entry. Order-agnostic. |

Persisted via `Plugin.saveData(settings)` and loaded via `Plugin.loadData()`. `loadSettings()` merges into the immer draft; missing fields fall back to `DEFAULT_SETTINGS` and the merged object is re-saved.

## Constants (not user-configurable)

Defined in `src/app/constants.ts`:

| Constant                   | Value                  | Purpose                                                                       |
| -------------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `PROPERTY_CREATED`         | `'created'`            | Front-matter key for creation time.                                           |
| `PROPERTY_UPDATED`         | `'updated'`            | Front-matter key for last-update time.                                        |
| `DATE_FORMAT`              | `"yyyy-MM-dd'T'HH:mm"` | Stored/displayed date format.                                                 |
| `MINUTES_BETWEEN_SAVES`    | `1`                    | Debounce threshold: `updated` is refreshed only when mtime is this far ahead. |
| `MARKDOWN_FILE_EXTENSION`  | `'md'`                 | Only Markdown files are processed.                                            |
| `DEFAULT_CANVAS_FILE_NAME` | `'Canvas.md'`          | Explicitly excluded Canvas file.                                              |

Existing GitHub issues track making these user-configurable:

- Customizable date/time format: https://github.com/dsebastien/obsidian-update-time/issues/3
- Customizable minutes-between-saves: https://github.com/dsebastien/obsidian-update-time/issues/4
- Customizable property names: https://github.com/dsebastien/obsidian-update-time/issues/2

## Settings UI

`src/app/settingTab/index.ts` renders:

- **Folders to exclude** — add/remove list backed by `FolderSuggest` (vault-folder autocomplete).
- **Follow me on X** — CTA button opening `https://x.com/dSebastien`.
- **Support** — section with a Buy Me A Coffee badge.

Adding a folder de-duplicates via `onlyUniqueArray` before calling `saveSettings()`.
