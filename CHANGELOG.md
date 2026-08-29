# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0](https://github.com/dsebastien/obsidian-update-time/compare/1.5.0...2.0.0) (2026-08-29)

### ⚠ BREAKING CHANGES

* **plugin:** minAppVersion moves from 1.8.7 to 1.13.0 — the
declarative settings API (getSettingDefinitions) only exists there.

getSettingDefinitions() replaces the display() tab: the property names
and the save delay become plain controls, and the excluded-folder list
becomes a native type:'list' at the top level (a group's items cannot
host one) with an inline folder-autocomplete add row — the framework's
addItem affordance hands back a bare element and the completion is the
whole point of that field.

The write path is a serialized persist-then-commit updateSettings
shared by the tab and the post-migration save in loadSettings, which
previously went straight to disk and could finish after a user edit and
restore the pre-edit state. The debouncers every timestamp write goes
through are reset strictly after a successful commit, so a failed write
can no longer make a changed save delay look applied.

Deliberate behavior change: an invalid save delay is refused with an
inline error instead of being silently replaced by the default, which
hid typos. Deleting a folder resolves the entry by value before the
write, so two deletions issued from one render remove exactly those two
entries.

The settings-tab spec is rewritten around the declarative surface and
keeps every guarantee the imperative version encoded — including the

### Features

* **plugin:** declare the settings tab (Obsidian 1.13 declarative settings) ([380c983](https://github.com/dsebastien/obsidian-update-time/commit/380c98390c13b01d39c33715618a23e775748a9a)), closes [#9](https://github.com/dsebastien/obsidian-update-time/issues/9)
* **plugin:** show what's new in a tab instead of a modal dialog ([c0bf4c9](https://github.com/dsebastien/obsidian-update-time/commit/c0bf4c99d3c1dd5e5889f46b8529d4b82c9456c2))
* **plugin:** surface support CTAs everywhere users can see them ([4758bb1](https://github.com/dsebastien/obsidian-update-time/commit/4758bb15a0f42b3345d004543efc1c417592ad39))

### Bug Fixes

* **build:** align with the catalog reviewer's archive, ruleset and audit ([a34597e](https://github.com/dsebastien/obsidian-update-time/commit/a34597ebc9b7ec9ccf9dc7d2579dae57cbb097c5))
* **plugin:** constrain the save delay and cover what the port left untested ([fc14a2a](https://github.com/dsebastien/obsidian-update-time/commit/fc14a2acea5f21873e503888ab35c588be774b17))

## [1.5.0](https://github.com/dsebastien/obsidian-update-time/compare/1.4.0...1.5.0) (2026-07-29)

### Features

* **plugin:** aggregate what's new dialogs across simultaneously updated plugins ([d9789c8](https://github.com/dsebastien/obsidian-update-time/commit/d9789c82ec86c256588e3918ae6fc96f39cd4675))

## [1.4.0](https://github.com/dsebastien/obsidian-update-time/compare/1.3.0...1.4.0) (2026-07-29)

### Features

* **plugin:** add Knowii community to the what's new dialog and harden it ([b21a1f0](https://github.com/dsebastien/obsidian-update-time/commit/b21a1f0efee74e7a3267bb1032df63065c3e95fc))

## [1.3.0](https://github.com/dsebastien/obsidian-update-time/compare/1.2.3...1.3.0) (2026-07-27)

### Features

* **plugin:** show a what's new dialog once after plugin updates ([c0a03db](https://github.com/dsebastien/obsidian-update-time/commit/c0a03dbac1b7403a9e7d19cb04a0931f11727b51))

## [1.2.3](https://github.com/dsebastien/obsidian-update-time/compare/1.2.2...1.2.3) (2026-07-18)

### Bug Fixes

* **plugin:** reliably add excluded folders and ignore blank entries ([#9](https://github.com/dsebastien/obsidian-update-time/issues/9)) ([b364593](https://github.com/dsebastien/obsidian-update-time/commit/b3645935e423f14c29820d0ccc1fe26075c14934)), closes [#1](https://github.com/dsebastien/obsidian-update-time/issues/1)

## [1.2.2](https://github.com/dsebastien/obsidian-update-time/compare/1.2.1...1.2.2) (2026-07-17)

## [1.2.1](https://github.com/dsebastien/obsidian-update-time/compare/1.2.0...1.2.1) (2026-06-24)

### Bug Fixes

* **plugin:** ignore self-induced modify events to stop runaway updates ([59fa47b](https://github.com/dsebastien/obsidian-update-time/commit/59fa47b470d419b74b0800e46faaf0f8febeaed4)), closes [#14](https://github.com/dsebastien/obsidian-update-time/issues/14) [#8](https://github.com/dsebastien/obsidian-update-time/issues/8)

## [1.2.0](https://github.com/dsebastien/obsidian-update-time/compare/1.1.3...1.2.0) (2026-06-23)

### Features

* **plugin:** debounce front-matter writes to keep editor focus ([#7](https://github.com/dsebastien/obsidian-update-time/issues/7)) ([094974d](https://github.com/dsebastien/obsidian-update-time/commit/094974da154b274b7cb4557787622c76d5061fbd))

## [1.1.3](https://github.com/dsebastien/obsidian-update-time/compare/1.1.2...1.1.3) (2026-05-14)

## [1.1.2](https://github.com/dsebastien/obsidian-update-time/compare/1.1.1...1.1.2) (2026-05-13)

### Features

* **all:** added a command to insert properties in all notes ([40ce40a](https://github.com/dsebastien/obsidian-update-time/commit/40ce40a765e40aaf344625a78791c1c170eb5d1d)), closes [#5](https://github.com/dsebastien/obsidian-update-time/issues/5)
* **all:** added way to customize properties ([e9742f9](https://github.com/dsebastien/obsidian-update-time/commit/e9742f9c086be1d674a61b72d539b433aac07cad)), closes [#2](https://github.com/dsebastien/obsidian-update-time/issues/2)

## [1.1.1](https://github.com/dsebastien/obsidian-update-time/compare/1.1.0...1.1.1) (2026-05-13)

## [1.1.0](https://github.com/dsebastien/obsidian-update-time/compare/1.0.13...1.1.0) (2026-05-13)

### Features

* **all:** migrated to Bun and added docs ([75d2ae2](https://github.com/dsebastien/obsidian-update-time/commit/75d2ae259763ab5dab2da65c1c25497116465fb8))
* **all:** removed husky ([416c078](https://github.com/dsebastien/obsidian-update-time/commit/416c078d4645176445591927e973b30642b56a4f))

## 1.0.13

See the full release history in [docs/release-notes.md](./docs/release-notes.md) and on [GitHub Releases](https://github.com/dsebastien/obsidian-update-time/releases).

Future releases will be generated by `scripts/generate-changelog.ts`.












