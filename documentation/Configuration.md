# Configuration

Internal reference for the plugin's settings. For user-facing copy, see [docs/configuration.md](../docs/configuration.md).

## Settings interface

Defined in `src/app/types/index.ts`:

```ts
export interface PluginSettings {
    ignoredFolders: string[]
    createdPropertyName: string
    updatedPropertyName: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
    ignoredFolders: [],
    createdPropertyName: PROPERTY_CREATED, // 'created'
    updatedPropertyName: PROPERTY_UPDATED // 'updated'
}
```

## Settings persisted

| Key                   | Type       | Default     | Description                                                                                                                                                                                 |
| --------------------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ignoredFolders`      | `string[]` | `[]`        | Folder-path prefixes to exclude from automatic front-matter updates. A file is skipped if `file.path.startsWith(ignoredFolder)` for any entry. Order-agnostic.                              |
| `createdPropertyName` | `string`   | `'created'` | Front-matter key written for the creation time. Resolved through `resolvePropertyName`: trimmed; empty/whitespace-only falls back to `PROPERTY_CREATED`. Changes only affect future writes. |
| `updatedPropertyName` | `string`   | `'updated'` | Front-matter key written for the last-update time. Same resolution rules. Changes only affect future writes (no migration of existing notes).                                               |

Persisted via `Plugin.saveData(settings)` and loaded via `Plugin.loadData()`. `loadSettings()` merges into the immer draft; missing fields fall back to `DEFAULT_SETTINGS` and the merged object is re-saved. Settings stored by older versions of the plugin without the property-name fields are migrated transparently on next load.

## Constants (not user-configurable)

Defined in `src/app/constants.ts`:

| Constant                   | Value                  | Purpose                                                                                    |
| -------------------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| `PROPERTY_CREATED`         | `'created'`            | Default front-matter key for creation time. User-overridable via `createdPropertyName`.    |
| `PROPERTY_UPDATED`         | `'updated'`            | Default front-matter key for last-update time. User-overridable via `updatedPropertyName`. |
| `DATE_FORMAT`              | `"yyyy-MM-dd'T'HH:mm"` | Stored/displayed date format.                                                              |
| `MINUTES_BETWEEN_SAVES`    | `1`                    | Debounce threshold: `updated` is refreshed only when mtime is this far ahead.              |
| `MARKDOWN_FILE_EXTENSION`  | `'md'`                 | Only Markdown files are processed.                                                         |
| `DEFAULT_CANVAS_FILE_NAME` | `'Canvas.md'`          | Explicitly excluded Canvas file.                                                           |

Existing GitHub issues track making the remaining constants user-configurable:

- Customizable date/time format: https://github.com/dsebastien/obsidian-update-time/issues/3
- Customizable minutes-between-saves: https://github.com/dsebastien/obsidian-update-time/issues/4

## Settings UI

`src/app/settingTab/index.ts` renders:

- **Front-matter properties** — heading containing two text inputs: `createdPropertyName` and `updatedPropertyName`. Each input writes through `immer.produce` and calls `saveSettings()` on every keystroke (`onChange`). Empty/whitespace input is preserved in storage but is resolved to the default at write time via `resolvePropertyName`.
- **Folders to exclude** — add/remove list backed by `FolderSuggest` (vault-folder autocomplete).
- **Follow me on X** — CTA button opening `https://x.com/dSebastien`.
- **Support** — section with a Buy Me A Coffee badge.

Adding a folder de-duplicates via `onlyUniqueArray` before calling `saveSettings()`.
