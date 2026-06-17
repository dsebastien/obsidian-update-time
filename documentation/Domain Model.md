# Domain Model

## Core types

### `PluginSettings` (`src/app/types/index.ts`)

```ts
interface PluginSettings {
    ignoredFolders: string[]
    createdPropertyName: string
    updatedPropertyName: string
    saveDelayInSeconds: number
}
```

The only persisted state. Loaded via `Plugin.loadData()`, saved via `Plugin.saveData()`. Mutated immutably through `immer`'s `produce`. The two property-name fields are user-overridable front-matter keys; empty/whitespace values are tolerated in storage and resolved to `PROPERTY_CREATED` / `PROPERTY_UPDATED` at write time via `resolvePropertyName`. `saveDelayInSeconds` is the per-file idle debounce before processing (default `DEFAULT_SAVE_DELAY_IN_SECONDS`; non-numeric/negative falls back to the default on load). Settings persisted by older versions without these fields are migrated on first load.

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

### `BackfillResult` (`src/app/commands/backfill-properties.ts`)

```ts
interface BackfillResult {
    total: number // every Markdown file returned by app.vault.getMarkdownFiles()
    processed: number // files that passed the ignore filter and were handed to processFrontMatter
    updated: number // files where applyBackfillToFrontMatter mutated front matter
    skipped: number // files filtered out (ignored folder, Canvas, Excalidraw, empty, non-TFile, bad timestamps)
    errors: number // YAMLParseError or any other write failure
}
```

Returned by `runBackfillProperties` and logged at the `info` level. Not persisted.

### `ApplyBackfillArgs` (`src/app/utils/apply-backfill-to-front-matter.fn.ts`)

```ts
interface ApplyBackfillArgs {
    frontMatter: Record<string, unknown>
    cTime: Date
    mTime: Date
    createdKey: string
    updatedKey: string
    dateFormat: string
}
```

Pure-function argument bag. The function mutates `frontMatter` in place and returns a boolean indicating whether anything changed.

### `ApplyTimestampsArgs` (`src/app/utils/apply-timestamps-to-front-matter.fn.ts`)

```ts
interface ApplyTimestampsArgs {
    frontMatter: Record<string, unknown>
    cTime: Date
    mTime: Date
    createdKey: string
    updatedKey: string
    dateFormat: string
    minutesBetweenSaves: number
}
```

Pure-function argument bag for the live handler. Applies created-if-missing + debounced-`updated` semantics, mutates `frontMatter` in place, and returns whether anything changed. `processFile` uses the boolean to skip the write when nothing changed.

## Obsidian types used

- `TAbstractFile`, `TFile`, `TFolder` — vault file/folder abstractions.
- `Plugin`, `PluginSettingTab`, `App`, `Setting`, `SearchComponent`, `AbstractInputSuggest<TFolder>` — UI and lifecycle primitives.

## Data flow

```
Obsidian vault 'modify' event
        │
        ▼
handleFileChange(TAbstractFile)
        ├─ narrow to TFile
        └─ schedule per-path debounce (saveDelayInSeconds, resetTimer) → processFile
                                       (timer resets on every keystroke; fires once typing pauses)
        │
        ▼
processFile(TFile)
        │
        ├─ shouldFileBeIgnored(file)
        │     ├─ empty path / not `.md` / Canvas.md / empty body → true
        │     ├─ isExcalidrawFile(file) → true
        │     └─ any ignoredFolder prefix match → true
        │
        ├─ createdKey = resolvePropertyName(settings.createdPropertyName, PROPERTY_CREATED)
        ├─ updatedKey = resolvePropertyName(settings.updatedPropertyName, PROPERTY_UPDATED)
        ├─ cTime  = parseDate(file.stat.ctime, DATE_FORMAT)
        ├─ mTime  = parseDate(file.stat.mtime, DATE_FORMAT)
        │
        ├─ probe = applyTimestampsToFrontMatter({...copy of cached frontmatter})
        ├─ if !probe (nothing would change) → return (no write, no editor refresh)
        │
        ▼
app.fileManager.processFrontMatter(file, fm => applyTimestampsToFrontMatter({frontMatter: fm, ...}))
        ├─ if !frontMatter[createdKey]            → frontMatter[createdKey] = format(cTime)
        ├─ if !frontMatter[updatedKey] | invalid  → frontMatter[updatedKey] = format(mTime)
        └─ else if isAfter(mTime, updated + MINUTES_BETWEEN_SAVES)
                                                  → frontMatter[updatedKey] = format(mTime)
```

Two debounces are layered:

- **Invocation debounce** (`saveDelayInSeconds`): the file isn't even examined until typing pauses, so writes never land mid-edit (issue #7). Per-file `Debouncer` with `resetTimer: true`.
- **Value debounce** (`MINUTES_BETWEEN_SAVES`): `updated` is refreshed only when `mTime` is more than that many minutes after the recorded value, preventing churn on small mtime bumps.

When the applied rules would not mutate front matter, `processFile` skips the `processFrontMatter` write entirely (checked against the cached front matter), avoiding a redundant editor refresh.

## Immutability

`PluginSettings` is treated as immutable. Both `loadSettings` and `SettingsTab.renderExcludedFolders` use `immer.produce(current, draft => { ... })` to produce new state before persisting.
