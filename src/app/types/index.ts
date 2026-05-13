import { PROPERTY_CREATED, PROPERTY_UPDATED } from '../constants'

export interface PluginSettings {
    ignoredFolders: string[]
    createdPropertyName: string
    updatedPropertyName: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
    ignoredFolders: [],
    createdPropertyName: PROPERTY_CREATED,
    updatedPropertyName: PROPERTY_UPDATED
}
