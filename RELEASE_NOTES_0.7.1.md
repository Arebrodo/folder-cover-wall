## Folder Cover Wall 0.7.1

This maintenance release focuses on Community Directory code-quality cleanup and forward compatibility.

### Improvements

- Added declarative settings definitions for Obsidian 1.13+ while keeping the legacy settings UI for older supported versions.
- Updated DOM type checks to use Obsidian's cross-window-safe `instanceOf` helper.
- Removed deprecated slider tooltip calls.
- Simplified command IDs and command names to follow current plugin guidance.
- Removed redundant MIME typing, unused constants, empty catch bindings, and an unnecessary `await`.
- Removed unnecessary CSS `!important` declarations.

No intended changes to folder cover behavior or the v0.6 memory optimizations.
