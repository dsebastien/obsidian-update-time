# Issue #7 — Updates make tables lose focus

Tracking: https://github.com/dsebastien/obsidian-update-time/issues/7

Status: **Implemented** (pending manual runtime verification in Obsidian).

## Symptom

Reporter (`DrizztFR`): while typing in a Live Preview table, the cursor is repeatedly "kicked out" of the cell. Disabling Update Time stops it. Request: a delay so writes happen less frequently / not mid-word, or update only on save/close.

## Root cause

`plugin.ts` handled the vault `modify` event by calling `processFrontMatter` immediately, on every event. `processFrontMatter` re-serializes and writes the file, which refreshes the active editor; in Live Preview that refresh moves the cursor out of the table cell being edited. The existing `MINUTES_BETWEEN_SAVES` window only debounced the **`updated` value**, not whether a write happened.

## Fix (A + B)

**A. Invocation debounce.** `handleFileChange` now schedules a per-file `debounce(cb, saveDelayInSeconds * 1000, /*resetTimer*/ true)` instead of writing immediately. The timer resets on each keystroke, so the file is only processed once typing pauses → writes never land mid-word. New setting `saveDelayInSeconds` (default `DEFAULT_SAVE_DELAY_IN_SECONDS = 2`) exposes the delay in the settings tab under a **Behavior** heading.

**B. Skip no-op writes.** New pure helper `applyTimestampsToFrontMatter` encapsulates the created-if-missing + debounced-`updated` rules and returns whether it mutated. `processFile` runs it first against a copy of the cached front matter (`metadataCache.getFileCache`); if nothing would change, it returns without calling `processFrontMatter` at all → no write, no refresh.

Debouncers are held in a `Map<path, Debouncer>`, cancelled in `onunload` and cleared in `saveSettings` (so a changed delay takes effect).

## Files touched

- `src/app/constants.ts` — added `DEFAULT_SAVE_DELAY_IN_SECONDS = 2`.
- `src/app/types/index.ts` — added `saveDelayInSeconds` to `PluginSettings` / `DEFAULT_SETTINGS`.
- `src/app/utils/apply-timestamps-to-front-matter.fn.ts` (+ `.spec.ts`) — new pure mutator and tests.
- `src/app/plugin.ts` — debounced scheduler `handleFileChange`, new `processFile`, debouncer map, `onunload`/`saveSettings` cleanup, `loadSettings` merge + validation; removed `shouldUpdateMTime` (logic moved into the helper).
- `src/app/settingTab/index.ts` — **Behavior → Save delay (seconds)** numeric input.
- Docs: `Architecture.md`, `Configuration.md`, `Domain Model.md`, `Business Rules.md` (invariants #12, #13), `README.md`, `docs/configuration.md`.

## Business rules added

- #12 — never write front matter mid-edit (idle debounce, reset on each change).
- #13 — never write when nothing changes (probe cached front matter first).

## Definition of done

- [x] `bun run tsc` clean.
- [x] `bun run lint` clean for `src` (full-repo run is polluted by untracked `.nx/`, `Drive/`, `tmp/` artifacts unrelated to this change).
- [x] `bun test` — 51 pass (7 new in `apply-timestamps-to-front-matter.fn.spec.ts`).
- [x] `bun run build` succeeds.
- [ ] **Manual runtime verification in Obsidian** (cannot self-verify — GUI):
    1. Type continuously in a Live Preview table for >5s; confirm the cursor is no longer kicked out.
    2. Stop typing; confirm `updated` advances ~`saveDelayInSeconds` later (and after the 1-min value window).
    3. Set Save delay to `0`; confirm near-immediate updates (old behavior).
    4. Confirm `created` is still written once and never overwritten.

## Notes / open questions

- The cached-front-matter probe relies on `metadataCache` being current; after the idle delay it has caught up, so the probe matches the live front matter. Worst case the probe and live read disagree → at most one redundant (today's-behavior) write or one skipped write that the next `modify` re-checks. No correctness regression.
- Interacts with issue #6 (timezone round-trip of typed datetime). Independent fix; the helper keeps the same value-comparison semantics, so #6's `DATE_FORMAT` change drops in without conflict.
