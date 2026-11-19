// identity-guard.mjs — 个人展示页「身份信息与汉字」不可回归闸门
// 每次 push 到 master 都必须通过：
//   ① 必须包含：赵欣曈 / 南方科技大学 / 香港中文大学 / 计算机科学与技术 /
//      全国中学生物理竞赛 / 铜牌 / 江西省一等奖 / 江西省二等奖 / 法狗狗公司 / 隐盾 / 应用工程师 /
//   ② 必须不包含（往例幻觉 / 旧错字 / 过时篇章数）：隐图 / 践哲 / 暨南大学 / 国家网络安全竞赛 /
//      硕士研究生 / 十九篇 / 二十一篇 / WCAG 1.0 / 国家中学生物理竞赛
//   ③ 必须不包含（2026-11-17 增补·形近/同音简体误写；本页简体+工程语境零合法用法）：
//      铜板（铜牌）· 一等将 / 二等将（奖）· 獎 / 賽（混繁体）· 既使（即使）· 做为（作为）· 其它（其他）·
//      登陆（登录）· 真象（真相）· 气慨（气概）· 迫不急待（迫不及待）· 翻天复地（翻天覆地）·
//      相形见拙（相形见绌）· 走头无路（走投无路）· 变本加利（变本加厉）· 甘败下风（甘拜下风）·
//      一股作气（一鼓作气）· 一愁莫展（一筹莫展）· 穿流不息（川流不息）· 美仑美奂（美轮美奂）·
//      漠不关心（莫不关心）· 挺而走险（铤而走险）· 坚苦（艰苦）· 按装（安装）· 九宵（九霄）· 黄梁（黄粱）·
//      草管人命（草菅人命）· 不尽人意（不尽如人意）· 额首（额手称庆）· 年青（年轻）· 幅射（辐射）·
//      直接了当（直截了当）· 受益非浅（受益匪浅）· 面面具到（面面俱到）· 耳儒目染（耳濡目染）
// （2026-11-18 历史补录）：IELTS 6.5 / CET6 546 在用户 2026-11-18 明言: "别忘了在我个人主页加上 雅思6.5 六级 546 即 IELTS6.5 CET6 546 可以的"，此后入册永久磐石。
// （2026-11-20 增补）：禁语同样扫 README.md；index-stats 的中英数字必须逐位一致，
// 且等于 GitHub API 实测的 16 仓库 / 9 旗舰 / 4 公网产品 / 2 fork。任何一侧漂移即红灯。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8')
const readme = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8')

const need = ['赵欣曈', '南方科技大学', '香港中文大学', '计算机科学与技术', '全国中学生物理竞赛', '铜牌', '江西省一等奖', '江西省二等奖', '法狗狗公司', '隐盾', '应用工程师', '雅思 6.5', 'IELTS 6.5', 'CET6 546']
const ban = ['隐图',
  'teedyas', 'teedyassi', 'teedy-assign', // phantom repos — removed 2026-11-20
 '践哲', '暨南大学', '国家网络安全竞赛', '硕士研究生', '十九篇', '二十一篇', 'WCAG 1.0', '国家中学生物理竞赛',
  '铜板', '一等将', '二等将', '獎', '賽', '既使', '做为', '其它', '登陆', '真象', '气慨',
  '迫不急待', '翻天复地', '相形见拙', '走头无路', '变本加利', '甘败下风', '一股作气',
  '一愁莫展', '穿流不息', '美仑美奂', '漠不关心', '挺而走险', '坚苦', '按装', '九宵', '黄梁',
  '草管人命', '不尽人意', '额首', '年青', '幅射', '直接了当', '受益非浅', '面面具到', '耳儒目染']

let fail = 0
for (const s of need) {
  if (!html.includes(s)) {
    console.error(`::error::identity-guard: MISSING required phrase: ${s}`)
    fail = 1
  }
}
for (const s of ban) {
  for (const [surface, text] of [['index.html', html], ['README.md', readme]]) {
    if (text.includes(s)) {
      console.error(`::error::identity-guard: FOUND forbidden phrase in ${surface}: ${s}`)
      fail = 1
    }
  }
}

// 统计条中英对账：中文正文与英文模板各一块，数字序列必须逐位相等且等于实测事实。
const statBlocks = [...html.matchAll(/<div class="index-stats"[\s\S]*?(?=<div class="project-table")/g)]
  .map(([block]) => [...block.matchAll(/<span class="index-stat-num">(\d+)<\/span>/g)].map(([, n]) => n))
const expectedStats = ['16', '9', '4', '2']
if (statBlocks.length !== 2 || statBlocks.some((nums) => nums.join(',') !== expectedStats.join(','))) {
  console.error(`::error::identity-guard: index-stats zh/en drift — got ${JSON.stringify(statBlocks)}, expected two blocks of ${expectedStats.join(',')}`)
  fail = 1
}
// 2026-11-20 · the two regressions the reader actually saw: NaN in the language card,
// and a portrait whose edges looked shaved. Both are now pinned to evidence.
const css = readFileSync(fileURLToPath(new URL('../styles.css', import.meta.url)), 'utf8')
const langShares = ['32.28%', '24.64%', '19.48%', '12.36%', '8.83%', '1.51%', '0.40%', '0.28%', '0.22%']
const langPanels = [...html.matchAll(/<div class="gh-panel gh-panel-langs"[\s\S]*?<\/ul>/g)].map(([b]) => b)
if (langPanels.length !== 2 || langPanels.some((b) => !langShares.every((s) => b.includes(s)))) {
  console.error(`::error::identity-guard: language panels drift (${langPanels.length} panels, expected 2 with ${langShares.join(' ')})`)
  fail = 1
}
// The portrait is 508x586 with zero transparent padding; contain + the exact aspect ratio
// means every edge is shown. A cover/clip path here would crop the head or the shoulders.
const portraitCss = (css.match(/\.profile-frame img\{[^}]*\}/) || [''])[0]
if (!/aspect-ratio:\s*508\s*\/\s*586/.test(portraitCss) || !/object-fit:\s*contain/.test(portraitCss) || /clip-path/.test(portraitCss)) {
  console.error(`::error::identity-guard: portrait edge contract broken (${portraitCss.slice(0, 160)})`)
  fail = 1
}
for (const [surface, text] of [['index.html', html], ['README.md', readme], ['styles.css', css]]) {
  if (/\bNaN\b/.test(text)) {
    console.error(`::error::identity-guard: NaN leaked into ${surface}`)
    fail = 1
  }
}

if (fail === 0) console.log('identity-guard: OK — 身份信息、禁语、语言字节与头像边缘契约全部通过')
process.exit(fail)
