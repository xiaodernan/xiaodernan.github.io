// structure-audit.mjs —— io 站的**结构闸门**：抓那些「看得见但说不清」的坏形状。
//
// 它守的四件事，每一件都对应一个**真的会坏**的机制，不是审美口味：
//
//   ① <img> 必须有 width/height/alt
//      没有 width/height ⇒ 浏览器在图加载前**不知道占多大** ⇒ 页面会抖（CLS）；
//      没有 alt ⇒ 读屏软件只能念出文件名。
//
//   ② **同一个 id 在文档里只能出现一次**
//      中英两半区各有一份同名 id 看着"对称"，可 DOM 里同时存在两份时：
//        · getElementById / querySelector 只拿**第一份**；
//        · aria-labelledby 指向的可能是**隐藏的那一份** ⇒ 读屏念的是看不见的标题；
//        · 锚点跳过去可能落在隐藏元素上 ⇒ 点链接没反应。
//      ⇒ 半区靠 [data-i18n-block] 配对，id 必须**只在正文那一份**上。
//
//   ③ 切换语言时**换掉的节点**要有人接手监听
//      applyLang 用 replaceWith 把中文区块换成英文区块 ⇒ 旧节点脱离文档。
//      任何在切换前抓的 IntersectionObserver 目标都会失效（浏览器不再向
//      已脱离的节点派发交叠事件）⇒ 滚动高亮静默失效。
//      ⇒ script.js 必须在 'portfolio:lang' 事件上**重新绑定**。
//
//   ④ <script src> 必须带 cache-busting 版本号
//      静态站没有构建步骤 ⇒ 不带 ?v= 的 script.js 会被浏览器长期缓存，
//      改了却没生效，用户看到的是旧行为。
//
// 用法：node scripts/structure-audit.mjs —— 任一契约缺失即 exit 1。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (name) => readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), 'utf8')
const index = read('index.html')
const script = read('script.js')
const manual = read('manual.html')
const admin = read('admin.html')

let fail = 0
const bad = (msg) => { console.error(`::error::structure-audit: ${msg}`); fail = 1 }
const lineOf = (text, offset) => text.slice(0, offset).split('\n').length

/** 抽出 <template> 里的内容 —— 那些节点在运行时**不在文档里**（§② 只查文档内的） */
function stripTemplates(html) {
  let out = html
  for (const m of [...html.matchAll(/<template\b[^>]*>([\s\S]*?)<\/template>/g)]) {
    out = out.replace(m[0], m[0].replace(m[1], ''))
  }
  return out
}

for (const [name, html] of [['index.html', index], ['manual.html', manual], ['admin.html', admin]]) {
  const doc = stripTemplates(html)

  // ── ① <img> 的尺寸与替代文本 ───────────────────────────────────────────
  for (const m of doc.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0]
    const src = (tag.match(/\bsrc="([^"]*)"/) || [])[1] ?? '(no src)'
    if (!/\bwidth="/.test(tag)) bad(`${name}:${lineOf(doc, m.index)} <img> 缺 width —— ${src}`)
    if (!/\bheight="/.test(tag)) bad(`${name}:${lineOf(doc, m.index)} <img> 缺 height —— ${src}`)
    if (!/\balt="/.test(tag)) bad(`${name}:${lineOf(doc, m.index)} <img> 缺 alt —— ${src}`)
  }

  // ── ② 文档内的 id 必须唯一 ─────────────────────────────────────────────
  const seen = new Map()
  for (const m of doc.matchAll(/\sid="([^"]+)"/g)) {
    const id = m[1]
    const n = (seen.get(id) ?? 0) + 1
    seen.set(id, n)
    if (n === 2) bad(`${name}: id "${id}" 在文档里出现多次 —— getElementById / aria-labelledby 只会命中第一份`)
  }

  // ── ④ 脚本必须带版本号（静态站没有构建，缓存是硬伤） ─────────────────
  for (const m of doc.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)) {
    const src = m[1]
    if (!/\?v=/.test(src)) bad(`${name}:${lineOf(doc, m.index)} <script src="${src}"> 没有 ?v= 版本号 —— 改了不会被用户看到`)
  }
}

// ── ③ 切换语言后必须有人接手 scroll-spy ────────────────────────────────
// applyLang 用 replaceWith 换掉区块 ⇒ 旧节点脱离文档 ⇒ 切换前抓的
// IntersectionObserver 目标全部失效 ⇒ 滚动高亮静默失效。
if (!/portfolio:lang/.test(script)) {
  bad('script.js 里没有 portfolio:lang 事件 —— 切换语言后没有任何机制能感知 DOM 被换掉')
}
if (!/addEventListener\(\s*['"]portfolio:lang['"]/.test(script)) {
  bad("script.js 没有监听 'portfolio:lang' —— 切换语言后 scroll-spy 仍盯着已脱离文档的节点")
}
// 两个 observer（顶栏 + 底部章节轨）**都要**断开 —— 少断一个，那个 spy 会重复触发。
const disconnects = (script.match(/\.disconnect\(\)/g) || []).length
if (disconnects < 2) {
  bad(`script.js 只有 ${disconnects} 处 observer.disconnect() —— 顶栏与底部章节轨是两个 observer，少断一个就会重复触发`)
}
if (!/rebindScrollSpies/.test(script)) {
  bad('script.js 没有 rebindScrollSpies —— 切换语言后不重绑 scroll-spy')
}
// applyLang 必须在替换 DOM **之后**派发事件
const applyIdx = script.indexOf('function applyLang')
if (applyIdx === -1) {
  bad('script.js 找不到 applyLang')
} else {
  const body = script.slice(applyIdx, script.indexOf('\n}', applyIdx))
  const replaceAt = body.indexOf('replaceWith')
  const dispatchAt = body.indexOf("dispatchEvent(new CustomEvent('portfolio:lang'")
  if (replaceAt === -1) bad('applyLang 里没有 replaceWith —— 半区切换机制变了，闸门需要跟着改')
  if (dispatchAt === -1) bad("applyLang 里没有派发 'portfolio:lang'")
  else if (replaceAt !== -1 && dispatchAt < replaceAt) {
    bad("applyLang 在替换 DOM **之前**就派发了 'portfolio:lang' —— 重绑时抓到的还是旧节点")
  }
}

if (fail === 0) {
  console.log('structure-audit: OK — 图片尺寸、id 唯一性、语言切换重绑、脚本版本号全部合规')
}
process.exit(fail)
