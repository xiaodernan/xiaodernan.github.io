// gh-stats.mjs — the REAL GitHub figures behind the portfolio's language panel.
// Every number on the panel is fetched live from the GitHub REST API with a personal access
// token (GH_PAT env, or the one in .gh-pat), summed per-repo through languages_url — the same
//口径 the panel has always claimed. Nothing here is hand-maintained: re-run this script and the
// panel re-states what GitHub says today.
//
// Run: GH_PAT=ghp_... node scripts/gh-stats.mjs [--write]
// Without --write it prints the computed figures and changes nothing (a dry run).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "xiaodernan";
const WRITE = process.argv.includes("--write");

const token = process.env.GH_PAT
  || (existsSync(resolve(root, ".gh-pat")) ? readFileSync(resolve(root, ".gh-pat"), "utf8").trim() : "");
if (!token) {
  console.error("UNVERIFIED — set GH_PAT (or drop it in .gh-pat) to fetch the real figures.");
  process.exit(78);
}
const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
const get = async (url) => {
  const r = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
};

// 1 · every public repo, page by page.
const repos = [];
for (let page = 1; page <= 10; page++) {
  const batch = await get(`https://api.github.com/user/repos?per_page=100&page=${page}&sort=pushed`);
  repos.push(...batch);
  if (batch.length < 100) break;
}
// The panel's 口径: the owner's OWN public repos — the /user/repos listing also carries repos
// of orgs the account is a member of (class repos, org projects), which are not this portfolio's.
const mine = (r) => r.owner?.login === OWNER && !r.private;
const own = repos.filter((r) => mine(r) && !r.fork);
const forks = repos.filter((r) => mine(r) && r.fork);
const stars = repos.reduce((s, r) => s + (r.stargazers_count ?? 0), 0);

// 2 · the language bytes, summed across the non-fork public repos (the panel's own 口径).
const bytes = new Map();
for (const r of own) {
  const langs = await get(r.languages_url);
  for (const [name, n] of Object.entries(langs)) bytes.set(name, (bytes.get(name) ?? 0) + n);
}
const totalBytes = [...bytes.values()].reduce((s, n) => s + n, 0);
const ranked = [...bytes.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const share = (n) => (n / totalBytes) * 100;
const mib = totalBytes / 1024 / 1024;

const today = new Date().toISOString().slice(0, 10);
const TOP = 8;
const top = ranked.slice(0, TOP);
const rest = ranked.slice(TOP);
const restShare = rest.reduce((s, [, n]) => s + share(n), 0);

console.log(`fetched ${today}: ${own.length} own public repos (+${forks.length} forks), ${stars} stars, ${mib.toFixed(2)} MiB across ${ranked.length} languages`);
for (const [name, n] of top) console.log(`  ${name} ${share(n).toFixed(2)}%`);
if (rest.length) console.log(`  other ${rest.length} languages ${restShare.toFixed(2)}%`);
if (!WRITE) { console.log("dry run — pass --write to restate the panel"); process.exit(0); }

// 3 · restate the panel: the figure block and the language rows, from the fetched numbers.
const p = resolve(root, "index.html");
let html = readFileSync(p, "utf8");
const before = html;

const aria = `Languages by source bytes: ${top.map(([n, b]) => `${n} ${share(b).toFixed(2)}%`).join(", ")}`;
html = html.replace(/(<div class="gh-panel gh-panel-langs" role="group" aria-label=")[^"]*(")/g, `$1${aria}$2`);

const rows = top.map(([name, n], i) => {
  const pct = share(n);
  const w = (pct / share(top[0][1])) * 100;
  return `<li class="lang-row"><span class="lang-name">${name}</span><span class="lang-track"><span class="lang-fill" style="width:${w.toFixed(2)}%"></span></span><span class="lang-pct">${pct.toFixed(2)}%</span></li>`;
}).join("\n      ");
const restRow = rest.length
  ? `\n      <li class="lang-row lang-row-rest"><span class="lang-name">其他 ${rest.length} 种</span><span class="lang-track"><span class="lang-fill lang-fill-rest" style="width:${(restShare / share(top[0][1]) * 100).toFixed(2)}%"></span></span><span class="lang-pct">${restShare.toFixed(2)}%</span></li>`
  : "";
// BOTH panels (the zh block and the en block) restate the same fetched figures.
html = html.replace(/(<ul class="lang-bars">)[\s\S]*?(<\/ul>)/g, `$1\n      ${rows}${restRow}\n    $2`);

// The figure blocks (zh and en) restate the same fetched numbers. Function replacements only:
// a string replacement with interpolated values makes "$11" out of "$1" + "14" and silently
// writes group eleven — the corruption this rewrite exists to prevent.
const mibStr = mib.toFixed(2);
html = html.replace(/(<figure class="gh-figures" data-i18n-block="figures" aria-label="GitHub 真实数据 · )\d{4}-\d{2}-\d{2}/,
  (_m, p1) => `${p1}${today}`);
// zh grid
html = html.replace(/(<span class="gh-stat-num">)\d+(<\/span><span class="gh-stat-label">公开仓库<small>原创 )\d+( · fork )\d+/,
  (_m, p1, p2, p3) => `${p1}${own.length + forks.length}${p2}${own.length}${p3}${forks.length}`);
html = html.replace(/(<span class="gh-stat-num">)\d+(<\/span><span class="gh-stat-label">Stars 合计)/,
  (_m, p1, p2) => `${p1}${stars}${p2}`);
html = html.replace(/(<span class="gh-stat-num">)[\d.]+(<small>&nbsp;MiB<\/small><\/span><span class="gh-stat-label">代码字节合计<small>)\d+( 种语言)/,
  (_m, p1, p2, p3) => `${p1}${mibStr}${p2}${ranked.length}${p3}`);
html = html.replace(/(<span class="gh-stat-num">)\d+(<\/span><span class="gh-stat-label">原创项目<small>\+ )\d+( 个 fork 实验仓)/,
  (_m, p1, p2, p3) => `${p1}${own.length}${p2}${forks.length}${p3}`);
// en grid
html = html.replace(/(<span class="gh-stat-num">)\d+(<\/span><span class="gh-stat-label">public repos<small>)\d+( originals · )\d+( forks)/,
  (_m, p1, p2, p3, p4) => `${p1}${own.length + forks.length}${p2}${own.length}${p3}${forks.length}${p4}`);
html = html.replace(/(<span class="gh-stat-num">)\d+(<\/span><span class="gh-stat-label">stars, total)/,
  (_m, p1, p2) => `${p1}${stars}${p2}`);
html = html.replace(/(<span class="gh-stat-num">)[\d.]+(<small>&nbsp;MiB<\/small><\/span><span class="gh-stat-label">bytes of code<small>)\d+( languages)/,
  (_m, p1, p2, p3) => `${p1}${mibStr}${p2}${ranked.length}${p3}`);
html = html.replace(/(<span class="gh-stat-num">)\d+(<\/span><span class="gh-stat-label">original projects<small>\+ )\d+( fork experimental repos)/,
  (_m, p1, p2, p3) => `${p1}${own.length}${p2}${forks.length}${p3}`);
// the two foot lines
html = html.replace(/(<p class="gh-panel-foot">口径 )\d{4}-\d{2}-\d{2}( · )\d+( 个非 fork 公开仓)/,
  (_m, p1, p2, p3) => `${p1}${today}${p2}${own.length}${p3}`);
html = html.replace(/(<p class="gh-panel-foot">Measured )\d{4}-\d{2}-\d{2}( · )\d+( public repos \(no forks\))/,
  (_m, p1, p2, p3) => `${p1}${today}${p2}${own.length}${p3}`);

// 4 · the snapshot: the same figures as a small JSON the identity-guard reads, so the guard
// verifies the panel against what was last FETCHED rather than a hand-kept list — refreshing
// the data moves the panel and the snapshot together, and a silent edit to the panel alone reddens.
const snapshot = {
  date: today,
  repos: repos.length,
  own: own.length,
  forks: forks.length,
  stars,
  bytes: totalBytes,
  languages: ranked.map(([name, n]) => ({ name, share: Number(share(n).toFixed(2)) })),
};
writeFileSync(resolve(root, "data/gh-languages.json"), JSON.stringify(snapshot, null, 2) + "\n");

if (html === before) { console.log("panel unchanged; snapshot restated"); process.exit(0); }
writeFileSync(p, html);
console.log(`index.html restated: ${own.length} repos · ${stars} stars · ${mib.toFixed(2)} MiB · ${ranked.length} languages`);
