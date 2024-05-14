import { App, PluginSettingTab, SearchComponent, Setting } from 'obsidian';
import { UpdateTimePlugin } from '../plugin';

import { Draft, produce } from 'immer';
import { PluginSettings } from '../types';
import { ArgsSearchAndRemove } from './args-search-and-remove.intf';
import { FolderSuggest } from './folder-suggester';
import { onlyUniqueArray } from '../utils/only-unique-array.tn';

export class SettingsTab extends PluginSettingTab {
  plugin: UpdateTimePlugin;

  constructor(app: App, plugin: UpdateTimePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    this.renderSupportHeader(containerEl);

    this.renderExcludedFolders();
  }

  renderSupportHeader(containerEl: HTMLElement) {
    new Setting(containerEl).setName('Support').setHeading();

    const supportDesc = new DocumentFragment();
    supportDesc.createDiv({
      text: 'Buy me a coffee to support the development of this plugin ❤️',
    });

    new Setting(containerEl).setDesc(supportDesc);

    this.renderBuyMeACoffeeBadge(containerEl);
    const spacing = containerEl.createDiv();
    spacing.style.marginBottom = '0.75em';
  }

  renderExcludedFolders(): void {
    this.doSearchAndRemoveList({
      currentList: this.plugin.settings.ignoredFolders,
      setValue: async (newValue) => {
        this.plugin.settings = produce(
          this.plugin.settings,
          (draft: Draft<PluginSettings>) => {
            draft.ignoredFolders = newValue;
          }
        );
      },
      name: 'Folders to exclude',
      description:
        'Any file created or updated in one of these folders will not trigger an update of the created and updated fields.',
    });
  }

  doSearchAndRemoveList({
    currentList,
    setValue,
    description,
    name,
  }: ArgsSearchAndRemove) {
    let searchInput: SearchComponent | undefined;
    new Setting(this.containerEl)
      .setName(name)
      .setDesc(description)
      .addSearch((cb) => {
        searchInput = cb;
        new FolderSuggest(this.app, cb.inputEl);
        cb.setPlaceholder('Example: folder1/folder2');
        // @ts-expect-error Actually exists
        cb.containerEl.addClass('time_search');
      })
      .addButton((cb) => {
        cb.setIcon('plus');
        cb.setTooltip('Add folder');
        cb.onClick(async () => {
          if (!searchInput) {
            return;
          }
          const newFolder = searchInput.getValue();

          await setValue([...currentList, newFolder].filter(onlyUniqueArray));
          await this.plugin.saveSettings();
          searchInput.setValue('');
          this.display();
        });
      });

    currentList.forEach((ignoreFolder) =>
      new Setting(this.containerEl).setName(ignoreFolder).addButton((button) =>
        button.setButtonText('Remove').onClick(async () => {
          await setValue(currentList.filter((value) => value !== ignoreFolder));
          await this.plugin.saveSettings();
          this.display();
        })
      )
    );
  }

  renderBuyMeACoffeeBadge(
    contentEl: HTMLElement | DocumentFragment,
    width = 175
  ) {
    const linkEl = contentEl.createEl('a', {
      href: 'https://www.buymeacoffee.com/dsebastien',
    });
    const imgEl = linkEl.createEl('img');
    imgEl.src =
      'https://github.com/dsebastien/obsidian-update-time/blob/master/apps/plugin/src/assets/buy-me-a-coffee.png?raw=true';
    imgEl.alt = 'Buy me a coffee';
    imgEl.width = width;
  }
}
