import { describe, expect, test } from 'bun:test'
import { isSelfInducedModify } from './is-self-induced-modify.fn'

describe('isSelfInducedModify', () => {
    test('returns false when the plugin never wrote the file', () => {
        expect(isSelfInducedModify(undefined, 1_700_000_000_000)).toBe(false)
    })

    test('returns true when the current mtime matches the recorded write mtime', () => {
        const mtime = 1_700_000_000_000
        expect(isSelfInducedModify(mtime, mtime)).toBe(true)
    })

    test('returns false when the mtime advanced past the recorded write (a real edit)', () => {
        const recorded = 1_700_000_000_000
        const current = recorded + 5_000
        expect(isSelfInducedModify(recorded, current)).toBe(false)
    })

    test('returns false when the mtime is older than the recorded write', () => {
        const recorded = 1_700_000_000_000
        const current = recorded - 5_000
        expect(isSelfInducedModify(recorded, current)).toBe(false)
    })
})
