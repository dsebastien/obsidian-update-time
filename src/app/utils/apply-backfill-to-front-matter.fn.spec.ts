import { describe, expect, test } from 'bun:test'
import { applyBackfillToFrontMatter } from './apply-backfill-to-front-matter.fn'
import { DATE_FORMAT } from '../constants'

const cTime = new Date('2024-01-01T10:00:00')
const mTime = new Date('2024-01-02T11:30:00')
const formattedC = '2024-01-01T10:00'
const formattedM = '2024-01-02T11:30'

const baseArgs = () => ({
    cTime,
    mTime,
    createdKey: 'created',
    updatedKey: 'updated',
    dateFormat: DATE_FORMAT
})

describe('applyBackfillToFrontMatter', () => {
    test('fills both keys when both are missing', () => {
        const frontMatter: Record<string, unknown> = {}
        const modified = applyBackfillToFrontMatter({ ...baseArgs(), frontMatter })

        expect(modified).toBe(true)
        expect(frontMatter['created']).toBe(formattedC)
        expect(frontMatter['updated']).toBe(formattedM)
    })

    test('leaves a valid existing created value untouched (business rule #2)', () => {
        const frontMatter: Record<string, unknown> = { created: '2020-05-05T08:00' }
        const modified = applyBackfillToFrontMatter({ ...baseArgs(), frontMatter })

        expect(modified).toBe(true)
        expect(frontMatter['created']).toBe('2020-05-05T08:00')
        expect(frontMatter['updated']).toBe(formattedM)
    })

    test('does NOT overwrite even an invalid created value', () => {
        // 'created' is only written when missing; invalid values stay as-is per business rule #2.
        const frontMatter: Record<string, unknown> = { created: 'not-a-date' }
        const modified = applyBackfillToFrontMatter({ ...baseArgs(), frontMatter })

        expect(modified).toBe(true)
        expect(frontMatter['created']).toBe('not-a-date')
        expect(frontMatter['updated']).toBe(formattedM)
    })

    test('refills updated when it is invalid/unparsable', () => {
        const frontMatter: Record<string, unknown> = {
            created: '2020-05-05T08:00',
            updated: 'gibberish'
        }
        const modified = applyBackfillToFrontMatter({ ...baseArgs(), frontMatter })

        expect(modified).toBe(true)
        expect(frontMatter['updated']).toBe(formattedM)
    })

    test('returns false and leaves front matter untouched when both keys are valid', () => {
        const frontMatter: Record<string, unknown> = {
            created: '2020-05-05T08:00',
            updated: '2020-05-06T09:00'
        }
        const modified = applyBackfillToFrontMatter({ ...baseArgs(), frontMatter })

        expect(modified).toBe(false)
        expect(frontMatter['created']).toBe('2020-05-05T08:00')
        expect(frontMatter['updated']).toBe('2020-05-06T09:00')
    })

    test('honors custom property names', () => {
        const frontMatter: Record<string, unknown> = {}
        const modified = applyBackfillToFrontMatter({
            ...baseArgs(),
            frontMatter,
            createdKey: 'createdAt',
            updatedKey: 'updatedAt'
        })

        expect(modified).toBe(true)
        expect(frontMatter['createdAt']).toBe(formattedC)
        expect(frontMatter['updatedAt']).toBe(formattedM)
        expect(frontMatter['created']).toBeUndefined()
        expect(frontMatter['updated']).toBeUndefined()
    })
})
