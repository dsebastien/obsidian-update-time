import { format } from 'date-fns'
import { parseDate } from './parse-date.fn'

export interface ApplyBackfillArgs {
    frontMatter: Record<string, unknown>
    cTime: Date
    mTime: Date
    createdKey: string
    updatedKey: string
    dateFormat: string
}

/**
 * Apply "fill missing only" backfill semantics to a front-matter object.
 *
 * - Writes `createdKey` only if it is missing (business rule #2 — never overwrite a user-provided created value).
 * - Writes `updatedKey` if it is missing or unparsable (matches the live handler's first-write branch).
 * - Never overwrites a valid existing value. Debounce is not consulted; the batch command does not refresh stale timestamps.
 *
 * Returns true when the front-matter object was mutated.
 */
export function applyBackfillToFrontMatter(args: ApplyBackfillArgs): boolean {
    let modified = false

    if (!args.frontMatter[args.createdKey]) {
        args.frontMatter[args.createdKey] = format(args.cTime, args.dateFormat)
        modified = true
    }

    const currentUpdated = parseDate(
        args.frontMatter[args.updatedKey] as string | number | undefined | null,
        args.dateFormat
    )

    if (!args.frontMatter[args.updatedKey] || !currentUpdated) {
        args.frontMatter[args.updatedKey] = format(args.mTime, args.dateFormat)
        modified = true
    }

    return modified
}
