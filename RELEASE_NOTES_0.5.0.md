# Folder Cover Wall 0.5.0

This release focuses on safer cover persistence and storage management.

## Added

- External Cover Storage manager in plugin settings and the command palette.
- Storage usage summary for copied external images.
- Per-image usage information and removal controls.
- One-click cleanup for unused images and orphaned folder-cover mappings.
- Shared storage for copied external images to avoid duplicate copies when the same image is reused.

## Fixed

- Renaming a folder now preserves its custom cover.
- Covers assigned to nested folders are migrated when a parent folder is renamed.
- Vault-image cover references follow renamed files/folders.
- Deleted folders no longer leave unnecessary external cover data behind.

Existing v0.4 external-image covers are migrated automatically.
