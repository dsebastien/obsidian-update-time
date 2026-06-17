import { add, format, isAfter } from 'date-fns'
import { parseDate } from './parse-date.fn'

export interface ApplyTimestampsArgs {
    frontMatter: Record<string, unknown>
    cTime: Date
    mTime: Date
    createdKey: string
    updatedKey: string
    dateFormat: string
    minutesBetweenSaves: number
}

/**
 * Apply the live "created / updated" semantics to a front-matter object.
 *
 * - Writes `createdKey` only if it is missing (business rule #2 — never overwrite a user-provided created value).
 * - Writes `updatedKey` if it is missing or unparsable.
 * - Otherwise refreshes `updatedKey` only when more than `minutesBetweenSaves` have elapsed (business rule #3).
 *
 * Returns true when the front-matter object was mutated. The caller uses the
 * return value to skip the file write entirely when nothing changed, avoiding
 * an editor refresh that would otherwise kick the cursor out of the active note.
 */
export function applyTimestampsToFrontMatter(args: ApplyTimestampsArgs): boolean {
    let modified = false

    if (!args.frontMatter[args.createdKey]) {
        args.frontMatter[args.createdKey] = format(args.cTime, args.dateFormat)
        modified = true
    }

    const currentUpdated = parseDate(
        args.frontMatter[args.updatedKey] as string | number | undefined | null,
        args.dateFormat
    )

    // If the updated property isn't set or has no valid value, write it.
    if (!args.frontMatter[args.updatedKey] || !currentUpdated) {
        args.frontMatter[args.updatedKey] = format(args.mTime, args.dateFormat)
        return true
    }

    // Otherwise only refresh once the debounce window has elapsed.
    const nextUpdate = add(currentUpdated, { minutes: args.minutesBetweenSaves })
    if (isAfter(args.mTime, nextUpdate)) {
        args.frontMatter[args.updatedKey] = format(args.mTime, args.dateFormat)
        modified = true
    }

    return modified
}
