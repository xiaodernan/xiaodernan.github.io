# 赵欣曈 · 个人展示页

这是一个无构建依赖的 GitHub Pages 静态个人作品集，入口为 `index.html`。

## 本地预览

```powershell
python -m http.server 4173
```

然后打开 `http://127.0.0.1:4173/`。

## 身份闸门

本页载有本人身份信息（姓名 / 院校 / 专业 / 奖项 / 公司 / 产品），这些事实由仓库自带的
`scripts/identity-guard.mjs` 逐条核对。每次改动后运行一次即可：

```powershell
node scripts/identity-guard.mjs
```

脚本要求 index.html 必须包含本人真实信息（姓名、院校、专业、竞赛奖项、实习公司、产品名等），
且不得出现任何往期出错的版本字样。脚本本身是失败即阻断（fail-closed）的闸门；在本仓库
`master` 的每次改动提交前都应先跑一遍，防止身份信息被无意改坏。

> 说明：GitHub 端创建 `.github/workflows/*.yml` 需要 `workflow` 权限，当前 PAT 只有 `repo` 等权限，
> 无法把闸门装进 GitHub Actions。闸门因此以文档化方式 + 本机核对的方式执行。

## 当前对齐（2026-11-18 收尾）

- 雅思 6.5 · CET6 546（用户本人钦示，强一口气）
- 全部 16 个公开仓库：minicc-codex、specproof、caesura、crossrealm-chronicles、nexus-content-platform、nexus-platform、football-os、football-os-web、ai-career-os、ted、teedyyyy、main、docs(fork sismics-docs)、linuxdo-scripts(fork anghunk-linuxdo-scripts)、xiaodernan(本站)、xiaodernan.github.io
- 4 个私有仓（不在公开清单）: fagougou-desensitize、teedyas、teedyassi、teedy-assign
- SpecProof tile `UI 594/594 · #18 exhibit · 189 scrolls · strike #1988`（由 `sp-state` 从 `specproof/docs/latest.json` 每行直接读）
- IELTS / CET6 已在 `README (profile)`、`banner.svg <desc>`、展示瓷 `index.html` 主要三个 chip 全显示

## 本地核验流程（每次推送后必跑）

```powershell
node scripts/identity-guard.mjs
python -m http.server 4180  # 肉眼复核 hero/轮廓/卡片条
```

## 自动同步叙事

每个卫星仓库（specproof、caesura、minicc、football-os、career-os、nexus-platform、nexus-content-platform）的自身 master 都会周期性 push 入 `assets/*/latest.json` 最新事实包，加 `sp-state` placeholder 之后由静态站点直接 fetch。真正"最新"始终来自每个卫星 master 自身，而不是本仓库手动维护数字。

## 历史

- `docs/EVIDENCE-identity-baseline-2026-11-18.md` — 本轮身份 restore 全流程记录
- `docs/EVIDENCE-showcase-identity-incident-2026-11-18.md` — 之前影子改写的追溯
- `docs/adr-0275-identity-guard-boundary.md` — identity guard 的职责边界

## 取舍

- `minicc-codex` 是首选主展示项。
- `football-os` 周 cron 自动重算最新事实。
- SpecProof 此刻进入 Scroll CLXXXIX（#1988），门禁仍 LOCKED。
