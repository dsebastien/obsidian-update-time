import { describe, expect, test, mock } from 'bun:test'

// The `obsidian` module is mocked globally by src/test-setup.ts (preloaded
// via bunfig.toml), so the plugin module's runtime dependencies resolve.
const { UpdateTimePlugin } = await import('./plugin')
const { DEFAULT_SETTINGS } = await import('./types')

/**
 * Behavioral coverage for the plugin's settings write path. Nothing in CI
 * renders a settings pane, so these tests exercise the properties no UI test
 * can reach: writes are serialized, memory is committed only after
 * persistence succeeds, and the debouncers every timestamp write goes through
 * are reset only for a write that actually landed.
 */

interface Harness {
    plugin: InstanceType<typeof UpdateTimePlugin>
    saveData: ReturnType<typeof mock>
    cancelled: number
    /**
     * `createdPropertyName` of each write in the order the writes LANDED (not
     * the order they were issued). Ordering bugs show up here and nowhere
     * else: a write that starts first but finishes last still leaves its
     * payload on disk.
     */
    landed: string[]
}

function createHarness(options?: { saveData?: () => Promise<void> }): Harness {
    const harness = { cancelled: 0, landed: [] } as unknown as Harness
    const saveData = mock(async (data: unknown) => {
        if (options?.saveData) {
            await options.saveData()
        }
        harness.landed.push((data as { createdPropertyName: string }).createdPropertyName)
    })

    const plugin = Object.create(UpdateTimePlugin.prototype) as InstanceType<
        typeof UpdateTimePlugin
    >
    const internals = plugin as unknown as Record<string, unknown>
    internals['settings'] = { ...DEFAULT_SETTINGS }
    internals['settingsWriteChain'] = Promise.resolve()
    internals['saveData'] = saveData
    internals['debouncers'] = new Map([
        [
            'note.md',
            {
                cancel: (): void => {
                    harness.cancelled += 1
                }
            }
        ]
    ])
    internals['lastWriteMtimes'] = new Map([['note.md', 1]])

    harness.plugin = plugin
    harness.saveData = saveData
    return harness
}

describe('updateSettings', () => {
    test('commits to memory only after the write is persisted', async () => {
        let release = (): void => {}
        const gate = new Promise<void>((resolve) => {
            release = resolve
        })
        const { plugin, saveData } = createHarness({ saveData: () => gate })

        const pending = plugin.updateSettings((draft) => {
            draft.createdPropertyName = 'made-on'
        })

        // Let the queued write start and reach its save await; a bare
        // synchronous assertion would pass even with the ordering reversed,
        // because the chain defers the work to a microtask.
        await Promise.resolve()
        await Promise.resolve()
        expect(saveData).toHaveBeenCalledTimes(1)
        expect(plugin.settings.createdPropertyName).toBe(DEFAULT_SETTINGS.createdPropertyName)

        release()
        await pending
        expect(plugin.settings.createdPropertyName).toBe('made-on')
    })

    test('leaves memory and the debouncers untouched when persistence fails', async () => {
        const harness = createHarness({
            saveData: () => Promise.reject(new Error('disk full'))
        })
        let caught: unknown
        await harness.plugin
            .updateSettings((draft) => {
                draft.saveDelayInSeconds = 99
            })
            .catch((error: unknown) => {
                caught = error
            })
        expect(caught).toBeInstanceOf(Error)
        expect(harness.plugin.settings.saveDelayInSeconds).toBe(DEFAULT_SETTINGS.saveDelayInSeconds)
        // A failed write must not make a changed save delay look applied.
        expect(harness.cancelled).toBe(0)
    })

    test('resets the debouncers after a successful write', async () => {
        const harness = createHarness()
        await harness.plugin.updateSettings((draft) => {
            draft.saveDelayInSeconds = 30
        })
        expect(harness.cancelled).toBe(1)
        expect(
            (harness.plugin as unknown as { lastWriteMtimes: Map<string, number> }).lastWriteMtimes
                .size
        ).toBe(0)
    })

    test('the post-migration save goes through the write queue', async () => {
        // A fire-and-forget saveSettings() bypasses the chain: it can still be
        // in flight when the settings pane writes, finish last, and put the
        // pre-edit state back on disk. Asserting the ROUTE (rather than a
        // landing order that both implementations can produce) is what
        // actually fails if this call site regresses.
        const harness = createHarness()
        const plugin = harness.plugin as unknown as {
            loadData: () => Promise<unknown>
            loadSettings: () => Promise<void>
            updateSettings: (mutator: (draft: unknown) => void) => Promise<void>
        }
        const throughQueue: number[] = []
        const original = plugin.updateSettings.bind(plugin)
        plugin.updateSettings = (mutator): Promise<void> => {
            throughQueue.push(1)
            return original(mutator)
        }
        // Missing fields force the migration branch.
        plugin.loadData = async () => ({ ignoredFolders: ['Meetings'] })

        await plugin.loadSettings()
        for (let i = 0; i < 20; i += 1) {
            await Promise.resolve()
        }

        expect(throughQueue).toHaveLength(1)
        expect(harness.saveData).toHaveBeenCalledTimes(1)
        expect(harness.plugin.settings.ignoredFolders).toEqual(['Meetings'])
    })

    test('serializes overlapping writes so both land', async () => {
        let release = (): void => {}
        const gate = new Promise<void>((resolve) => {
            release = resolve
        })
        let first = true
        const { plugin } = createHarness({
            saveData: () => {
                if (first) {
                    first = false
                    return gate
                }
                return Promise.resolve()
            }
        })

        const a = plugin.updateSettings((draft) => {
            draft.createdPropertyName = 'first'
        })
        const b = plugin.updateSettings((draft) => {
            draft.updatedPropertyName = 'second'
        })
        release()
        await Promise.all([a, b])
        expect(plugin.settings.createdPropertyName).toBe('first')
        expect(plugin.settings.updatedPropertyName).toBe('second')
    })
})
