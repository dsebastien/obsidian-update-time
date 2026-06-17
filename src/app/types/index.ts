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

export const DEFAULT_SETTINGS: PluginSettings = {
    ignoredFolders: [],
    createdPropertyName: PROPERTY_CREATED,
    updatedPropertyName: PROPERTY_UPDATED,
    saveDelayInSeconds: DEFAULT_SAVE_DELAY_IN_SECONDS
}
