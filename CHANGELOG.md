# Changelog

## 0.5.0

- Folder cover assignments now follow folder renames automatically, including covers assigned to descendant folders.
- Vault-image cover paths and the configured root/current folder are migrated when their parent folder is renamed.
- Added automatic cleanup when folders or referenced vault cover images are deleted.
- Added a shared external-cover image library so the same copied image is stored only once.
- Added an External Cover Storage manager with storage totals, usage information, per-image removal, orphan cleanup, and bulk cleanup controls.
- Existing v0.4 external cover data is migrated automatically on first load.

## 0.4.1

- Fixed Community Directory automated review blockers.
- Removed `Obsidian` from the manifest description.
- Renamed the plugin-owned `settings` field to `pluginSettings` to avoid colliding with the newer core `Plugin.settings` API.
- Stopped detaching custom view leaves during plugin unload so the user's workspace location is preserved.
- Replaced the deprecated `builtin-modules` development dependency with Node's `builtinModules`.

Maintained by [Arebrodo](https://github.com/Arebrodo).

All notable changes to Folder Cover Wall are documented here.

## 0.4.0 - 2026-09-14

### Added

- External folder-cover images selected through the operating-system file picker.
- Embedded external image storage so covers keep working after the source image is moved or renamed.
- Vault image cover selection remains available from the folder context menu.

### Existing behavior

- Folder cover wall in the sidebar.
- Nested folder navigation.
- Notes and files listed within the current folder.
- Automatic `cover.*` detection.
- First-image automatic cover fallback.
- Generated cover fallback.
