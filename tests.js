// ─────────────────────────────────────────────────────────────
// 测试清单
// 新增一个测试：在数组里加一条即可，首页会自动渲染卡片，
// 数量、换行、排版都会自动适配，无需改动 index.html / main.js。
//
// 字段说明：
//   id       唯一标识（用于 DOM id / 埋点，可留空）
//   title    卡片主标题
//   subtitle 卡片副标题（一句话说明）
//   href     目标页面（仓库根目录下的 HTML 文件）
//   emoji    卡片图标
//   tag      右上角小标签（可留空）
//   accent   配色，见 main.js 的 ACCENTS：pink / mint / violet / yellow / coral
// ─────────────────────────────────────────────────────────────

export const site = {
  name: '好玩研究所',
  tagline: '点一个，测测你自己',
}

export const tests = [
  {
    id: 'history',
    title: '前世人物志',
    subtitle: '你像哪位历史人物',
    href: 'history_character.html',
    emoji: '🏮',
    tag: '历史',
    accent: 'pink',
  },
  {
    id: 'person',
    title: '做人成绩单',
    subtitle: '你做人能得几分',
    href: 'person_report.html',
    emoji: '📝',
    tag: '做人',
    accent: 'mint',
  },
  {
    id: 'bottles',
    title: '人格小瓶子',
    subtitle: '你是哪一款',
    href: 'personality_bottles.html',
    emoji: '🫙',
    tag: '人格',
    accent: 'violet',
  },
  {
    id: 'scum',
    title: '渣渣检测中心',
    subtitle: '测测你能渣到什么程度',
    href: 'scum_report.html',
    emoji: '🧪',
    tag: '娱乐',
    accent: 'yellow',
  },
]
