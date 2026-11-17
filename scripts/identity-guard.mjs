// identity-guard.mjs — 个人展示页「身份信息与汉字」不可回归闸门
// 每次 push 到 master 都必须通过：
//   ① 必须包含：赵欣曈 / 南方科技大学 / 香港中文大学 / 计算机科学与技术 /
//      全国中学生物理竞赛 / 铜牌 / 江西省一等奖 / 江西省二等奖 / 法狗狗公司 / 隐盾 / 应用工程师
//   ② 必须不包含（往例幻觉 / 旧错字 / 过时篇章数）：隐图 / 践哲 / 暨南大学 / 国家网络安全竞赛 /
//      硕士研究生 / 十九篇 / 二十一篇 / WCAG 1.0
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8')

const need = ['赵欣曈', '南方科技大学', '香港中文大学', '计算机科学与技术', '全国中学生物理竞赛', '铜牌', '江西省一等奖', '江西省二等奖', '法狗狗公司', '隐盾', '应用工程师']
const ban = ['隐图', '践哲', '暨南大学', '国家网络安全竞赛', '硕士研究生', '十九篇', '二十一篇', 'WCAG 1.0', '国家中学生物理竞赛']

let fail = 0
for (const s of need) {
  if (!html.includes(s)) {
    console.error(`::error::identity-guard: MISSING required phrase: ${s}`)
    fail = 1
  }
}
for (const s of ban) {
  if (html.includes(s)) {
    console.error(`::error::identity-guard: FOUND forbidden phrase: ${s}`)
    fail = 1
  }
}
if (fail === 0) console.log('identity-guard: OK — 身份信息与禁语全部对账通过')
process.exit(fail)
