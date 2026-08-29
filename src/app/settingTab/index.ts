import { Notice, PluginSettingTab } from 'obsidian'
import type { App, SearchComponent, SettingDefinitionItem, SettingGroupItem } from 'obsidian'
import { UpdateTimePlugin } from '../plugin'

import { onlyUniqueArray } from '../utils/only-unique-array.tn'
import { FolderSuggest } from '../utils/folder-suggest'
import { BUY_ME_A_COFFEE_BADGE_DATA_URL } from '../assets/buy-me-a-coffee'
import { DEFAULT_SAVE_DELAY_IN_SECONDS, PROPERTY_CREATED, PROPERTY_UPDATED } from '../constants'
import { renderSupportSection } from '../ui/support-links'

/**
 * Decide which value the user meant when the add button is clicked.
 *
 * `getValue()` alone proved unreliable at click time: the folder suggester can
 * blur and clear the field before the handler reads it, which let empty values
 * through — and an empty folder entry matches every path, silently disabling
 * timestamp updates for the whole vault. The mirror kept by `onChange` is the
 * fallback, and the result is trimmed so whitespace never becomes an entry.
 */
export function resolveFolderInput(searchValue: string | undefined, mirroredValue: string): string {
    return (searchValue || mirroredValue).trim()
}

/** The settings keys addressed by `getControlValue`/`setControlValue`. */
type ControlKey = 'createdPropertyName' | 'updatedPropertyName' | 'saveDelayInSeconds'

/**
 * Settings tab, declared rather than rendered (Obsidian 1.13+).
 *
 * `getSettingDefinitions()` REPLACES `display()`: when it returns a non-empty
 * array, `display()` is never called. There is no partial adoption — the whole
 * settings UI is declarative, or none of it.
 *
 * Rules that each cost a shipped bug the first time they were broken:
 *
 * - A `render:` hook renders the ROW. Write into `setting.settingEl` only.
 * - A row `action:` fires on the whole row and draws no button; button rows
 *   use `render:` with `addButton`.
 * - `setControlValue` MUST reject on failure — resolving tells the framework
 *   the write landed and the pane keeps showing a value that was never
 *   stored.
 * - `onDelete(index)` indexes the list as it was DRAWN: resolve the entry to
 *   a value immediately, then filter against the committed array INSIDE the
 *   mutator.
 * - The framework rebuilds rows from `getControlValue`, which reads the
 *   COMMITTED settings, so a re-render while a text control has focus would
 *   replace what the user is typing. Re-renders go through `refresh()`.
 */
export class SettingsTab extends PluginSettingTab {
    plugin: UpdateTimePlugin

    /** Set while a re-render is waiting for a text control to lose focus. */
    private refreshPending = false

    constructor(app: App, plugin: UpdateTimePlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    override getSettingDefinitions(): SettingDefinitionItem[] {
        return [
            {
                type: 'group',
                heading: 'Front-matter properties',
                items: [
                    {
                        name: 'Created property name',
                        desc: `Front-matter key used to store the creation time. Leave empty to use the default ("${PROPERTY_CREATED}"). Renaming this only affects future writes; existing notes are not migrated.`,
                        control: {
                            type: 'text',
                            key: 'createdPropertyName',
                            placeholder: PROPERTY_CREATED
                        }
                    },
                    {
                        name: 'Updated property name',
                        desc: `Front-matter key used to store the last-update time. Leave empty to use the default ("${PROPERTY_UPDATED}"). Renaming this only affects future writes; existing notes are not migrated.`,
                        control: {
                            type: 'text',
                            key: 'updatedPropertyName',
                            placeholder: PROPERTY_UPDATED
                        }
                    }
                ]
            },
            {
                type: 'group',
                heading: 'Behavior',
                items: [
                    {
                        name: 'Save delay (seconds)',
                        desc: `Wait this long after you stop typing before updating the front matter. A higher value reduces how often notes are rewritten while editing, which prevents losing cursor focus (e.g. inside tables). Default: ${DEFAULT_SAVE_DELAY_IN_SECONDS}.`,
                        control: {
                            type: 'number',
                            key: 'saveDelayInSeconds',
                            placeholder: String(DEFAULT_SAVE_DELAY_IN_SECONDS),
                            // `min` is the framework-level constraint the old
                            // tab set by hand on the input element.
                            min: 0,
                            // The control resolves an unparseable or emptied
                            // field to this value before `validate` ever runs.
                            // Without it that fallback is 0 — a zero-second
                            // delay rewrites front matter on every keystroke,
                            // which is precisely what this setting exists to
                            // avoid. The old tab replaced invalid input with
                            // the default too, so this is also parity.
                            defaultValue: DEFAULT_SAVE_DELAY_IN_SECONDS,
                            validate: (value: number): string | void => {
                                if (!Number.isFinite(value) || value < 0) {
                                    return 'Enter a number of seconds, zero or more.'
                                }
                            }
                        }
                    }
                ]
            },
            ...this.excludedFolderDefinitions(),
            {
                type: 'group',
                heading: 'About',
                items: [
                    {
                        name: 'Follow me on X',
                        desc: '@dSebastien',
                        searchable: false,
                        // A CTA button, not a row `action:` — `action:` makes
                        // the whole row clickable and draws no button at all.
                        render: (setting): void => {
                            setting.addButton((button) => {
                                button
                                    .setCta()
                                    .setButtonText('Follow me on X')
                                    .onClick(() => {
                                        window.open('https://x.com/dSebastien')
                                    })
                            })
                        }
                    },
                    {
                        name: 'Support',
                        searchable: false,
                        render: (setting): void => {
                            setting.infoEl.remove() // the section draws its own headings
                            // `.setting-item` is a flex ROW; the support block
                            // is a stack of full-width rows.
                            setting.settingEl.addClass('settings-stack')
                            renderSupportSection(setting.settingEl, (el) => {
                                this.renderBuyMeACoffeeBadge(el)
                            })
                        }
                    }
                ]
            }
        ]
    }

    /**
     * The excluded-folder list: a header row carrying the description and the
     * add control, then the entries as a native list.
     *
     * The add control stays an inline search box with folder autocomplete
     * rather than the framework's `addItem` affordance, because `addItem`
     * hands back a bare element and the completion is the whole point.
     *
     * A `type: 'list'` cannot live inside a group's `items`, so these two
     * definitions sit at the top level.
     */
    private excludedFolderDefinitions(): SettingDefinitionItem[] {
        return [
            {
                name: 'Folders to exclude',
                desc: 'Any file created or updated in one of these folders will not trigger an update of the created and updated fields.',
                render: (setting): void => {
                    let searchInput: SearchComponent | undefined
                    // Mirror of the current input value; see
                    // resolveFolderInput for why it exists.
                    let currentValue = ''
                    setting.addSearch((cb) => {
                        searchInput = cb
                        new FolderSuggest(cb.inputEl, this.app, (path) => {
                            currentValue = path
                        })
                        cb.setPlaceholder('Example: folder1/folder2')
                        cb.onChange((value) => {
                            currentValue = value
                        })
                    })
                    setting.addButton((cb) => {
                        cb.setIcon('plus')
                        cb.setTooltip('Add folder')
                        cb.onClick(() => {
                            const raw = resolveFolderInput(searchInput?.getValue(), currentValue)
                            void (async (): Promise<void> => {
                                if (await this.addExcludedFolder(raw)) {
                                    currentValue = ''
                                    searchInput?.setValue('')
                                    this.refresh()
                                }
                            })().catch(() => {
                                new Notice('Failed to save settings.')
                            })
                        })
                    })
                }
            },
            {
                type: 'list',
                emptyState: 'No folders excluded.',
                // The framework hands back a position into the list as it was
                // DRAWN. Resolve the entry to a value here, while that
                // position is still meaningful, then filter INSIDE the mutator
                // against the committed array. Filtering a snapshot captured
                // out here would let two quick deletions each write a stale
                // whole array, resurrecting the entry the other one removed.
                onDelete: (index: number): void => {
                    const target = this.plugin.settings.ignoredFolders[index]
                    if (undefined === target) {
                        return
                    }
                    void (async (): Promise<void> => {
                        await this.plugin.updateSettings((draft) => {
                            draft.ignoredFolders = draft.ignoredFolders.filter(
                                (value) => value !== target
                            )
                        })
                        this.refresh()
                    })().catch(() => {
                        // The committed list is unchanged on failure, so no
                        // rebuild is needed — just say the write did not land.
                        new Notice('Failed to save settings.')
                    })
                },
                items: this.plugin.settings.ignoredFolders.map(
                    (folder): SettingGroupItem => ({
                        name: folder,
                        // Entries are data, not settings: keep them out of the
                        // settings search.
                        searchable: false
                    })
                )
            }
        ]
    }

    /**
     * Append a folder to the exclusion list.
     *
     * Extracted from the add button so the write can be tested without a DOM.
     * Returns whether anything was written, so the caller knows whether to
     * clear its input and re-render.
     *
     * Blank entries are refused: an empty folder path matches every file and
     * would silently disable timestamp updates for the whole vault. The
     * duplicate check runs INSIDE the mutator, against the committed list:
     * deciding out here would capture a pre-await snapshot, and two quick
     * additions would each build on the same base.
     */
    async addExcludedFolder(raw: string): Promise<boolean> {
        const folder = raw.trim()
        if (0 === folder.length) {
            return false
        }
        let added = false
        await this.plugin.updateSettings((draft) => {
            const next = [...draft.ignoredFolders, folder].filter(onlyUniqueArray)
            if (next.length === draft.ignoredFolders.length) {
                return
            }
            draft.ignoredFolders = next
            added = true
        })
        return added
    }

    /**
     * Re-render the pane, but never while a text control in it has focus: the
     * framework rebuilds every row from `getControlValue`, which reads the
     * COMMITTED settings, so a re-render landing mid-typing would replace the
     * input with the last-saved value and the next keystroke would persist
     * that stale text. The render is deferred to the moment the field is left
     * rather than dropped.
     */
    private refresh(): void {
        if (!this.hasFocusedTextControl()) {
            // Also clears a flag left behind by a field that was removed
            // without ever emitting focusout, so a later structural update
            // cannot stay pending forever.
            this.refreshPending = false
            this.update()
            return
        }
        if (this.refreshPending) {
            return
        }
        this.refreshPending = true
        // Listen on the container rather than the focused input: focusout
        // bubbles, and the container outlives the row, so a field that is
        // removed while focused still releases the pending render.
        this.containerEl.addEventListener(
            'focusout',
            () => {
                this.refreshPending = false
                this.refresh()
            },
            { once: true }
        )
    }

    private hasFocusedTextControl(): boolean {
        const focused = activeDocument.activeElement
        if (!focused || !this.containerEl.contains(focused)) {
            return false
        }
        return focused.instanceOf(HTMLInputElement) || focused.instanceOf(HTMLTextAreaElement)
    }

    /**
     * Reads the value behind a control `key`. Returning undefined/null makes
     * the framework fall back to the control's declared `defaultValue`.
     */
    override getControlValue(key: string): unknown {
        switch (key as ControlKey) {
            case 'createdPropertyName':
                return this.plugin.settings.createdPropertyName
            case 'updatedPropertyName':
                return this.plugin.settings.updatedPropertyName
            case 'saveDelayInSeconds':
                return this.plugin.settings.saveDelayInSeconds
            default:
                return undefined
        }
    }

    /**
     * Persists a control edit. Rejecting (not resolving) on failure is what
     * lets the framework roll the control back to the stored truth.
     */
    override async setControlValue(key: string, value: unknown): Promise<void> {
        switch (key as ControlKey) {
            case 'createdPropertyName': {
                const next = this.expectString(key, value)
                await this.plugin.updateSettings((draft) => {
                    draft.createdPropertyName = next
                })
                return
            }
            case 'updatedPropertyName': {
                const next = this.expectString(key, value)
                await this.plugin.updateSettings((draft) => {
                    draft.updatedPropertyName = next
                })
                return
            }
            case 'saveDelayInSeconds': {
                // The control validates too, but this is a public write
                // surface: a negative or non-finite delay would break the
                // debouncers that every timestamp write goes through.
                if ('number' !== typeof value || !Number.isFinite(value) || value < 0) {
                    throw new Error(`Setting "${key}" expects a number of seconds, zero or more.`)
                }
                await this.plugin.updateSettings((draft) => {
                    draft.saveDelayInSeconds = value
                })
                return
            }
            default:
                new Notice('Failed to save settings.')
                throw new Error(`Setting "${key}" does not address a known field.`)
        }
    }

    private expectString(key: string, value: unknown): string {
        if ('string' !== typeof value) {
            throw new Error(`Setting "${key}" expects a string.`)
        }
        return value
    }

    renderBuyMeACoffeeBadge(contentEl: HTMLElement | DocumentFragment, width = 175) {
        const linkEl = contentEl.createEl('a', {
            href: 'https://www.buymeacoffee.com/dsebastien'
        })
        const imgEl = linkEl.createEl('img')
        imgEl.src = BUY_ME_A_COFFEE_BADGE_DATA_URL
        imgEl.alt = 'Buy me a coffee'
        imgEl.width = width
    }
}
