// gh-stats-core.mjs — the panel restatement, with no network and no token.
//
// Why this file exists: `gh-stats.mjs` used to inline ten `html.replace(...)` steps and exit 0
// whether or not each pattern still matched the page. Two of them had stopped matching months
// earlier (the footnote copy moved from "14 仓" to "14 个非 fork 仓", and from "(14 repos," to
// "(14 non-fork repos,"), so the MiB figure in those two lines has been frozen ever since while
// the weekly sync kept reporting success. **A restater whose needles can silently stop firing is
// worse than no restater** — it manufactures confidence.
//
// So: the needles live here as data, one array, with names. `gh-stats-check.mjs` runs them
// against the committed `index.html` using deliberately distinct synthetic figures — a swapped
// capture group then shows up as a wrong number somewhere visible, not as a passing CI run.
import { readFileSync } from "node:fs";

/** label + pattern, one entry per replacement, in the order they must fire. */
export const NEEDLES = [
  ["panel aria-label", /(<div class="gh-panel gh-panel-langs" role="group" aria-label=")[^"]*(")/g],
  ["lang-bars 两组清单", /(<ul class="lang-bars">)[\s\S]*?(<\/ul>)/g],
  ["figures aria-label 日期", /(<figure class="gh-figures" data-i18n-block="figures" aria-label="GitHub 真实数据 · )\d{4}-\d{2}-\d{2}/],
  ["zh · 公开仓库数", /(<span class="gh-stat-num">)\d+(<\/span><span class="gh-stat-label">公开仓库<small>原创 )\d+( · fork )\d+/],
  ["zh · Stars 合计", /(<span class="gh-stat-num">)\d+(<\/span><span class="gh-stat-label">Stars 合计)/],
  ["zh · 代码字节合计", /(<span class="gh-stat-num">)[\d.]+(<small>&nbsp;MiB<\/small><\/span><span class="gh-stat-label">代码字节合计<small>)\d+( 种语言)/],
  ["zh · 原创项目", /(<span class="gh-stat-num">)\d+(<\/span><span class="gh-stat-label">原创项目<small>\+ )\d+( 个 fork 实验仓)/],
  ["en · public repos", /(<span class="gh-stat-num">)\d+(<\/span><span class="gh-stat-label">public repos<small>)\d+( originals · )\d+( forks)/],
  ["en · stars, total", /(<span class="gh-stat-num">)\d+(<\/span><span class="gh-stat-label">stars, total)/],
  ["en · bytes of code", /(<span class="gh-stat-num">)[\d.]+(<small>&nbsp;MiB<\/small><\/span><span class="gh-stat-label">bytes of code<small>)\d+( languages)/],
  ["en · original projects", /(<span class="gh-stat-num">)\d+(<\/span><span class="gh-stat-label">original projects<small>\+ )\d+( fork experimental repos)/],
  ["zh · 口径脚线", /(<p class="gh-panel-foot">口径 )\d{4}-\d{2}-\d{2}( · )\d+( 个公开仓（原创 )\d+( · fork )\d+(）)/],
  ["zh · 实拉脚注（仓数 + MiB）", /(实拉（)\d+( 个非 fork 仓 )[\d.]+( MiB）)/],
  ["en · Measured 脚线", /(<p class="gh-panel-foot">Measured )\d{4}-\d{2}-\d{2}( · )\d+( public repos \()\d+( original · )\d+( forks?\))/],
  ["en · pulled-live 脚注（仓数 + MiB）", /(\(\d+ non-fork repos, )[\d.]+( MiB\))/],
];

/**
 * Restate every figure on the panel from `fig`, or throw naming the needle that stopped matching.
 *
 * Function replacements only. A string replacement with interpolated values makes "$11" out of
 * "$1" + "14" and silently writes group eleven — the corruption this shape exists to prevent.
 *
 * @param html the current index.html
 * @param fig  {today, reposTotal, ownCount, forkCount, stars, mibStr, languageCount,
 *              bars:[{name,pct}], rest:{count,pct}|null}
 */
export function applyRestatements(html, fig) {
  const { today, reposTotal, ownCount, forkCount, stars, mibStr, languageCount, bars, rest } = fig;
  if (!bars.length) throw new Error("applyRestatements: bars 为空 —— 百分比没有归一化的基准，宁可不写");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(today))) throw new Error(`applyRestatements: today 形状不对：${today}`);
  // The width is pct / base. If the GitHub response carries no bytes for any
  // language (a rate-limited or empty languages_url), base is 0 and every bar
  // becomes NaN% — the exact stale number the panel once shipped. Refuse to
  // repaint rather than write a NaN into the page.
  if (!bars.every((b) => Number.isFinite(b.pct) && b.pct >= 0)) {
    throw new Error("applyRestatements: 语言字节占比不是有限非负数，拒绝写入 NaN");
  }
  const base = bars[0].pct;
  if (!(base > 0)) throw new Error("applyRestatements: 第一语言占比为 0 —— 归一化基准无效");
  const pct2 = (n) => n.toFixed(2);
  const aria = `Languages by source bytes: ${bars.map((b) => `${b.name} ${pct2(b.pct)}%`).join(", ")}`;
  const rowOf = ({ name, pct }) => `<li class="lang-row"><span class="lang-name">${name}</span>`
    + `<span class="lang-track"><span class="lang-fill" style="width:${((pct / base) * 100).toFixed(2)}%"></span></span>`
    + `<span class="lang-pct">${pct2(pct)}%</span></li>`;
  const rows = bars.map(rowOf).join("\n      ");
  // Each panel gets its OWN rest label: the zh block says 其他 N 种, the en block says other N.
  // A single shared restRow used to hardcode the Chinese label into BOTH, so every refresh
  // re-introduced 中英夹杂 into the English panel.
  const restRowFor = (zh) => (rest
    ? `\n      <li class="lang-row lang-row-rest"><span class="lang-name">${zh ? `其他 ${rest.count} 种` : `other ${rest.count}`}</span>`
      + `<span class="lang-track"><span class="lang-fill lang-fill-rest" style="width:${((rest.pct / base) * 100).toFixed(2)}%"></span></span>`
      + `<span class="lang-pct">${pct2(rest.pct)}%</span></li>`
    : "");

  const steps = [
    ["panel aria-label", NEEDLES[0][1], (_m, p1, p2) => `${p1}${aria}${p2}`],
    ["lang-bars 两组清单", NEEDLES[1][1], (_m, open, close) => {
      // the first block in the document is the Chinese one; the second is English
      const zh = panelCount++ === 0;
      return `${open}\n      ${rows}${restRowFor(zh)}\n    ${close}`;
    }],
    ["figures aria-label 日期", NEEDLES[2][1], (_m, p1) => `${p1}${today}`],
    ["zh · 公开仓库数", NEEDLES[3][1], (_m, p1, p2, p3) => `${p1}${reposTotal}${p2}${ownCount}${p3}${forkCount}`],
    ["zh · Stars 合计", NEEDLES[4][1], (_m, p1, p2) => `${p1}${stars}${p2}`],
    ["zh · 代码字节合计", NEEDLES[5][1], (_m, p1, p2, p3) => `${p1}${mibStr}${p2}${languageCount}${p3}`],
    ["zh · 原创项目", NEEDLES[6][1], (_m, p1, p2, p3) => `${p1}${ownCount}${p2}${forkCount}${p3}`],
    ["en · public repos", NEEDLES[7][1], (_m, p1, p2, p3, p4) => `${p1}${reposTotal}${p2}${ownCount}${p3}${forkCount}${p4}`],
    ["en · stars, total", NEEDLES[8][1], (_m, p1, p2) => `${p1}${stars}${p2}`],
    ["en · bytes of code", NEEDLES[9][1], (_m, p1, p2, p3) => `${p1}${mibStr}${p2}${languageCount}${p3}`],
    ["en · original projects", NEEDLES[10][1], (_m, p1, p2, p3) => `${p1}${ownCount}${p2}${forkCount}${p3}`],
    ["zh · 口径脚线", NEEDLES[11][1], (_m, p1, p2, p3, p4, p5) => `${p1}${today}${p2}${reposTotal}${p3}${ownCount}${p4}${forkCount}${p5}`],
    // The two "non-fork" footnotes state the roster whose BYTES were summed, which is `own`
    // (non-fork, public) — NOT own+forks. Writing the total here would make the line read
    // "16 non-fork repos" while two of them are forks: a needle that fires and is still wrong.
    ["zh · 实拉脚注（仓数 + MiB）", NEEDLES[12][1], (_m, p1, p2, p3) => `${p1}${ownCount}${p2}${mibStr}${p3}`],
    ["en · Measured 脚线", NEEDLES[13][1], (_m, p1, p2, p3, p4, p5) => `${p1}${today}${p2}${reposTotal}${p3}${ownCount}${p4}${forkCount}${p5}`],
    // The repo count sits INSIDE the captured prefix and the MiB inside the suffix; appending
    // mibStr after the count group used to produce "(16 repos, 16 MiB)143.04".
    ["en · pulled-live 脚注（仓数 + MiB）", NEEDLES[14][1], (_m, p1, p2) => `${p1.replace(/\d+/, String(ownCount))}${mibStr}${p2}`],
  ];

  let panelCount = 0;
  let out = html;
  for (const [label, re, fn] of steps) {
    // Probe with a fresh, non-global copy: `/g` regexes keep `lastIndex` between calls, which
    // would make the second probe of an identical pattern lie about whether it matched.
    const probe = new RegExp(re.source, re.flags.replace("g", ""));
    if (!probe.test(out)) {
      throw new Error(`needle stopped matching: ${label}\n  pattern: ${re.source}\n`
        + "  The page's wording moved. Fix the pattern (or the page) — do not ship a half-restated panel.");
    }
    out = out.replace(re, fn);
  }
  if (panelCount !== 2) throw new Error(`语言清单只找到 ${panelCount} 组，预期 2 组（zh + en）`);
  return out;
}

/** The figures the panel must show after restating — also what the offline check asserts. */
export function expectedFigStrings(fig) {
  const { today, reposTotal, ownCount, forkCount, stars, mibStr, languageCount } = fig;
  return { today, reposTotal, ownCount, forkCount, stars, mibStr, languageCount };
}

/** Read the committed panel (used by the offline checker). */
export function readPanel(path) {
  return readFileSync(path, "utf8");
}
