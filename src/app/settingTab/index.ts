import { App, PluginSettingTab, SearchComponent, Setting } from 'obsidian'
import { UpdateTimePlugin } from '../plugin'

import { produce } from 'immer'
import type { Draft } from 'immer'
import type { PluginSettings } from '../types'
import type { ArgsSearchAndRemove } from './args-search-and-remove.intf'
import { onlyUniqueArray } from '../utils/only-unique-array.tn'
import { FolderSuggest } from '../utils/folder-suggest'
import { BUY_ME_A_COFFEE_BADGE_DATA_URL } from '../assets/buy-me-a-coffee'
import { DEFAULT_SAVE_DELAY_IN_SECONDS, PROPERTY_CREATED, PROPERTY_UPDATED } from '../constants'

export class SettingsTab extends PluginSettingTab {
    plugin: UpdateTimePlugin

    constructor(app: App, plugin: UpdateTimePlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    display(): void {
        const { containerEl } = this

        containerEl.empty()

        this.renderPropertyNames(containerEl)
        this.renderSaveDelay(containerEl)
        this.renderExcludedFolders()
        this.renderFollowButton(containerEl)
        this.renderSupportHeader(containerEl)
    }

    renderSaveDelay(containerEl: HTMLElement): void {
        new Setting(containerEl).setName('Behavior').setHeading()

        new Setting(containerEl)
            .setName('Save delay (seconds)')
            .setDesc(
                `Wait this long after you stop typing before updating the front matter. A higher value reduces how often notes are rewritten while editing, which prevents losing cursor focus (e.g. inside tables). Default: ${DEFAULT_SAVE_DELAY_IN_SECONDS}.`
            )
            .addText((text) => {
                text.inputEl.type = 'number'
                text.inputEl.min = '0'
                text.setPlaceholder(String(DEFAULT_SAVE_DELAY_IN_SECONDS))
                    .setValue(String(this.plugin.settings.saveDelayInSeconds))
                    .onChange(async (value) => {
                        const parsed = Number(value)
                        const delay =
                            Number.isFinite(parsed) && parsed >= 0
                                ? parsed
                                : DEFAULT_SAVE_DELAY_IN_SECONDS
                        this.plugin.settings = produce(
                            this.plugin.settings,
                            (draft: Draft<PluginSettings>) => {
                                draft.saveDelayInSeconds = delay
                            }
                        )
                        await this.plugin.saveSettings()
                    })
            })
    }

    renderPropertyNames(containerEl: HTMLElement): void {
        new Setting(containerEl).setName('Front-matter properties').setHeading()

        new Setting(containerEl)
            .setName('Created property name')
            .setDesc(
                `Front-matter key used to store the creation time. Leave empty to use the default ("${PROPERTY_CREATED}"). Renaming this only affects future writes; existing notes are not migrated.`
            )
            .addText((text) => {
                text.setPlaceholder(PROPERTY_CREATED)
                    .setValue(this.plugin.settings.createdPropertyName)
                    .onChange(async (value) => {
                        this.plugin.settings = produce(
                            this.plugin.settings,
                            (draft: Draft<PluginSettings>) => {
                                draft.createdPropertyName = value
                            }
                        )
                        await this.plugin.saveSettings()
                    })
            })

        new Setting(containerEl)
            .setName('Updated property name')
            .setDesc(
                `Front-matter key used to store the last-update time. Leave empty to use the default ("${PROPERTY_UPDATED}"). Renaming this only affects future writes; existing notes are not migrated.`
            )
            .addText((text) => {
                text.setPlaceholder(PROPERTY_UPDATED)
                    .setValue(this.plugin.settings.updatedPropertyName)
                    .onChange(async (value) => {
                        this.plugin.settings = produce(
                            this.plugin.settings,
                            (draft: Draft<PluginSettings>) => {
                                draft.updatedPropertyName = value
                            }
                        )
                        await this.plugin.saveSettings()
                    })
            })
    }

    renderFollowButton(containerEl: HTMLElement) {
        new Setting(containerEl)
            .setName('Follow me on X')
            .setDesc('@dSebastien')
            .addButton((button) => {
                button.setCta()
                button.setButtonText('Follow me on X').onClick(() => {
                    window.open('https://x.com/dSebastien')
                })
            })
    }

    renderSupportHeader(containerEl: HTMLElement) {
        new Setting(containerEl).setName('Support').setHeading()

        const supportDesc = new DocumentFragment()
        supportDesc.createDiv({
            text: 'Buy me a coffee to support the development of this plugin ❤️'
        })

        new Setting(containerEl).setDesc(supportDesc)

        this.renderBuyMeACoffeeBadge(containerEl)
        const spacing = containerEl.createDiv()
        spacing.classList.add('support-header-margin')
    }

    renderExcludedFolders(): void {
        this.doSearchAndRemoveList({
            currentList: this.plugin.settings.ignoredFolders,
            setValue: async (newValue) => {
                this.plugin.settings = produce(
                    this.plugin.settings,
                    (draft: Draft<PluginSettings>) => {
                        draft.ignoredFolders = newValue
                    }
                )
            },
            name: 'Folders to exclude',
            description:
                'Any file created or updated in one of these folders will not trigger an update of the created and updated fields.'
        })
    }

    doSearchAndRemoveList({ currentList, setValue, description, name }: ArgsSearchAndRemove) {
        let searchInput: SearchComponent | undefined
        new Setting(this.containerEl)
            .setName(name)
            .setDesc(description)
            .addSearch((cb) => {
                searchInput = cb
                new FolderSuggest(cb.inputEl, this.app)
                cb.setPlaceholder('Example: folder1/folder2')
            })
            .addButton((cb) => {
                cb.setIcon('plus')
                cb.setTooltip('Add folder')
                cb.onClick(async () => {
                    if (!searchInput) {
                        return
                    }
                    const newFolder = searchInput.getValue()

                    await setValue([...currentList, newFolder].filter(onlyUniqueArray))
                    await this.plugin.saveSettings()
                    searchInput.setValue('')
                    this.display()
                })
            })

        currentList.forEach((ignoreFolder) => {
            new Setting(this.containerEl).setName(ignoreFolder).addButton((button) => {
                button.setButtonText('Remove').onClick(async () => {
                    await setValue(currentList.filter((value) => value !== ignoreFolder))
                    await this.plugin.saveSettings()
                    this.display()
                })
            })
        })
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
