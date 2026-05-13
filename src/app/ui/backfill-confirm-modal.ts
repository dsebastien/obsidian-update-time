import { App, ButtonComponent, Modal } from 'obsidian'

export class BackfillConfirmModal extends Modal {
    private readonly fileCount: number
    private readonly onConfirm: () => void

    constructor(app: App, fileCount: number, onConfirm: () => void) {
        super(app)
        this.fileCount = fileCount
        this.onConfirm = onConfirm
    }

    override onOpen(): void {
        this.titleEl.setText('Backfill created / updated properties')

        const body = this.contentEl.createDiv({ cls: 'flex flex-col gap-3' })

        body.createEl('p', {
            text: `This will scan ${this.fileCount.toLocaleString()} Markdown ${
                this.fileCount === 1 ? 'note' : 'notes'
            } in your vault and add missing front-matter properties.`
        })

        const rulesList = body.createEl('ul', { cls: 'pl-5 m-0' })
        rulesList.createEl('li', {
            text: 'Existing values are never overwritten (except an unparsable "updated" value, which is refreshed).'
        })
        rulesList.createEl('li', {
            text: 'Files in excluded folders, Canvas files, empty notes, and Excalidraw files are skipped.'
        })
        rulesList.createEl('li', {
            text: 'This operation modifies vault files. Make sure you have a backup before continuing.'
        })

        const buttonRow = this.contentEl.createDiv({
            cls: 'flex flex-row justify-end gap-2 mt-4'
        })

        new ButtonComponent(buttonRow).setButtonText('Cancel').onClick(() => this.close())

        new ButtonComponent(buttonRow)
            .setCta()
            .setButtonText('Run')
            .onClick(() => {
                this.close()
                this.onConfirm()
            })
    }

    override onClose(): void {
        this.contentEl.empty()
    }
}
