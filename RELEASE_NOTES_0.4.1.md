# Folder Cover Wall 0.4.1

This maintenance release addresses the automated Community Directory review findings from the initial 0.4.0 submission.

## Fixes

- Updated the manifest description to follow directory guidelines.
- Renamed the internal settings property to avoid a collision with a newer core API while keeping the existing minimum app version.
- Removed leaf detachment during plugin unload so sidebar placement is preserved.
- Replaced the deprecated `builtin-modules` development dependency.

No intended user-facing behavior changes.
