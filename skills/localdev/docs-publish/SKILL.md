# Skill: 文档站发布（docs.nexu.io）

## 触发词
doc站、文档站、docs、发布文档、提交文档、VitePress、docs.nexu.io、发博客

## 能力概述
将文章（HTML / Markdown / 公众号预览稿）转换为 VitePress 文档页面，完成侧边栏注册、图片资源迁移、本地预览验证，一站式提交到 `docs/` 目录。

---

## 一、文档站结构速查

```
docs/
├── .vitepress/config.ts        # 侧边栏 + 路由配置（中英双语）
├── en/                         # 英文页面
│   ├── index.md
│   └── guide/
│       ├── channels.md         # 渠道总览页
│       ├── channels/           # 各渠道子页
│       ├── concepts.md
│       ├── quickstart.md
│       ├── models.md
│       ├── skills.md
│       ├── contributing.md
│       ├── contact.md
│       └── star.md
├── zh/                         # 中文页面（与 en/ 结构对齐）
│   ├── index.md
│   └── guide/
│       └── ...
├── public/assets/              # 静态资源（图片）
├── scripts/                    # dev.mjs, normalize-assets.mjs 等
├── package.json                # 独立项目，不在根 pnpm-workspace 内
└── pnpm-workspace.yaml         # docs 自己的 workspace root
```

### 路由规则

VitePress 的 rewrite 把 `en/` 映射到根路径：

| 源文件 | 线上 URL |
|--------|----------|
| `docs/en/guide/foo.md` | `/guide/foo` |
| `docs/zh/guide/foo.md` | `/zh/guide/foo` |
| `docs/en/index.md` | `/` |
| `docs/zh/index.md` | `/zh/` |

---

## 二、端到端发布流程

### 步骤 1：准备内容

1. 读取源文件（`.tmp/` 下的 HTML 预览稿、Markdown 等）
2. 从 HTML 中提取纯文本结构，转为 VitePress Markdown：
   - `<h1>` → `#`，`<h2>` → `##`，`<h3>` → `###`
   - `<blockquote>` 声明 → `::: warning` / `::: tip` 容器
   - `<table>` → Markdown 表格
   - `<strong>` → `**粗体**`
   - `<a href>` → `[文字](URL)`
   - `<figure><img src="xxx">` → `![描述](/assets/新文件名)`
3. 移除所有内联 `style="..."` 属性（VitePress 自带主题）

### 步骤 2：迁移图片

1. 将图片从源目录复制到 `docs/public/assets/`
2. 重命名为语义化文件名（如 `wechat-clawbot-overview.png`，不要用 `image1.png`）
3. Markdown 中引用路径统一为 `/assets/文件名`

### 步骤 3：创建中英文页面

1. 中文页面写入 `docs/zh/guide/<slug>.md`
2. 英文页面写入 `docs/en/guide/<slug>.md`
3. 两个版本结构保持一致，标题和内容对应翻译

### 步骤 4：注册侧边栏

在 `docs/.vitepress/config.ts` 中：

1. 找到 `enSidebar`，在合适分组的 `items` 数组中添加条目：
   ```ts
   { text: "Page Title", link: "/guide/<slug>" }
   ```
2. 找到 `zhSidebar`，添加对应中文条目：
   ```ts
   { text: "页面标题", link: "/zh/guide/<slug>" }
   ```
3. 如果页面属于某个索引页（如 `channels.md`），也在该索引页末尾加链接

### 步骤 5：本地预览验证

```bash
cd docs
pnpm install
pnpm dev
```

在浏览器打开本地地址（通常 `http://localhost:5173/`），验证：
- [ ] 中英文页面均可正常渲染
- [ ] 图片正常加载
- [ ] 侧边栏出现新条目
- [ ] 链接跳转正确

---

## 三、已知坑与解决方案

### 3.1 pnpm v10 忽略 esbuild / sharp 构建脚本

**现象**：`pnpm install` 后提示 `Ignored build scripts: esbuild@0.21.5, sharp@0.34.5`，VitePress 启动无任何输出（静默挂起）。

**原因**：pnpm v10 默认不执行第三方包的 postinstall 脚本，需要显式批准。

**解决**：临时在 `docs/package.json` 中添加：

```json
{
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild", "sharp"]
  }
}
```

然后重新安装：

```bash
cd docs
rm -rf node_modules
pnpm install
```

安装完成后应看到 `esbuild postinstall: Done` 和 `sharp install: Done`。

**注意**：完成后还原 `package.json`，不要将此临时字段提交到仓库（除非团队决定持久保留）。

### 3.2 `pnpm approve-builds` 需要交互式 TTY

**现象**：在非交互终端（如 Cursor 的 shell 工具）中运行 `pnpm approve-builds` 会挂起等待用户选择。

**解决**：不要用 `pnpm approve-builds`，改用上面的 `package.json` 方案。

### 3.3 端口被占用

**现象**：`pnpm dev` 提示 `Port 5173 is in use, trying another one...`，自动切换到 5174、5175 等。

**解决**：查看实际输出中显示的端口号，或者先清理占用端口：

```bash
lsof -ti:5173 | xargs kill -9
```

### 3.4 线上 404 ≠ 本地出错

**现象**：在 `docs.nexu.io` 上打开新页面看到 404。

**原因**：改动只在本地，还没有推送到远程仓库并部署。

**解决**：确认本地预览正常后，推送分支、合并 PR，等待部署流程完成即可。

---

## 四、VitePress 容器语法速查

文档站支持以下 Markdown 容器（对应原始 HTML 中的 `<blockquote>` 声明块）：

```markdown
::: tip 标题
正文内容
:::

::: warning 标题
正文内容
:::

::: danger 标题
正文内容
:::

::: details 点击展开
折叠内容
:::
```

---

## 五、文件命名规范

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 页面文件 | `kebab-case.md` | `wechat-clawbot.md` |
| 图片文件 | `<页面slug>-<描述>.{png,jpeg,webp}` | `wechat-clawbot-overview.png` |
| 图片目录 | 统一放 `docs/public/assets/` | — |

---

## 六、提交检查清单

- [ ] 中英文页面均已创建且结构对齐
- [ ] 图片已复制到 `docs/public/assets/` 并用语义化文件名
- [ ] `config.ts` 中英文侧边栏均已添加条目
- [ ] 相关索引页（如 `channels.md`）已添加链接
- [ ] 本地 `pnpm dev` 预览正常（页面渲染、图片加载、侧边栏导航）
- [ ] 未引入不必要的文件变更（如临时的 `pnpm.onlyBuiltDependencies`）
- [ ] Markdown 中不包含内联 HTML 样式
