export interface PluginSettings {
  enabled: boolean;
  ignoredFolders: string[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
  enabled: false,
  ignoredFolders: [],
};
