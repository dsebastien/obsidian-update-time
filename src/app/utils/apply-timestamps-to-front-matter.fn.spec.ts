import { describe, expect, test } from 'bun:test'
import { applyTimestampsToFrontMatter } from './apply-timestamps-to-front-matter.fn'
import { DATE_FORMAT, MINUTES_BETWEEN_SAVES } from '../constants'

const cTime = new Date('2024-01-01T10:00:00')
const mTime = new Date('2024-01-02T11:30:00')
const formattedC = '2024-01-01T10:00'
const formattedM = '2024-01-02T11:30'

const baseArgs = () => ({
    cTime,
    mTime,
    createdKey: 'created',
    updatedKey: 'updated',
    dateFormat: DATE_FORMAT,
    minutesBetweenSaves: MINUTES_BETWEEN_SAVES
})

describe('applyTimestampsToFrontMatter', () => {
    test('fills both keys when both are missing', () => {
        const frontMatter: Record<string, unknown> = {}
        const modified = applyTimestampsToFrontMatter({ ...baseArgs(), frontMatter })

        expect(modified).toBe(true)
        expect(frontMatter['created']).toBe(formattedC)
        expect(frontMatter['updated']).toBe(formattedM)
    })

    test('never overwrites an existing created value (business rule #2)', () => {
        const frontMatter: Record<string, unknown> = {
            created: '2020-05-05T08:00',
            updated: 'gibberish'
        }
        const modified = applyTimestampsToFrontMatter({ ...baseArgs(), frontMatter })

        expect(modified).toBe(true)
        expect(frontMatter['created']).toBe('2020-05-05T08:00')
        expect(frontMatter['updated']).toBe(formattedM)
    })

    test('writes updated when it is missing or unparsable', () => {
        const frontMatter: Record<string, unknown> = {
            created: '2020-05-05T08:00',
            updated: 'not-a-date'
        }
        const modified = applyTimestampsToFrontMatter({ ...baseArgs(), frontMatter })

        expect(modified).toBe(true)
        expect(frontMatter['updated']).toBe(formattedM)
    })

    test('refreshes updated once more than the debounce window has elapsed', () => {
        // updated is ~25h before mTime, well past MINUTES_BETWEEN_SAVES.
        const frontMatter: Record<string, unknown> = {
            created: '2020-05-05T08:00',
            updated: '2024-01-01T10:00'
        }
        const modified = applyTimestampsToFrontMatter({ ...baseArgs(), frontMatter })

        expect(modified).toBe(true)
        expect(frontMatter['updated']).toBe(formattedM)
    })

    test('returns false and leaves front matter untouched within the debounce window', () => {
        // updated is only 30s before mTime, inside MINUTES_BETWEEN_SAVES (1 min).
        const frontMatter: Record<string, unknown> = {
            created: '2020-05-05T08:00',
            updated: '2024-01-02T11:29'
        }
        const modified = applyTimestampsToFrontMatter({ ...baseArgs(), frontMatter })

        expect(modified).toBe(false)
        expect(frontMatter['created']).toBe('2020-05-05T08:00')
        expect(frontMatter['updated']).toBe('2024-01-02T11:29')
    })

    test('still fills a missing created even when updated is fresh', () => {
        const frontMatter: Record<string, unknown> = {
            updated: '2024-01-02T11:29'
        }
        const modified = applyTimestampsToFrontMatter({ ...baseArgs(), frontMatter })

        expect(modified).toBe(true)
        expect(frontMatter['created']).toBe(formattedC)
        expect(frontMatter['updated']).toBe('2024-01-02T11:29')
    })

    test('honors custom property names', () => {
        const frontMatter: Record<string, unknown> = {}
        const modified = applyTimestampsToFrontMatter({
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
