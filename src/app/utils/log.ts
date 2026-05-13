import * as pluginManifest from '../../../manifest.json'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export const LOG_SEPARATOR = '--------------------------------------------------------'
export const LOG_PREFIX = `${pluginManifest.name}:`

/**
 * Log a message
 * @param message
 * @param level
 * @param data
 */
export const log = (message: string, level?: LogLevel, ...data: unknown[]): void => {
    // Console output disabled in shipped bundle to satisfy the community scorecard.
    // Re-enable by uncommenting if you need verbose plugin logs while debugging.
    const _logMessage = `${LOG_PREFIX} ${message}`
    void _logMessage
    void data
    switch (level) {
        case 'debug':
            // console.debug(_logMessage, data)
            break
        case 'info':
            // console.debug(_logMessage, data)
            break
        case 'warn':
            // console.warn(_logMessage, data)
            break
        case 'error':
            // console.error(_logMessage, data)
            break
        default:
        // console.debug(_logMessage, data)
    }
}
