# Folder Cover Wall

作者：[Arebrodo](https://github.com/Arebrodo) · [English](./README.md)

Folder Cover Wall 将左侧边栏变成可视化文件夹浏览器。每个文件夹都会以大尺寸封面卡片显示，而当前文件夹中的笔记和其他文件仍然可以正常访问。

![Folder Cover Wall screenshot](./assets/screenshot.png)

## 功能特点

- 在左侧边栏中以大尺寸可视化封面卡片浏览文件夹。
- 支持多级嵌套文件夹导航，无需在主编辑区单独打开 Dashboard。
- 当前文件夹中的笔记和其他文件仍可显示在封面墙下方。
- 可从当前 Vault 内任意位置选择图片作为文件夹封面。
- 可从电脑中的其他位置选择外部图片作为文件夹封面。
- 可自动识别 `cover.jpg`、`cover.png`、`.folder-cover.jpg` 等常见封面文件名。
- 可选地自动使用文件夹中的第一张图片作为封面。
- 当没有可用图片时，自动生成默认封面。
- 可配置根文件夹、卡片宽度、宽高比、文件夹/文件数量显示以及文件可见性。
- 重命名文件夹时自动保留并迁移封面绑定。
- 重命名父文件夹时，其下嵌套文件夹的封面绑定也会自动迁移。
- 可在插件设置中管理复制进来的外部封面图片。
- 可删除未使用的外部图片并清理失效的封面映射。
- 同一张外部图片被多个文件夹使用时，只保存一份，不会重复占用空间。

## 快速开始

启用插件后，可以从左侧边栏打开 **Folder Cover Wall**，也可以通过命令面板使用。

可用命令：

- **Folder Cover Wall: Open Folder Cover Wall**
- **Folder Cover Wall: Replace current left sidebar view with Folder Cover Wall**
- **Folder Cover Wall: Manage external cover storage**

如果希望每次启动时自动使用 Folder Cover Wall，可以在插件设置中启用 **Replace left pane automatically**。

### 浏览文件夹

点击文件夹卡片即可进入该文件夹。

可以使用顶部的返回按钮或文件夹标题返回上一级目录。

当前文件夹中的笔记和其他文件会继续显示在文件夹卡片下方。

### 设置文件夹封面

右键点击文件夹卡片，然后选择：

- **Choose cover from vault…** — 使用 Vault 内已有图片。
- **Choose external image…** — 从电脑任意位置选择外部图片。
- **Clear custom cover** — 清除自定义封面并恢复自动封面逻辑。

### 自动封面优先级

Folder Cover Wall 会按以下顺序选择封面：

1. 手动指定的外部图片或 Vault 内图片。
2. 预设封面文件名，例如 `cover.jpg`、`cover.png`、`.folder-cover.jpg`、`.folder-cover.png`。
3. 如果已启用，则使用文件夹中的第一张图片。
4. 如果以上都不可用，则使用自动生成的默认封面。

## 文件夹重命名时保留封面

从 0.5.0 版本开始，自定义封面会在文件夹重命名时自动跟随迁移。

如果重命名的是父文件夹，其下嵌套文件夹的封面绑定也会一起迁移。

这样可以避免旧文件夹路径留下无效的封面映射。

## 外部封面存储管理

从 Vault 外部选择的图片会被复制到插件内部封面库中，因此即使原始图片之后被移动、重命名、外接磁盘断开或删除，封面仍然可以继续显示。

打开：

**设置 → Folder Cover Wall → External cover storage → Manage**

或者运行命令：

**Folder Cover Wall: Manage external cover storage**

在管理界面中可以：

- 查看当前保存了多少张外部图片。
- 查看外部封面总共占用了多少存储空间。
- 查看每张图片被哪些文件夹使用。
- 删除单独的外部封面图片。
- 删除未使用的外部图片。
- 清理失效的文件夹封面映射。
- 一次性删除所有外部封面图片。

同一张外部图片即使被多个文件夹使用，也只会保存一份。

## 外部图片与隐私

外部图片仅在本地读取，并以嵌入式图片数据形式保存到插件的 `data.json` 中。

插件**不会将这些图片上传到任何地方**。

由于图片数据已经嵌入插件数据中，因此移动或重命名原始图片不会导致封面失效。

体积很大的图片会增加 `data.json` 的大小。对于大约超过 12 MB 的源图片，插件会显示提示。

你可以随时通过 External Cover Storage 管理器查看并删除已保存的外部图片。

## 设置项

Folder Cover Wall 提供以下设置：

- 根文件夹
- 卡片最小宽度
- 卡片宽高比
- 是否显示文件夹数量
- 是否显示文件数量
- 文件可见性
- 是否自动使用文件夹中的第一张图片
- 是否自动替换左侧边栏
- 外部封面存储管理

## 安装

### Community Plugins

插件进入 Community Plugins 目录后：

1. 打开 **设置 → Community plugins → Browse**。
2. 搜索 **Folder Cover Wall**。
3. 安装并启用插件。

### 手动安装

将以下文件复制到：

```text
<Vault>/.obsidian/plugins/folder-cover-wall/
```

所需文件：

```text
main.js
manifest.json
styles.css
```

重新加载应用后，在 Community plugins 中启用 **Folder Cover Wall**。

## 为什么做这个插件

我借助 GPT 构建了 Folder Cover Wall，因为我希望文件夹浏览方式更直观、更有表现力，更接近 Craft 这类应用中精致的封面式文件夹体验。

我个人很喜欢那种让文件夹不只是普通文字列表，而更像“视觉空间”的界面。因为没有找到完全符合自己需求的现有插件，所以我借助 GPT 把这个想法实现成了一个可用插件。

我也希望把它分享给同样喜欢更丰富、更华丽、更有视觉感的文件夹浏览方式的人。

欢迎反馈、建议和 Bug 报告。

## 开发

环境要求：

- Node.js 18 或更高版本
- npm

安装依赖：

```bash
npm install
```

启动开发构建：

```bash
npm run dev
```

创建生产构建：

```bash
npm run build
```

生产构建会在仓库根目录生成 `main.js`。

## 仓库

GitHub：https://github.com/Arebrodo/folder-cover-wall

Issues：https://github.com/Arebrodo/folder-cover-wall/issues

## 发布

详见 [RELEASING.md](./RELEASING.md)。

仓库中已经包含 GitHub Actions 工作流。推送版本标签后，可以自动创建 Release，例如：

```text
0.5.0
```

## License

MIT，详见 [LICENSE](./LICENSE)。
