// tooltip-audit.mjs — 「每个可操作元素都要附带一句教学说明」闸门
//
// 说明分两层：
//   ① 静态层：顶栏位于双语区块之外，必须同时写 title + data-tip-zh + data-tip-en，
//      切换语言时说明才会跟着换；表单控件必须有 title。
//   ② 运行时层：首页 script.js 的 __teachInteractive 为所有 a / button 兜底生成
//      说明，并按 data-auto-title 标记、在切换语言时整批重生成，保证零遗漏且不夹语言。
//      说明书与管理員页各自内联同一套 teach() 逻辑。
// 闸门检查这些机制真的存在（而不是只信注释），并逐条核对顶栏与表单控件。
// 用法：node scripts/tooltip-audit.mjs —— 任一契约缺失即 exit 1。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (name) => readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), 'utf8')
const index = read('index.html')
const script = read('script.js')
const manual = read('manual.html')
const admin = read('admin.html')

let fail = 0
const lineOf = (text, offset) => text.slice(0, offset).split('\n').length

// ── ① 顶栏：静态双语提示 ────────────────────────────────────────────────
const headerStart = index.indexOf('<header')
const headerEnd = index.indexOf('</header>')
if (headerStart === -1 || headerEnd === -1) {
  console.error('::error::tooltip-audit: index.html has no <header> block')
  fail = 1
} else {
  const header = index.slice(headerStart, headerEnd)
  for (const match of header.matchAll(/<(a|button)\b([^>]*)>/g)) {
    const attrs = match[2]
    const ok = /\btitle="[^"]+"/.test(attrs) && /\bdata-tip-zh="/.test(attrs) && /\bdata-tip-en="/.test(attrs)
    if (!ok) {
      console.error(`::error::tooltip-audit: index.html:${lineOf(index, headerStart + match.index)} topbar control needs title + data-tip-zh + data-tip-en → ${match[0].slice(0, 100)}`)
      fail = 1
    }
  }
}

// ── ② 表单控件：静态 title 必须存在（运行时兜底只覆盖 a / button）────────
for (const [name, text] of [['index.html', index], ['manual.html', manual], ['admin.html', admin]]) {
  for (const match of text.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
    const attrs = match[2]
    if (/type="hidden"/.test(attrs)) continue
    if (!/\btitle="[^"]+"/.test(attrs)) {
      console.error(`::error::tooltip-audit: ${name}:${lineOf(text, match.index)} form control needs a title → ${match[0].slice(0, 100)}`)
      fail = 1
    }
  }
}

// ── ③ 运行时兜底：首页所有 a / button 由 __teachInteractive 覆盖 ─────────
const REQUIRED_SELECTORS = [
  '.main-nav a', '.project-links a', '.sub-link', '.lab-link', '[data-filter]',
  '[data-repo-filter]', '.index-row', '.repo-card', '.contact-card', '.anchor-dock a',
  '.footer a', '.milestone-cell', '.github-figures a', '.hero-actions .button',
  '[data-theme-toggle]',
]
for (const sel of REQUIRED_SELECTORS) {
  const covered = script.includes(`querySelectorAll('${sel}')`) ||
    script.includes(`fromText('${sel}'`) || script.includes(`setAll('${sel}'`)
  if (!covered) {
    console.error(`::error::tooltip-audit: script.js lost the teaching hook for ${sel}`)
    fail = 1
  }
}
if (!/querySelectorAll\('a, button'\)/.test(script) || !script.includes('data-auto-title')) {
  console.error('::error::tooltip-audit: script.js lost the generic a/button fallback or its language-reset marker')
  fail = 1
}
if (!/if \(typeof window\.__teachInteractive === 'function'\) window\.__teachInteractive\(\)/.test(script)) {
  console.error('::error::tooltip-audit: __teachInteractive is not re-run on language switch')
  fail = 1
}

// ── ④ 独立页：各自内联 teach()，并在 applyLang/apply 中调用 ────────────
for (const [name, text] of [['manual.html', manual], ['admin.html', admin]]) {
  if (!/function teach\(/.test(text) || !/teach\(lang\)/.test(text) || !text.includes('data-auto-title')) {
    console.error(`::error::tooltip-audit: ${name} lost its inline teach() sweep or language-aware reset`)
    fail = 1
  }
  if (!/data-lang-toggle/.test(text)) {
    console.error(`::error::tooltip-audit: ${name} has no language toggle`)
    fail = 1
  }
}

if (fail === 0) console.log('tooltip-audit: OK — 顶栏静态双语说明 + 全站 a/button 运行时兜底 + 表单控件说明齐备')
process.exit(fail)
