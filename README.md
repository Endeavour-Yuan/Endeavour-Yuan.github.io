# 好玩研究所

一个装满趣味测试的小站。首页「好玩研究所」列出全部测试，点卡片进入对应页面。

本站是一个 Node 构建项目（Vite 多页应用），通过 GitHub Actions 自动构建并部署到 GitHub Pages。

## 本地开发

```bash
npm install
npm run dev        # 本地开发，默认 http://localhost:5173
npm run build      # 产物输出到 dist/
npm run preview    # 本地预览 dist/ 构建产物
```

## 目录结构

```
index.html              首页（结构 + 入口）
styles.css              首页样式
main.js                 首页脚本（渲染卡片 / 动画 / 霓虹背景）
tests.js                测试清单数据 ← 新增测试改这里
history_character.html  测试页面（4 个，保持原样）
person_report.html
personality_bottles.html
scum_report.html
images/                 测试页面用到的图片
vite.config.js          构建配置
.github/workflows/deploy.yml   自动部署
```

## 新增一个测试

1. 把新的 `.html` 页面放到仓库根目录。
2. 在 `tests.js` 的 `tests` 数组里加一条：

```js
{
  id: 'my-test',              // 唯一标识
  title: '我的新测试',
  subtitle: '一句话说明',
  href: 'my_test.html',       // 指向页面
  emoji: '🎲',
  tag: '新',                  // 可留空
  accent: 'mint',             // pink / mint / violet / yellow / coral
}
```

首页会自动多出一张卡片，数量与换行自动适配，不需要改动 `index.html` 或 `main.js`。
若新增页面被 Vite 当作新的入口打包（例如页面引用了相对资源），把它加到
`vite.config.js` 的 `rollupOptions.input` 即可。

## 部署到 GitHub Pages

工作流 `.github/workflows/deploy.yml` 会在 push 到 `master` 时自动构建并发布 `dist/`。

**首次需要手动设置一次：**

> 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。

设置后，每次 push 到 `master` 都会自动部署。

> 兼容说明：如果暂时没有切换 Source、仍使用「Deploy from a branch」（`master` 根目录），
> 站点也能正常工作——源码里的 `index.html`、4 个页面以及仓库根的 `images/` 都是可直接访问的。

## 说明

- 4 个测试页面各自的访问码只存在于对应页面源码中，**首页不会显示或传递任何访问码**。
- 构建只压缩 HTML 空白、注释与内联 CSS，不改动既有页面的内联 JavaScript。
