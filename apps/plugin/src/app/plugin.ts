import { Plugin, TAbstractFile, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings } from './types';
import { SettingsTab } from './settingTab';
import { log } from './utils/log';
import { Draft, produce } from 'immer';
import { isTFile } from './utils/is-tfile.fn';
import { isExcalidrawFile } from './utils/is-excalidraw-file.fn';
import {
  DATE_FORMAT,
  DEFAULT_CANVAS_FILE_NAME,
  MARKDOWN_FILE_EXTENSION,
  MINUTES_BETWEEN_SAVES,
  PROPERTY_CREATED,
  PROPERTY_UPDATED,
} from './constants';
import { parseDate } from './utils/parse-date.fn';
import { add, format, isAfter } from 'date-fns';
import { hasName } from './utils/has-name.fn';

export class UpdateTimePlugin extends Plugin {
  /**
   * The plugin settings are immutable
   */
  settings: PluginSettings = produce(DEFAULT_SETTINGS, () => DEFAULT_SETTINGS);

  /**
   * Executed as soon as the plugin loads
   */
  async onload() {
    log('Initializing', 'debug');
    await this.loadSettings();

    this.setupEventHandlers();

    // Add a settings screen for the plugin
    this.addSettingTab(new SettingsTab(this.app, this));
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onunload() {}

  /**
   * Load the plugin settings
   */
  async loadSettings() {
    log('Loading settings', 'debug');
    let loadedSettings = (await this.loadData()) as PluginSettings;

    if (!loadedSettings) {
      log('Using default settings', 'debug');
      loadedSettings = produce(DEFAULT_SETTINGS, () => DEFAULT_SETTINGS);
      return;
    }

    let needToSaveSettings = false;

    this.settings = produce(this.settings, (draft: Draft<PluginSettings>) => {
      if (
        loadedSettings.ignoredFolders !== undefined &&
        loadedSettings.ignoredFolders !== null &&
        Array.isArray(loadedSettings.ignoredFolders)
      ) {
        draft.ignoredFolders = loadedSettings.ignoredFolders;
      } else {
        log('The loaded settings miss the [ignoredFolders] property', 'debug');
        needToSaveSettings = true;
      }
    });

    log(`Settings loaded`, 'debug', loadedSettings);

    if (needToSaveSettings) {
      this.saveSettings();
    }
  }

  /**
   * Save the plugin settings
   */
  async saveSettings() {
    log('Saving settings', 'debug', this.settings);
    await this.saveData(this.settings);
    log('Settings saved', 'debug', this.settings);
  }

  /**
   * Add the event handlers
   */
  setupEventHandlers() {
    log('Adding event handlers', 'debug');

    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        return this.handleFileChange(file);
      })
    );
  }

  async handleFileChange(file: TAbstractFile): Promise<void> {
    if (!isTFile(file)) {
      return;
    }

    const shouldBeIgnored = await this.shouldFileBeIgnored(file);
    if (shouldBeIgnored) {
      return;
    }

    log(`Processing updated file: ${file.path}`);

    try {
      await this.app.fileManager.processFrontMatter(file, (frontMatter) => {
        log('Current file stat: ', 'debug', file.stat);

        const createdKey = PROPERTY_CREATED;
        const updatedKey = PROPERTY_UPDATED;

        const cTime = parseDate(file.stat.ctime, DATE_FORMAT);
        const mTime = parseDate(file.stat.mtime, DATE_FORMAT);

        if (!mTime || !cTime) {
          log(
            'Could not determine the creation/modification times. Skipping...'
          );
          return;
        }

        if (!frontMatter[createdKey]) {
          log('Adding the created property');
          frontMatter[createdKey] = format(cTime, DATE_FORMAT);
        }

        const currentMTimePropertyValue = parseDate(
          frontMatter[updatedKey],
          DATE_FORMAT
        );

        // If the updated property isn't set or has no valid value
        if (!frontMatter[updatedKey] || !currentMTimePropertyValue) {
          log('Adding the updated property');
          frontMatter[updatedKey] = format(mTime, DATE_FORMAT);
          return;
        }

        if (this.shouldUpdateMTime(mTime, currentMTimePropertyValue)) {
          frontMatter[updatedKey] = format(mTime, DATE_FORMAT);
          log('Updating the updated property');
          return;
        }
      });
    } catch (e: unknown) {
      if (hasName(e) && 'YAMLParseError' === e.name) {
        log(
          `Failed to update creation/update times because the front matter of [${file.path}] is malformed`,
          'warn',
          e
        );
      }
    }
  }

  shouldUpdateMTime(currentMTime: Date, currentUpdatedTime: Date): boolean {
    const nextUpdate = add(currentUpdatedTime, {
      minutes: MINUTES_BETWEEN_SAVES,
    });
    return isAfter(currentMTime, nextUpdate);
  }

  async shouldFileBeIgnored(file: TFile): Promise<boolean> {
    log(`Checking if the file should be ignored: ${file.path}`, 'debug');
    if (!file.path) {
      return true;
    }

    if (MARKDOWN_FILE_EXTENSION !== file.extension) {
      return true;
    }

    // Ignored Canvas files
    if (DEFAULT_CANVAS_FILE_NAME === file.name) {
      return true;
    }

    const fileContent = (await this.app.vault.read(file)).trim();

    if (fileContent.length === 0) {
      return true;
    }

    if (isExcalidrawFile(file)) {
      return true;
    }

    return this.settings.ignoredFolders.some((ignoredFolder) => {
      if (file.path.startsWith(ignoredFolder)) {
        log(
          `Skipping because the file is part of an ignored folder: [${ignoredFolder}]`
        );
        return true;
      } else {
        return false;
      }
    });
  }
}
