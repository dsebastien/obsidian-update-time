import { registerWhatsNewView } from './whats-new'
import { debounce, Plugin, TAbstractFile, TFile } from 'obsidian'
import type { Debouncer } from 'obsidian'
import { DEFAULT_SETTINGS } from './types'
import type { PluginSettings } from './types'
import { SettingsTab } from './settingTab'
import { log } from './utils/log'
import { produce } from 'immer'
import type { Draft } from 'immer'
import { isExcalidrawFile } from './utils/is-excalidraw-file.fn'
import {
    DATE_FORMAT,
    DEFAULT_CANVAS_FILE_NAME,
    MARKDOWN_FILE_EXTENSION,
    MINUTES_BETWEEN_SAVES,
    PROPERTY_CREATED,
    PROPERTY_UPDATED
} from './constants'
import { parseDate } from './utils/parse-date.fn'
import { hasName } from './utils/has-name.fn'
import { resolvePropertyName } from './utils/resolve-property-name.fn'
import { applyTimestampsToFrontMatter } from './utils/apply-timestamps-to-front-matter.fn'
import { isSelfInducedModify } from './utils/is-self-induced-modify.fn'
import { isInIgnoredFolder } from './utils/is-in-ignored-folder.fn'
import { registerCommands } from './commands'

export class UpdateTimePlugin extends Plugin {
    /**
     * The plugin settings are immutable
     */
    override settings: PluginSettings = produce(DEFAULT_SETTINGS, () => DEFAULT_SETTINGS)

    /**
     * Per-file debouncers. Each changed file is processed only once typing has
     * paused for `saveDelayInSeconds`, so front-matter writes never land in the
     * middle of an edit (which would refresh the editor and lose cursor focus).
     */
    private readonly debouncers = new Map<string, Debouncer<[TFile], void>>()

    /**
     * The `mtime` of the last front-matter write the plugin performed, per file.
     *
     * Writing front matter bumps the file's `mtime` and fires another `modify`
     * event. This map lets the plugin recognise that echo and ignore it, so it
     * never reacts to its own write — which, with a save delay larger than
     * `MINUTES_BETWEEN_SAVES`, would otherwise loop forever.
     */
    private readonly lastWriteMtimes = new Map<string, number>()

    /**
     * Executed as soon as the plugin loads
     */
    override async onload() {
        // Must run before anything can call saveData (fresh-install detection)
        registerWhatsNewView(this)
        log('Initializing', 'debug')
        await this.loadSettings()

        this.setupEventHandlers()

        registerCommands(this)

        // Add a settings screen for the plugin
        this.addSettingTab(new SettingsTab(this.app, this))
    }

    override onunload() {
        this.debouncers.forEach((debouncer) => debouncer.cancel())
        this.debouncers.clear()
        this.lastWriteMtimes.clear()
    }

    /**
     * Load the plugin settings
     */
    async loadSettings() {
        log('Loading settings', 'debug')
        let loadedSettings = (await this.loadData()) as PluginSettings

        if (!loadedSettings) {
            log('Using default settings', 'debug')
            loadedSettings = produce(DEFAULT_SETTINGS, () => DEFAULT_SETTINGS)
            return
        }

        let needToSaveSettings = false

        this.settings = produce(this.settings, (draft: Draft<PluginSettings>) => {
            if (
                loadedSettings.ignoredFolders !== undefined &&
                loadedSettings.ignoredFolders !== null &&
                Array.isArray(loadedSettings.ignoredFolders)
            ) {
                draft.ignoredFolders = loadedSettings.ignoredFolders
            } else {
                log('The loaded settings miss the [ignoredFolders] property', 'debug')
                needToSaveSettings = true
            }

            if (typeof loadedSettings.createdPropertyName === 'string') {
                draft.createdPropertyName = loadedSettings.createdPropertyName
            } else {
                log('The loaded settings miss the [createdPropertyName] property', 'debug')
                needToSaveSettings = true
            }

            if (typeof loadedSettings.updatedPropertyName === 'string') {
                draft.updatedPropertyName = loadedSettings.updatedPropertyName
            } else {
                log('The loaded settings miss the [updatedPropertyName] property', 'debug')
                needToSaveSettings = true
            }

            if (
                typeof loadedSettings.saveDelayInSeconds === 'number' &&
                Number.isFinite(loadedSettings.saveDelayInSeconds) &&
                loadedSettings.saveDelayInSeconds >= 0
            ) {
                draft.saveDelayInSeconds = loadedSettings.saveDelayInSeconds
            } else {
                log('The loaded settings miss the [saveDelayInSeconds] property', 'debug')
                needToSaveSettings = true
            }
        })

        log(`Settings loaded`, 'debug', loadedSettings)

        if (needToSaveSettings) {
            // Through the same queue as user edits: a fire-and-forget save
            // could still be in flight when the settings pane writes, finish
            // last, and put the pre-edit state back on disk.
            void this.updateSettings(() => {
                // The migration already produced `this.settings`; this write
                // exists to persist it in queue order.
            })
        }
    }

    /**
     * Save the plugin settings
     */
    async saveSettings() {
        log('Saving settings', 'debug', this.settings)
        await this.saveData(this.settings)
        this.resetDebouncers()
        log('Settings saved', 'debug', this.settings)
    }

    /**
     * Drop existing debouncers so a changed save delay takes effect
     * immediately, and forget the mtimes recorded under the old settings.
     */
    private resetDebouncers(): void {
        this.debouncers.forEach((debouncer) => debouncer.cancel())
        this.debouncers.clear()
        this.lastWriteMtimes.clear()
    }

    /** Serializes settings writes; see updateSettings. */
    private settingsWriteChain: Promise<void> = Promise.resolve()

    /**
     * Apply a mutation to the settings (via immer) and persist the result.
     * The single write path — the declarative settings tab routes every
     * control edit through here so persistence happens in exactly one place.
     *
     * Persist-then-commit: memory is swapped only after saveData() succeeds,
     * so a rejected write rolls the control back to the on-disk truth.
     * Serialized: writes queue and each mutation derives from the previous
     * COMMITTED state — without this, overlapping calls produce from the same
     * base across the save await and the second commit silently drops the
     * first edit. The debouncers are reset strictly AFTER a successful
     * commit, so a failed write cannot make a changed save delay look applied.
     */
    updateSettings(mutator: (draft: Draft<PluginSettings>) => void): Promise<void> {
        const run = async (): Promise<void> => {
            const next = produce(this.settings, mutator)
            await this.saveData(next)
            this.settings = next
            this.resetDebouncers()
        }
        const p = this.settingsWriteChain.then(run, run)
        this.settingsWriteChain = p.catch(() => {})
        return p
    }

    /**
     * Add the event handlers
     */
    setupEventHandlers() {
        //log('Adding event handlers', 'debug');

        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                this.handleFileChange(file)
            })
        )
    }

    /**
     * Entry point for the `modify` event. Schedules the file for debounced
     * processing rather than writing immediately, so writes land once typing
     * has paused instead of in the middle of an edit.
     */
    handleFileChange(file: TAbstractFile): void {
        if (!(file instanceof TFile)) {
            return
        }

        let debouncer = this.debouncers.get(file.path)
        if (!debouncer) {
            const delayMs = Math.max(0, this.settings.saveDelayInSeconds) * 1000
            debouncer = debounce(
                (changedFile: TFile) => {
                    void this.processFile(changedFile)
                },
                delayMs,
                true
            )
            this.debouncers.set(file.path, debouncer)
        }

        debouncer(file)
    }

    /**
     * Update the created / updated front-matter properties of a file.
     *
     * The file is only written when something actually changes, so unchanged
     * notes never trigger an editor refresh (which would lose cursor focus).
     */
    async processFile(file: TFile): Promise<void> {
        // Ignore the `modify` echo produced by our own front-matter write. Each
        // write is consumed once so the next genuine change is still processed.
        const lastWriteMtime = this.lastWriteMtimes.get(file.path)
        if (lastWriteMtime !== undefined) {
            this.lastWriteMtimes.delete(file.path)
            if (isSelfInducedModify(lastWriteMtime, file.stat.mtime)) {
                return
            }
        }

        const shouldBeIgnored = await this.shouldFileBeIgnored(file)
        if (shouldBeIgnored) {
            return
        }

        const createdKey = resolvePropertyName(this.settings.createdPropertyName, PROPERTY_CREATED)
        const updatedKey = resolvePropertyName(this.settings.updatedPropertyName, PROPERTY_UPDATED)

        const cTime = parseDate(file.stat.ctime, DATE_FORMAT)
        const mTime = parseDate(file.stat.mtime, DATE_FORMAT)

        if (!mTime || !cTime) {
            log('Could not determine the creation/modification times. Skipping...', 'debug')
            return
        }

        // Probe the cached front matter first: if nothing would change, skip the
        // write entirely to avoid an unnecessary editor refresh.
        const cachedFrontMatter = {
            ...(this.app.metadataCache.getFileCache(file)?.frontmatter ?? {})
        }
        const wouldChange = applyTimestampsToFrontMatter({
            frontMatter: cachedFrontMatter,
            cTime,
            mTime,
            createdKey,
            updatedKey,
            dateFormat: DATE_FORMAT,
            minutesBetweenSaves: MINUTES_BETWEEN_SAVES
        })
        if (!wouldChange) {
            return
        }

        try {
            await this.app.fileManager.processFrontMatter(
                file,
                (frontMatter: Record<string, unknown>) => {
                    applyTimestampsToFrontMatter({
                        frontMatter,
                        cTime,
                        mTime,
                        createdKey,
                        updatedKey,
                        dateFormat: DATE_FORMAT,
                        minutesBetweenSaves: MINUTES_BETWEEN_SAVES
                    })
                }
            )
            // Record the post-write mtime so the resulting `modify` event is
            // recognised as our own echo and ignored (prevents the self-feeding
            // write loop when the save delay exceeds MINUTES_BETWEEN_SAVES).
            this.lastWriteMtimes.set(file.path, file.stat.mtime)
        } catch (e: unknown) {
            if (hasName(e) && 'YAMLParseError' === e.name) {
                log(
                    `Failed to update creation/update times because the front matter of [${file.path}] is malformed`,
                    'warn',
                    e
                )
            }
        }
    }

    async shouldFileBeIgnored(file: TFile): Promise<boolean> {
        //log(`Checking if the file should be ignored: ${file.path}`, 'debug');
        if (!file.path) {
            return true
        }

        if (MARKDOWN_FILE_EXTENSION !== file.extension) {
            return true
        }

        // Ignored Canvas files
        if (DEFAULT_CANVAS_FILE_NAME === file.name) {
            return true
        }

        const fileContent = (await this.app.vault.read(file)).trim()

        if (fileContent.length === 0) {
            return true
        }

        if (isExcalidrawFile(file)) {
            return true
        }

        return isInIgnoredFolder(file.path, this.settings.ignoredFolders)
    }
}
