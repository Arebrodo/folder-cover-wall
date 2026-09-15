# Folder Cover Wall

作者：[Arebrodo](https://github.com/Arebrodo) · [English](./README.md)

Folder Cover Wall 将 Obsidian 左侧边栏变成可视化文件夹浏览器。每个文件夹都会以大尺寸封面卡片显示，而当前文件夹中的笔记和其他文件仍然可以正常访问。

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
- 通过 WebP 缩略图和懒加载降低封面图片的运行内存占用。

## 快速开始

启用插件后，可以从左侧边栏打开 **Folder Cover Wall**，也可以通过命令面板使用。

可用命令：

- **Folder Cover Wall: Open cover wall**
- **Folder Cover Wall: Replace current left sidebar view with cover wall**
- **Folder Cover Wall: Manage external cover storage**
- **Folder Cover Wall: Optimize stored cover images**

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

## 性能与内存优化

**v0.6.1：** 修复重复重启后 Folder Cover Wall 侧边栏标签不断增加的问题。升级后首次启动会自动清理已有的重复标签。


0.6.0 版本重新设计了封面图片处理方式，以降低大量高清图片带来的运行内存占用。

- 外部图片导入时会自动缩小到设定的最大分辨率，并转换为 WebP 后再保存。
- Vault 内的图片可以使用临时低分辨率 WebP 缩略图显示，不会修改原始图片。
- 只有当文件夹卡片接近可视区域时，插件才会准备对应的封面图片。
- 缩略图生成限制并发数量，减少多张高清图片同时解码造成的瞬时内存峰值。
- 只保留有限数量的临时缩略图缓存，不会无限累积已经浏览过的封面。
- 文件夹视图刷新或关闭时，会主动释放已经渲染的封面元素。

默认性能参数针对左侧边栏进行了优化，可以在 **设置 → Folder Cover Wall → Performance** 中调整。

从旧版本升级到 0.6.0 后，已有的外部封面会在首次加载时自动转换为优化后的格式。

## 文件夹重命名时保留封面

自定义封面会在文件夹重命名时自动跟随迁移。

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
- 查看优化后的封面尺寸以及源文件/存储大小。
- 按当前性能设置优化已有外部封面。
- 删除单独的外部封面图片。
- 删除未使用的外部图片。
- 清理失效的文件夹封面映射。
- 一次性删除所有外部封面图片。

同一张外部图片即使被多个文件夹使用，也只会保存一份。

## 安全与隐私

- Folder Cover Wall 不会为了封面图片发起网络请求。
- 只有在用户主动选择外部图片后，插件才会读取该文件。
- 外部导入仅允许 JPEG、PNG 和 WebP，并拒绝大于 32 MB 的源文件。
- 插件在解码前会校验保存的图片 data URL。
- 只有在用户打开 Vault 图片选择器时，插件才会枚举 Vault 文件，用于列出可选的本地图片。
- GitHub CI 会在构建和发布前运行 Obsidian 官方 `eslint-plugin-obsidianmd` 推荐规则。

## 外部图片与隐私

外部图片只会在本地读取。插件会将优化后的封面副本以嵌入式图片数据形式保存到自己的 `data.json` 中。

插件**不会将这些图片上传到任何地方**。

由于保存了本地优化副本，因此移动或重命名原始图片不会导致封面失效。

原始图片不会被插件修改。

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
- 最大封面分辨率
- WebP 封面质量
- Vault 封面临时缩略图优化
- 封面图片懒加载
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

重新加载 Obsidian 后，在 Community plugins 中启用 **Folder Cover Wall**。

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

运行 Obsidian 官方 ESLint 规则：

```bash
npm run lint
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
0.6.0
```

## License

MIT，详见 [LICENSE](./LICENSE)。
