const {
  ItemView,
  Plugin,
  PluginSettingTab,
  Setting,
  TFolder,
  TFile,
  FuzzySuggestModal,
  Menu,
  Notice,
  normalizePath,
  setIcon,
} = require('obsidian');

const VIEW_TYPE_FOLDER_COVER_WALL = 'folder-cover-wall-view';

const DEFAULT_SETTINGS = {
  rootPath: '',
  autoReplaceLeftPane: false,
  cardMinWidth: 180,
  cardAspectRatio: '16 / 9',
  showChildCount: true,
  showFileCount: false,
  showFiles: true,
  autoUseFirstImage: true,
  coverFileNames: 'cover.jpg,cover.jpeg,cover.png,cover.webp,.folder-cover.jpg,.folder-cover.png,.folder-cover.webp',
  customCovers: {},
};

function imageExtensions() {
  return new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg']);
}

function isImageFile(file) {
  return file instanceof TFile && imageExtensions().has((file.extension || '').toLowerCase());
}

function stableHue(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

class ImageFileSuggestModal extends FuzzySuggestModal {
  constructor(app, onChoose) {
    super(app);
    this.onChoose = onChoose;
    this.setPlaceholder('Choose an image from this vault…');
  }

  getItems() {
    return this.app.vault.getFiles().filter(isImageFile);
  }

  getItemText(file) {
    return file.path;
  }

  onChooseItem(file) {
    this.onChoose(file);
  }
}

class FolderCoverWallView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentPath = plugin.pluginSettings.rootPath || '';
    this.boundRefresh = () => this.refresh();
  }

  getViewType() {
    return VIEW_TYPE_FOLDER_COVER_WALL;
  }

  getDisplayText() {
    return 'Folder Cover Wall';
  }

  getIcon() {
    return 'layout-grid';
  }

  async onOpen() {
    this.contentEl.addClass('fcw-view');
    this.registerEvent(this.app.vault.on('create', this.boundRefresh));
    this.registerEvent(this.app.vault.on('delete', this.boundRefresh));
    this.registerEvent(this.app.vault.on('rename', this.boundRefresh));
    await this.refresh();
  }

  async onClose() {
    this.contentEl.empty();
  }

  resolveFolder(path) {
    const normalized = normalizePath(path || '');
    if (!normalized) return this.app.vault.getRoot();
    const target = this.app.vault.getAbstractFileByPath(normalized);
    return target instanceof TFolder ? target : null;
  }

  rootFolder() {
    return this.resolveFolder(this.plugin.pluginSettings.rootPath) || this.app.vault.getRoot();
  }

  ensurePathInsideRoot(path) {
    const root = this.rootFolder();
    if (!root || root.path === '/') return path;
    if (!path) return root.path;
    if (path === root.path || path.startsWith(root.path + '/')) return path;
    return root.path;
  }

  async navigate(path) {
    this.currentPath = this.ensurePathInsideRoot(path);
    await this.refresh();
  }

  countFolder(folder) {
    let folders = 0;
    let files = 0;
    for (const child of folder.children) {
      if (child instanceof TFolder) folders++;
      else if (child instanceof TFile) files++;
    }
    return { folders, files };
  }

  async findCoverSource(folder) {
    const custom = this.plugin.pluginSettings.customCovers[folder.path];

    // Backward compatibility with v0.1-v0.3, where a custom cover was stored
    // as a plain vault-relative path string.
    if (typeof custom === 'string' && custom) {
      const customFile = this.app.vault.getAbstractFileByPath(normalizePath(custom));
      if (isImageFile(customFile)) {
        return { src: this.app.vault.getResourcePath(customFile), kind: 'vault', name: customFile.name };
      }
    }

    // v0.4+ stores richer cover descriptors. External images are embedded as
    // data URLs so they keep working even if the original OS file is moved.
    if (custom && typeof custom === 'object') {
      if (custom.type === 'external' && typeof custom.dataUrl === 'string' && custom.dataUrl.startsWith('data:image/')) {
        return { src: custom.dataUrl, kind: 'external', name: custom.name || 'External image' };
      }
      if (custom.type === 'vault' && custom.path) {
        const customFile = this.app.vault.getAbstractFileByPath(normalizePath(custom.path));
        if (isImageFile(customFile)) {
          return { src: this.app.vault.getResourcePath(customFile), kind: 'vault', name: customFile.name };
        }
      }
    }

    const names = this.plugin.pluginSettings.coverFileNames
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    for (const name of names) {
      const candidate = this.app.vault.getAbstractFileByPath(normalizePath(`${folder.path}/${name}`));
      if (isImageFile(candidate)) {
        return { src: this.app.vault.getResourcePath(candidate), kind: 'auto', name: candidate.name };
      }
    }

    if (this.plugin.pluginSettings.autoUseFirstImage) {
      const firstImage = folder.children
        .filter(isImageFile)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))[0];
      if (firstImage) {
        return { src: this.app.vault.getResourcePath(firstImage), kind: 'auto', name: firstImage.name };
      }
    }

    return null;
  }

  readExternalImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string' && result.startsWith('data:image/')) resolve(result);
        else reject(new Error('The selected file could not be read as an image.'));
      };
      reader.onerror = () => reject(reader.error || new Error('Failed to read the selected image.'));
      reader.readAsDataURL(file);
    });
  }

  async chooseExternalCover(folder) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;

      try {
        // Very large images work, but embedding them in data.json makes the
        // plugin settings unnecessarily heavy. Warn without blocking the user.
        if (file.size > 12 * 1024 * 1024) {
          new Notice('Large image selected. The cover will work, but the plugin data file may become large.');
        }

        const dataUrl = await this.readExternalImageAsDataUrl(file);
        this.plugin.pluginSettings.customCovers[folder.path] = {
          type: 'external',
          name: file.name,
          mime: file.type || 'image/*',
          size: file.size,
          dataUrl,
        };
        await this.plugin.saveSettings();
        await this.refresh();
        new Notice(`External cover set for ${folder.name}`);
      } catch (error) {
        console.error('Folder Cover Wall: failed to load external cover', error);
        new Notice('Could not use that image as a folder cover.');
      }
    }, { once: true });

    // Chromium/Electron opens the operating-system file picker here, so the
    // selected image may live anywhere on the computer, not only in the vault.
    input.click();
  }

  createToolbar(container, folder) {
    const toolbar = container.createDiv({ cls: 'fcw-toolbar' });

    const backButton = toolbar.createEl('button', {
      cls: 'fcw-icon-button',
      attr: { 'aria-label': 'Go to parent folder', type: 'button' },
    });
    setIcon(backButton, 'arrow-left');

    const root = this.rootFolder();
    const atRoot = !folder || folder.path === root.path;
    backButton.disabled = atRoot;
    backButton.addEventListener('click', async () => {
      if (!folder || !folder.parent || atRoot) return;
      const parentPath = folder.parent.path === '/' ? '' : folder.parent.path;
      await this.navigate(parentPath);
    });

    const location = toolbar.createDiv({
      cls: 'fcw-location',
      attr: { title: folder?.path || this.app.vault.getName() },
    });
    const locationName = folder && folder.path !== '/'
      ? folder.name
      : this.app.vault.getName();
    location.createDiv({ cls: 'fcw-location-name', text: locationName });
    if (!atRoot) {
      location.createDiv({ cls: 'fcw-location-hint', text: 'Click to return to root' });
      location.addEventListener('click', () => this.navigate(root.path === '/' ? '' : root.path));
      location.setAttribute('role', 'button');
      location.setAttribute('tabindex', '0');
      location.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          this.navigate(root.path === '/' ? '' : root.path);
        }
      });
    }

    const refreshButton = toolbar.createEl('button', {
      cls: 'fcw-icon-button',
      attr: { 'aria-label': 'Refresh folder wall', type: 'button' },
    });
    setIcon(refreshButton, 'refresh-cw');
    refreshButton.addEventListener('click', () => this.refresh());
  }

  fileIconName(file) {
    const ext = (file.extension || '').toLowerCase();
    if (ext === 'md') return 'file-text';
    if (ext === 'canvas') return 'layout-dashboard';
    if (ext === 'pdf') return 'file-text';
    if (imageExtensions().has(ext)) return 'image';
    return 'file';
  }

  async openFile(file) {
    let leaf = null;
    const markdownLeaves = this.app.workspace.getLeavesOfType('markdown');
    if (markdownLeaves && markdownLeaves.length) leaf = markdownLeaves[0];
    if (!leaf || leaf === this.leaf) {
      try {
        leaf = this.app.workspace.getLeaf('tab');
      } catch (_) {
        leaf = this.app.workspace.getLeaf(true);
      }
    }
    if (!leaf) return;
    await leaf.openFile(file, { active: true });
    try { await this.app.workspace.revealLeaf(leaf); } catch (_) {}
  }

  createFileSection(container, files) {
    if (!this.plugin.pluginSettings.showFiles || !files.length) return;

    const section = container.createDiv({ cls: 'fcw-files-section' });
    const heading = section.createDiv({ cls: 'fcw-section-heading' });
    heading.createSpan({ text: '笔记与文件' });
    heading.createSpan({ cls: 'fcw-section-count', text: String(files.length) });

    const list = section.createDiv({ cls: 'fcw-file-list' });
    for (const file of files) {
      const row = list.createDiv({
        cls: 'fcw-file-row',
        attr: { role: 'button', tabindex: '0', title: file.path },
      });
      const icon = row.createDiv({ cls: 'fcw-file-icon' });
      setIcon(icon, this.fileIconName(file));

      const text = row.createDiv({ cls: 'fcw-file-text' });
      text.createDiv({ cls: 'fcw-file-name', text: file.basename || file.name });
      if (file.extension && file.extension.toLowerCase() !== 'md') {
        text.createDiv({ cls: 'fcw-file-ext', text: file.extension.toUpperCase() });
      }

      const open = () => this.openFile(file);
      row.addEventListener('click', open);
      row.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          open();
        }
      });
    }
  }

  async createFolderCard(grid, folder) {
    // Deliberately use a div instead of a button. Some Obsidian themes impose
    // fixed heights on generic buttons, which clipped the original v0.1 cards.
    const card = grid.createDiv({
      cls: 'fcw-card',
      attr: {
        role: 'button',
        tabindex: '0',
        'aria-label': `Open folder ${folder.name}`,
      },
    });

    card.style.setProperty('--fcw-card-min-width', `${this.plugin.pluginSettings.cardMinWidth}px`);
    card.style.setProperty('--fcw-aspect-ratio', this.plugin.pluginSettings.cardAspectRatio);
    card.style.setProperty('--fcw-folder-hue', `${stableHue(folder.path || folder.name)}`);

    const coverWrap = card.createDiv({ cls: 'fcw-cover' });
    const coverSource = await this.findCoverSource(folder);

    if (coverSource) {
      const img = coverWrap.createEl('img', {
        cls: 'fcw-cover-image',
        attr: { alt: `${folder.name} cover`, loading: 'lazy' },
      });
      img.src = coverSource.src;
      img.title = coverSource.kind === 'external' ? `External cover: ${coverSource.name}` : coverSource.name;
    } else {
      const fallback = coverWrap.createDiv({ cls: 'fcw-cover-fallback' });
      const icon = fallback.createDiv({ cls: 'fcw-folder-icon' });
      setIcon(icon, 'folder');
      fallback.createDiv({
        cls: 'fcw-fallback-letter',
        text: folder.name.trim().slice(0, 1).toUpperCase() || '•',
      });
    }

    const overlay = coverWrap.createDiv({ cls: 'fcw-cover-overlay' });
    overlay.createDiv({ cls: 'fcw-card-title', text: folder.name });

    const counts = this.countFolder(folder);
    const metaParts = [];
    if (this.plugin.pluginSettings.showChildCount) metaParts.push(`${counts.folders} folders`);
    if (this.plugin.pluginSettings.showFileCount) metaParts.push(`${counts.files} files`);
    if (metaParts.length) overlay.createDiv({ cls: 'fcw-card-meta', text: metaParts.join(' · ') });

    const open = async () => this.navigate(folder.path);
    card.addEventListener('click', open);
    card.addEventListener('keydown', async (evt) => {
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        await open();
      }
    });

    card.addEventListener('contextmenu', (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      this.openFolderMenu(evt, folder);
    });
  }

  openFolderMenu(evt, folder) {
    const menu = new Menu();

    menu.addItem((item) => {
      item.setTitle('Choose cover from vault…').setIcon('image').onClick(() => {
        new ImageFileSuggestModal(this.app, async (file) => {
          this.plugin.pluginSettings.customCovers[folder.path] = { type: 'vault', path: file.path };
          await this.plugin.saveSettings();
          await this.refresh();
          new Notice(`Vault cover set for ${folder.name}`);
        }).open();
      });
    });

    menu.addItem((item) => {
      item.setTitle('Choose external image…').setIcon('folder-open').onClick(() => {
        this.chooseExternalCover(folder);
      });
    });

    if (this.plugin.pluginSettings.customCovers[folder.path]) {
      menu.addItem((item) => {
        item.setTitle('Clear custom cover').setIcon('x').onClick(async () => {
          delete this.plugin.pluginSettings.customCovers[folder.path];
          await this.plugin.saveSettings();
          await this.refresh();
        });
      });
    }

    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle('Open folder').setIcon('folder-open').onClick(() => this.navigate(folder.path));
    });

    menu.showAtMouseEvent(evt);
  }

  async refresh() {
    if (!this.contentEl) return;
    this.contentEl.empty();

    const root = this.rootFolder();
    this.currentPath = this.ensurePathInsideRoot(this.currentPath || root.path);
    const folder = this.resolveFolder(this.currentPath) || root;
    this.currentPath = folder.path;

    const shell = this.contentEl.createDiv({ cls: 'fcw-shell' });
    this.createToolbar(shell, folder);

    const folderChildren = folder.children
      .filter((child) => child instanceof TFolder)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const files = folder.children
      .filter((child) => child instanceof TFile)
      .filter((file) => {
        const lower = file.name.toLowerCase();
        const coverNames = this.plugin.pluginSettings.coverFileNames
          .split(',')
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean);
        return !coverNames.includes(lower);
      })
      .sort((a, b) => {
        const aMd = (a.extension || '').toLowerCase() === 'md' ? 0 : 1;
        const bMd = (b.extension || '').toLowerCase() === 'md' ? 0 : 1;
        if (aMd !== bMd) return aMd - bMd;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });

    if (folderChildren.length) {
      const grid = shell.createDiv({ cls: 'fcw-grid' });
      grid.style.setProperty('--fcw-card-min-width', `${this.plugin.pluginSettings.cardMinWidth}px`);
      for (const child of folderChildren) {
        await this.createFolderCard(grid, child);
      }
    }

    this.createFileSection(shell, files);

    if (folderChildren.length === 0 && (!this.plugin.pluginSettings.showFiles || files.length === 0)) {
      const empty = shell.createDiv({ cls: 'fcw-empty' });
      const icon = empty.createDiv({ cls: 'fcw-empty-icon' });
      setIcon(icon, 'folder-open');
      empty.createDiv({ cls: 'fcw-empty-title', text: '这个文件夹是空的' });
      empty.createDiv({ cls: 'fcw-empty-desc', text: '使用返回按钮进入上一级目录。' });
    }
  }

}

class FolderCoverWallSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Root folder')
      .setDesc('Leave empty to show the whole vault. Example: Projects/Research')
      .addText((text) => text
        .setPlaceholder('')
        .setValue(this.plugin.pluginSettings.rootPath)
        .onChange(async (value) => {
          this.plugin.pluginSettings.rootPath = normalizePath(value.trim());
          await this.plugin.saveSettings();
          this.plugin.refreshOpenViews();
        }));

    new Setting(containerEl)
      .setName('Replace left pane automatically')
      .setDesc('When Obsidian finishes loading, show Folder Cover Wall in the current left sidebar leaf.')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.pluginSettings.autoReplaceLeftPane)
        .onChange(async (value) => {
          this.plugin.pluginSettings.autoReplaceLeftPane = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Card minimum width')
      .setDesc('Larger values create fewer, larger folder covers.')
      .addSlider((slider) => slider
        .setLimits(120, 360, 10)
        .setDynamicTooltip()
        .setValue(this.plugin.pluginSettings.cardMinWidth)
        .onChange(async (value) => {
          this.plugin.pluginSettings.cardMinWidth = value;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenViews();
        }));

    new Setting(containerEl)
      .setName('Card aspect ratio')
      .setDesc('Examples: 16 / 9, 4 / 3, 1 / 1, 3 / 4')
      .addText((text) => text
        .setValue(this.plugin.pluginSettings.cardAspectRatio)
        .onChange(async (value) => {
          this.plugin.pluginSettings.cardAspectRatio = value.trim() || '16 / 9';
          await this.plugin.saveSettings();
          this.plugin.refreshOpenViews();
        }));

    new Setting(containerEl)
      .setName('Automatically use first image in folder')
      .setDesc('If no custom cover or cover.jpg/png exists, use the first image directly inside that folder before falling back to a generated cover.')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.pluginSettings.autoUseFirstImage)
        .onChange(async (value) => {
          this.plugin.pluginSettings.autoUseFirstImage = value;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenViews();
        }));

    new Setting(containerEl)
      .setName('Show child-folder count')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.pluginSettings.showChildCount)
        .onChange(async (value) => {
          this.plugin.pluginSettings.showChildCount = value;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenViews();
        }));

    new Setting(containerEl)
      .setName('Show file count')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.pluginSettings.showFileCount)
        .onChange(async (value) => {
          this.plugin.pluginSettings.showFileCount = value;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenViews();
        }));

    new Setting(containerEl)
      .setName('Show notes and files')
      .setDesc('Show the files inside the current folder below the folder cover wall. Markdown notes appear first.')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.pluginSettings.showFiles)
        .onChange(async (value) => {
          this.plugin.pluginSettings.showFiles = value;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenViews();
        }));

    new Setting(containerEl)
      .setName('Automatic cover file names')
      .setDesc('Comma-separated. If a folder contains one of these files, it becomes the cover automatically.')
      .addTextArea((text) => text
        .setValue(this.plugin.pluginSettings.coverFileNames)
        .onChange(async (value) => {
          this.plugin.pluginSettings.coverFileNames = value;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenViews();
        }));
  }
}

module.exports = class FolderCoverWallPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_FOLDER_COVER_WALL, (leaf) => new FolderCoverWallView(leaf, this));

    this.addCommand({
      id: 'open-folder-cover-wall',
      name: 'Open Folder Cover Wall',
      callback: () => this.activateView(false),
    });

    this.addCommand({
      id: 'replace-left-file-browser-with-folder-cover-wall',
      name: 'Replace current left sidebar view with Folder Cover Wall',
      callback: () => this.activateView(true),
    });

    this.addSettingTab(new FolderCoverWallSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      if (this.pluginSettings.autoReplaceLeftPane) this.activateView(true);
    });
  }

  async loadSettings() {
    this.pluginSettings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!this.pluginSettings.customCovers) this.pluginSettings.customCovers = {};
    if (typeof this.pluginSettings.autoUseFirstImage !== 'boolean') this.pluginSettings.autoUseFirstImage = true;
    if (typeof this.pluginSettings.showFiles !== 'boolean') this.pluginSettings.showFiles = true;
  }

  async saveSettings() {
    await this.saveData(this.pluginSettings);
  }

  async activateView(replaceCurrentLeftLeaf = false) {
    let leaf = null;

    if (replaceCurrentLeftLeaf) leaf = this.app.workspace.getLeftLeaf(false);

    if (!leaf) {
      const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_COVER_WALL)[0];
      if (existing) leaf = existing;
    }

    if (!leaf) leaf = this.app.workspace.getLeftLeaf(false) || this.app.workspace.getLeftLeaf(true);

    if (!leaf) {
      new Notice('Could not open Folder Cover Wall in the left sidebar.');
      return;
    }

    await leaf.setViewState({ type: VIEW_TYPE_FOLDER_COVER_WALL, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  async refreshOpenViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_COVER_WALL);
    for (const leaf of leaves) {
      try {
        if (leaf.loadIfDeferred) await leaf.loadIfDeferred();
      } catch (_) {}
      const view = leaf.view;
      if (view instanceof FolderCoverWallView) await view.refresh();
    }
  }
};
