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
import { applyRestatements } from "./gh-stats-core.mjs";

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
const stars = [...own, ...forks].reduce((s, r) => s + (r.stargazers_count ?? 0), 0);

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

// A zero-byte roster is not "a small number" — it is "GitHub answered with nothing we own".
// Every percentage below is `n / totalBytes` and the bar widths divide by the top language's
// share, so without this guard a thin API response bakes literal `NaN%` into both language
// panels while the footnote keeps a stale figure until someone notices in a browser.
// Better a red run: this script's whole contract is that nobody has to eyeball the numbers.
if (!own.length || totalBytes === 0 || !ranked.length) {
  console.error(`REFUSING to restate: ${own.length} own repos / ${totalBytes} bytes / ${ranked.length} languages.`
    + " A zero anywhere here would write NaN% into the panel.");
  process.exit(1);
}

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
// The needles live in gh-stats-core.mjs as ONE named array, and every one of them must fire or the
// run fails. See the header there for the two foot-line needles that quietly stopped matching and
// left a MiB figure frozen while the weekly sync kept reporting success.
const p = resolve(root, "index.html");
const before = readFileSync(p, "utf8");

const html = applyRestatements(before, {
  today,
  reposTotal: own.length + forks.length,
  ownCount: own.length,
  forkCount: forks.length,
  stars,
  mibStr: mib.toFixed(2),
  languageCount: ranked.length,
  bars: top.map(([name, n]) => ({ name, pct: share(n) })),
  rest: rest.length ? { count: rest.length, pct: restShare } : null,
});

// 4 · the snapshot: the same figures as a small JSON the identity-guard reads, so the guard
// verifies the panel against what was last FETCHED rather than a hand-kept list — refreshing
// the data moves the panel and the snapshot together, and a silent edit to the panel alone reddens.
const snapshot = {
  date: today,
  repos: own.length + forks.length,
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
