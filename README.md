# Folder Cover Wall

By [Arebrodo](https://github.com/Arebrodo) · [中文说明](./README.zh-CN.md)

Folder Cover Wall turns Obsidian's sidebar into a visual folder browser. Each folder is represented by a large cover card, while notes and other files remain available inside the selected folder.

![Folder Cover Wall screenshot](./assets/screenshot.png)

## Features

- Browse folders as large visual cover cards in the left sidebar.
- Navigate through nested folders without opening a separate dashboard in the main editor area.
- Keep notes and files accessible below the folder wall.
- Choose a cover image from anywhere inside the current vault.
- Choose an external image from elsewhere on the computer.
- Automatically use `cover.jpg`, `cover.png`, `.folder-cover.jpg`, and similar filenames.
- Optionally use the first image directly inside a folder as its cover.
- Use a generated fallback cover when no image is available.
- Configure root folder, card width, aspect ratio, folder/file counts, and file visibility.


### Rename-safe covers and storage management

Folder cover assignments follow folder renames automatically, including nested folders. External images copied into plugin data can be reviewed and deleted from **Settings → Folder Cover Wall → External cover storage → Manage** or from the command palette with **Manage external cover storage**.

The manager shows total embedded storage, image usage, orphaned mappings, and cleanup controls. Reusing the same external image across multiple folders stores only one copy.

## Installation

### Community Plugins

After the plugin is accepted into the Obsidian Community directory:

1. Open **Settings → Community plugins → Browse**.
2. Search for **Folder Cover Wall**.
3. Install and enable it.

### Manual installation

Copy these files into:

```text
<Vault>/.obsidian/plugins/folder-cover-wall/
```

Required files:

```text
main.js
manifest.json
styles.css
```

Reload Obsidian, then enable **Folder Cover Wall** under Community plugins.

## Usage

Open the Command Palette and run either:

- **Folder Cover Wall: Open Folder Cover Wall**
- **Folder Cover Wall: Replace current left sidebar view with Folder Cover Wall**

You can also enable **Replace left pane automatically** in the plugin settings.

### Set a folder cover

Right-click a folder card and choose one of the following:

- **Choose cover from vault…** — use an image already stored in the vault.
- **Choose external image…** — use an image selected from the operating system file picker.
- **Clear custom cover** — return to automatic cover selection.

### Automatic cover priority

The plugin chooses a cover in this order:

1. Manually selected external or vault image.
2. A configured cover filename such as `cover.jpg` or `cover.png`.
3. The first image directly inside the folder, if enabled.
4. A generated fallback cover.

## External images and privacy

External images are read locally and stored as embedded image data in the plugin's `data.json`. The plugin does not upload these images anywhere. Because the image data is embedded, moving or renaming the original image does not break the cover.

Very large images can make `data.json` large. The plugin shows a warning for source images above approximately 12 MB.

## Development

Requirements:

- Node.js 18 or newer.
- npm.

Install dependencies:

```bash
npm install
```

Start a development build:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

The production build outputs `main.js` in the repository root.

## Repository

GitHub: https://github.com/Arebrodo/folder-cover-wall

Issues: https://github.com/Arebrodo/folder-cover-wall/issues

## Releasing

See [RELEASING.md](./RELEASING.md). The repository includes a GitHub Actions workflow that can create a release automatically when you push a tag such as `0.5.0`.

## License

MIT. See [LICENSE](./LICENSE).
