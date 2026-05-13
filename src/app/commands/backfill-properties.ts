import { Notice, TFile } from 'obsidian'
import { UpdateTimePlugin } from '../plugin'
import { DATE_FORMAT, PROPERTY_CREATED, PROPERTY_UPDATED } from '../constants'
import { parseDate } from '../utils/parse-date.fn'
import { resolvePropertyName } from '../utils/resolve-property-name.fn'
import { applyBackfillToFrontMatter } from '../utils/apply-backfill-to-front-matter.fn'
import { hasName } from '../utils/has-name.fn'
import { log } from '../utils/log'
import { BackfillConfirmModal } from '../ui/backfill-confirm-modal'

export interface BackfillResult {
    total: number
    processed: number
    updated: number
    skipped: number
    errors: number
}

export const BACKFILL_COMMAND_ID = 'backfill-properties'

export function registerBackfillPropertiesCommand(plugin: UpdateTimePlugin): void {
    plugin.addCommand({
        id: BACKFILL_COMMAND_ID,
        name: 'Backfill created / updated properties in all notes',
        callback: () => {
            const fileCount = plugin.app.vault.getMarkdownFiles().length
            new BackfillConfirmModal(plugin.app, fileCount, () => {
                void runBackfillProperties(plugin)
            }).open()
        }
    })
}

export async function runBackfillProperties(plugin: UpdateTimePlugin): Promise<BackfillResult> {
    const files = plugin.app.vault.getMarkdownFiles()
    const result: BackfillResult = {
        total: files.length,
        processed: 0,
        updated: 0,
        skipped: 0,
        errors: 0
    }

    new Notice(
        `Update Time: backfilling ${result.total.toLocaleString()} Markdown ${
            result.total === 1 ? 'note' : 'notes'
        }…`
    )

    const createdKey = resolvePropertyName(plugin.settings.createdPropertyName, PROPERTY_CREATED)
    const updatedKey = resolvePropertyName(plugin.settings.updatedPropertyName, PROPERTY_UPDATED)

    for (const file of files) {
        if (!(file instanceof TFile)) {
            result.skipped += 1
            continue
        }

        const ignored = await plugin.shouldFileBeIgnored(file)
        if (ignored) {
            result.skipped += 1
            continue
        }

        const cTime = parseDate(file.stat.ctime, DATE_FORMAT)
        const mTime = parseDate(file.stat.mtime, DATE_FORMAT)
        if (!cTime || !mTime) {
            result.skipped += 1
            continue
        }

        let didWrite = false
        try {
            await plugin.app.fileManager.processFrontMatter(file, (frontMatter) => {
                didWrite = applyBackfillToFrontMatter({
                    frontMatter,
                    cTime,
                    mTime,
                    createdKey,
                    updatedKey,
                    dateFormat: DATE_FORMAT
                })
            })
        } catch (e: unknown) {
            result.errors += 1
            if (hasName(e) && 'YAMLParseError' === e.name) {
                log(
                    `Backfill: skipping [${file.path}] because the front matter is malformed`,
                    'warn',
                    e
                )
            } else {
                log(`Backfill: unexpected error for [${file.path}]`, 'warn', e)
            }
            continue
        }

        result.processed += 1
        if (didWrite) {
            result.updated += 1
        }
    }

    new Notice(
        `Update Time: backfill done. Updated ${result.updated.toLocaleString()} of ${result.total.toLocaleString()} ${
            result.total === 1 ? 'note' : 'notes'
        }. Skipped: ${result.skipped.toLocaleString()}. Errors: ${result.errors.toLocaleString()}.`,
        8000
    )

    log('Backfill completed', 'info', result)

    return result
}
