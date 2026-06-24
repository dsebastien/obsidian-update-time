# Plan: distinguish real edits from mere "touches"

Tracking issue: [#8](https://github.com/dsebastien/obsidian-update-time/issues/8).

## Problem

`vault.on('modify')` fires for any change to a file's bytes or `mtime`, regardless of source:

- the user typing in the editor,
- AI tools / external programs writing the file directly,
- the plugin's own front-matter writes,
- **Syncthing (and similar sync tools) rewriting/touching files on disk.**

The plugin currently treats every `modify` as a genuine edit and bumps `updated`. With Syncthing this creates a cross-device loop: a touch on device A → `updated` bump → real content change → sync to device B → `modify` on B → bump → … The self-induced-write case (the plugin reacting to its own write) is already handled by business rule #14 (see history 2026-06-24); this plan covers the remaining external-touch case.

Goal: bump `updated` only when a note's **meaningful content actually changed** (body + front matter excluding the `created`/`updated` keys), from the user **or** an AI/external writer — never for a pure touch or a timestamp-only sync propagation.

## Constraints (must respect)

- **No hash storms.** Never precompute or recompute signatures across the whole vault. Bulk external changes — e.g. close Obsidian, modify 5K files on disk, reopen — must not trigger mass hashing.
- **Cheap common path.** Interactive typing is the dominant case; it must not pay a hashing cost per keystroke.
- **Staleness must be safe, not incorrect.** In-memory baselines will be missing or stale (after restart, for files never opened). A missing/stale baseline must degrade to a safe fallback, never to a wrong bump or a loop.
- **Respect existing invariants** (#1–#14), especially #12 (debounce, never write mid-edit), #13 (never write when nothing changes), #14 (never react to own write).
- **Mobile-friendly:** no Node APIs, bounded memory.

## Chosen approach — hybrid (option 3)

Combine a cheap positive signal with a bounded negative check:

1. **`editor-change` as the positive "real edit" signal.** Obsidian fires `workspace.on('editor-change')` only when an editor's content actually changes (user typing or programmatic editor edits in an open view). When this fires for a file, mark it as having a genuine pending edit. This covers the dominant interactive case with zero hashing.

2. **Content-signature as the disambiguator for non-editor `modify` events.** For a `modify` that is *not* backed by an `editor-change` mark (external/AI write, or a sync touch), compute a signature of the meaningful content and compare it to a stored baseline:
    - signature = hash of (front matter **excluding** `createdKey`/`updatedKey`) + body,
    - if it equals the stored baseline → pure touch / timestamp-only sync → **skip**,
    - if it differs (or there is no baseline → see fallback) → genuine external edit → bump and store the new signature.

3. **Cold-start / missing-baseline fallback.** When no baseline exists for a file (first event after load, or evicted entry), do **not** hash speculatively and do **not** assume a change. Fall back to the existing cheap `mtime`-vs-`updated` heuristic for that single decision, then store a baseline going forward. Business rule #14 guarantees this fallback cannot loop. This bounds worst-case cost to **one** decision per file actively firing events — never a vault-wide sweep.

### Why this satisfies the constraints

- Typing never hashes (handled by `editor-change`).
- Hashing happens only for files that *actively* fire a non-editor `modify` while the plugin runs — bounded by real change traffic, not vault size. Reopening after 5K external edits processes only files that fire events, one decision each, debounced; no precompute.
- A missing/stale baseline falls back to the cheap heuristic instead of forcing a hash or a wrong bump.
- Excluding the timestamp keys from the signature breaks the cross-device Syncthing loop: a propagated timestamp-only change leaves the signature unchanged → skip.

## Configurable change filters

"What counts as a real edit" must be user-configurable, not hardcoded. The content-signature is built only from the parts the user considers meaningful, so the same mechanism expresses the filters. Settings to add:

- **Trigger on body changes** (toggle, default on) — bump `updated` when the note body changes.
- **Trigger on front-matter changes** (toggle, default on) — bump when front matter changes. Off = front-matter-only edits (e.g. other plugins writing properties) never bump `updated`.
- **Ignored properties** (list) — front-matter keys whose changes never count (e.g. `tags`, `aliases`, plugin-managed fields). Always implicitly includes the configured `created`/`updated` keys. Reuse the existing search-and-remove list UI (the "Folders to exclude" component).

Composition into the signature:

- include the body **iff** the body trigger is on;
- include front matter **minus** the ignored-properties set (and minus `createdKey`/`updatedKey`) **iff** the front-matter trigger is on.

A `modify` whose only differences fall entirely in excluded parts → signature unchanged → skip. Note: when *both* triggers are off the signature is constant and nothing ever bumps — guard against that (warn, or treat as "disabled"). When the front-matter trigger is on but a property is in the ignored list, changes to that single property alone must not bump.

## Implementation outline

- **State**
    - `pendingEditorEdits: Set<string>` — paths flagged by `editor-change` since the last process.
    - `contentSignatures: Map<string, string>` — last-known meaningful-content signature per path.
    - Bound `contentSignatures` (cap size with simple LRU/insertion-order eviction) so memory stays flat; eviction is safe because it degrades to the fallback.
    - Clear all on `onunload` / `saveSettings`, like the existing maps.
- **Listeners**
    - Register `workspace.on('editor-change')` via `this.registerEvent`; on fire, resolve the file and add its path to `pendingEditorEdits`.
    - Keep the existing `vault.on('modify')` → debounced `processFile`.
- **Signature helper** (new pure util + spec)
    - `computeContentSignature({ content, createdKey, updatedKey }): string` — strip/parse front matter, drop the two timestamp keys, hash the remainder + body. Use a small, fast, dependency-free hash (e.g. FNV-1a / djb2 over the string) — cryptographic strength is unnecessary; we only need change detection. Read content via `vault.cachedRead`.
- **`processFile` decision order**
    1. self-induced-write guard (#14, already shipped) → skip echo.
    2. ignore filters (#1, #4, #5) and key resolution.
    3. if path in `pendingEditorEdits` → real edit; clear the flag; proceed to apply timestamps (#13 no-op skip still applies).
    4. else compute signature; compare to baseline:
        - equal → skip (touch),
        - differ → proceed,
        - no baseline → cheap `mtime`-vs-`updated` fallback.
    5. on any path that proceeds and writes, refresh the stored baseline signature after the write.
- **Settings:** the configurable change filters above (body-trigger toggle, front-matter-trigger toggle, ignored-properties list). Optionally a master toggle to disable content-signature checking entirely (fall back to the cheap heuristic) for users who want the simplest behavior; default on.

## Definition of done

- `bun run tsc`, `bun run lint`, `bun test`, `bun run build` all clean; new pure helpers covered by `.spec.ts`.
- Business rules updated (new invariant for "bump only on real content change") and history entry written.
- README / docs updated to explain the touch-vs-edit behavior and any new setting.
- Manual runtime verification (GUI, cannot self-verify): Syncthing touch does not bump `updated`; cross-device propagation of a timestamp-only change does not re-bump; user typing and an external/AI body edit both bump exactly once; reopening after a large external batch does not cause a hashing storm or a write loop.

## Notes

- This plan is the long-term fix for Problem 2 in history 2026-06-24. The base-logic stabilization (self-induced-write detection, #14) already shipped and fixes the runaway-write loop independently of this work.
- Constraint source: user feedback 2026-06-24 (hashing cost, stale entries, bulk external-change scenarios).
