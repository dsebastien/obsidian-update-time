# Issue #6 — `updated` stops refreshing after the first write

Tracking: https://github.com/dsebastien/obsidian-update-time/issues/6

## Symptom

- Reporter (`ms3056`) in a non-UTC timezone (issue filed at `2024-07-16T05:13:43Z`, screenshot file modified `Today 14:11` ⇒ ~UTC+9).
- Meeting note: file mtime = 14:11 local, `updated:` stuck at `2024-07-16 13:59`. Editing the file does not push `updated` forward.
- Daily note in the same vault works correctly.
- `settings.ignoredFolders` is empty.

## Root cause

The plugin stores timestamps without a timezone offset. When Obsidian re-reads a typed "Date & time" property, YAML 1.1 interprets the bare timestamp as **UTC**, which silently shifts the recorded epoch by the user's UTC offset and breaks the debounce comparison.

Mechanics:

1. `src/app/constants.ts:6` — `DATE_FORMAT = "yyyy-MM-dd'T'HH:mm"` (no offset).
2. `src/app/plugin.ts:166`, `:171` — writes `frontMatter[updatedKey] = format(mTime, DATE_FORMAT)`. `date-fns format` uses local time, so in JST a 13:59 mtime becomes the string `"2024-07-16T13:59"`.
3. Obsidian persists the property as a typed datetime (template-driven; visible in the screenshot's green property icons). On the next modify event, `processFrontMatter` returns a JS `Date` object. Per YAML 1.1 timestamp resolution, a timestamp without an explicit zone is treated as UTC ⇒ the Date represents UTC 13:59 ≈ JST 22:59 (9h in the future).
4. `src/app/plugin.ts:158-161` casts the value to `string | number | undefined | null`, masking that it is actually a `Date`. `src/app/utils/parse-date.fn.ts:28` falls through to `new Date(input)` and returns the off-by-9h Date unchanged.
5. `src/app/plugin.ts:187-192` `shouldUpdateMTime` does `isAfter(mTime, currentUpdatedTime + 1min)`. Real mTime (UTC 05:11) is **not** after the misread `updated` (UTC 14:00), so the function returns `false` and the property is left alone — for every subsequent edit, until real UTC clock passes the misread value.

### Why initial write works, subsequent writes don't

- First modify on a fresh note: `frontMatter[updatedKey]` is `undefined` ⇒ `plugin.ts:164` first-write branch fires ⇒ `updated` gets a value. Matches "initial updated property and time".
- Every modify after that: value is a `Date` from a typed property ⇒ debounce branch ⇒ comparison fails ⇒ no write. Matches "editing them doesn't update the time".

### Why daily notes work

The daily-notes template most likely doesn't declare `updated:` as a typed datetime, so the value remains a plain string. `parseDate(string, DATE_FORMAT)` re-parses it as local time consistently ⇒ no drift on round-trip ⇒ debounce works.

### Why `created` is unaffected

`created` is only written when missing (`plugin.ts:153`). The typed-datetime round-trip still yields a truthy `Date`, so the missing-check stays correct. The bug is specific to the `updated` debounce branch.

## Proposed fix

Make stored timestamps timezone-anchored so YAML round-trip preserves the absolute instant.

Smallest viable change:

- Update `DATE_FORMAT` in `src/app/constants.ts` to include the offset, e.g. `"yyyy-MM-dd'T'HH:mmXXX"` (output: `2024-07-16T13:59+09:00`).
- `date-fns format` emits with offset; YAML preserves the absolute instant; the next read returns a Date with the correct epoch; `shouldUpdateMTime` becomes timezone-correct.

### Self-healing for existing notes

Old offset-less values keep being misread on first read, but the very next modify event past the (real-time) debounce window overwrites them with the new tz-aware form. No migration command required — notes self-heal on their next save.

### `parseDate` robustness pass

While here, tighten `src/app/utils/parse-date.fn.ts`:

- Accept `Date` objects explicitly (currently relies on the `new Date(date)` copy path) and update the input type.
- Drop the `as string | number | undefined | null` cast at `plugin.ts:159` and `apply-backfill-to-front-matter.fn.ts:31` once the input type is honest.
- Add a fallback for ISO strings that don't match `DATE_FORMAT` exactly (e.g. with seconds or with offset) so unrelated edits in user-authored values don't trip the "unparsable ⇒ overwrite" branch unnecessarily. Use `parseISO` from date-fns as a second attempt before declaring invalid.

## Files to touch

- `src/app/constants.ts` — change `DATE_FORMAT`.
- `src/app/utils/parse-date.fn.ts` — accept `Date` inputs; add `parseISO` fallback; update return-type guards.
- `src/app/utils/parse-date.fn.spec.ts` — add cases for `Date` input, ISO with offset, ISO without offset, ISO with seconds.
- `src/app/plugin.ts` — remove the misleading type cast at `:159`; no logic change beyond that.
- `src/app/utils/apply-backfill-to-front-matter.fn.ts` — remove the equivalent cast at `:31`.
- `src/app/utils/apply-backfill-to-front-matter.fn.spec.ts` — extend coverage to match the new parse paths.
- Documentation: update `documentation/Architecture.md` (storage format section), `documentation/Configuration.md` (constants table), `docs/configuration.md` if it references the storage format, `README.md` if it shows example output.

## Open questions

- Should the new format be configurable (ties into issue #3 — custom date/time format)? Defer: pick a sane tz-aware default here; let #3 expose configurability.
- Does Obsidian's Properties UI still render `2024-07-16T13:59+09:00` as a typed "Date & time" property or fall back to a plain string? Needs manual verification in Obsidian.
- Behavior on mobile / Android, where `file.stat.mtime` granularity may differ.

## Definition of done

- `bun run tsc`, `bun run lint`, `bun test`, `bun run build` all clean.
- New parse-date specs cover: `Date` input, ISO with offset, ISO without offset (UTC interpretation matches js-yaml), seconds-precision ISO, garbage.
- Manual verification in Obsidian (non-UTC timezone, e.g. set system tz to Asia/Tokyo for the test):
    1. Create a note with an `updated:` field typed as "Date & time".
    2. Wait > 1 minute, edit the note.
    3. Confirm `updated` advances and shows a `+HH:MM` offset (or equivalent) in the raw YAML.
    4. Confirm `created` is still written only on first write and is not overwritten on subsequent edits.
- History entry written in `documentation/history/yyyy-mm-dd.md`.
- Issue #6 closed with a comment summarising the fix.
