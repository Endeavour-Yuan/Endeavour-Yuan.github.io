# 风雅集 — 首页与 Node 构建改造 · 设计文档

- 日期：2026-10-21
- 仓库：`Endeavour-Yuan.github.io`（GitHub Pages 用户站，分支 `master`）
- 状态：已与用户确认

## 1. 背景与目标

当前仓库是纯静态的 GitHub Pages 站点，根目录下放着 4 个相互独立的 HTML 小测试页面和一个
`images/` 图片目录。没有 `index.html`，所以站点根 URL 目前返回 404。

本次改造要达成两件事：

1. **把仓库改造成 Node 构建项目**，通过官方 GitHub Actions 直接部署到 GitHub Pages。
2. **新增一个首页「风雅集」**，以国风水墨风格动画呈现，用于进入已有的 4 个页面。

### 现状事实（已核实）

- `history_character.html`、`person_report.html`、`personality_bottles.html`、`scum_report.html` 均在仓库根目录。
- 4 个页面均**只使用内联 `<style>` 与内联经典 `<script>`**（没有 `type="module"`，没有本地外链 CSS/JS）。
- 外部依赖全部走 CDN：Chart.js、GSAP、ScrollTrigger、ScrollToPlugin、Google Fonts。本次不改动这些引用。
- 图片仅在 `history_character.html` 中以运行时动态路径引用：`const AVATAR_URL = name => \`images/${name}.png\``（第 2233 行），共 116 个 PNG。
- `mobile.992cbe.js`（106 KB webpack bundle）**没有被任何文件引用**，是孤儿文件。
- 4 个页面均有一个 4 位数字「访问验证」入口闸：
  - `history_character.html` → `8023`，且支持链接 `?code=xxxx` 自动解锁。
  - `person_report.html` → `2333`。
  - `personality_bottles.html` → `1314`。
  - `scum_report.html` → `2026`。
- 访问码硬编码在页面源码中，仓库公开，因此闸门属于「仪式感」而非安全边界。

## 2. 非目标（YAGNI）

- 不把页面重写为 Vue/React 组件，不引入路由或框架。
- 不修改 4 个现有页面的 HTML/CSS/JS 逻辑（链接路径与内联资源保持原样）。
- 不迁移 CDN 依赖到本地 bundle。
- 不新增后端、不做真实鉴权。

## 3. 构建与部署方案

### 3.1 目录结构（改造后）

```
package.json                    # scripts: dev / build / preview
vite.config.js                  # MPA 配置
index.html                      # 新建首页「风雅集」
history_character.html          # 保持不变，URL 不变
person_report.html              # 保持不变，URL 不变
personality_bottles.html        # 保持不变，URL 不变
scum_report.html                # 保持不变，URL 不变
public/images/…                 # 由 images/ 移动而来，原样拷贝到 dist/
.github/workflows/deploy.yml    # 构建 + 发布到 GitHub Pages
.gitignore                      # node_modules / dist
docs/superpowers/specs/…        # 本文档
```

### 3.2 Vite 配置要点

- 使用 Vite 多页（MPA）构建：`build.rollupOptions.input` 指向 `index.html` 与 4 个页面。
- `root` 为仓库根，`base: '/'`（用户站从域名根提供服务）。
- `publicDir: 'public'`，`build.outDir: 'dist'`，`emptyOutDir: true`。
- 输出文件名与源 HTML 同名并位于 `dist/` 根：`dist/index.html`、`dist/history_character.html` 等，**现有 URL 完全不变**。
- Vite 会处理内联 `<style>`（抽取并压缩为带 hash 的 CSS），内联经典 `<script>` 保持原样不动。
- `package.json` 使用 `"type": "module"`，devDependency 仅 `vite`。

### 3.3 图片处理

`images/` 移动为 `public/images/`。Vite 将 `public/` 原样拷贝到 `dist/` 根，因此
`dist/images/*.png` 存在；页面运行时的相对路径 `images/${name}.png` 从 `dist/` 根页面解析后
正好命中 `/images/*.png`。因为该路径是运行时模板字符串，Vite 无法静态分析，所以必须放
`public/`（而非被 import）。

### 3.4 删除孤儿文件

删除 `mobile.992cbe.js`（无引用，git 历史仍保留）。

### 3.5 GitHub Actions 部署

新增 `.github/workflows/deploy.yml`：

- 触发：push 到 `master`，以及 `workflow_dispatch`。
- 权限：`contents: read`、`pages: write`、`id-token: write`。
- `concurrency: group: pages, cancel-in-progress: true`。
- build job：`actions/checkout@v4` → `actions/setup-node@v4`（Node 20，npm cache）→ `npm ci` → `npm run build` → `actions/configure-pages@v5` → `actions/upload-pages-artifact@v3`（path: `dist`）。
- deploy job：`needs: build`，环境 `github-pages`，`actions/deploy-pages@v4`。
- 不使用 `gh-pages` 分支。

**一次性人工步骤（写入 README 或交付说明）：** 仓库 Settings → Pages → Source 选择 **GitHub Actions**。

## 4. 首页「风雅集」设计

### 4.1 文案与结构

```
<body>
  <canvas id="ink">            背景水墨
  <header class="hero">
     <p class="eyebrow">东方雅集 · 四卷</p>
     <h1 class="brand">风雅集</h1>        ← 毛笔书写逐字显现
     <p class="tagline">四道小题，照见一个人</p>
     <div class="scroll-hint">↓ 展开卷轴</div>
  </header>
  <main class="gallery">       4 张「卷轴卡片」<a class="scroll-card">
  <footer>© Endeavour-Yuan</footer>
</body>
```

### 4.2 四张卡片

| 印章字 | 标题 | 副标题 | 入场码 | 链接 / 行为 |
|---|---|---|---|---|
| 档 | 前世人物志 | 你像哪位历史人物 | 8023 | `history_character.html?code=8023`（自动解锁） |
| 考 | 做人成绩单 | 你做人能得几分 | 2333 | `person_report.html`，点击复制码 |
| 瓶 | 人格小瓶子 | 你是哪一款 | 1314 | `personality_bottles.html`，点击复制码 |
| 渣 | 渣渣检测中心 | 测测你能渣到什么程度 | 2026 | `scum_report.html`，点击复制码 |

卡片 DOM 语义：外层 `<a>` 指向目标页面，内部含印章 `<span class="seal">`、标题 `<h2>`、
副标题 `<p>`、入场码提示/揭示元素。入场码同时写入 `data-code` 属性供 JS 读取。

### 4.3 视觉规范

- 配色沿用《前世人物志》工笔重彩：
  `--paper:#FBF6EC`、`--paper-2:#F3E9D6`、`--cinnabar:#B13A2A`、`--cinnabar-deep:#8E2B21`、
  `--gold:#B8934A`、`--gold-soft:#D8BE85`、`--ink:#33241C`、`--ink-soft:#6A5747`。
- 标题用楷体/衬线（`"Kaiti SC","STKaiti","KaiTi",serif`），正文用系统无衬线。
- 不新增 CDN 依赖；纯原生 CSS + JS。

### 4.4 动画清单

1. **水墨背景（Canvas）**：缓动扩散的半透明墨点/墨晕；鼠标轻微视差；粒子数按视口缩放并设上限；`requestAnimationFrame` 驱动；页面 `visibilitychange` 隐藏时暂停。
2. **标题「风雅集」**：逐字「墨迹晕开」（`opacity 0→1`、`blur(8px)→0`、小幅上浮），按字错峰延迟；下方一笔 SVG 笔锋横向 draw-on。
3. **卷轴卡片入场**：`IntersectionObserver` 触发；卡片自上而下展开（`scaleY` + 轻微旋转），四张错峰。
4. **卡片 hover**：盖下朱砂印章（放大→回落 + 墨圈扩散）+ 3D 倾斜跟随鼠标 + 入场码揭示。
5. **点击行为**：见 4.2 表。对于需要复制入场码的三页，点击时先 `preventDefault()`，`await navigator.clipboard.writeText(code)` 成功并弹出「入场码已复制：xxxx」提示后（最多约 350ms），再 `location.href = href` 跳转；这样保证复制在导航前完成。剪贴板不可用（拒绝授权/非安全上下文）时，提示改为「请手动输入入场码：xxxx」，随后仍跳转。「前世人物志」不需要复制，直接以 `?code=8023` 跳转。
6. **无动画/降级**：`prefers-reduced-motion: reduce` 时禁用位移/粒子等重动画，仅保留淡入；无 JS 时内容与链接静态可用（渐进增强）。

### 4.5 移动端与性能

- 卡片纵向堆叠；降低 Canvas 粒子数；动画在窄屏减弱。
- Canvas 尺寸适配 `devicePixelRatio`，避免模糊与过度绘制。

## 5. 验收标准

1. `npm install && npm run build` 成功，`dist/` 包含：`index.html`、四个页面 HTML、`images/`（116 个 PNG）、带 hash 的 CSS。
2. `npm run preview` 打开首页：水墨动画、标题显现、卡片入场与 hover 印章/入场码效果正常。
3. 首页四张卡片跳转正确；「前世人物志」经 `?code=8023` 直达内容；其余三页点击后剪贴板含对应入场码。
4. 4 个原有页面在新构建下与改造前表现一致（含图片、CDN 依赖、闸门）。
5. `prefers-reduced-motion` 及禁用 JS 时内容可读、链接可用。
6. push 到 `master` 后 Actions 部署成功（需先在仓库设置中把 Pages Source 设为 GitHub Actions）。

## 6. 风险与缓解

| 风险 | 缓解 |
|---|---|
| Vite 解析超大内联 HTML 出错 | 4 页均为内联经典脚本、无 `type=module`；先跑 `npm run build` 实测，若失败则对该文件改用 asset 拷贝策略 |
| 中文图片文件名在 URL 中编码 | `public/` 拷贝保留原名，浏览器自动编码；实测确认可加载 |
| 运行时拼接的图片路径被 Vite 误判 | 路径放 `public/` 且不改动页面源码，天然规避 |
| Pages Source 未切换导致仍发布旧根目录 | 交付说明中明确人工步骤；workflow 使用 `deploy-pages` |
