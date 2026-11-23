// paint-fact-packs.mjs — 把事实包刷进**静态半区**，让静态页与运行时永远说同一句话。
//
// 为什么需要它：
//
//   · 页面的事实包卡片是**双份**的：中文半区是默认标记，英文半区在 `<template data-i18n-en>` 里；
//   · 运行时（index.html 内联的 refreshNp）会按当前语言刷两半，用的是事实包自带的中文镜像
//     `features_zh`；
//   · 但**静态半区**是人手维护的。上一次有人更新这张卡时，把**英文**的 features 原文粘进了
//     中文半区，于是中文模式里出现了一整句英文——lang-audit 红灯，主干的 site-gates 因此变红，
//     而"英文清单"是每周事实包刷新都会重新灌进来的东西。
//
// 所以静态半区不能靠人记得改：它必须**由事实包生成**。这个脚本就是那个生成器。
//
// 口径与运行时**逐字一致**（照抄 index.html 里 refreshNp 的规则）：
//   zh → features_zh（事实包自带的中文镜像；没有镜像才回落 features）
//   en → features
//   两者都取前 4 条，用 ' · ' 连接。
//
// 运行：
//   node scripts/paint-fact-packs.mjs           # 打印将要改的内容，不写盘
//   node scripts/paint-fact-packs.mjs --write   # 刷进 index.html
//   node scripts/paint-fact-packs.mjs --check   # 只判定：静态半区与事实包是否已经一致（CI 用）
//
// --check 的存在意义：刷写器是"事后"的，而人手改页是"随手"的。把 --check 接进闸门，
// 人手改一次静态半区就红一次——而不是等下一周事实包刷新时，中文模式里又出现一句英文。
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check");

/**
 * 每张事实包卡片的刷写规则。
 *
 * <p>`class` 是页面上那一格的类名；`pack` 是事实包在本仓的路径；`zh`/`en` 分别是两半该显示什么。
 *
 * <p>规则必须与 index.html 里对应的 refresh*() **逐字一致**——静态半区是运行时的替身，
 * 两边说出不同的话，就是同一个谎说了两遍。
 */
const CARDS = [
  {
    id: "nexus-platform",
    pack: "assets/nexus-platform/latest.json",
    class: "np-features-list",
    zh: (d) => (Array.isArray(d.features_zh) && d.features_zh.length ? d.features_zh : d.features ?? []),
    en: (d) => d.features ?? [],
    take: 4,
  },
];

/**
 * 把 HTML 切成"语言半区"。
 *
 * <p>默认标记是中文半区；`<template data-i18n-en="…">` 里的是英文半区。两者在文档里的位置
 * 互不重叠，所以按区间切分比按标记解析更不容易出错——也更不容易在将来某次重构里悄悄失效。
 */
function splitHalves(html) {
  const halves = [];
  const templateRe = /<template data-i18n-en="[^"]*">[\s\S]*?<\/template>/g;
  let cursor = 0;
  let match;
  while ((match = templateRe.exec(html)) !== null) {
    if (match.index > cursor) {
      halves.push({ lang: "zh", start: cursor, end: match.index, text: html.slice(cursor, match.index) });
    }
    halves.push({ lang: "en", start: match.index, end: match.index + match[0].length, text: match[0] });
    cursor = match.index + match[0].length;
  }
  if (cursor < html.length) {
    halves.push({ lang: "zh", start: cursor, end: html.length, text: html.slice(cursor) });
  }
  return halves;
}

/** 把某一格里的文字换掉（这些格子里都是纯文本，没有嵌套标记）。 */
function replaceCell(segment, className, value) {
  const re = new RegExp(`(<(code|span) class="${className}"[^>]*>)([\\s\\S]*?)(</\\2>)`, "g");
  return segment.replace(re, (_all, open, tag, _old, close) => `${open}${value}${close}`);
}

const indexPath = resolve(root, "index.html");
const html = readFileSync(indexPath, "utf8");
const halves = splitHalves(html);

let changed = 0;
const problems = [];

for (const card of CARDS) {
  let pack;
  try {
    pack = JSON.parse(readFileSync(resolve(root, card.pack), "utf8"));
  } catch (error) {
    console.error(`::error::paint-fact-packs: cannot read ${card.pack} — ${error.message}`);
    process.exitCode = 1;
    continue;
  }
  const wanted = {
    zh: card.zh(pack).slice(0, card.take).join(" · "),
    en: card.en(pack).slice(0, card.take).join(" · "),
  };

  for (const half of halves) {
    const re = new RegExp(`(<(code|span) class="${card.class}"[^>]*>)([\\s\\S]*?)(</\\2>)`, "g");
    const current = [...half.text.matchAll(re)].map((m) => m[3]);
    if (!current.length) continue;
    const next = half.text.replace(re, (_all, open, tag, _old, close) => `${open}${wanted[half.lang]}${close}`);
    if (next !== half.text) {
      changed += 1;
      if (WRITE) {
        halves[halves.indexOf(half)] = { ...half, text: next };
      } else {
        console.log(`[${card.id}] ${half.lang} 半区的 ${card.class} 需要重刷：`);
        console.log(`  现有：${current.join(' | ').slice(0, 200)}`);
        console.log(`  应为：${wanted[half.lang].slice(0, 200)}`);
      }
    }
  }
}

if (CHECK) {
  if (changed > 0) {
    console.error(`::error::paint-fact-packs: 静态半区与事实包不一致（${changed} 处）。`
      + " 跑 node scripts/paint-fact-packs.mjs --write 刷齐。");
    process.exitCode = 1;
  } else {
    console.log("paint-fact-packs: OK — 静态半区与事实包一致");
  }
} else if (WRITE) {
  // 从后往前替换，偏移量才不会互相打架。
  const out = halves
    .slice()
    .sort((a, b) => b.start - a.start)
    .reduce((acc, half) => acc.slice(0, half.start) + half.text + acc.slice(half.end), html);
  if (out === html) {
    console.log("paint-fact-packs: 静态半区已经与事实包一致，未改动。");
  } else {
    writeFileSync(indexPath, out);
    console.log(`paint-fact-packs: 已刷写 ${changed} 处静态半区。`);
  }
} else {
  console.log(changed > 0
    ? `paint-fact-packs: 有 ${changed} 处需要刷写（加 --write 落盘）。`
    : "paint-fact-packs: 静态半区已经与事实包一致。");
}
