## Folder Cover Wall 0.7.0

This release focuses on code quality, review cleanliness, and defensive handling of local cover images while preserving the low-memory behavior introduced in 0.6.x.

### Improvements

- Removed `@ts-nocheck` and added explicit TypeScript types across the plugin.
- Added validated parsing for persisted settings and cover metadata.
- External cover selection now accepts JPEG, PNG, and WebP only and rejects source files larger than 32 MB.
- Embedded image data is validated before decoding.
- Removed direct HTML heading creation and aligned settings UI with Obsidian's `Setting.setHeading()` API.
- Removed deferred-view API usage to keep compatibility with the declared minimum app version.
- Added the official Obsidian ESLint plugin and its recommended rules.
- GitHub CI and release workflows now run lint checks before building.
- Async DOM event handlers are wrapped so they do not return promises to the browser event system.

### Expected scan disclosures

Folder Cover Wall intentionally enumerates vault files only when the user opens the vault-image picker, because that picker needs to list available images. External covers are stored locally and use base64/data-URL conversion internally; the plugin does not upload cover images or make network requests.

### Compatibility

All folder navigation, cover management, rename migration, storage management, and 0.6.x memory optimizations remain unchanged.
