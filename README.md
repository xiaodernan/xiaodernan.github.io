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
- 隐盾在线服务链接指向 `https://yindun.fagougou.com/`，页面不会复制或暴露任何服务凭据。
- `nexus-content-platform` 当前 `main` / `master` 同一提交，展示入口使用 `main`。
- `specproof` 使用当前 `master` 作为唯一展示线；实验分支不作为主入口。
- 其他公开仓库保留在“全部作品”列表中，方便面试者继续深入。

## 当前未自动执行的外部动作

本地页面已完成，但没有自动提交、推送 GitHub，也没有把任何私有仓库改写为公开。私有 CNB 仓库的内容不能在当前无凭据环境中安全比对；页面只展示你明确提供的公网链接。
