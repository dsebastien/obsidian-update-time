import { DEFAULT_SAVE_DELAY_IN_SECONDS, PROPERTY_CREATED, PROPERTY_UPDATED } from '../constants'

export interface PluginSettings {
    ignoredFolders: string[]
    createdPropertyName: string
    updatedPropertyName: string
    /**
     * Idle delay (in seconds) before a changed file's front matter is written.
     * Writes are debounced per file so they happen once typing pauses.
     */
    saveDelayInSeconds: number
}

/**
 * A fresh default settings object, safe to hand to Immer.
 *
 * `produce` deep-freezes what it returns, including any subtree it shares
 * with its base. Producing from the shared DEFAULT_SETTINGS froze that
 * constant (and its arrays) for the rest of the process, so any later code
 * or test touching it failed with "Attempted to assign to readonly
 * property". Produce from this instead, and keep it deep-fresh: build
 * nested arrays and objects as new values, never by spreading DEFAULT_SETTINGS.
 */
export function createDefaultSettings(): PluginSettings {
    return {
        ignoredFolders: [],
        createdPropertyName: PROPERTY_CREATED,
        updatedPropertyName: PROPERTY_UPDATED,
        saveDelayInSeconds: DEFAULT_SAVE_DELAY_IN_SECONDS
    }
}

/** The defaults, for reading and comparing. Never produce from it. */
export const DEFAULT_SETTINGS: PluginSettings = createDefaultSettings()
