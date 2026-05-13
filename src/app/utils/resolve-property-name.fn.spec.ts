import { describe, expect, test } from 'bun:test'
import { resolvePropertyName } from './resolve-property-name.fn'

describe('resolvePropertyName', () => {
    test('returns the trimmed value when it is a non-empty string', () => {
        expect(resolvePropertyName('createdAt', 'created')).toBe('createdAt')
        expect(resolvePropertyName('  createdAt  ', 'created')).toBe('createdAt')
    })

    test('falls back to the default when the value is empty or whitespace-only', () => {
        expect(resolvePropertyName('', 'created')).toBe('created')
        expect(resolvePropertyName('   ', 'created')).toBe('created')
        expect(resolvePropertyName('\t\n', 'created')).toBe('created')
    })

    test('falls back to the default when the value is undefined or null', () => {
        expect(resolvePropertyName(undefined, 'created')).toBe('created')
        expect(resolvePropertyName(null, 'created')).toBe('created')
    })

    test('falls back to the default when the value is not a string', () => {
        // Settings persisted by older versions of the plugin may not contain these fields.
        // The function must defensively handle non-string input shapes.
        expect(resolvePropertyName(undefined as unknown as string, 'updated')).toBe('updated')
    })
})
