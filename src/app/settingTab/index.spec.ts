import { test, expect, mock, beforeEach, describe } from 'bun:test'

// The settings pane is declarative (Obsidian 1.13+): its rows are DEFINITIONS,
// not imperatively built Setting objects, so these tests drive the write
// surface the framework calls — addExcludedFolder, setControlValue and the
// list's onDelete — rather than a DOM. The guarantees they cover are the ones
// the imperative version had, including the issue #9 regressions ("Folders to
// exclude" not settable / empty values excluding the whole vault).

void mock.module('obsidian', () => ({
    Notice: class Notice {},
    App: class App {},
    Plugin: class Plugin {},
    PluginSettingTab: class PluginSettingTab {},
    Setting: class Setting {},
    TFile: class TFile {},
    TFolder: class TFolder {},
    TAbstractFile: class TAbstractFile {},
    AbstractInputSuggest: class AbstractInputSuggest {}
}))

const { SettingsTab, resolveFolderInput } = await import('./index')

interface Harness {
    plugin: { settings: Record<string, unknown> }
    tab: InstanceType<typeof SettingsTab>
    saveCount: number
    failWrites: boolean
}

let harness: Harness

function listDefinition(): {
    onDelete?: (index: number) => void
    items?: { name: string }[]
} {
    const definitions = harness.tab.getSettingDefinitions() as unknown as {
        type?: string
        onDelete?: (index: number) => void
        items?: { name: string }[]
    }[]
    const list = definitions.find((definition) => 'list' === definition.type)
    expect(list).toBeDefined()
    return list!
}

/** Lets the fire-and-forget writes the pane starts run to completion. */
async function settle(): Promise<void> {
    for (let i = 0; i < 20; i += 1) {
        await Promise.resolve()
    }
}

beforeEach(() => {
    let writeChain: Promise<void> = Promise.resolve()
    const plugin = {
        settings: {
            ignoredFolders: [] as string[],
            createdPropertyName: 'created',
            updatedPropertyName: 'updated',
            saveDelayInSeconds: 10
        } as Record<string, unknown>,
        // Stands in for the plugin's serialized persist-then-commit write
        // path: writes queue, each mutation derives from the previously
        // COMMITTED state, and the mutation is applied only once the "save"
        // succeeds. Modelling the queue matters — without it the harness
        // would let two overlapping writes both build on the same base and
        // the tests would pass against code that has the bug.
        updateSettings: (mutator: (draft: Record<string, unknown>) => void): Promise<void> => {
            const run = async (): Promise<void> => {
                const next = structuredClone(plugin.settings)
                mutator(next)
                if (harness.failWrites) {
                    throw new Error('disk full')
                }
                plugin.settings = next
                harness.saveCount += 1
            }
            const queued = writeChain.then(run, run)
            writeChain = queued.catch(() => {})
            return queued
        }
    }

    const tab = Object.create(SettingsTab.prototype) as InstanceType<typeof SettingsTab>
    const internals = tab as unknown as Record<string, unknown>
    internals['plugin'] = plugin
    internals['refresh'] = (): void => {}

    harness = { plugin, tab, saveCount: 0, failWrites: false }
})

describe('excluded folders', () => {
    test('a typed folder is added', async () => {
        expect(await harness.tab.addExcludedFolder('Meetings')).toBe(true)
        expect(harness.plugin.settings['ignoredFolders']).toEqual(['Meetings'])
        expect(harness.saveCount).toBe(1)
    })

    test('an empty field does not add a blank entry', async () => {
        // A blank entry matches every path and would silently disable
        // timestamp updates for the whole vault.
        expect(await harness.tab.addExcludedFolder('')).toBe(false)
        expect(harness.plugin.settings['ignoredFolders']).toEqual([])
        expect(harness.saveCount).toBe(0)
    })

    test('whitespace-only input is not added', async () => {
        expect(await harness.tab.addExcludedFolder('   ')).toBe(false)
        expect(harness.plugin.settings['ignoredFolders']).toEqual([])
        expect(harness.saveCount).toBe(0)
    })

    test('surrounding whitespace is trimmed', async () => {
        await harness.tab.addExcludedFolder('  Journal/2026  ')
        expect(harness.plugin.settings['ignoredFolders']).toEqual(['Journal/2026'])
    })

    test('a value captured via onChange survives the field being cleared', () => {
        // Issue #9's failure mode: the suggester blurs and clears the field
        // before the + handler reads it. Without the mirror the click adds
        // nothing — or worse, an empty entry that matches every path.
        expect(resolveFolderInput('', 'Journal')).toBe('Journal')
        // The live field wins when it still holds something.
        expect(resolveFolderInput('Meetings', 'Journal')).toBe('Meetings')
        // Neither source has anything usable.
        expect(resolveFolderInput('', '')).toBe('')
        expect(resolveFolderInput(undefined, '   ')).toBe('')
        // Whitespace never becomes an entry.
        expect(resolveFolderInput('  Journal/2026  ', '')).toBe('Journal/2026')
    })

    test('two concurrent additions of the same folder store it once', async () => {
        // The dedupe check must run INSIDE the mutator, against the state the
        // write is applied to. Deciding from a snapshot taken before the await
        // makes both calls see an empty list and store the folder twice.
        const [a, b] = await Promise.all([
            harness.tab.addExcludedFolder('Meetings'),
            harness.tab.addExcludedFolder('Meetings')
        ])
        expect(harness.plugin.settings['ignoredFolders']).toEqual(['Meetings'])
        expect([a, b].filter(Boolean)).toHaveLength(1)
    })

    test('duplicates are not added twice and report no write', async () => {
        harness.plugin.settings['ignoredFolders'] = ['Meetings']
        expect(await harness.tab.addExcludedFolder('Meetings')).toBe(false)
        expect(harness.plugin.settings['ignoredFolders']).toEqual(['Meetings'])
    })

    test('an existing folder can be removed by its drawn position', async () => {
        harness.plugin.settings['ignoredFolders'] = ['Meetings', 'Journal']
        const list = listDefinition()
        expect(list.items?.map((item) => item.name)).toEqual(['Meetings', 'Journal'])

        list.onDelete?.(1)
        await settle()
        expect(harness.plugin.settings['ignoredFolders']).toEqual(['Meetings'])
    })

    test('deleting resolves the entry before the write, not the index', async () => {
        // The framework hands back a position into the list AS DRAWN. Two
        // deletions issued from the same render must remove exactly those two
        // entries — resolving the second by index after the first landed would
        // remove the wrong folder.
        harness.plugin.settings['ignoredFolders'] = ['A', 'B', 'C']
        const list = listDefinition()
        list.onDelete?.(0)
        list.onDelete?.(2)
        await settle()
        expect(harness.plugin.settings['ignoredFolders']).toEqual(['B'])
    })

    test('a failed delete leaves the list untouched', async () => {
        harness.plugin.settings['ignoredFolders'] = ['Meetings']
        harness.failWrites = true
        listDefinition().onDelete?.(0)
        await settle()
        expect(harness.plugin.settings['ignoredFolders']).toEqual(['Meetings'])
    })
})

describe('setControlValue', () => {
    test('persists the property names', async () => {
        await harness.tab.setControlValue('createdPropertyName', 'made-on')
        await harness.tab.setControlValue('updatedPropertyName', 'changed-on')
        expect(harness.plugin.settings['createdPropertyName']).toBe('made-on')
        expect(harness.plugin.settings['updatedPropertyName']).toBe('changed-on')
        expect(harness.tab.getControlValue('createdPropertyName')).toBe('made-on')
    })

    test('accepts a valid save delay, including zero', async () => {
        await harness.tab.setControlValue('saveDelayInSeconds', 0)
        expect(harness.plugin.settings['saveDelayInSeconds']).toBe(0)
        await harness.tab.setControlValue('saveDelayInSeconds', 30)
        expect(harness.plugin.settings['saveDelayInSeconds']).toBe(30)
    })

    test('rejects a negative or non-finite save delay without writing', async () => {
        // Every timestamp write goes through debouncers built from this value.
        for (const bad of [-1, Number.POSITIVE_INFINITY, Number.NaN, '10']) {
            let caught: unknown
            await harness.tab.setControlValue('saveDelayInSeconds', bad).catch((e: unknown) => {
                caught = e
            })
            expect(caught).toBeInstanceOf(Error)
        }
        expect(harness.plugin.settings['saveDelayInSeconds']).toBe(10)
        expect(harness.saveCount).toBe(0)
    })

    test('rejects a type-mismatched property name', async () => {
        let caught: unknown
        await harness.tab.setControlValue('createdPropertyName', 42).catch((e: unknown) => {
            caught = e
        })
        expect((caught as Error).message).toContain('expects a string')
        expect(harness.saveCount).toBe(0)
    })

    test('rejects an unknown key', async () => {
        let caught: unknown
        await harness.tab.setControlValue('__proto__', 'x').catch((e: unknown) => {
            caught = e
        })
        expect((caught as Error).message).toContain('does not address a known field')
        expect(harness.saveCount).toBe(0)
    })
})
