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

## GitHub Pages

把当前目录作为一个 GitHub 仓库的根目录，Pages 构建来源选择 `Deploy from a branch`，分支选择默认分支的 `/ (root)` 即可。项目没有 npm 构建步骤，也不需要 Docker。

## 项目取舍

- `minicc-codex` 是首选主展示项，页面链接指向其公开源码和能力概览。
- `nexus-platform` 的展示卡读取 `./assets/nexus-platform/latest.json`；`.github/workflows/sync-nexus-platform.yml` 每周一 13:00 UTC 从其公开仓跑一次只读同步，提交一份更新的事实包（一次提交总数 + 最新里程碑 + 特性面），直接在卡片上呈现；`nexus-platform/master` 的每次推送都会原样进入展示，不需要改本仓库。里程碑文本由 nexus-platform 仓库内的 `docs/SHOWCASE.json` 手动维护，只在有“大提升”时才更新。
- 隐盾在线服务链接指向 `https://yindun.fagougou.com/`，页面不会复制或暴露任何服务凭据。
- `nexus-content-platform` 的最新 `latest.json` 已嵌入主卡只读取（see `./assets/nexus-content/latest.json`），页面直接读它并每分钟右下显示真实提交数 / ADR 数 / 契约数 / Java 服务数，一行 `git push` 即可刷新——……见 `.github/workflows/` 与任何同步脚本。
- `football-os` 的卡片读的是足球项目自身 master 的 `docs/latest.json`（master weekly cron 仅在语义面变化时提交）；`assets/football/latest.json` 是同一副本的离线兜底，随 football-os 的主要推进同步更新；早期的 React 演示版仍保留在同卡片的脚注里。
- `specproof` 使用当前 `master` 作为唯一展示线；实验分支不作为主入口。
- 其他公开仓库保留在“全部作品”列表中，方便继续深入。

## 同步方式

本仓库中的事实包（`assets/*/latest.json`）由各项目自身的 master 分支每周一重算；`football-os` 的卡片由 football-os 的主要推进带动更新（`git push` 后随之同步）。本页除静态资源外没有服务端逻辑，所有数字在浏览器端实时渲染，不构成任何个人资质的虚假声称。
