/* =====================================================================
   好玩研究所 · 首页脚本
   - 从 tests.js 读取测试清单并渲染卡片（数量自动适配）
   - 入场动画 / 3D 跟随 / 霓虹背景
   ===================================================================== */

import { site, tests } from './tests.js'

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const canHover = matchMedia('(hover: hover)').matches

/* 糖果霓虹配色：卡片 accent 名 → [主色, 亮色] */
const ACCENTS = {
  pink:   ['#FF5FA2', '#FF9CC8'],
  mint:   ['#5CF2CE', '#9DF7E4'],
  violet: ['#A78BFA', '#CDBBFF'],
  yellow: ['#FFD166', '#FFE6AC'],
  coral:  ['#FF8A5B', '#FFB491'],
}
const ORDER = Object.keys(ACCENTS)
const TITLE_COLORS = ['#FF5FA2', '#A78BFA', '#5CF2CE', '#FFD166', '#FF8A5B']

function hexToRgba(hex, a){
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
function reveal(el){ el.classList.add('in') }

/* ---------------- 站点名 / 副标题 ---------------- */
const brandEl = document.getElementById('brand')
const taglineEl = document.getElementById('tagline')
if (brandEl && site.name) brandEl.textContent = site.name
if (taglineEl && site.tagline) taglineEl.textContent = site.tagline
if (site.name) document.title = `${site.name} · ${site.tagline || ''}`.trim()

/* ---------------- 标题拆字（逐字着色 + 依次入场） ---------------- */
const chars = []
if (brandEl){
  const text = (brandEl.textContent || '').trim()
  brandEl.textContent = ''
  Array.from(text).forEach((ch, i) => {
    const span = document.createElement('span')
    span.className = 'ch'
    span.textContent = ch
    const color = TITLE_COLORS[i % TITLE_COLORS.length]
    span.style.color = color
    span.style.textShadow = `0 0 26px ${hexToRgba(color, .55)}`
    brandEl.appendChild(span)
    chars.push(span)
  })
}

/* ---------------- 渲染测试卡片 ---------------- */
const grid = document.getElementById('testGrid')
const cards = []
if (grid){
  if (!tests.length){
    const empty = document.createElement('p')
    empty.className = 'grid-empty'
    empty.textContent = '暂无测试，敬请期待～'
    grid.appendChild(empty)
  }
  tests.forEach((t, i) => {
    const [c1, c2] = ACCENTS[t.accent] || ACCENTS[ORDER[i % ORDER.length]]
    const a = document.createElement('a')
    a.className = 'test-card'
    a.href = t.href
    if (t.id) a.dataset.id = t.id
    a.style.setProperty('--c1', c1)
    a.style.setProperty('--c2', c2)
    a.style.setProperty('--glow', hexToRgba(c1, .45))
    a.style.setProperty('--soft', hexToRgba(c1, .16))
    a.style.setProperty('--edge', hexToRgba(c1, .45))
    a.setAttribute('aria-label', t.title + (t.subtitle ? '：' + t.subtitle : ''))
    a.innerHTML =
      '<span class="test-icon" aria-hidden="true"></span>' +
      '<span class="test-body">' +
        '<span class="test-tag"></span>' +
        '<span class="test-title"></span>' +
        '<span class="test-sub"></span>' +
      '</span>' +
      '<span class="test-go" aria-hidden="true">→</span>'
    a.querySelector('.test-icon').textContent = t.emoji || '✨'
    a.querySelector('.test-title').textContent = t.title
    a.querySelector('.test-sub').textContent = t.subtitle || ''
    const tag = a.querySelector('.test-tag')
    if (t.tag) tag.textContent = t.tag
    else tag.remove()
    grid.appendChild(a)
    cards.push(a)
  })
}

/* ---------------- 入场揭示 ---------------- */
chars.forEach((ch, i) => setTimeout(() => reveal(ch), i * (reduce ? 0 : 160)))
setTimeout(() => {
  document.querySelectorAll('.eyebrow,.tagline,.scroll-hint').forEach(reveal)
}, reduce ? 0 : 480)

if ('IntersectionObserver' in window && !reduce){
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return
      const idx = cards.indexOf(en.target)
      setTimeout(() => reveal(en.target), Math.max(0, idx) * 90)
      io.unobserve(en.target)
    })
  }, { threshold: .15, rootMargin: '0px 0px -6% 0px' })
  cards.forEach((c) => io.observe(c))
} else {
  cards.forEach(reveal)
}

// 兜底：任何异常都不要让头部内容永久隐藏
addEventListener('load', () => {
  setTimeout(() => {
    document.querySelectorAll('.eyebrow,.tagline,.scroll-hint,.brand .ch').forEach(reveal)
  }, 2400)
})

/* ---------------- 展开按钮 ---------------- */
const hint = document.getElementById('scrollHint')
if (hint){
  hint.addEventListener('click', () => {
    const g = document.getElementById('testGrid')
    if (g) g.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  })
}

/* ---------------- 卡片 3D 跟随 ---------------- */
if (canHover && !reduce){
  cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - .5
      const py = (e.clientY - r.top) / r.height - .5
      card.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg')
      card.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg')
    })
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--ry', '0deg')
      card.style.setProperty('--rx', '0deg')
    })
  })
}

/* ---------------- 霓虹背景 ---------------- */
const canvas = document.getElementById('glow')
if (canvas && canvas.getContext){
  const ctx = canvas.getContext('2d')
  const NEON = [[255,95,162],[92,242,206],[167,139,250],[255,209,102],[255,138,91]]
  const Q = .6
  let W = 0, H = 0
  let blobs = [], stars = []
  let raf = null, running = true, last = 0
  let mx = 0, my = 0, tx = 0, ty = 0
  const isSmall = () => innerWidth < 720

  function makeBlob(){
    const c = NEON[(Math.random() * NEON.length) | 0]
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: 150 + Math.random() * (isSmall() ? 150 : 260),
      vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18,
      a: .05 + Math.random() * .10,
      t: Math.random() * 1000, ttl: 700 + Math.random() * 900, c,
    }
  }
  function makeStar(){
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: .4 + Math.random() * 1.1, vy: -(.05 + Math.random() * .18),
      a: .10 + Math.random() * .35,
      t: Math.random() * 400, ttl: 500 + Math.random() * 900,
    }
  }
  function seed(){
    const nb = isSmall() ? 6 : 10, ns = isSmall() ? 18 : 46
    blobs = []; for (let i = 0; i < nb; i++) blobs.push(makeBlob())
    stars = []; for (let j = 0; j < ns; j++) stars.push(makeStar())
  }
  function resize(){
    W = innerWidth; H = innerHeight
    canvas.width = Math.max(1, Math.floor(W * Q))
    canvas.height = Math.max(1, Math.floor(H * Q))
    ctx.setTransform(Q, 0, 0, Q, 0, 0)
    seed()
  }
  function draw(dt){
    ctx.clearRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'lighter'

    for (let i = 0; i < blobs.length; i++){
      const b = blobs[i]
      b.t += dt; b.x += b.vx; b.y += b.vy
      if (b.t > b.ttl){ blobs[i] = makeBlob(); continue }
      if (b.x < -b.r) b.x = W + b.r; else if (b.x > W + b.r) b.x = -b.r
      if (b.y < -b.r) b.y = H + b.r; else if (b.y > H + b.r) b.y = -b.r
      const env = Math.sin(b.t / b.ttl * Math.PI)
      const x = b.x + mx * 18, y = b.y + my * 14
      const col = `rgba(${b.c[0]},${b.c[1]},${b.c[2]},`
      const g = ctx.createRadialGradient(x, y, 0, x, y, b.r)
      g.addColorStop(0, col + (b.a * env).toFixed(4) + ')')
      g.addColorStop(.5, col + (b.a * env * .4).toFixed(4) + ')')
      g.addColorStop(1, col + '0)')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.2832); ctx.fill()
    }

    // 光标光晕
    const cx = W / 2 + mx * W * .42, cy = H * .5 + my * H * .42
    const cr = Math.min(W, H) * .5
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr)
    cg.addColorStop(0, 'rgba(167,139,250,.14)')
    cg.addColorStop(.5, 'rgba(92,242,206,.05)')
    cg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = cg
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 6.2832); ctx.fill()

    // 星点
    for (let k = 0; k < stars.length; k++){
      const s = stars[k]
      s.t += dt; s.y += s.vy
      if (s.t > s.ttl || s.y < -10){ stars[k] = makeStar(); stars[k].y = H + 8; continue }
      const se = Math.sin(s.t / s.ttl * Math.PI)
      ctx.fillStyle = `rgba(255,255,255,${(s.a * se).toFixed(4)})`
      ctx.beginPath(); ctx.arc(s.x + mx * 26, s.y + my * 20, s.r, 0, 6.2832); ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }
  function loop(now){
    if (!running) return
    const dt = Math.min(48, now - (last || now)); last = now
    mx += (tx - mx) * .05; my += (ty - my) * .05
    draw(dt)
    raf = requestAnimationFrame(loop)
  }

  addEventListener('resize', () => { resize(); if (reduce) draw(1) })
  addEventListener('pointermove', (e) => {
    tx = (e.clientX / innerWidth - .5) * 2
    ty = (e.clientY / innerHeight - .5) * 2
  }, { passive: true })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden){ running = false; if (raf) cancelAnimationFrame(raf) }
    else if (!reduce){ running = true; last = 0; raf = requestAnimationFrame(loop) }
  })

  resize()
  if (reduce) draw(1)
  else raf = requestAnimationFrame(loop)
}
