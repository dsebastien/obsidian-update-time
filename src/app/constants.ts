export const DEFAULT_CANVAS_FILE_NAME = 'Canvas.md'
export const MARKDOWN_FILE_EXTENSION = 'md'

// TODO add support for customizing the date/time format
// Cfr https://github.com/dsebastien/obsidian-update-time/issues/3
export const DATE_FORMAT = "yyyy-MM-dd'T'HH:mm"

// TODO add support for defining a minimum number of minutes between edits before updating the mTime
// Cfr https://github.com/dsebastien/obsidian-update-time/issues/4
export const MINUTES_BETWEEN_SAVES = 1

// Idle delay before processing a changed file. Front-matter writes are debounced
// per file so they land while the user has paused typing, not mid-word.
// Cfr https://github.com/dsebastien/obsidian-update-time/issues/7
export const DEFAULT_SAVE_DELAY_IN_SECONDS = 2

// Default front-matter property names. Users can override these in the settings tab.
export const PROPERTY_CREATED = 'created'
export const PROPERTY_UPDATED = 'updated'
