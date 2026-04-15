# Domain Model

## Core types

### `PluginSettings` (`src/app/types/index.ts`)

```ts
interface PluginSettings {
    ignoredFolders: string[]
}
```

The only persisted state. Loaded via `Plugin.loadData()`, saved via `Plugin.saveData()`. Mutated immutably through `immer`'s `produce`.

### `ArgsSearchAndRemove` (`src/app/settingTab/args-search-and-remove.intf.ts`)

```ts
interface ArgsSearchAndRemove {
    name: string
    description: string
    currentList: string[]
    setValue: (newValue: string[]) => Promise<void>
}
```

UI-level argument bag passed to `doSearchAndRemoveList`, which renders an add-remove list control for a `string[]` setting. Currently used only for `ignoredFolders` but generic by design.

### `LogLevel` (`src/app/utils/log.ts`)

```ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
```

Dispatches to the matching `console.*` method; falls back to `console.log`.

### `Named` (`src/app/utils/has-name.fn.ts`)

Internal runtime shape `{ name: string }`. Used by the `hasName` type guard to detect `YAMLParseError` in caught exceptions.

## Obsidian types used

- `TAbstractFile`, `TFile`, `TFolder` — vault file/folder abstractions.
- `Plugin`, `PluginSettingTab`, `App`, `Setting`, `SearchComponent`, `AbstractInputSuggest<TFolder>` — UI and lifecycle primitives.

## Data flow

```
Obsidian vault 'modify' event
        │
        ▼
handleFileChange(TAbstractFile)
        │
        ├─ narrow to TFile
        ├─ shouldFileBeIgnored(file)
        │     ├─ empty path / not `.md` / Canvas.md / empty body → true
        │     ├─ isExcalidrawFile(file) → true
        │     └─ any ignoredFolder prefix match → true
        │
        ▼
app.fileManager.processFrontMatter(file, mut)
        ├─ cTime  = parseDate(file.stat.ctime, DATE_FORMAT)
        ├─ mTime  = parseDate(file.stat.mtime, DATE_FORMAT)
        ├─ if !frontMatter[created]  → frontMatter[created] = format(cTime)
        ├─ if !frontMatter[updated]  → frontMatter[updated] = format(mTime)
        └─ else if shouldUpdateMTime(mTime, parsed(updated))
                                     → frontMatter[updated] = format(mTime)
```

`shouldUpdateMTime(newMTime, currentUpdatedTime)` returns true iff `newMTime` is after `currentUpdatedTime + MINUTES_BETWEEN_SAVES`. This is the debounce mechanism that prevents a write on every keystroke-level mtime bump.

## Immutability

`PluginSettings` is treated as immutable. Both `loadSettings` and `SettingsTab.renderExcludedFolders` use `immer.produce(current, draft => { ... })` to produce new state before persisting.
