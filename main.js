"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Folder Cover Wall source.
const obsidian_1 = require("obsidian");
const VIEW_TYPE_FOLDER_COVER_WALL = 'folder-cover-wall-view';
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);
const MAX_EXTERNAL_SOURCE_BYTES = 32 * 1024 * 1024;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isSupportedDataUrl(value) {
    return /^data:image\/(?:jpeg|png|webp);base64,/i.test(value);
}
function isSupportedImageMime(value) {
    return value === 'image/jpeg' || value === 'image/png' || value === 'image/webp';
}
function mimeFromDataUrl(dataUrl) {
    if (dataUrl.startsWith('data:image/jpeg;'))
        return 'image/jpeg';
    if (dataUrl.startsWith('data:image/png;'))
        return 'image/png';
    return 'image/webp';
}
function optionalFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
function parseCustomCover(value) {
    if (typeof value === 'string' && value.length > 0)
        return value;
    if (!isRecord(value))
        return null;
    if (value.type === 'vault' && typeof value.path === 'string' && value.path.length > 0) {
        return { type: 'vault', path: value.path };
    }
    if (value.type === 'external') {
        const imageId = typeof value.imageId === 'string' && value.imageId.length > 0 ? value.imageId : undefined;
        const dataUrl = typeof value.dataUrl === 'string' && isSupportedDataUrl(value.dataUrl) ? value.dataUrl : undefined;
        if (!imageId && !dataUrl)
            return null;
        return {
            type: 'external',
            imageId,
            dataUrl,
            name: typeof value.name === 'string' ? value.name : undefined,
            mime: typeof value.mime === 'string' ? value.mime : undefined,
            size: optionalFiniteNumber(value.size),
        };
    }
    return null;
}
function parseExternalImageRecord(value) {
    var _a, _b;
    if (!isRecord(value) || typeof value.dataUrl !== 'string' || !isSupportedDataUrl(value.dataUrl))
        return null;
    const mime = typeof value.mime === 'string' && isSupportedImageMime(value.mime)
        ? value.mime
        : mimeFromDataUrl(value.dataUrl);
    return {
        name: typeof value.name === 'string' && value.name.length > 0 ? value.name : 'External image',
        mime,
        originalSize: (_a = optionalFiniteNumber(value.originalSize)) !== null && _a !== void 0 ? _a : estimateDataUrlBytes(value.dataUrl),
        storedSize: optionalFiniteNumber(value.storedSize),
        width: optionalFiniteNumber(value.width),
        height: optionalFiniteNumber(value.height),
        sourceWidth: optionalFiniteNumber(value.sourceWidth),
        sourceHeight: optionalFiniteNumber(value.sourceHeight),
        optimizedVersion: optionalFiniteNumber(value.optimizedVersion),
        optimizationMaxDimension: optionalFiniteNumber(value.optimizationMaxDimension),
        optimizationQuality: optionalFiniteNumber(value.optimizationQuality),
        optimizedAt: optionalFiniteNumber(value.optimizedAt),
        dataUrl: value.dataUrl,
        addedAt: (_b = optionalFiniteNumber(value.addedAt)) !== null && _b !== void 0 ? _b : Date.now(),
    };
}
function parseStoredSettings(raw) {
    const source = isRecord(raw) ? raw : {};
    const customCovers = {};
    const externalImages = {};
    if (isRecord(source.customCovers)) {
        for (const [folderPath, rawCover] of Object.entries(source.customCovers)) {
            const cover = parseCustomCover(rawCover);
            if (cover)
                customCovers[folderPath] = cover;
        }
    }
    if (isRecord(source.externalImages)) {
        for (const [imageId, rawImage] of Object.entries(source.externalImages)) {
            const image = parseExternalImageRecord(rawImage);
            if (image)
                externalImages[imageId] = image;
        }
    }
    const numberOr = (key, fallback) => { var _a; return (_a = optionalFiniteNumber(source[key])) !== null && _a !== void 0 ? _a : fallback; };
    const booleanOr = (key, fallback) => typeof source[key] === 'boolean' ? source[key] : fallback;
    const stringOr = (key, fallback) => typeof source[key] === 'string' ? source[key] : fallback;
    return {
        rootPath: stringOr('rootPath', DEFAULT_SETTINGS.rootPath),
        autoReplaceLeftPane: booleanOr('autoReplaceLeftPane', DEFAULT_SETTINGS.autoReplaceLeftPane),
        cardMinWidth: numberOr('cardMinWidth', DEFAULT_SETTINGS.cardMinWidth),
        cardAspectRatio: stringOr('cardAspectRatio', DEFAULT_SETTINGS.cardAspectRatio),
        showChildCount: booleanOr('showChildCount', DEFAULT_SETTINGS.showChildCount),
        showFileCount: booleanOr('showFileCount', DEFAULT_SETTINGS.showFileCount),
        showFiles: booleanOr('showFiles', DEFAULT_SETTINGS.showFiles),
        autoUseFirstImage: booleanOr('autoUseFirstImage', DEFAULT_SETTINGS.autoUseFirstImage),
        coverFileNames: stringOr('coverFileNames', DEFAULT_SETTINGS.coverFileNames),
        coverMaxDimension: numberOr('coverMaxDimension', DEFAULT_SETTINGS.coverMaxDimension),
        coverWebpQuality: numberOr('coverWebpQuality', DEFAULT_SETTINGS.coverWebpQuality),
        optimizeVaultCovers: booleanOr('optimizeVaultCovers', DEFAULT_SETTINGS.optimizeVaultCovers),
        lazyLoadCovers: booleanOr('lazyLoadCovers', DEFAULT_SETTINGS.lazyLoadCovers),
        customCovers,
        externalImages,
    };
}
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
    coverMaxDimension: 768,
    coverWebpQuality: 80,
    optimizeVaultCovers: true,
    lazyLoadCovers: true,
    customCovers: {},
    externalImages: {},
};
function imageExtensions() {
    return SUPPORTED_IMAGE_EXTENSIONS;
}
function isImageFile(file) {
    return file instanceof obsidian_1.TFile && imageExtensions().has((file.extension || '').toLowerCase());
}
function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024)
        return `${value} B`;
    const units = ['KB', 'MB', 'GB'];
    let size = value / 1024;
    let unit = units[0];
    for (let i = 1; i < units.length && size >= 1024; i++) {
        size /= 1024;
        unit = units[i];
    }
    return `${size >= 10 ? size.toFixed(1) : size.toFixed(2)} ${unit}`;
}
function estimateDataUrlBytes(dataUrl) {
    if (typeof dataUrl !== 'string')
        return 0;
    const comma = dataUrl.indexOf(',');
    if (comma < 0)
        return dataUrl.length;
    const payload = dataUrl.slice(comma + 1);
    if (!/;base64,/i.test(dataUrl.slice(0, comma + 1)))
        return payload.length;
    const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor(payload.length * 3 / 4) - padding);
}
function hashText(text) {
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        h1 ^= code;
        h1 = Math.imul(h1, 0x01000193);
        h2 ^= code + ((i & 255) << 8);
        h2 = Math.imul(h2, 0x85ebca6b);
    }
    return `${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}${text.length.toString(36)}`;
}
function mimeFromName(name) {
    var _a;
    const ext = (_a = String(name || '').split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg')
        return 'image/jpeg';
    if (ext === 'png')
        return 'image/png';
    if (ext === 'webp')
        return 'image/webp';
    return 'application/octet-stream';
}
function dataUrlToBlob(dataUrl) {
    if (!isSupportedDataUrl(dataUrl))
        throw new Error('Unsupported image data URL.');
    const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
    if (!match)
        throw new Error('Invalid image data URL.');
    const mime = match[1] || 'application/octet-stream';
    const isBase64 = Boolean(match[2]);
    const payload = match[3] || '';
    if (!isBase64) {
        return new Blob([decodeURIComponent(payload)], { type: mime });
    }
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
        bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}
function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string'
            ? resolve(reader.result)
            : reject(new Error('Could not encode optimized cover image.'));
        reader.onerror = () => reject(reader.error || new Error('Could not encode optimized cover image.'));
        reader.readAsDataURL(blob);
    });
}
async function decodeImageBlob(blob) {
    if (typeof createImageBitmap === 'function') {
        try {
            const bitmap = await createImageBitmap(blob);
            return {
                source: bitmap,
                width: bitmap.width,
                height: bitmap.height,
                cleanup: () => bitmap.close(),
            };
        }
        catch (_a) {
            // Fall back to the HTMLImageElement decoder below.
        }
    }
    const url = URL.createObjectURL(blob);
    try {
        const image = createEl('img');
        image.decoding = 'async';
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(new Error('Could not decode the selected image.'));
            image.src = url;
        });
        return {
            source: image,
            width: image.naturalWidth || image.width,
            height: image.naturalHeight || image.height,
            cleanup: () => {
                image.src = '';
                URL.revokeObjectURL(url);
            },
        };
    }
    catch (error) {
        URL.revokeObjectURL(url);
        throw error;
    }
}
async function optimizeBlobToWebp(blob, maxDimension = 768, qualityPercent = 80) {
    const decoded = await decodeImageBlob(blob);
    const sourceWidth = Math.max(1, Number(decoded.width) || 1);
    const sourceHeight = Math.max(1, Number(decoded.height) || 1);
    const longest = Math.max(sourceWidth, sourceHeight);
    const limit = Math.max(256, Number(maxDimension) || 768);
    const scale = Math.min(1, limit / longest);
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const quality = Math.min(0.95, Math.max(0.45, (Number(qualityPercent) || 80) / 100));
    const canvas = createEl('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
        decoded.cleanup();
        throw new Error('Could not create an image canvas.');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(decoded.source, 0, 0, width, height);
    try {
        let output = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
        if (!output) {
            const fallbackUrl = canvas.toDataURL('image/webp', quality);
            output = dataUrlToBlob(fallbackUrl);
        }
        return {
            blob: output,
            width,
            height,
            sourceWidth,
            sourceHeight,
        };
    }
    finally {
        decoded.cleanup();
        // Explicitly release the potentially large canvas backing store.
        canvas.width = 1;
        canvas.height = 1;
    }
}
function rewritePath(path, oldPath, newPath, includeDescendants) {
    if (typeof path !== 'string' || !path)
        return path;
    if (path === oldPath)
        return newPath;
    if (includeDescendants && path.startsWith(`${oldPath}/`)) {
        return `${newPath}${path.slice(oldPath.length)}`;
    }
    return path;
}
function stableHue(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 360;
}
class ImageFileSuggestModal extends obsidian_1.FuzzySuggestModal {
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
    onChooseItem(file, _evt) {
        void this.onChoose(file);
    }
}
class FolderCoverWallView extends obsidian_1.ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.currentPath = plugin.pluginSettings.rootPath || '';
        this.boundRefresh = () => { void this.refresh(); };
        this.coverObserver = null;
        this.pendingCoverSources = new WeakMap();
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
        await this.refresh();
    }
    async onClose() {
        this.releaseRenderedCovers();
        this.contentEl.empty();
    }
    releaseRenderedCovers() {
        if (this.coverObserver) {
            this.coverObserver.disconnect();
            this.coverObserver = null;
        }
        this.pendingCoverSources = new WeakMap();
        for (const img of this.contentEl.querySelectorAll('img.fcw-cover-image')) {
            try {
                img.removeAttribute('src');
                img.src = '';
            }
            catch (_a) {
                // Fall back to the HTMLImageElement decoder below.
            }
        }
    }
    ensureCoverObserver() {
        if (this.coverObserver || !this.plugin.pluginSettings.lazyLoadCovers || typeof IntersectionObserver === 'undefined')
            return;
        this.coverObserver = new IntersectionObserver((entries) => {
            var _a;
            for (const entry of entries) {
                if (!entry.isIntersecting)
                    continue;
                const target = entry.target;
                (_a = this.coverObserver) === null || _a === void 0 ? void 0 : _a.unobserve(target);
                const source = this.pendingCoverSources.get(target);
                this.pendingCoverSources.delete(target);
                if (source && target.instanceOf(HTMLImageElement))
                    void this.hydrateCoverImage(target, source);
            }
        }, { root: this.contentEl, rootMargin: '240px 0px', threshold: 0.01 });
    }
    scheduleCoverImage(img, source) {
        var _a;
        if (!source)
            return;
        if (!this.plugin.pluginSettings.lazyLoadCovers || typeof IntersectionObserver === 'undefined') {
            void this.hydrateCoverImage(img, source);
            return;
        }
        this.ensureCoverObserver();
        this.pendingCoverSources.set(img, source);
        (_a = this.coverObserver) === null || _a === void 0 ? void 0 : _a.observe(img);
    }
    async hydrateCoverImage(img, source) {
        try {
            img.classList.add('is-loading');
            const resolved = await this.plugin.resolveCoverDisplayUrl(source);
            if (!resolved || !img.isConnected)
                return;
            img.src = resolved;
            img.title = source.kind === 'external' ? `External cover: ${source.name || 'External image'}` : (source.name || '');
        }
        catch (error) {
            console.error('Folder Cover Wall: failed to prepare cover image', error);
        }
        finally {
            if (img.isConnected)
                img.classList.remove('is-loading');
        }
    }
    resolveFolder(path) {
        const normalized = (0, obsidian_1.normalizePath)(path || '');
        if (!normalized)
            return this.app.vault.getRoot();
        const target = this.app.vault.getAbstractFileByPath(normalized);
        return target instanceof obsidian_1.TFolder ? target : null;
    }
    rootFolder() {
        return this.resolveFolder(this.plugin.pluginSettings.rootPath) || this.app.vault.getRoot();
    }
    ensurePathInsideRoot(path) {
        const root = this.rootFolder();
        if (!root || root.path === '/')
            return path;
        if (!path)
            return root.path;
        if (path === root.path || path.startsWith(root.path + '/'))
            return path;
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
            if (child instanceof obsidian_1.TFolder)
                folders++;
            else if (child instanceof obsidian_1.TFile)
                files++;
        }
        return { folders, files };
    }
    findCoverSource(folder) {
        const custom = this.plugin.pluginSettings.customCovers[folder.path];
        // Backward compatibility with v0.1-v0.3, where a custom cover was stored
        // as a plain vault-relative path string.
        if (typeof custom === 'string' && custom) {
            const customFile = this.app.vault.getAbstractFileByPath((0, obsidian_1.normalizePath)(custom));
            if (isImageFile(customFile)) {
                return { kind: 'vault', file: customFile, name: customFile.name };
            }
        }
        if (custom && typeof custom === 'object') {
            if (custom.type === 'external' && custom.imageId) {
                const image = this.plugin.pluginSettings.externalImages[custom.imageId];
                if (image && typeof image.dataUrl === 'string' && image.dataUrl.startsWith('data:image/')) {
                    return { kind: 'external', imageId: custom.imageId, name: image.name || 'External image' };
                }
            }
            // Backward-compatible fallback for an unmigrated v0.4 record.
            if (custom.type === 'external' && typeof custom.dataUrl === 'string' && custom.dataUrl.startsWith('data:image/')) {
                return { kind: 'inline', dataUrl: custom.dataUrl, name: custom.name || 'External image' };
            }
            if (custom.type === 'vault' && custom.path) {
                const customFile = this.app.vault.getAbstractFileByPath((0, obsidian_1.normalizePath)(custom.path));
                if (isImageFile(customFile)) {
                    return { kind: 'vault', file: customFile, name: customFile.name };
                }
            }
        }
        const names = this.plugin.pluginSettings.coverFileNames
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean);
        for (const name of names) {
            const candidate = this.app.vault.getAbstractFileByPath((0, obsidian_1.normalizePath)(`${folder.path}/${name}`));
            if (isImageFile(candidate)) {
                return { kind: 'auto', file: candidate, name: candidate.name };
            }
        }
        if (this.plugin.pluginSettings.autoUseFirstImage) {
            const firstImage = folder.children
                .filter(isImageFile)
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))[0];
            if (firstImage) {
                return { kind: 'auto', file: firstImage, name: firstImage.name };
            }
        }
        return null;
    }
    chooseExternalCover(folder) {
        const input = createEl('input', { type: 'file' });
        input.accept = 'image/jpeg,image/png,image/webp';
        input.addEventListener('change', () => {
            void (async () => {
                var _a;
                const file = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
                if (!file)
                    return;
                if (file.size > MAX_EXTERNAL_SOURCE_BYTES) {
                    new obsidian_1.Notice(`Image is too large. Choose a file smaller than ${formatBytes(MAX_EXTERNAL_SOURCE_BYTES)}.`);
                    input.value = '';
                    return;
                }
                if (!isSupportedImageMime(file.type)) {
                    new obsidian_1.Notice('Unsupported image format. Use JPEG, PNG, or WebP.');
                    input.value = '';
                    return;
                }
                try {
                    new obsidian_1.Notice('Optimizing cover image…');
                    const optimized = await this.plugin.optimizeExternalFile(file);
                    const imageId = this.plugin.storeExternalImage({
                        name: file.name,
                        mime: 'image/webp',
                        originalSize: file.size,
                        storedSize: optimized.storedSize,
                        width: optimized.width,
                        height: optimized.height,
                        sourceWidth: optimized.sourceWidth,
                        sourceHeight: optimized.sourceHeight,
                        optimizedVersion: 1,
                        optimizationMaxDimension: this.plugin.pluginSettings.coverMaxDimension,
                        optimizationQuality: this.plugin.pluginSettings.coverWebpQuality,
                        dataUrl: optimized.dataUrl,
                    });
                    this.plugin.pluginSettings.customCovers[folder.path] = { type: 'external', imageId };
                    this.plugin.cleanupUnusedExternalImages();
                    await this.plugin.saveSettings();
                    await this.refresh();
                    new obsidian_1.Notice(`External cover set for ${folder.name} · ${optimized.width}×${optimized.height} · ${formatBytes(optimized.storedSize)}`);
                }
                catch (error) {
                    console.error('Folder Cover Wall: failed to optimize external cover', error);
                    new obsidian_1.Notice('Could not use that image as a folder cover.');
                }
                finally {
                    input.value = '';
                }
            })();
        }, { once: true });
        input.click();
    }
    createToolbar(container, folder) {
        const toolbar = container.createDiv({ cls: 'fcw-toolbar' });
        const backButton = toolbar.createEl('button', {
            cls: 'fcw-icon-button',
            attr: { 'aria-label': 'Go to parent folder', type: 'button' },
        });
        (0, obsidian_1.setIcon)(backButton, 'arrow-left');
        const root = this.rootFolder();
        const atRoot = !folder || folder.path === root.path;
        backButton.disabled = atRoot;
        backButton.addEventListener('click', () => {
            if (!folder.parent || atRoot)
                return;
            const parentPath = folder.parent.path === '/' ? '' : folder.parent.path;
            void this.navigate(parentPath);
        });
        const location = toolbar.createDiv({
            cls: 'fcw-location',
            attr: { title: (folder === null || folder === void 0 ? void 0 : folder.path) || this.app.vault.getName() },
        });
        const locationName = folder && folder.path !== '/'
            ? folder.name
            : this.app.vault.getName();
        location.createDiv({ cls: 'fcw-location-name', text: locationName });
        if (!atRoot) {
            location.createDiv({ cls: 'fcw-location-hint', text: 'Click to return to root' });
            location.addEventListener('click', () => { void this.navigate(root.path === '/' ? '' : root.path); });
            location.setAttribute('role', 'button');
            location.setAttribute('tabindex', '0');
            location.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter' || evt.key === ' ') {
                    evt.preventDefault();
                    void this.navigate(root.path === '/' ? '' : root.path);
                }
            });
        }
        const refreshButton = toolbar.createEl('button', {
            cls: 'fcw-icon-button',
            attr: { 'aria-label': 'Refresh folder wall', type: 'button' },
        });
        (0, obsidian_1.setIcon)(refreshButton, 'refresh-cw');
        refreshButton.addEventListener('click', () => { void this.refresh(); });
    }
    fileIconName(file) {
        const ext = (file.extension || '').toLowerCase();
        if (ext === 'md')
            return 'file-text';
        if (ext === 'canvas')
            return 'layout-dashboard';
        if (ext === 'pdf')
            return 'file-text';
        if (imageExtensions().has(ext))
            return 'image';
        return 'file';
    }
    async openFile(file) {
        let leaf = null;
        const markdownLeaves = this.app.workspace.getLeavesOfType('markdown');
        if (markdownLeaves && markdownLeaves.length)
            leaf = markdownLeaves[0];
        if (!leaf || leaf === this.leaf) {
            try {
                leaf = this.app.workspace.getLeaf('tab');
            }
            catch (_a) {
                leaf = this.app.workspace.getLeaf(true);
            }
        }
        if (!leaf)
            return;
        await leaf.openFile(file, { active: true });
        try {
            await this.app.workspace.revealLeaf(leaf);
        }
        catch (_b) {
            // The file is already open; revealing it is best-effort only.
        }
    }
    createFileSection(container, files) {
        if (!this.plugin.pluginSettings.showFiles || !files.length)
            return;
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
            (0, obsidian_1.setIcon)(icon, this.fileIconName(file));
            const text = row.createDiv({ cls: 'fcw-file-text' });
            text.createDiv({ cls: 'fcw-file-name', text: file.basename || file.name });
            if (file.extension && file.extension.toLowerCase() !== 'md') {
                text.createDiv({ cls: 'fcw-file-ext', text: file.extension.toUpperCase() });
            }
            const open = () => { void this.openFile(file); };
            row.addEventListener('click', () => open());
            row.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter' || evt.key === ' ') {
                    evt.preventDefault();
                    open();
                }
            });
        }
    }
    createFolderCard(grid, folder) {
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
        const coverSource = this.findCoverSource(folder);
        if (coverSource) {
            const img = coverWrap.createEl('img', {
                cls: 'fcw-cover-image',
                attr: { alt: `${folder.name} cover`, loading: 'lazy', decoding: 'async' },
            });
            this.scheduleCoverImage(img, coverSource);
        }
        else {
            const fallback = coverWrap.createDiv({ cls: 'fcw-cover-fallback' });
            const icon = fallback.createDiv({ cls: 'fcw-folder-icon' });
            (0, obsidian_1.setIcon)(icon, 'folder');
            fallback.createDiv({
                cls: 'fcw-fallback-letter',
                text: folder.name.trim().slice(0, 1).toUpperCase() || '•',
            });
        }
        const overlay = coverWrap.createDiv({ cls: 'fcw-cover-overlay' });
        overlay.createDiv({ cls: 'fcw-card-title', text: folder.name });
        const counts = this.countFolder(folder);
        const metaParts = [];
        if (this.plugin.pluginSettings.showChildCount)
            metaParts.push(`${counts.folders} folders`);
        if (this.plugin.pluginSettings.showFileCount)
            metaParts.push(`${counts.files} files`);
        if (metaParts.length)
            overlay.createDiv({ cls: 'fcw-card-meta', text: metaParts.join(' · ') });
        const open = () => { void this.navigate(folder.path); };
        card.addEventListener('click', () => open());
        card.addEventListener('keydown', (evt) => {
            if (evt.key === 'Enter' || evt.key === ' ') {
                evt.preventDefault();
                open();
            }
        });
        card.addEventListener('contextmenu', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            this.openFolderMenu(evt, folder);
        });
    }
    openFolderMenu(evt, folder) {
        const menu = new obsidian_1.Menu();
        menu.addItem((item) => {
            item.setTitle('Choose cover from vault…').setIcon('image').onClick(() => {
                new ImageFileSuggestModal(this.app, async (file) => {
                    this.plugin.pluginSettings.customCovers[folder.path] = { type: 'vault', path: file.path };
                    this.plugin.cleanupUnusedExternalImages();
                    await this.plugin.saveSettings();
                    await this.refresh();
                    new obsidian_1.Notice(`Vault cover set for ${folder.name}`);
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
                item.setTitle('Clear custom cover').setIcon('x').onClick(() => {
                    void (async () => {
                        delete this.plugin.pluginSettings.customCovers[folder.path];
                        this.plugin.cleanupUnusedExternalImages();
                        await this.plugin.saveSettings();
                        await this.refresh();
                    })();
                });
            });
        }
        menu.addSeparator();
        menu.addItem((item) => {
            item.setTitle('Open folder').setIcon('folder-open').onClick(() => { void this.navigate(folder.path); });
        });
        menu.showAtMouseEvent(evt);
    }
    async refresh() {
        if (!this.contentEl)
            return;
        this.releaseRenderedCovers();
        this.contentEl.empty();
        const root = this.rootFolder();
        this.currentPath = this.ensurePathInsideRoot(this.currentPath || root.path);
        const folder = this.resolveFolder(this.currentPath) || root;
        this.currentPath = folder.path;
        const shell = this.contentEl.createDiv({ cls: 'fcw-shell' });
        this.createToolbar(shell, folder);
        const folderChildren = folder.children
            .filter((child) => child instanceof obsidian_1.TFolder)
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        const files = folder.children
            .filter((child) => child instanceof obsidian_1.TFile)
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
            if (aMd !== bMd)
                return aMd - bMd;
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        });
        if (folderChildren.length) {
            const grid = shell.createDiv({ cls: 'fcw-grid' });
            grid.style.setProperty('--fcw-card-min-width', `${this.plugin.pluginSettings.cardMinWidth}px`);
            for (const child of folderChildren) {
                this.createFolderCard(grid, child);
            }
        }
        this.createFileSection(shell, files);
        if (folderChildren.length === 0 && (!this.plugin.pluginSettings.showFiles || files.length === 0)) {
            const empty = shell.createDiv({ cls: 'fcw-empty' });
            const icon = empty.createDiv({ cls: 'fcw-empty-icon' });
            (0, obsidian_1.setIcon)(icon, 'folder-open');
            empty.createDiv({ cls: 'fcw-empty-title', text: '这个文件夹是空的' });
            empty.createDiv({ cls: 'fcw-empty-desc', text: '使用返回按钮进入上一级目录。' });
        }
    }
}
class ConfirmActionModal extends obsidian_1.Modal {
    constructor(app, title, message, confirmLabel, onConfirm) {
        super(app);
        this.titleText = title;
        this.message = message;
        this.confirmLabel = confirmLabel;
        this.onConfirm = onConfirm;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.setTitle(this.titleText);
        contentEl.createEl('p', { text: this.message });
        const actions = contentEl.createDiv({ cls: 'fcw-manager-actions' });
        const cancel = actions.createEl('button', { text: 'Cancel', attr: { type: 'button' } });
        cancel.addEventListener('click', () => this.close());
        const confirm = actions.createEl('button', {
            text: this.confirmLabel,
            cls: 'mod-warning',
            attr: { type: 'button' },
        });
        confirm.addEventListener('click', () => {
            void (async () => {
                await this.onConfirm();
                this.close();
            })();
        });
    }
    onClose() {
        this.contentEl.empty();
    }
}
class ExternalCoverManagerModal extends obsidian_1.Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }
    onOpen() {
        this.setTitle('External cover storage');
        this.render();
    }
    render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('fcw-manager-modal');
        contentEl.createEl('p', {
            cls: 'setting-item-description',
            text: 'External images are copied into the plugin data so covers keep working if the original files are moved. Manage those stored copies here.',
        });
        const images = Object.entries(this.plugin.pluginSettings.externalImages || {});
        const orphanedMappings = this.plugin.getOrphanedCoverMappings();
        const totalBytes = images.reduce((sum, [, image]) => sum + this.plugin.externalImageStoredBytes(image), 0);
        const summary = contentEl.createDiv({ cls: 'fcw-manager-summary' });
        summary.createDiv({ text: `${images.length} stored image${images.length === 1 ? '' : 's'}` });
        summary.createDiv({ text: `${formatBytes(totalBytes)} embedded storage` });
        summary.createDiv({ text: `${orphanedMappings.length} orphaned mapping${orphanedMappings.length === 1 ? '' : 's'}` });
        const actions = contentEl.createDiv({ cls: 'fcw-manager-actions' });
        const optimizeStored = actions.createEl('button', { text: 'Optimize stored images', attr: { type: 'button' } });
        optimizeStored.addEventListener('click', () => {
            void (async () => {
                optimizeStored.disabled = true;
                optimizeStored.textContent = 'Optimizing…';
                const result = await this.plugin.optimizeAllExternalImages();
                const saved = Math.max(0, result.beforeBytes - result.afterBytes);
                new obsidian_1.Notice(result.optimized
                    ? `Optimized ${result.optimized} stored cover${result.optimized === 1 ? '' : 's'} and saved ${formatBytes(saved)}.`
                    : 'Stored covers are already optimized for the current settings.');
                this.render();
            })();
        });
        const cleanUnused = actions.createEl('button', { text: 'Remove unused images', attr: { type: 'button' } });
        cleanUnused.addEventListener('click', () => {
            void (async () => {
                const removed = this.plugin.cleanupUnusedExternalImages();
                if (removed > 0)
                    await this.plugin.saveSettings();
                new obsidian_1.Notice(removed ? `Removed ${removed} unused image${removed === 1 ? '' : 's'}.` : 'No unused external images found.');
                this.render();
            })();
        });
        const cleanOrphans = actions.createEl('button', { text: 'Clean orphaned mappings', attr: { type: 'button' } });
        cleanOrphans.addEventListener('click', () => {
            void (async () => {
                const result = this.plugin.cleanupOrphanedCoverMappings();
                if (result.mappingsRemoved || result.imagesRemoved)
                    await this.plugin.saveSettings();
                new obsidian_1.Notice(result.mappingsRemoved
                    ? `Removed ${result.mappingsRemoved} orphaned mapping${result.mappingsRemoved === 1 ? '' : 's'}.`
                    : 'No orphaned folder cover mappings found.');
                await this.plugin.refreshOpenViews();
                this.render();
            })();
        });
        if (images.length) {
            const removeAll = actions.createEl('button', { text: 'Remove all external images', cls: 'mod-warning', attr: { type: 'button' } });
            removeAll.addEventListener('click', () => {
                new ConfirmActionModal(this.app, 'Remove all external cover images?', 'All folders using copied external images will fall back to vault, automatic, or generated covers. This cannot be undone.', 'Remove all', async () => {
                    this.plugin.removeAllExternalImages();
                    await this.plugin.saveSettings();
                    await this.plugin.refreshOpenViews();
                    this.render();
                }).open();
            });
        }
        if (!images.length) {
            contentEl.createDiv({ cls: 'fcw-manager-empty', text: 'No external cover images are currently stored.' });
            return;
        }
        const list = contentEl.createDiv({ cls: 'fcw-manager-list' });
        for (const [imageId, image] of images.sort((a, b) => (a[1].name || '').localeCompare(b[1].name || ''))) {
            const usages = this.plugin.getExternalImageUsage(imageId);
            const row = list.createDiv({ cls: 'fcw-manager-row' });
            const preview = row.createEl('img', {
                cls: 'fcw-manager-thumb',
                attr: { alt: image.name || 'Stored external cover', loading: 'lazy', decoding: 'async' },
            });
            preview.src = image.dataUrl;
            const info = row.createDiv({ cls: 'fcw-manager-info' });
            info.createDiv({ cls: 'fcw-manager-name', text: image.name || 'External image' });
            const stored = this.plugin.externalImageStoredBytes(image);
            const original = Number(image.originalSize) || stored;
            const dimensions = image.width && image.height ? ` · ${image.width}×${image.height}` : '';
            info.createDiv({
                cls: 'fcw-manager-meta',
                text: `${formatBytes(stored)} stored${original > stored ? ` · source ${formatBytes(original)}` : ''}${dimensions} · used by ${usages.length} folder${usages.length === 1 ? '' : 's'}`,
            });
            if (usages.length) {
                info.createDiv({
                    cls: 'fcw-manager-paths',
                    text: usages.slice(0, 3).join(' · ') + (usages.length > 3 ? ` · +${usages.length - 3} more` : ''),
                });
            }
            else {
                info.createDiv({ cls: 'fcw-manager-paths is-unused', text: 'Unused' });
            }
            const remove = row.createEl('button', {
                cls: 'fcw-manager-remove',
                attr: { type: 'button', 'aria-label': `Remove ${image.name || 'external image'}` },
            });
            (0, obsidian_1.setIcon)(remove, 'trash-2');
            remove.addEventListener('click', () => {
                const label = usages.length
                    ? `This image is used by ${usages.length} folder${usages.length === 1 ? '' : 's'}. Removing it will clear those custom covers.`
                    : 'This stored image is not currently used by any folder.';
                new ConfirmActionModal(this.app, 'Remove stored cover image?', label, 'Remove image', async () => {
                    this.plugin.removeExternalImage(imageId, true);
                    await this.plugin.saveSettings();
                    await this.plugin.refreshOpenViews();
                    this.render();
                }).open();
            });
        }
    }
    onClose() {
        this.contentEl.empty();
    }
}
class FolderCoverWallSettingTab extends obsidian_1.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    getControlValue(key) {
        if (key === 'coverMaxDimension')
            return String(this.plugin.pluginSettings.coverMaxDimension);
        return this.plugin.pluginSettings[key];
    }
    async setControlValue(key, value) {
        const settings = this.plugin.pluginSettings;
        switch (key) {
            case 'rootPath':
                settings.rootPath = (0, obsidian_1.normalizePath)(String(value !== null && value !== void 0 ? value : '').trim());
                break;
            case 'autoReplaceLeftPane':
                settings.autoReplaceLeftPane = Boolean(value);
                break;
            case 'cardMinWidth':
                settings.cardMinWidth = Number(value) || DEFAULT_SETTINGS.cardMinWidth;
                break;
            case 'cardAspectRatio':
                settings.cardAspectRatio = String(value !== null && value !== void 0 ? value : '').trim() || DEFAULT_SETTINGS.cardAspectRatio;
                break;
            case 'autoUseFirstImage':
                settings.autoUseFirstImage = Boolean(value);
                break;
            case 'showChildCount':
                settings.showChildCount = Boolean(value);
                break;
            case 'showFileCount':
                settings.showFileCount = Boolean(value);
                break;
            case 'showFiles':
                settings.showFiles = Boolean(value);
                break;
            case 'coverFileNames':
                settings.coverFileNames = String(value !== null && value !== void 0 ? value : '');
                break;
            case 'coverMaxDimension':
                settings.coverMaxDimension = Number(value) || DEFAULT_SETTINGS.coverMaxDimension;
                this.plugin.clearImageCaches();
                break;
            case 'coverWebpQuality':
                settings.coverWebpQuality = Number(value) || DEFAULT_SETTINGS.coverWebpQuality;
                this.plugin.clearImageCaches();
                break;
            case 'optimizeVaultCovers':
                settings.optimizeVaultCovers = Boolean(value);
                this.plugin.clearImageCaches();
                break;
            case 'lazyLoadCovers':
                settings.lazyLoadCovers = Boolean(value);
                break;
            default:
                return;
        }
        await this.plugin.saveSettings();
        if (key !== 'autoReplaceLeftPane')
            await this.plugin.refreshOpenViews();
    }
    getSettingDefinitions() {
        return [
            {
                name: 'Root folder',
                desc: 'Leave empty to show the whole vault.',
                control: { type: 'text', key: 'rootPath', placeholder: '' },
            },
            {
                name: 'Replace left pane automatically',
                desc: 'When the app finishes loading, show Folder Cover Wall in the current left sidebar leaf.',
                control: { type: 'toggle', key: 'autoReplaceLeftPane' },
            },
            {
                name: 'Card minimum width',
                desc: 'Larger values create fewer, larger folder covers.',
                control: { type: 'slider', key: 'cardMinWidth', min: 120, max: 360, step: 10 },
            },
            {
                name: 'Card aspect ratio',
                desc: 'Examples: 16 / 9, 4 / 3, 1 / 1, 3 / 4',
                control: { type: 'text', key: 'cardAspectRatio' },
            },
            {
                name: 'Automatically use first image in folder',
                desc: 'If no custom cover or named cover image exists, use the first image directly inside that folder before falling back to a generated cover.',
                control: { type: 'toggle', key: 'autoUseFirstImage' },
            },
            {
                name: 'Show child-folder count',
                control: { type: 'toggle', key: 'showChildCount' },
            },
            {
                name: 'Show file count',
                control: { type: 'toggle', key: 'showFileCount' },
            },
            {
                name: 'Show notes and files',
                desc: 'Show the files inside the current folder below the folder cover wall. Markdown notes appear first.',
                control: { type: 'toggle', key: 'showFiles' },
            },
            {
                name: 'Automatic cover file names',
                desc: 'Comma-separated. If a folder contains one of these files, it becomes the cover automatically.',
                control: { type: 'textarea', key: 'coverFileNames', rows: 3 },
            },
            {
                type: 'group',
                heading: 'Performance',
                items: [
                    {
                        name: 'Maximum cover resolution',
                        desc: 'Images are reduced to this maximum width or height before being used as covers. 768 px is recommended for the sidebar.',
                        control: {
                            type: 'dropdown',
                            key: 'coverMaxDimension',
                            defaultValue: '768',
                            options: {
                                '512': '512 px',
                                '768': '768 px (recommended)',
                                '1024': '1024 px',
                                '1280': '1280 px',
                            },
                        },
                    },
                    {
                        name: 'WebP cover quality',
                        desc: 'Compression quality used for generated cover thumbnails. Lower values reduce storage and memory pressure.',
                        control: { type: 'slider', key: 'coverWebpQuality', min: 55, max: 95, step: 5 },
                    },
                    {
                        name: 'Optimize vault cover images in memory',
                        desc: 'Use temporary low-resolution WebP thumbnails for vault images instead of keeping full-resolution source images decoded in memory. Original files are never modified.',
                        control: { type: 'toggle', key: 'optimizeVaultCovers' },
                    },
                    {
                        name: 'Lazy-load cover images',
                        desc: 'Only prepare cover images when cards are near the visible area. Recommended for folders with many subfolders.',
                        control: { type: 'toggle', key: 'lazyLoadCovers' },
                    },
                    {
                        name: 'External cover storage',
                        desc: 'Review copied external images, storage usage, and orphaned mappings.',
                        render: (setting) => {
                            const storageImages = Object.values(this.plugin.pluginSettings.externalImages);
                            const storageBytes = storageImages.reduce((sum, image) => sum + this.plugin.externalImageStoredBytes(image), 0);
                            const orphanCount = this.plugin.getOrphanedCoverMappings().length;
                            setting
                                .setDesc(`${storageImages.length} copied image${storageImages.length === 1 ? '' : 's'} · ${formatBytes(storageBytes)} embedded${orphanCount ? ` · ${orphanCount} orphaned mapping${orphanCount === 1 ? '' : 's'}` : ''}`)
                                .addButton((button) => button
                                .setButtonText('Manage')
                                .onClick(() => new ExternalCoverManagerModal(this.app, this.plugin).open()));
                        },
                    },
                ],
            },
        ];
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        new obsidian_1.Setting(containerEl)
            .setName('Root folder')
            .setDesc('Leave empty to show the whole vault. Example: Projects/Research')
            .addText((text) => text
            .setPlaceholder('')
            .setValue(this.plugin.pluginSettings.rootPath)
            .onChange(async (value) => {
            this.plugin.pluginSettings.rootPath = (0, obsidian_1.normalizePath)(value.trim());
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenViews();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Replace left pane automatically')
            .setDesc('When Obsidian finishes loading, show Folder Cover Wall in the current left sidebar leaf.')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.pluginSettings.autoReplaceLeftPane)
            .onChange(async (value) => {
            this.plugin.pluginSettings.autoReplaceLeftPane = value;
            await this.plugin.saveSettings();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Card minimum width')
            .setDesc('Larger values create fewer, larger folder covers.')
            .addSlider((slider) => slider
            .setLimits(120, 360, 10)
            .setValue(this.plugin.pluginSettings.cardMinWidth)
            .onChange(async (value) => {
            this.plugin.pluginSettings.cardMinWidth = value;
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenViews();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Card aspect ratio')
            .setDesc('Examples: 16 / 9, 4 / 3, 1 / 1, 3 / 4')
            .addText((text) => text
            .setValue(this.plugin.pluginSettings.cardAspectRatio)
            .onChange(async (value) => {
            this.plugin.pluginSettings.cardAspectRatio = value.trim() || '16 / 9';
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenViews();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Automatically use first image in folder')
            .setDesc('If no custom cover or cover.jpg/png exists, use the first image directly inside that folder before falling back to a generated cover.')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.pluginSettings.autoUseFirstImage)
            .onChange(async (value) => {
            this.plugin.pluginSettings.autoUseFirstImage = value;
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenViews();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Show child-folder count')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.pluginSettings.showChildCount)
            .onChange(async (value) => {
            this.plugin.pluginSettings.showChildCount = value;
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenViews();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Show file count')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.pluginSettings.showFileCount)
            .onChange(async (value) => {
            this.plugin.pluginSettings.showFileCount = value;
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenViews();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Show notes and files')
            .setDesc('Show the files inside the current folder below the folder cover wall. Markdown notes appear first.')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.pluginSettings.showFiles)
            .onChange(async (value) => {
            this.plugin.pluginSettings.showFiles = value;
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenViews();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Automatic cover file names')
            .setDesc('Comma-separated. If a folder contains one of these files, it becomes the cover automatically.')
            .addTextArea((text) => text
            .setValue(this.plugin.pluginSettings.coverFileNames)
            .onChange(async (value) => {
            this.plugin.pluginSettings.coverFileNames = value;
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenViews();
        }));
        new obsidian_1.Setting(containerEl).setName('Performance').setHeading();
        new obsidian_1.Setting(containerEl)
            .setName('Maximum cover resolution')
            .setDesc('Images are reduced to this maximum width or height before being used as covers. 768 px is recommended for the sidebar.')
            .addDropdown((dropdown) => dropdown
            .addOption('512', '512 px')
            .addOption('768', '768 px (recommended)')
            .addOption('1024', '1024 px')
            .addOption('1280', '1280 px')
            .setValue(String(this.plugin.pluginSettings.coverMaxDimension))
            .onChange(async (value) => {
            this.plugin.pluginSettings.coverMaxDimension = Number(value) || 768;
            this.plugin.clearImageCaches();
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenViews();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('WebP cover quality')
            .setDesc('Compression quality used for generated cover thumbnails. Lower values reduce storage and memory pressure.')
            .addSlider((slider) => slider
            .setLimits(55, 95, 5)
            .setValue(this.plugin.pluginSettings.coverWebpQuality)
            .onChange(async (value) => {
            this.plugin.pluginSettings.coverWebpQuality = value;
            this.plugin.clearImageCaches();
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenViews();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Optimize vault cover images in memory')
            .setDesc('Use temporary low-resolution WebP thumbnails for vault images instead of keeping full-resolution source images decoded in memory. Original files are never modified.')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.pluginSettings.optimizeVaultCovers)
            .onChange(async (value) => {
            this.plugin.pluginSettings.optimizeVaultCovers = value;
            this.plugin.clearImageCaches();
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenViews();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Lazy-load cover images')
            .setDesc('Only prepare cover images when cards are near the visible area. Recommended for folders with many subfolders.')
            .addToggle((toggle) => toggle
            .setValue(this.plugin.pluginSettings.lazyLoadCovers)
            .onChange(async (value) => {
            this.plugin.pluginSettings.lazyLoadCovers = value;
            await this.plugin.saveSettings();
            await this.plugin.refreshOpenViews();
        }));
        const storageImages = Object.values(this.plugin.pluginSettings.externalImages || {});
        const storageBytes = storageImages.reduce((sum, image) => sum + this.plugin.externalImageStoredBytes(image), 0);
        const orphanCount = this.plugin.getOrphanedCoverMappings().length;
        new obsidian_1.Setting(containerEl)
            .setName('External cover storage')
            .setDesc(`${storageImages.length} copied image${storageImages.length === 1 ? '' : 's'} · ${formatBytes(storageBytes)} embedded${orphanCount ? ` · ${orphanCount} orphaned mapping${orphanCount === 1 ? '' : 's'}` : ''}`)
            .addButton((button) => button
            .setButtonText('Manage')
            .onClick(() => new ExternalCoverManagerModal(this.app, this.plugin).open()));
    }
}
class FolderCoverWallPlugin extends obsidian_1.Plugin {
    constructor() {
        super(...arguments);
        this.pluginSettings = { ...DEFAULT_SETTINGS, customCovers: {}, externalImages: {} };
        this.vaultThumbnailCache = new Map();
        this.externalObjectUrlCache = new Map();
        this.thumbnailTasks = new Map();
        this.thumbnailActive = 0;
        this.thumbnailQueue = [];
    }
    async onload() {
        await this.loadSettings();
        const migrationResult = await this.optimizeLegacyExternalImages();
        if (migrationResult.optimized > 0) {
            new obsidian_1.Notice(`Folder Cover Wall optimized ${migrationResult.optimized} stored cover${migrationResult.optimized === 1 ? '' : 's'} for lower memory use.`);
        }
        this.registerView(VIEW_TYPE_FOLDER_COVER_WALL, (leaf) => new FolderCoverWallView(leaf, this));
        this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
            void this.handleVaultRename(file, oldPath);
        }));
        this.registerEvent(this.app.vault.on('delete', (file) => {
            void this.handleVaultDelete(file);
        }));
        this.addCommand({
            id: 'open',
            name: 'Open cover wall',
            callback: () => { void this.activateView(false); },
        });
        this.addCommand({
            id: 'replace-left-file-browser',
            name: 'Replace current left sidebar view with cover wall',
            callback: () => { void this.activateView(true); },
        });
        this.addCommand({
            id: 'manage-external-cover-storage',
            name: 'Manage external cover storage',
            callback: () => new ExternalCoverManagerModal(this.app, this).open(),
        });
        this.addCommand({
            id: 'optimize-stored-cover-images',
            name: 'Optimize stored cover images',
            callback: async () => {
                const result = await this.optimizeAllExternalImages();
                const saved = Math.max(0, result.beforeBytes - result.afterBytes);
                new obsidian_1.Notice(result.optimized
                    ? `Optimized ${result.optimized} stored cover${result.optimized === 1 ? '' : 's'} and saved ${formatBytes(saved)}.`
                    : 'Stored covers are already optimized for the current settings.');
            },
        });
        this.addSettingTab(new FolderCoverWallSettingTab(this.app, this));
        this.app.workspace.onLayoutReady(() => {
            const removed = this.removeDuplicateViews();
            if (removed > 0) {
                new obsidian_1.Notice(`Folder Cover Wall removed ${removed} duplicate sidebar tab${removed === 1 ? '' : 's'}.`);
            }
            if (this.pluginSettings.autoReplaceLeftPane)
                void this.activateView(true);
        });
    }
    onunload() {
        this.clearImageCaches();
    }
    async loadSettings() {
        var _a, _b;
        const raw = await this.loadData();
        this.pluginSettings = parseStoredSettings(raw);
        // Migrate v0.4 external covers that embedded their data directly in each
        // folder mapping into the shared external-image library introduced in v0.5.
        let migrated = false;
        for (const [folderPath, cover] of Object.entries(this.pluginSettings.customCovers)) {
            if (typeof cover !== 'string' && cover.type === 'external' && cover.dataUrl) {
                const imageId = this.storeExternalImage({
                    name: (_a = cover.name) !== null && _a !== void 0 ? _a : 'External image',
                    mime: typeof cover.mime === 'string' && isSupportedImageMime(cover.mime)
                        ? cover.mime
                        : mimeFromDataUrl(cover.dataUrl),
                    originalSize: (_b = cover.size) !== null && _b !== void 0 ? _b : estimateDataUrlBytes(cover.dataUrl),
                    dataUrl: cover.dataUrl,
                });
                this.pluginSettings.customCovers[folderPath] = { type: 'external', imageId };
                migrated = true;
            }
        }
        if (migrated)
            await this.saveSettings();
    }
    async saveSettings() {
        await this.saveData(this.pluginSettings);
    }
    cacheLimit() {
        return 12;
    }
    async withThumbnailSlot(work) {
        if (this.thumbnailActive >= 2) {
            await new Promise((resolve) => this.thumbnailQueue.push(() => resolve()));
        }
        this.thumbnailActive++;
        try {
            return await work();
        }
        finally {
            this.thumbnailActive = Math.max(0, this.thumbnailActive - 1);
            const next = this.thumbnailQueue.shift();
            if (next)
                next();
        }
    }
    touchUrlCache(cache, key, entry) {
        if (cache.has(key))
            cache.delete(key);
        cache.set(key, entry);
        while (cache.size > this.cacheLimit()) {
            const oldestResult = cache.keys().next();
            if (oldestResult.done)
                break;
            const oldestKey = oldestResult.value;
            const oldest = cache.get(oldestKey);
            if (oldest === null || oldest === void 0 ? void 0 : oldest.url)
                URL.revokeObjectURL(oldest.url);
            cache.delete(oldestKey);
        }
        return entry.url;
    }
    clearUrlCache(cache) {
        for (const entry of cache.values()) {
            if (entry === null || entry === void 0 ? void 0 : entry.url)
                URL.revokeObjectURL(entry.url);
        }
        cache.clear();
    }
    clearImageCaches() {
        var _a;
        this.clearUrlCache(this.vaultThumbnailCache);
        this.clearUrlCache(this.externalObjectUrlCache);
        this.thumbnailTasks.clear();
        while ((_a = this.thumbnailQueue) === null || _a === void 0 ? void 0 : _a.length) {
            const next = this.thumbnailQueue.shift();
            if (next)
                next();
        }
    }
    revokeExternalImageUrl(imageId) {
        const entry = this.externalObjectUrlCache.get(imageId);
        if (entry === null || entry === void 0 ? void 0 : entry.url)
            URL.revokeObjectURL(entry.url);
        this.externalObjectUrlCache.delete(imageId);
    }
    async optimizeExternalFile(file) {
        const optimized = await optimizeBlobToWebp(file, this.pluginSettings.coverMaxDimension, this.pluginSettings.coverWebpQuality);
        const dataUrl = await blobToDataUrl(optimized.blob);
        return {
            ...optimized,
            dataUrl,
            storedSize: optimized.blob.size,
        };
    }
    externalImageNeedsOptimization(image) {
        if (!image || typeof image.dataUrl !== 'string' || !image.dataUrl.startsWith('data:image/'))
            return false;
        if (image.optimizedVersion !== 1)
            return true;
        if (String(image.mime || '').toLowerCase() !== 'image/webp')
            return true;
        const maxDimension = Math.max(256, Number(this.pluginSettings.coverMaxDimension) || 768);
        if ((Number(image.width) || 0) > maxDimension || (Number(image.height) || 0) > maxDimension)
            return true;
        const currentQuality = Number(image.optimizationQuality);
        if (Number.isFinite(currentQuality) && currentQuality > this.pluginSettings.coverWebpQuality)
            return true;
        return false;
    }
    async optimizeExternalImageRecord(imageId, force = false) {
        var _a;
        const image = (_a = this.pluginSettings.externalImages) === null || _a === void 0 ? void 0 : _a[imageId];
        if (!image || typeof image.dataUrl !== 'string' || !image.dataUrl.startsWith('data:image/'))
            return null;
        if (!force && !this.externalImageNeedsOptimization(image))
            return null;
        const beforeBytes = this.externalImageStoredBytes(image);
        const blob = dataUrlToBlob(image.dataUrl);
        const optimized = await optimizeBlobToWebp(blob, this.pluginSettings.coverMaxDimension, this.pluginSettings.coverWebpQuality);
        const dataUrl = await blobToDataUrl(optimized.blob);
        image.dataUrl = dataUrl;
        image.mime = 'image/webp';
        image.storedSize = optimized.blob.size;
        image.width = optimized.width;
        image.height = optimized.height;
        image.sourceWidth = image.sourceWidth || optimized.sourceWidth;
        image.sourceHeight = image.sourceHeight || optimized.sourceHeight;
        image.optimizedVersion = 1;
        image.optimizationMaxDimension = this.pluginSettings.coverMaxDimension;
        image.optimizationQuality = this.pluginSettings.coverWebpQuality;
        image.optimizedAt = Date.now();
        this.revokeExternalImageUrl(imageId);
        return {
            beforeBytes,
            afterBytes: optimized.blob.size,
            width: optimized.width,
            height: optimized.height,
        };
    }
    async optimizeLegacyExternalImages() {
        const entries = Object.keys(this.pluginSettings.externalImages || {});
        let optimized = 0;
        let beforeBytes = 0;
        let afterBytes = 0;
        for (const imageId of entries) {
            if (!this.externalImageNeedsOptimization(this.pluginSettings.externalImages[imageId]))
                continue;
            try {
                const result = await this.optimizeExternalImageRecord(imageId, false);
                if (!result)
                    continue;
                optimized++;
                beforeBytes += result.beforeBytes;
                afterBytes += result.afterBytes;
                await new Promise((resolve) => window.setTimeout(resolve, 0));
            }
            catch (error) {
                console.error(`Folder Cover Wall: failed to optimize stored cover ${imageId}`, error);
            }
        }
        if (optimized) {
            await this.saveSettings();
            this.clearUrlCache(this.externalObjectUrlCache);
        }
        return { optimized, beforeBytes, afterBytes };
    }
    async optimizeAllExternalImages() {
        const entries = Object.keys(this.pluginSettings.externalImages || {});
        let optimized = 0;
        let beforeBytes = 0;
        let afterBytes = 0;
        for (const imageId of entries) {
            const image = this.pluginSettings.externalImages[imageId];
            if (!this.externalImageNeedsOptimization(image))
                continue;
            try {
                const result = await this.optimizeExternalImageRecord(imageId, false);
                if (!result)
                    continue;
                optimized++;
                beforeBytes += result.beforeBytes;
                afterBytes += result.afterBytes;
                await new Promise((resolve) => window.setTimeout(resolve, 0));
            }
            catch (error) {
                console.error(`Folder Cover Wall: failed to optimize stored cover ${imageId}`, error);
            }
        }
        if (optimized) {
            await this.saveSettings();
            await this.refreshOpenViews();
        }
        return { optimized, beforeBytes, afterBytes };
    }
    async getExternalImageObjectUrl(imageId) {
        var _a;
        const cached = this.externalObjectUrlCache.get(imageId);
        if (cached) {
            this.externalObjectUrlCache.delete(imageId);
            this.externalObjectUrlCache.set(imageId, cached);
            return cached.url;
        }
        const image = (_a = this.pluginSettings.externalImages) === null || _a === void 0 ? void 0 : _a[imageId];
        if (!(image === null || image === void 0 ? void 0 : image.dataUrl))
            return null;
        const blob = dataUrlToBlob(image.dataUrl);
        const url = URL.createObjectURL(blob);
        return this.touchUrlCache(this.externalObjectUrlCache, imageId, { url, bytes: blob.size });
    }
    vaultThumbnailKey(file) {
        var _a;
        return `${file.path}|${((_a = file.stat) === null || _a === void 0 ? void 0 : _a.mtime) || 0}|${this.pluginSettings.coverMaxDimension}|${this.pluginSettings.coverWebpQuality}`;
    }
    async getVaultThumbnailUrl(file) {
        const key = this.vaultThumbnailKey(file);
        const cached = this.vaultThumbnailCache.get(key);
        if (cached) {
            this.vaultThumbnailCache.delete(key);
            this.vaultThumbnailCache.set(key, cached);
            return cached.url;
        }
        const existingTask = this.thumbnailTasks.get(key);
        if (existingTask)
            return existingTask;
        const task = this.withThumbnailSlot(async () => {
            const binary = await this.app.vault.readBinary(file);
            const blob = new Blob([binary], { type: mimeFromName(file.name) });
            const optimized = await optimizeBlobToWebp(blob, this.pluginSettings.coverMaxDimension, this.pluginSettings.coverWebpQuality);
            const url = URL.createObjectURL(optimized.blob);
            return this.touchUrlCache(this.vaultThumbnailCache, key, { url, bytes: optimized.blob.size });
        });
        this.thumbnailTasks.set(key, task);
        try {
            return await task;
        }
        finally {
            this.thumbnailTasks.delete(key);
        }
    }
    async resolveCoverDisplayUrl(source) {
        if (!source)
            return null;
        if (source.kind === 'external' && source.imageId) {
            return this.getExternalImageObjectUrl(source.imageId);
        }
        if (source.kind === 'inline' && source.dataUrl)
            return source.dataUrl;
        if ((source.kind === 'vault' || source.kind === 'auto') && source.file) {
            if (!this.pluginSettings.optimizeVaultCovers)
                return this.app.vault.getResourcePath(source.file);
            try {
                return await this.getVaultThumbnailUrl(source.file);
            }
            catch (error) {
                console.error('Folder Cover Wall: vault thumbnail optimization failed; using original resource', error);
                return this.app.vault.getResourcePath(source.file);
            }
        }
        return null;
    }
    externalImageStoredBytes(image) {
        return Number(image === null || image === void 0 ? void 0 : image.storedSize) || estimateDataUrlBytes((image === null || image === void 0 ? void 0 : image.dataUrl) || '');
    }
    storeExternalImage(image) {
        const baseId = `img-${hashText(image.dataUrl || `${image.name || ''}:${Date.now()}`)}`;
        let imageId = baseId;
        let suffix = 2;
        while (this.pluginSettings.externalImages[imageId]
            && this.pluginSettings.externalImages[imageId].dataUrl !== image.dataUrl) {
            imageId = `${baseId}-${suffix++}`;
        }
        if (!this.pluginSettings.externalImages[imageId]) {
            this.pluginSettings.externalImages[imageId] = {
                name: image.name || 'External image',
                mime: image.mime,
                originalSize: Number(image.originalSize) || estimateDataUrlBytes(image.dataUrl),
                storedSize: Number(image.storedSize) || estimateDataUrlBytes(image.dataUrl),
                width: Number(image.width) || undefined,
                height: Number(image.height) || undefined,
                sourceWidth: Number(image.sourceWidth) || undefined,
                sourceHeight: Number(image.sourceHeight) || undefined,
                optimizedVersion: Number(image.optimizedVersion) || 0,
                optimizationMaxDimension: Number(image.optimizationMaxDimension) || undefined,
                optimizationQuality: Number(image.optimizationQuality) || undefined,
                dataUrl: image.dataUrl,
                addedAt: Date.now(),
            };
        }
        return imageId;
    }
    getExternalImageUsage(imageId) {
        const usages = [];
        for (const [folderPath, cover] of Object.entries(this.pluginSettings.customCovers || {})) {
            if (cover && typeof cover === 'object' && cover.type === 'external' && cover.imageId === imageId) {
                usages.push(folderPath);
            }
        }
        return usages.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }
    cleanupUnusedExternalImages() {
        const used = new Set();
        for (const cover of Object.values(this.pluginSettings.customCovers || {})) {
            if (cover && typeof cover === 'object' && cover.type === 'external' && cover.imageId)
                used.add(cover.imageId);
        }
        let removed = 0;
        for (const imageId of Object.keys(this.pluginSettings.externalImages || {})) {
            if (!used.has(imageId)) {
                this.revokeExternalImageUrl(imageId);
                delete this.pluginSettings.externalImages[imageId];
                removed++;
            }
        }
        return removed;
    }
    getOrphanedCoverMappings() {
        const orphaned = [];
        for (const folderPath of Object.keys(this.pluginSettings.customCovers || {})) {
            const target = this.app.vault.getAbstractFileByPath((0, obsidian_1.normalizePath)(folderPath));
            if (!(target instanceof obsidian_1.TFolder))
                orphaned.push(folderPath);
        }
        return orphaned;
    }
    cleanupOrphanedCoverMappings() {
        const orphaned = this.getOrphanedCoverMappings();
        for (const folderPath of orphaned)
            delete this.pluginSettings.customCovers[folderPath];
        const imagesRemoved = this.cleanupUnusedExternalImages();
        return { mappingsRemoved: orphaned.length, imagesRemoved };
    }
    removeExternalImage(imageId, clearMappings = true) {
        if (clearMappings) {
            for (const [folderPath, cover] of Object.entries(this.pluginSettings.customCovers || {})) {
                if (cover && typeof cover === 'object' && cover.type === 'external' && cover.imageId === imageId) {
                    delete this.pluginSettings.customCovers[folderPath];
                }
            }
        }
        this.revokeExternalImageUrl(imageId);
        delete this.pluginSettings.externalImages[imageId];
    }
    removeAllExternalImages() {
        for (const [folderPath, cover] of Object.entries(this.pluginSettings.customCovers || {})) {
            if (cover && typeof cover === 'object' && cover.type === 'external') {
                delete this.pluginSettings.customCovers[folderPath];
            }
        }
        this.clearUrlCache(this.externalObjectUrlCache);
        this.pluginSettings.externalImages = {};
    }
    async handleVaultRename(file, oldPath) {
        this.clearUrlCache(this.vaultThumbnailCache);
        const newPath = file.path;
        const includeDescendants = file instanceof obsidian_1.TFolder;
        let changed = false;
        // Folder cover mappings are keyed by folder path. When a folder is renamed,
        // migrate its own mapping and every descendant mapping to the new prefix.
        const migratedCovers = {};
        for (const [folderPath, coverValue] of Object.entries(this.pluginSettings.customCovers || {})) {
            const migratedFolderPath = includeDescendants
                ? rewritePath(folderPath, oldPath, newPath, true)
                : folderPath;
            let cover = coverValue;
            if (typeof coverValue === 'string') {
                const migrated = rewritePath(coverValue, oldPath, newPath, includeDescendants);
                if (migrated !== coverValue) {
                    cover = migrated;
                    changed = true;
                }
            }
            else if (coverValue && typeof coverValue === 'object' && coverValue.type === 'vault' && coverValue.path) {
                const migrated = rewritePath(coverValue.path, oldPath, newPath, includeDescendants);
                if (migrated !== coverValue.path) {
                    cover = { ...coverValue, path: migrated };
                    changed = true;
                }
            }
            if (migratedFolderPath !== folderPath)
                changed = true;
            migratedCovers[migratedFolderPath] = cover;
        }
        this.pluginSettings.customCovers = migratedCovers;
        const migratedRoot = rewritePath(this.pluginSettings.rootPath, oldPath, newPath, includeDescendants);
        if (migratedRoot !== this.pluginSettings.rootPath) {
            this.pluginSettings.rootPath = migratedRoot;
            changed = true;
        }
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_COVER_WALL);
        for (const leaf of leaves) {
            const view = leaf.view;
            if (view instanceof FolderCoverWallView) {
                const migratedCurrent = rewritePath(view.currentPath, oldPath, newPath, includeDescendants);
                if (migratedCurrent !== view.currentPath)
                    view.currentPath = migratedCurrent;
            }
        }
        if (changed)
            await this.saveSettings();
        await this.refreshOpenViews();
    }
    async handleVaultDelete(file) {
        this.clearUrlCache(this.vaultThumbnailCache);
        const deletedPath = file.path;
        const includeDescendants = file instanceof obsidian_1.TFolder;
        let changed = false;
        for (const [folderPath, coverValue] of Object.entries({ ...this.pluginSettings.customCovers })) {
            if (includeDescendants && (folderPath === deletedPath || folderPath.startsWith(`${deletedPath}/`))) {
                delete this.pluginSettings.customCovers[folderPath];
                changed = true;
                continue;
            }
            if (typeof coverValue === 'string') {
                if (coverValue === deletedPath || (includeDescendants && coverValue.startsWith(`${deletedPath}/`))) {
                    delete this.pluginSettings.customCovers[folderPath];
                    changed = true;
                }
            }
            else if (coverValue && typeof coverValue === 'object' && coverValue.type === 'vault' && coverValue.path) {
                if (coverValue.path === deletedPath || (includeDescendants && coverValue.path.startsWith(`${deletedPath}/`))) {
                    delete this.pluginSettings.customCovers[folderPath];
                    changed = true;
                }
            }
        }
        if (includeDescendants && this.pluginSettings.rootPath
            && (this.pluginSettings.rootPath === deletedPath || this.pluginSettings.rootPath.startsWith(`${deletedPath}/`))) {
            this.pluginSettings.rootPath = '';
            changed = true;
        }
        const removedImages = this.cleanupUnusedExternalImages();
        if (removedImages)
            changed = true;
        if (changed)
            await this.saveSettings();
        await this.refreshOpenViews();
    }
    removeDuplicateViews() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_COVER_WALL);
        if (leaves.length <= 1)
            return 0;
        // Folder Cover Wall is intentionally a single-instance sidebar view.
        // Older builds could create one extra workspace leaf on every restart when
        // automatic left-pane replacement was enabled. Keep the first restored
        // leaf and detach only duplicate leaves created by that bug.
        for (const leaf of leaves.slice(1)) {
            try {
                leaf.detach();
            }
            catch (_a) {
                // Ignore leaves that were already detached by the workspace.
            }
        }
        return leaves.length - 1;
    }
    async activateView(replaceCurrentLeftLeaf = false) {
        var _a;
        this.removeDuplicateViews();
        // Always reuse an already restored Folder Cover Wall leaf first. This is
        // important on application startup: replacing another left-sidebar leaf
        // before checking the restored layout is what caused duplicate tab icons.
        let leaf = (_a = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_COVER_WALL)[0]) !== null && _a !== void 0 ? _a : null;
        if (!leaf && replaceCurrentLeftLeaf)
            leaf = this.app.workspace.getLeftLeaf(false);
        if (!leaf)
            leaf = this.app.workspace.getLeftLeaf(false) || this.app.workspace.getLeftLeaf(true);
        if (!leaf) {
            new obsidian_1.Notice('Could not open Folder Cover Wall in the left sidebar.');
            return;
        }
        if (leaf.getViewState().type !== VIEW_TYPE_FOLDER_COVER_WALL) {
            await leaf.setViewState({ type: VIEW_TYPE_FOLDER_COVER_WALL, active: true });
        }
        await this.app.workspace.revealLeaf(leaf);
    }
    async refreshOpenViews() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOLDER_COVER_WALL);
        for (const leaf of leaves) {
            const view = leaf.view;
            if (view instanceof FolderCoverWallView)
                await view.refresh();
        }
    }
}
exports.default = FolderCoverWallPlugin;
;

// Obsidian plugin loader compatibility.
module.exports = exports.default;
