import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = resolve(root, "index.html");
const fallbackPath = resolve(root, "assets", "football", "latest.json");
const upstreamUrl = "https://raw.githubusercontent.com/xiaodernan/football-os/master/docs/latest.json";
const args = process.argv.slice(2);
const fetchUpstream = args.includes("--fetch");
const write = args.includes("--write");
const check = args.includes("--check");

function fail(message) {
  throw new Error(message);
}

function validatePack(pack) {
  if (!pack || typeof pack !== "object" || Array.isArray(pack)) fail("fact pack is not an object");
  if (typeof pack.head !== "string" || !/^[0-9a-f]{7,40}$/i.test(pack.head)) fail("head is not a Git SHA");
  for (const key of ["total_commits", "screens", "locales", "assets", "basket_chapters"]) {
    if (!Number.isInteger(pack[key]) || pack[key] < 0) fail(`${key} is not a non-negative integer`);
  }
  if (typeof pack.milestone !== "string" || !pack.milestone) fail("milestone is missing");
  const generated = new Date(pack.generated_at);
  if (!Number.isFinite(generated.getTime())) fail("generated_at is not a date");
  return pack;
}

function splitHalves(html) {
  const halves = [];
  const templateRe = /<template data-i18n-en="[^"]*">[\s\S]*?<\/template>/g;
  let cursor = 0;
  let match;
  while ((match = templateRe.exec(html)) !== null) {
    if (match.index > cursor) halves.push({ lang: "zh", start: cursor, end: match.index, text: html.slice(cursor, match.index) });
    halves.push({ lang: "en", start: match.index, end: match.index + match[0].length, text: match[0] });
    cursor = match.index + match[0].length;
  }
  if (cursor < html.length) halves.push({ lang: "zh", start: cursor, end: html.length, text: html.slice(cursor, html.length) });
  return halves;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function valuesFor(pack, lang) {
  const commits = pack.total_commits.toLocaleString("en-US");
  const date = new Date(pack.generated_at).toISOString().slice(0, 10);
  return {
    "fw-head": `master @ ${pack.head}`,
    "fw-commits": commits,
    "fw-hero-commits": commits,
    "fw-milestone": pack.milestone,
    "fw-screens": String(pack.screens),
    "fw-locales": String(pack.locales),
    "fw-assets": String(pack.assets),
    "fw-generated": lang === "en"
      ? `Fact pack ${date} · milestone ${pack.milestone} · ${pack.basket_chapters} basket chapters`
      : `事实包 ${date} · 里程碑 ${pack.milestone} · ${pack.basket_chapters} 章`,
  };
}

function paint(html, pack) {
  let changed = 0;
  const halves = splitHalves(html);
  const classes = Object.keys(valuesFor(pack, "zh"));
  for (const className of classes) {
    const re = new RegExp(`<(code|span)\\b[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*"[^>]*>`, "g");
    const count = (html.match(re) || []).length;
    if (count !== 2) fail(`page has ${count} .${className} cells, expected one per language half`);
  }
  for (let index = 0; index < halves.length; index += 1) {
    let half = halves[index];
    for (const [className, value] of Object.entries(valuesFor(pack, half.lang))) {
      const re = new RegExp(`(<(code|span)\\b[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, "g");
      const matches = [...half.text.matchAll(re)];
      if (matches.length > 1) fail(`${half.lang} half has ${matches.length} .${className} cells, expected at most one`);
      if (!matches.length) continue;
      const next = half.text.replace(re, (_all, open, _tag, _old, close) => `${open}${escapeHtml(value)}${close}`);
      if (next !== half.text) {
        changed += 1;
        half = { ...half, text: next };
        halves[index] = half;
      }
    }
  }
  const out = halves
    .slice()
    .sort((a, b) => b.start - a.start)
    .reduce((acc, half) => acc.slice(0, half.start) + half.text + acc.slice(half.end), html);
  return { out, changed };
}

async function main() {
  let pack;
  try {
    const source = fetchUpstream
      ? await fetch(upstreamUrl, { cache: "no-store", headers: { "User-Agent": "football-os-profile-sync" } })
      : null;
    if (source && !source.ok) fail(`upstream returned HTTP ${source.status}`);
    pack = validatePack(JSON.parse(source ? await source.text() : readFileSync(fallbackPath, "utf8")));
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  const html = readFileSync(indexPath, "utf8");
  const { out, changed } = paint(html, pack);
  const fallbackText = `${JSON.stringify(pack, null, 2)}\n`;
  const fallbackChanged = fetchUpstream && readFileSync(fallbackPath, "utf8") !== fallbackText;

  if (check) {
    if (changed || fallbackChanged) {
      fail(`static page or fallback drifted (${changed} page fields, fallback ${fallbackChanged ? "changed" : "current"})`);
    }
    console.log("sync-football-os: OK — static figures and fallback match the fact pack");
  } else if (write) {
    if (fallbackChanged) {
      mkdirSync(dirname(fallbackPath), { recursive: true });
      writeFileSync(fallbackPath, fallbackText, "utf8");
    }
    if (out !== html) writeFileSync(indexPath, out, "utf8");
    console.log(`sync-football-os: ${changed} page fields ${out === html ? "already current" : "painted"}; fallback ${fallbackChanged ? "refreshed" : "current"}`);
  } else {
    console.log(`sync-football-os: ${changed} page fields need painting; fallback ${fallbackChanged ? "needs refresh" : "current"}`);
  }
}

main().catch((error) => {
  console.error(`::error::sync-football-os: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
