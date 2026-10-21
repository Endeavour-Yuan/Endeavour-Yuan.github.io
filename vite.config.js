import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { cpSync, existsSync } from 'node:fs'
import { minify } from 'html-minifier-terser'

const page = (name) => fileURLToPath(new URL(`./${name}.html`, import.meta.url))

// 压缩 HTML：折叠空白、去注释、压缩内联 CSS。
// 刻意不压缩内联 JS（minifyJS:false），避免 terser 对既有页面脚本产生语义风险。
function htmlMinifyPlugin() {
  return {
    name: 'fengyaji:html-minify',
    enforce: 'post',
    apply: 'build',
    async generateBundle(_options, bundle) {
      for (const file of Object.keys(bundle)) {
        if (!file.endsWith('.html')) continue
        const chunk = bundle[file]
        const source = typeof chunk.source === 'string'
          ? chunk.source
          : Buffer.from(chunk.source).toString('utf8')
        chunk.source = await minify(source, {
          collapseWhitespace: 'conservative',
          removeComments: true,
          minifyCSS: true,
          minifyJS: false,
          keepClosingSlash: true,
        })
      }
    },
  }
}

// 把仓库根的 images/ 拷进 dist/images/。
// 页面在运行时用 `images/${name}.png` 动态拼路径，Vite 无法静态分析，
// 所以不用 import，而是构建后原样拷贝。
// 放在仓库根（而不是 public/）是为了让「分支部署」和「Actions 部署」两种方式都能正确取到图片。
function copyImagesPlugin() {
  return {
    name: 'fengyaji:copy-images',
    apply: 'build',
    closeBundle() {
      const src = fileURLToPath(new URL('./images', import.meta.url))
      const dest = fileURLToPath(new URL('./dist/images', import.meta.url))
      if (existsSync(src)) cpSync(src, dest, { recursive: true })
    },
  }
}

// GitHub Pages 用户站：从域名根提供服务
export default defineConfig({
  base: '/',
  publicDir: false,
  plugins: [htmlMinifyPlugin(), copyImagesPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // 多页应用：首页 + 四个既有页面，输出同名 HTML 以保持 URL 不变
    rollupOptions: {
      input: {
        index: page('index'),
        history_character: page('history_character'),
        person_report: page('person_report'),
        personality_bottles: page('personality_bottles'),
        scum_report: page('scum_report'),
      },
    },
  },
})
