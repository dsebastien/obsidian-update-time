import { TFile } from 'obsidian'

interface ExcalidrawAutomateApi {
    isExcalidrawFile: (file: TFile) => boolean
}

/**
 * Check if the given TFile is an Excalidraw file
 * Taken from https://github.com/beaussan/update-time-on-edit-obsidian
 * @param file
 */
export const isExcalidrawFile = (file: TFile): boolean => {
    // ExcalidrawAutomate is injected into the global context by the Excalidraw plugin
    const globalCtx = globalThis as unknown as {
        ExcalidrawAutomate?: ExcalidrawAutomateApi
    }
    const ea = globalCtx.ExcalidrawAutomate
    //ea will be undefined if the Excalidraw plugin is not running
    return ea ? ea.isExcalidrawFile(file) : false
}
