// gh-stats-check.mjs — offline gate for the panel restatement. No token, no network.
//
// It feeds gh-stats-core.mjs a set of deliberately DISTINCT synthetic figures and checks that
// every one of them lands where the page says it should. Two failure classes are the point:
//
//   1. a needle that has stopped matching the page's copy (this is how the MiB footnote silently
//      froze at 143.72 while the stat block moved to 143.73 — the weekly sync exited 0), and
//   2. a replacement whose capture groups got wired to the wrong slot (the count sitting inside a
//      prefix group, the MiB inside a suffix group — earlier shapes of this script produced
//      "(16 repos, 16 MiB)143.04" out of that mistake).
//
// Nothing is written to the repo; the page is restated in memory and thrown away.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { applyRestatements, NEEDLES } from "./gh-stats-core.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");

// Every number below is distinct, so a swapped capture group shows up as a wrong figure in a
// place the assertions name explicitly.
const fig = {
  today: "2001-02-03",
  reposTotal: 21,
  ownCount: 13,
  forkCount: 8,
  stars: 417,
  mibStr: "12.34",
  languageCount: 9,
  bars: [
    { name: "Alpha", pct: 50 },
    { name: "Beta", pct: 25 },
    { name: "Gamma", pct: 12.5 },
  ],
  rest: { count: 4, pct: 12.5 },
};

const problems = [];

// 1 · every declared needle must be present as data (the roster is what we claim to restate).
for (const [label, re] of NEEDLES) {
  const probe = new RegExp(re.source, re.flags.replace("g", ""));
  if (!probe.test(html)) problems.push(`页面里已经找不到这条 needle：${label}  (${re.source})`);
}

// 2 · the restatement must run and put each figure where the copy says it belongs.
let out = "";
try {
  out = applyRestatements(html, fig);
} catch (e) {
  problems.push(`applyRestatements 抛了：${e.message}`);
}

const must = [
  ["zh 口径脚线的日期", `口径 ${fig.today}`],
  ["zh 口径脚线的仓数", `${fig.reposTotal} 个公开仓（原创 ${fig.ownCount} · fork ${fig.forkCount}）`],
  ["zh 实拉脚注（这一条曾经静默停更）", `实拉（${fig.ownCount} 个非 fork 仓 ${fig.mibStr} MiB）`],
  ["en Measured 脚线", `Measured ${fig.today} · ${fig.reposTotal} public repos (${fig.ownCount} original · ${fig.forkCount} forks)`],
  ["en pulled-live 脚注（这一条也曾经静默停更）", `(${fig.ownCount} non-fork repos, ${fig.mibStr} MiB)`],
  ["MiB 读数（zh + en 两块都要动）", `>${fig.mibStr}<small>&nbsp;MiB</small>`],
  ["zh 语言数", `${fig.languageCount} 种语言`],
  ["en 语言数", `${fig.languageCount} languages`],
  ["zh 原创项目行", `原创项目<small>+ ${fig.forkCount} 个 fork 实验仓`],
  ["en original projects 行", `original projects<small>+ ${fig.forkCount} fork experimental repos`],
];
// The two "Stars 合计 / stars, total" checks below count occurrences instead of matching a shape:
// the number must appear in BOTH grids, which is what a dropped capture group tends to break.
for (const [label, text] of must) {
  if (out && !out.includes(text)) problems.push(`重述之后页面上找不到：${label} —— "${text}"`);
}
if (out) {
  const starsHits = out.split(String(fig.stars)).length - 1;
  if (starsHits < 2) problems.push(`Stars ${fig.stars} 只出现在 ${starsHits} 处，zh/en 两块读数应当都有它`);
  for (const [label, text] of [
    ["第一格条宽（基准 100%）", "Alpha</span><span class=\"lang-track\"><span class=\"lang-fill\" style=\"width:100.00%"],
    ["第二格条宽（50%）", "Beta</span><span class=\"lang-track\"><span class=\"lang-fill\" style=\"width:50.00%"],
    ["第三格条宽（25%）", "Gamma</span><span class=\"lang-track\"><span class=\"lang-fill\" style=\"width:25.00%"],
    ["zh 尾栏标签", `其他 ${fig.rest.count} 种`],
    ["en 尾栏标签", `other ${fig.rest.count}`],
    ["尾栏百分比", `${fig.rest.pct.toFixed(2)}%`],
    ["aria 读数", `Languages by source bytes: Alpha 50.00%, Beta 25.00%, Gamma 12.50%`],
  ]) {
    if (!out.includes(text)) problems.push(`重述之后页面上找不到：${label} —— "${text}"`);
  }
  if (/NaN/.test(out)) problems.push("重述结果里出现 NaN —— 归一化基准或字节和没守住");
  if (/undefined/.test(out)) problems.push("重述结果里出现 undefined —— 有捕获组被引用了不存在的那一格");
  // Semantics, not just placement: the two "non-fork" footnotes describe the roster whose BYTES
  // were summed (own, non-fork). Writing the repo total there produces a sentence that is both
  // confidently restated and false — "16 non-fork repos" while two of them are forks.
  for (const [label, forbidden] of [
    ["zh「非 fork 仓」那一格写了含 fork 的总数", `${fig.reposTotal} 个非 fork 仓`],
    ["en「non-fork repos」那一格写了含 fork 的总数", `(${fig.reposTotal} non-fork repos,`],
  ]) {
    if (out.includes(forbidden)) problems.push(`${label}：页面上出现了 "${forbidden}"`);
  }
}

// 3 · the NaN guard: a GitHub response with zero bytes for every language must be
// refused, not painted. The width formula divides by the first bar, so a zero
// base used to write NaN% into every row — the stale number the panel once shipped.
for (const [label, badBars] of [
  ["所有语言字节为 0", [{ name: "Zero", pct: 0 }]],
  ["语言字节不是有限数", [{ name: "NaN", pct: NaN }]],
]) {
  let refused = false;
  try {
    applyRestatements(html, { ...fig, bars: badBars });
  } catch {
    refused = true; // throwing is the correct outcome — no repaint with NaN
  }
  if (!refused) problems.push(`${label} 时 applyRestatements 没有拒绝 —— NaN 会写进页面`);
}

if (problems.length) {
  console.error(`gh-stats-check FAILED (${problems.length} 项)：`);
  for (const one of problems) console.error(`  · ${one}`);
  process.exit(1);
}
console.log(`gh-stats-check OK：${NEEDLES.length} 条 needle 全部命中，读数落位，无 NaN / undefined。`);
