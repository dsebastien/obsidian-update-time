# Business Rules

This document defines the core business rules for the Update Time plugin. These rules MUST be respected in all implementations unless explicitly approved otherwise.

---

## Invariants

1. **Never modify files in excluded folders.** `settings.ignoredFolders` is authoritative; any file whose path starts with an entry in that list must be skipped before front matter is read or written.
2. **Never overwrite a user-provided `created` value.** The `created` property is only written when it is missing from front matter. Existing values are preserved.
3. **Never overwrite a valid `updated` value unless the debounce window has elapsed.** `updated` is refreshed only when either (a) the property is missing/unparsable, or (b) more than `MINUTES_BETWEEN_SAVES` have passed since the last recorded update.
4. **Skip Excalidraw files.** When the Excalidraw plugin is present, `isExcalidrawFile` must be consulted and matching files skipped.
5. **Skip non-Markdown files and Canvas files.** Only `.md` files participate; `Canvas.md` is explicitly excluded.
6. **Debounce writes.** Enforced by `MINUTES_BETWEEN_SAVES` to avoid fighting active edits and to reduce churn.
7. **This plugin modifies vault data.** Changes are destructive and cannot be reverted by the plugin. Users must back up their vault before enabling it.
8. **No network calls.** The plugin runs fully local. No telemetry, no remote fetch, no third-party services at runtime.
9. **Handle malformed YAML gracefully.** `YAMLParseError` thrown by `processFrontMatter` must be caught and logged; the file must be left untouched.
10. **Use Obsidian's `register*` helpers for every subscription.** The `modify` listener is registered via `this.registerEvent` so it is cleaned up on unload.

---

## Documentation Guidelines

When a new business rule is mentioned:

1. Add it to this document immediately
2. Use a concise format (single line or brief paragraph)
3. Maintain precision - do not lose important details for brevity
4. Include rationale where it adds clarity
