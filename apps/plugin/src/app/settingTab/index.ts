import {App, PluginSettingTab, Setting} from 'obsidian';
import {MyPlugin} from '../plugin';
import * as pluginManifest from '../../assets/manifest.json';
import {Draft, produce} from "immer";
import {log} from '../utils/log';
import {PluginSettings} from "../types";

export class SettingsTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;

    containerEl.empty();
    containerEl.createEl('h1', {text: pluginManifest.name});

    containerEl.createEl('hr');
    containerEl.createEl('h2', {text: 'Settings'});

    new Setting(containerEl).setName('Enabled').addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.enabled)
        .onChange(async (value) => {
          log('Publish to Ghost set to: ' + value, 'debug');
          this.plugin.settings = produce(this.plugin.settings, (draft: Draft<PluginSettings>) => {
            draft.enabled = value;
          });
          await this.plugin.saveSettings();
        })
    );
  }
}
