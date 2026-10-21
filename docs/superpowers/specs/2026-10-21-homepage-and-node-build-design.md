# 好玩研究所 — 首页与 Node 构建改造 · 设计文档

- 日期：2026-10-21
- 仓库：`Endeavour-Yuan.github.io`（GitHub Pages 用户站，分支 `master`）
- 状态：已实现并通过验证

## 1. 背景与目标

仓库原本是纯静态的 GitHub Pages 站点：根目录下散落 4 个相互独立的 HTML 小测试页面和一个
`images/` 图片目录，没有 `index.html`（站点根 URL 返回 404）。

本次改造达成两件事：

1. **改造成 Node 构建项目**，用官方 GitHub Actions 直接部署到 GitHub Pages。
2. **新增首页「好玩研究所」**，数据驱动地列出所有测试，并进入已有页面。

### 已核实现状

- 4 个页面（`history_character / person_report / personality_bottles / scum_report`）均为**内联
  `<style>` + 内联经典 `<script>`**，无 `type="module"`、无本地外链 CSS/JS。
- 外部依赖走 CDN：Chart.js、GSAP、ScrollTrigger、ScrollToPlugin、Google Fonts。
- 图片仅由 `history_character.html` 在运行时以 `images/${name}.png` 动态引用，共 116 个 PNG。
- `mobile.992cbe.js` 无任何引用，是孤儿文件。
- 4 个页面各自带一个 4 位数字访问码闸门（`8023 / 2333 / 1314 / 2026`），硬编码于页面源码。

## 2. 非目标（YAGNI）

- 不把页面重写为 Vue/React，不引入路由/框架。
- 不修改 4 个既有页面的 HTML/CSS/JS 逻辑。
- 不迁移 CDN 依赖到本地 bundle。
- 不新增后端、不做真实鉴权。

## 3. 需求要点（来自用户）

1. 首页取一个直白的「趣味测试」类名字 → **好玩研究所**。
2. 测试**可能不止 4 个**，首页不能写死固定数量的卡片，要可扩展。
3. 首页**不出现任何验证码 / 入场码**信息，只提供入口。
4. 主题：**糖果马卡龙 + 深色霓虹的混搭**（赛博糖果）。

## 4. 构建与部署

### 4.1 目录结构

```
package.json            scripts: dev / build / preview
vite.config.js          MPA + HTML 压缩 + 图片拷贝
index.html              首页
styles.css              首页样式（被 Vite 打包为 assets/*.css）
main.js                 首页脚本（被 Vite 打包为 assets/*.js）
tests.js                测试清单数据
history_character.html  ┐
person_report.html      │ 保持不变，URL 不变
personality_bottles.html│
scum_report.html        ┘
images/                 116 个 PNG（保持在仓库根）
.github/workflows/deploy.yml
.gitignore              node_modules / dist
docs/…                  本文档
```

### 4.2 Vite 配置要点

- MPA：`build.rollupOptions.input` = 首页 + 4 个页面。
- `base: '/'`（用户站从域名根提供服务）。
- `build.outDir: 'dist'`，`emptyOutDir: true`。
- `publicDir: false`，改用自定义插件 `copyImagesPlugin` 在 `closeBundle` 时把
  `images/` 拷到 `dist/images/`。**这样做的原因**：既让 Actions 构建产出 `dist/images/`，
  又让「分支部署」模式下仓库根的 `images/` 仍然可用——两种部署方式都不会丢图。
- 自定义插件 `htmlMinifyPlugin`（`enforce:'post'`，`generateBundle`）：用
  `html-minifier-terser` 折叠空白、去注释、压缩内联 CSS；**不压缩内联 JS**
  （`minifyJS:false`），以避免 terser 改动既有页面脚本语义。
- `styles.css` / `main.js` 经 Vite 打包为带 hash 的资源（`assets/index-[hash].{css,js}`）。

### 4.3 GitHub Actions 部署

`.github/workflows/deploy.yml`：

- 触发 push 到 `master` 与 `workflow_dispatch`。
- 权限 `contents:read` / `pages:write` / `id-token:write`，`concurrency: pages`。
- build：`checkout@v4` → `setup-node@v4`（Node 20，npm cache）→ `npm ci` → `npm run build`
  → `configure-pages@v5` → `upload-pages-artifact@v3`（`path: dist`）。
- deploy：`deploy-pages@v4`，环境 `github-pages`。
- 不使用 `gh-pages` 分支。

**一次性人工步骤**：仓库 Settings → Pages → Source 选 **GitHub Actions**。
（若仍用旧的分支部署，根目录的源码也能正常跑，图片在仓库根，不会丢。）

## 5. 首页设计

### 5.1 数据驱动

`tests.js` 导出 `site` 与 `tests`：

```js
export const site = { name: '好玩研究所', tagline: '点一个，测测你自己' }
export const tests = [
  { id, title, subtitle, href, emoji, tag, accent }, // 想加几条加几条
]
```

`main.js` 读取 `tests` 渲染卡片网格（`repeat(auto-fill, minmax(300px,1fr))`），
**新增测试只需在数组里追加一条**，卡片数量与换行自动适配。空数组时显示占位文案。

现有 4 条：前世人物志 / 做人成绩单 / 人格小瓶子 / 渣渣检测中心，`href` 为对应 HTML。
**首页不含任何访问码信息**（无 `?code=`、无复制逻辑、无提示）。

### 5.2 视觉（赛博糖果）

- 深色底（`#0F0C18`）+ 霓虹糖果色：粉 `#FF5FA2`、薄荷 `#5CF2CE`、紫 `#A78BFA`、
  黄 `#FFD166`、珊瑚 `#FF8A5B`。
- 标题「好玩研究所」逐字着不同霓虹色 + 同色光晕。
- 玻璃拟态卡片（`backdrop-filter`），顶部霓虹细线，hover 出现彩色光晕与外描边。
- 无新增 CDN；中文用系统字体（`ui-rounded / PingFang SC` 等），免下载字体。

### 5.3 动画

1. **霓虹背景（Canvas）**：深色底上缓慢漂移的糖果色光斑，`globalCompositeOperation='lighter'`
   形成发光叠色；跟随鼠标的柔光；缓慢上升的星点。粒子数按视口缩放，页面隐藏时暂停。
2. **标题**：逐字「晕开」（`blur→0` + 上浮 + 缩放）依次入场。
3. **卡片**：`IntersectionObserver` 触发，错峰弹入（`translateY + scale`）。
4. **hover / 3D 跟随**：桌面端按指针位置做轻微 `rotateX/rotateY`，抬起并加强光晕。
5. **降级**：`prefers-reduced-motion` 时不播放位移/粒子；入口脚本加载失败时有 JS 独立的
   兜底计时器强制显示内容（避免首页空白）。

> 布局注意：卡片位移统一走 CSS 变量（`--ty/--sc/--rx/--ry`），由一个 `transform` 规则合成，
> 避免「入场动画 / hover 抬升 / 3D 跟随」互相覆盖。

## 6. 验收结果（已执行）

1. `npm ci && npm run build` 成功；`dist/` 含 5 个 HTML、`images/`（116 个）、
   `assets/index-[hash].css`、`assets/index-[hash].js`。
2. `npm run preview` / `npm run dev` 下：首页渲染正常，`/images/诸葛亮.png` 返回 200。
3. 首页可见文案、内联 JS 与改造前**逐字节一致（JS 语义不变；仅少量空白/注释被压缩）**。
4. 4 个既有页面在源码服务与构建产物下渲染对比：`person_report / history_character /
   scum_report` **逐像素一致**；`personality_bottles` 因页面自身的 `Math.random` 与 canvas
   动画存在随机性（同源两次渲染差异更大），非构建所致。
5. 无 JS 报错；首页在 `prefers-reduced-motion` 与 375–420px 移动宽度下均正常。
6. Actions 工作流 YAML 校验通过。

## 7. 风险与缓解

| 风险 | 缓解 |
|---|---|
| 压缩破坏既有页面 | 仅压缩空白/注释/内联 CSS，不动内联 JS；渲染逐像素比对验证 |
| 图片运行时路径被误处理 | 图片放仓库根，构建后原样拷贝到 `dist/images/` |
| Pages Source 未切换 | README 显著提示；同时兼容分支部署 |
| 入口脚本加载失败导致首页空白 | 独立的兜底计时器强制显示内容 |
| 中文文件名 URL 编码 | 实测 `/images/诸葛亮.png` 正常返回 |
