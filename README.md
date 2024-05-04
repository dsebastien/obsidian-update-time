# Obsidian Update Time

This Obsidian plugin updates the front matter in your notes to include the creation and last update dates/times.
Once the plugin is installed and enabled, it will automatically add/update the properties in your metadata.

This plugin is a simplified reimplementation of the [update-time-on-edit plugin](https://github.com/beaussan/update-time-on-edit-obsidian). It was created because the original plugin did not work with Obsidian Publish (cfr this issue: https://github.com/beaussan/update-time-on-edit-obsidian/issues/75)

## Features

Whenever a file change is detected (whether made in Obsidian or not), this plugin updates the metadata of the file to include up to date creation and modification dates.
By default, the information is stored in the `created` and `updated` properties.

The creation and modification times that are set correspond to the file's `ctime` (file creation time) and `mtime` (last modification time).

This plugin supports folder exclusions, to avoid updating certain files (e.g., templates).

Remember to backup your vault since this plugin will modify files.

## Configuration

Once installed, you need to go to the settings of the plugin to enable it. It is disabled by default to ensure you have time to configure it.

In the configuration, you can add a list of folders to exclude.
