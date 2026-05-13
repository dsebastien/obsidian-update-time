/**
 * Resolve a user-configurable front-matter property name.
 * Trims whitespace; if the result is empty, falls back to the provided default.
 */
export function resolvePropertyName(value: string | undefined | null, fallback: string): string {
    if (typeof value !== 'string') {
        return fallback
    }

    const trimmed = value.trim()
    if (trimmed.length === 0) {
        return fallback
    }

    return trimmed
}
