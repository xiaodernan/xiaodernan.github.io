// lang-audit.mjs — 「中文页不夹英文句子 / 英文页不夹中文句子」闸门
//
// 口径：
//   · 中文模式：正文里不得出现成句英文（以 the/and/with/your/this/… 这类功能词判定），
//     产品名、技术名词（Agent Runtime、FastAPI、Spring Cloud 等）不算夹杂。
//   · 英文模式：EN 模板 / data-only="en" 区块内不得出现汉字，白名单仅限人名、品牌
//     与语言切换按钮上的「中」。
//   · 引用类双语气泡（.splive-gazette-zh / -en）由 CSS 按语言各显一条，不算夹杂。
// 用法：node scripts/lang-audit.mjs —— 任一命中即 exit 1，并给出文件行号。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (name) => readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), 'utf8')
const pages = ['index.html', 'manual.html', 'admin.html']
let fail = 0

const EN_STOPWORDS = /\b(the|and|with|from|your|this|that|these|those|every|all|of|to|in|on|by|as|is|are|was|were|you|we|it|its|not|no|or|but|only|more|than|into|for|about|which|who|when|where|how|what|can|will|has|have|had|been|being|their|our|my|me|us|them|they|she|he|his|her)\b/i
// 品牌、人名与印章字形：允许在英文页出现
const ZH_ALLOW = ['赵欣曈', '欣', '曈', '隐盾', '止音纪元', '法狗狗']
const BLOCK_TAGS = 'section|figure|nav|aside|header|footer|span|h1|h2|h3|h4|p|b|td|th|a|div|li|strong|small|em|blockquote'

function stripNonProse(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\b(?:href|src|title|aria-label|alt|content|aria-labelledby)="[^"]*"/gi, ' ')
    .replace(/https?:\/\/[^\s"'<>]+/g, ' ')
}
const dropTemplates = (text) => text.replace(/<template[^>]*data-i18n-en[\s\S]*?<\/template>/gi, ' ')
const dropByClass = (text, cls) => text.replace(new RegExp(`<([a-z]+)[^>]*class="[^"]*${cls}[^"]*"[^>]*>[\\s\\S]*?<\\/\\1>`, 'gi'), ' ')
// 只保留 data-only="xx" 的可见半区（独立页用）
function onlyHalf(text, attr) {
  const re = new RegExp(`<(${BLOCK_TAGS})\\b[^>]*${attr}[^>]*>([\\s\\S]*?)<\\/\\1>`, 'gi')
  return [...text.matchAll(re)].map((m) => m[2]).join('\n')
}
const lineOf = (text, offset) => text.slice(0, offset).split('\n').length

for (const page of pages) {
  const raw = read(page)
  const isIndex = page === 'index.html'

  // ── 中文区 ──
  let zhSource = isIndex ? dropTemplates(raw) : raw
  zhSource = onlyHalf(zhSource, isIndex ? 'data-i18n-block' : 'data-only="zh"')
  if (isIndex) {
    // 中文区里夹带的英文引用块由 CSS 在 zh 模式隐藏，不计入正文
    zhSource = dropByClass(zhSource, 'splive-gazette-en')
  }
  const zhText = stripNonProse(zhSource)
  for (const match of zhText.matchAll(/>([^<>]{12,})</g)) {
    const chunk = match[1].replace(/\s+/g, ' ').trim()
    if (!chunk) continue
    if (EN_STOPWORDS.test(chunk) && /[A-Za-z]{2,}/.test(chunk)) {
      console.error(`::error::lang-audit: ${page}:${lineOf(raw, raw.indexOf(chunk.slice(0, 24)))} Chinese mode contains an English sentence → ${chunk.slice(0, 110)}`)
      fail = 1
    }
  }

  // ── 英文区 ──
  let enSource
  if (isIndex) {
    enSource = [...raw.matchAll(/<template[^>]*data-i18n-en[\s\S]*?<\/template>/gi)].map((m) => m[0]).join('\n')
    enSource = dropByClass(enSource, 'splive-gazette-zh')
  } else {
    enSource = onlyHalf(raw, 'data-only="en"')
  }
  const enText = stripNonProse(enSource)
  for (const hit of enText.matchAll(/[\u4e00-\u9fff]+/g)) {
    const word = hit[0]
    if (ZH_ALLOW.some((w) => word.includes(w))) continue
    const around = enText.slice(Math.max(0, hit.index - 44), hit.index + word.length + 44).replace(/\s+/g, ' ')
    console.error(`::error::lang-audit: ${page}${isIndex ? ':EN-template' : ':EN-half'} contains Chinese → “${word}” … ${around.slice(0, 110)}`)
    fail = 1
  }

  // ── 独立页的双语半区必须成对存在 ──
  if (!isIndex) {
    const zhBlocks = (raw.match(/data-only="zh"/g) || []).length
    const enBlocks = (raw.match(/data-only="en"/g) || []).length
    if (!zhBlocks || !enBlocks) {
      console.error(`::error::lang-audit: ${page} is missing a bilingual half (zh=${zhBlocks}, en=${enBlocks})`)
      fail = 1
    }
  }
}

if (fail === 0) console.log('lang-audit: OK — 中文模式无成句英文，英文模式无正文汉字，双语半区齐备')
process.exit(fail)
