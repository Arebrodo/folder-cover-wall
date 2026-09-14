# Folder Cover Wall

作者：[Arebrodo](https://github.com/Arebrodo) · [English README](./README.md)

Folder Cover Wall 是一个 Obsidian 文件夹可视化插件：它把左侧栏中的文件夹显示成大封面卡片，而不是只显示传统树状文件列表。

![Folder Cover Wall 截图](./assets/screenshot.png)

## 功能

- 文件夹以大封面卡片显示。
- 在左侧栏内逐层进入子文件夹，不占用主编辑区域。
- 进入文件夹后仍可直接打开其中的 Markdown 笔记和其他文件。
- 可以从 Vault 内选择封面。
- 可以从 Obsidian Vault 之外的电脑目录选择封面。
- 自动识别 `cover.jpg`、`cover.png`、`.folder-cover.jpg` 等文件。
- 可自动使用文件夹内第一张图片作为封面。
- 没有图片时生成清晰的默认封面。
- 可设置根目录、卡片尺寸、宽高比、文件数量显示等。

## 手动安装

把以下文件复制到：

```text
<Vault>/.obsidian/plugins/folder-cover-wall/
```

```text
main.js
manifest.json
styles.css
```

重启 Obsidian，并在 **设置 → 第三方插件** 中启用 Folder Cover Wall。

## 使用

打开命令面板 `Ctrl/Cmd + P`，运行：

- **Folder Cover Wall: Open Folder Cover Wall**
- **Folder Cover Wall: Replace current left sidebar view with Folder Cover Wall**

右键任意文件夹卡片，可以：

- 从 Vault 选择封面；
- 从电脑其他目录选择外部图片；
- 清除自定义封面。

外部图片会以嵌入数据保存在插件自己的 `data.json` 中，不会上传到网络。原始图片移动或改名后，封面仍可继续使用。

## 项目地址

GitHub：https://github.com/Arebrodo/folder-cover-wall

问题反馈：https://github.com/Arebrodo/folder-cover-wall/issues

## 开发与发布

开发命令：

```bash
npm install
npm run dev
npm run build
```

正式发布流程请看 [RELEASING.md](./RELEASING.md) 和 [PUBLISH_CHECKLIST.md](./PUBLISH_CHECKLIST.md)。

## License

MIT，见 [LICENSE](./LICENSE)。
