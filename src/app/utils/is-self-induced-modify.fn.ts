/**
 * Decide whether a `modify` event was caused by the plugin's own front-matter
 * write rather than a genuine change to the file.
 *
 * When the plugin writes `created` / `updated`, that write bumps the file's
 * `mtime` and fires another `modify` event. Without this guard the plugin would
 * react to its own write: with a save delay larger than `MINUTES_BETWEEN_SAVES`
 * the freshly-bumped `mtime` always looks "new enough" to warrant yet another
 * write, producing a perpetual self-feeding write loop (issue: runaway updates).
 *
 * After each write the plugin records the resulting `mtime` for that path. A
 * subsequent `modify` event whose current `mtime` still equals that recorded
 * value is the echo of our own write and must be ignored.
 *
 * @param lastWriteMtime the `mtime` recorded after the plugin's last write to
 *        this path, or `undefined` if the plugin never wrote it.
 * @param currentMtime the file's current `mtime` at the time of the event.
 * @returns `true` when the event is the echo of the plugin's own write.
 */
export function isSelfInducedModify(
    lastWriteMtime: number | undefined,
    currentMtime: number
): boolean {
    return lastWriteMtime !== undefined && lastWriteMtime === currentMtime
}
