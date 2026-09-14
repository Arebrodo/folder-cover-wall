# Folder Cover Wall 0.6.1

This maintenance release fixes duplicate sidebar tabs that could accumulate after restarting the app.

## Fixes

- Reuses an existing restored Folder Cover Wall sidebar view instead of creating/replacing another leaf at startup.
- Automatically removes duplicate Folder Cover Wall tabs left behind by affected previous sessions.
- Keeps the v0.6.0 low-memory image pipeline unchanged.

If you already see several Folder Cover Wall icons in the sidebar, update to 0.6.1 and restart once. The duplicates should be cleaned automatically.
