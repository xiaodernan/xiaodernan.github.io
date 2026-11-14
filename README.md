# 赵欣曈 · 个人展示页

这是一个无构建依赖的 GitHub Pages 静态个人作品集，入口为 `index.html`。

## 本地预览

```powershell
python -m http.server 4173
```

然后打开 `http://127.0.0.1:4173/`。

## GitHub Pages

把当前目录作为一个 GitHub 仓库的根目录，Pages 构建来源选择 `Deploy from a branch`，分支选择默认分支的 `/ (root)` 即可。项目没有 npm 构建步骤，也不需要 Docker。

## 项目取舍

- `minicc-codex` 是必选主展示项，页面链接指向其公开源码和能力概览。
- `nexus-platform` 的展示卡读取 `./assets/nexus-platform/latest.json`；`.github/workflows/sync-nexus-platform.yml` 每周一 13:00 UTC 从其公开仓跑一次只读同步，提交一份更新的事实包（一次提交总数 + 最新里程碑 + 特性面），直接在卡片上呈现；`nexus-platform/master` 的每次推送都会原样进入展示，不需要改本仓库。里程碑文本由 nexus-platform 仓库内的 `docs/SHOWCASE.json` 手动维护，只在有“大提升”时才更新。
- 隐盾在线服务链接指向 `https://yindun.fagougou.com/`，页面不会复制或暴露任何服务凭据。
- `nexus-content-platform` 的 最新 `latest.json` 已嵌入主卡只读取（see `./assets/nexus-content/latest.json`），页面直接读它并每分钟右下显示真实提交数 / ADR 数 / 契约数 / Java 服务数，一行 `git push` 即可刷新——... 见 `.github/workflows/` 与任何同步脚本
- `specproof` 使用当前 `master` 作为唯一展示线；实验分支不作为主入口。
- 其他公开仓库保留在"全部作品"列表中，方便面试者继续深入。

## 当前未自动执行的外部动作

本地页面已完成，但没有自动提交、推送 GitHub，也没有把任何私有仓库改写为公开。私有 CNB 仓库的内容不能在当前无凭据环境中安全比对；页面只展示你明确提供的公网链接。
