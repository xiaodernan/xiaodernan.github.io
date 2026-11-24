#!/usr/bin/env node
/**
 * crossrealm-ribbon-guard.mjs —— 首页「跨界纪元」事实条的**双语同值**闸门。
 *
 * ## 它抓的是什么
 * 首页有两份 `.cr-volumes` / `.cr-sources-label`（中文半区与英文半区），运行时由内联脚本
 * 从 assets/crossrealm/latest.json 刷成同一个数。但**脚本没跑起来时**（JS 被拦、离线、
 * 首帧未到），玩家看到的是 HTML 里手写的兜底值。2026-11-24 实测：中文写 611 源、
 * 英文写 587 源 —— 同一个事实两个口径，正是「全部内容统一、不许中英夹杂」要防的形状。
 *
 * ## 判据（全离线，读本仓文件）
 *   ① 两份兜底数字逐项相等（volumes 与 volumes，sources 与 sources）；
 *   ② 每份都等于事实包 assets/crossrealm/latest.json 的对应字段
 *      （novel_chapters_zh / lore_sources）；
 *   ③ 反向控制：两种语言各至少有一枚数字（防止把两半都删掉而假绿）。
 *
 * 用法：node scripts/crossrealm-ribbon-guard.mjs
 * 退出码：0 = 一致；1 = 漂移或缺字段。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const fact = JSON.parse(readFileSync(join(ROOT, 'assets/crossrealm/latest.json'), 'utf8'));

const 取数 = (cls) => [...html.matchAll(new RegExp(`class="[^"]*${cls}[^"]*"[^>]*>([\\s\\S]{0,120}?)<`, 'g'))]
  .map((m) => m[1].replace(/<[^>]*>/g, '').trim());
const 抽数 = (s) => {
  const m = s.match(/\d[\d,]*/);
  return m ? Number(m[0].replace(/,/g, '')) : null;
};

const vols = 取数('cr-volumes').map(抽数);
const srcs = 取数('cr-sources-label').map(抽数);
function 核对(名, 列, 期望) {
  const 问 = [];
  if (!Number.isFinite(期望) || 期望 <= 0) return [`事实包里没有合法的 ${名}`];
  if (列.length !== 2 || 列[0] !== 列[1]) 问.push(`${名}的两语兜底值不一致：${JSON.stringify(列)}`);
  for (const v of 列) if (v !== 期望) 问.push(`${名}兜底 ${v} ≠ 事实包 ${期望}`);
  return 问;
}

const 问 = [];
if (vols.length < 2 || srcs.length < 2) 问.push(`双语兜底值各要两枚：volumes=${JSON.stringify(vols)} sources=${JSON.stringify(srcs)}`);
问.push(...核对('卷数', vols, Number(fact.novel_chapters_zh)));
问.push(...核对('源数', srcs, Number(fact.lore_sources)));

// 反向控制：合成一处漂移，判据必须红——否则这条门恒绿，等于没守。
if (核对('反向控制', [期望值(vols, fact), 期望值(vols, fact) + 1], 期望值(vols, fact)).length === 0) {
  console.error('crossrealm-ribbon-guard: 反向控制失败——漂移没被判红');
  process.exit(1);
}
function 期望值(列, 数) { return Number.isFinite(Number(数.novel_chapters_zh)) ? Number(数.novel_chapters_zh) : (列[0] ?? 0); }

if (问.length) {
  for (const q of 问) console.error(`crossrealm-ribbon-guard: ${q}`);
  process.exit(1);
}
console.log(`crossrealm-ribbon-guard: OK — 双语兜底 ${vols[0]} 卷 / ${srcs[0]} 源，与事实包一致`);
