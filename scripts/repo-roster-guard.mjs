// repo-roster-guard.mjs — 名册对账：页面上的仓库链接与星数，必须与 GitHub 上此刻的真实情况一致。
//
// 这个闸门守的是三件**会骗人**的事：
//
//   ① **链接的仓库已经不存在了。** 2026-11-23 的实测：页面上的 `CS308_-ImageCaptioning-` 与
//      `team-project-25spring-59` 挂在 `github.com/xiaodernan/` 下，而它们真正的家在课程组织
//      `ReverseRain` / `sustech-cs304` 下——本人仓已删，个人链接 404，页面却照旧挂着，还写着
//      它们的星数（⭐1 / ⭐3）。`risc-v-single-cycle-cpu` 更彻底：全网都搜不到，星数却写着 ⭐0。
//      星数对不存在的仓库是没有意义的数字：它是一句没人核对过的话，而且它看起来像真话。
//      §159：没接通的东西不假装接通。
//
//   ② **星数与 GitHub 上此刻的不一样。** 星数会变，页面不会自己变。写着 ⭐1 的仓今天可能是 ⭐3，
//      访客无从分辨——这与语言面板的 NaN 是同一族病：一个没有人重新核过的数字。
//
//   ③ **GitHub 上公开、却没列的仓。** 用户要求「把所有项目都列入我的 github io 页面」。
//      少列一个就是少一个项目，而"少列"不会自己暴露。
//
// 口径与 gh-stats.mjs 一致：账号本人的**公开**仓；fork 单独一类。
// 每一个"故意不列"的仓必须写进 EXCLUDED 并给出理由——那是一份**声明**，不是一个洞。
//
// 运行：GH_PAT=ghp_... node scripts/repo-roster-guard.mjs
//   只读并打印；任一红灯 exit 1。无 token 时 exit 78（UNVERIFIED）：闸门不假装自己通过。
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "xiaodernan";

/**
 * 故意不列出的仓库，附理由。
 *
 * 空 = 每一个公开仓都必须出现在页面上。往里加一条是**声明**，不是遮掩：审阅者能看见谁被放过、为什么。
 */
const EXCLUDED = {
  // 例：{ "some-repo": "课程组织仓，非本人作品" }
};

const token = process.env.GH_PAT
  || (existsSync(resolve(root, ".gh-pat")) ? readFileSync(resolve(root, ".gh-pat"), "utf8").trim() : "");
if (!token) {
  console.error("UNVERIFIED — set GH_PAT (or drop it in .gh-pat) to check the real roster.");
  process.exit(78);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};
const get = async (url) => {
  const r = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
};

// ── 1 · GitHub 上此刻的公开仓（账号本人） ───────────────────────────────────────────────
const repos = [];
for (let page = 1; page <= 10; page++) {
  const batch = await get(`https://api.github.com/user/repos?per_page=100&page=${page}&sort=pushed`);
  if (!batch) break;
  repos.push(...batch);
  if (batch.length < 100) break;
}
const mine = repos.filter((r) => r.owner?.login === OWNER && !r.private);
const own = mine.filter((r) => !r.fork);
const forks = mine.filter((r) => r.fork);

// ── 2 · 页面上声称的东西 ────────────────────────────────────────────────────────────────
const html = readFileSync(resolve(root, "index.html"), "utf8");

/** 页面**链接**到的每一个 GitHub 仓（不论属于谁——课程组织的仓也算）。 */
const linkedTo = new Map(); // "owner/repo" -> href
for (const m of html.matchAll(/href="(https:\/\/github\.com\/[^"?#]+)"/g)) {
  const href = m[1];
  const p = /^https:\/\/github\.com\/([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)/.exec(href);
  if (!p) continue;
  const key = `${p[1]}/${p[2]}`;
  if (!linkedTo.has(key)) linkedTo.set(key, href);
}

/**
 * 星数声明，按**它所在那张卡片指向的仓**归属。
 *
 * <p>归属必须跟着链接走：一张卡片指向 `ReverseRain/CS308_-ImageCaptioning-` 时，它写的 ⭐ 是
 * 那个仓的星数，不是 `xiaodernan/` 下同名路径的星数（那个路径 404，压根没有星数）。
 */
const claimedStars = new Map(); // "owner/repo" -> { name, stars, line }
for (const card of html.matchAll(/<a class="repo-card"[^>]*href="https:\/\/github\.com\/([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)"[\s\S]*?aria-label="([^"]*?)\s+stars[：:]\s*(\d+)"[\s\S]*?<\/a>/g)) {
  const [, owner, repo, label, n] = card;
  const key = `${owner}/${repo}`;
  if (!claimedStars.has(key)) {
    claimedStars.set(key, { label, stars: Number(n), name: repo });
  }
}

/** 页面统计块里的数字（中文块与英文块各一份，必须逐位一致）。 */
const statBlocks = [...html.matchAll(/<div class="index-stats"[\s\S]*?(?=<div class="project-table")/g)]
  .map(([block]) => [...block.matchAll(/<span class="index-stat-num">(\d+)<\/span>/g)].map(([, n]) => Number(n)));

// ── 3 · 对账 ───────────────────────────────────────────────────────────────────────────
const problems = [];
const repoCache = new Map();
const lookup = async (owner, repo) => {
  const key = `${owner}/${repo}`;
  if (!repoCache.has(key)) repoCache.set(key, await get(`https://api.github.com/repos/${owner}/${repo}`));
  return repoCache.get(key);
};

// ① 页面链接到的每一个仓，GitHub 上必须还在。
for (const key of [...linkedTo.keys()].sort()) {
  if (EXCLUDED[key]) continue;
  const [owner, repo] = key.split("/");
  const found = await lookup(owner, repo);
  if (!found) {
    const claim = claimedStars.get(key);
    problems.push(`linked-but-gone: ${key}`
      + (claim ? `（页面还写着它 ⭐${claim.stars} —— 不存在的仓库没有星数）` : ""));
  }
}

// ② GitHub 上公开、页面上没列的仓。
const linkedNames = new Set([...linkedTo.keys()].map((k) => k.split("/")[1]));
for (const r of own) {
  if (linkedNames.has(r.name)) continue;
  if (EXCLUDED[`${OWNER}/${r.name}`]) continue;
  problems.push(`public-but-unlisted: ${OWNER}/${r.name}（${r.language ?? "—"} · ${r.stargazers_count} ⭐）`);
}

// ③ 星数声明与实测不符。
for (const [key, claim] of [...claimedStars].sort()) {
  const [owner, repo] = key.split("/");
  const found = await lookup(owner, repo);
  if (!found) continue; // ① 已经报过了
  if (found.stargazers_count !== claim.stars) {
    problems.push(`star-drift: ${key} 页面写 ⭐${claim.stars}，GitHub 上是 ⭐${found.stargazers_count}`);
  }
}

// ④ 统计块与实测的仓数不符（第一格是账号公开仓总数）。
const realTotal = own.length + forks.length;
statBlocks.forEach((block, i) => {
  if (block[0] !== realTotal) {
    problems.push(`stats-drift: 第 ${i + 1} 块统计说 ${block[0]} 个账号公开仓，GitHub 上是 ${realTotal}`);
  }
});

console.log(`GitHub 上此刻：${own.length} 个自有公开仓 + ${forks.length} 个 fork = ${realTotal}；`
  + `页面链接 ${linkedTo.size} 个仓（跨 ${new Set([...linkedTo.keys()].map((k) => k.split("/")[0])).size} 个 owner）、`
  + `写 ${claimedStars.size} 处星数声明。`);
if (problems.length === 0) {
  console.log("repo-roster-guard: OK — 链接、星数与统计块与 GitHub 此刻一致");
  process.exit(0);
}
for (const p of problems) console.error(`::error::repo-roster-guard: ${p}`);
console.error(`repo-roster-guard: ${problems.length} 处对不上。`);
process.exitCode = 1;
