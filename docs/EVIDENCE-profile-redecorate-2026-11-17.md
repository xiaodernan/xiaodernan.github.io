# 个人资料重装修记录（2026-11-17 · v860）

## 范围

1. **个人作品集**（本仓库 `xiaodernan.github.io`）：
   - 「PROJECT INDEX」改为「CURATED · 精选 2026.11」（6 行精选不动，保留 upstream live stars 徽章），
     上方新增「16 公开仓库 · 9 原创旗舰 · 3 公网产品 · 6 双语对账」统计条
   - 「ALL REPOS · 全部仓库」（16 卡片、分类过滤 主力/本站/归档/fork、含 `main`）完整保留
   - 新增 github-figures GitHub 真实数据卡两张（`github-readme-stats.vercel.app`，`onerror` 单卡隐藏）
   - hero-howto 更新为：works → lab → 项目索引（精选）→ 全部仓库（16）→ 成长路径
   - focus-visible 轮廓 / 暗色主题 / reduced-motion 适配；index-row 左缘 accent 线 hover
2. **GitHub 个人主页**（`xiaodernan/xiaodernan` repo）：
   - 新增自绘 `assets/banner.svg`（ZX 标识 · 赵欣曈 / ZHAO XINTONG · AI 应用工程师）
   - README.md 重排：banner 顶图、关于我、原创旗舰 9 项带 live 直达、
     「全部公开项目」分原创方向（10）/ 早期 Fork 实验（4）、徽章 for-the-badge
     （SUSTech / CUHK / 全国中学生物理竞赛 铜牌）、GitHub 实时统计卡

## 验证（逐项落到机器）

- `scripts/identity-guard.mjs`：identity-guard OK（need 11 条全在、ban 9 条零命中）
- HTML 解析：0 errors；`github-readme-stats` 卡片全部 `referrerpolicy="no-referrer"` + `onerror` 隐藏保护
- GitHub Pages：HTTP 200，正文与仓库 lg `master` EOL-归一后**逐字节一致**（sha1c78ed84f43e79f4），
  含 `全部仓库` / `ALL REPOS` / `index-stats` 等新节点
- GitHub profile 页面：HTTP 200，渲染全部新节点（banner.svg、全部公开项目、Fork 实验、统计卡、
  法狗狗公司、计算机科学与技术 ×2、1841422153@qq.com）

## 不改动的事实（逐字守卫）

赵欣曈 · 南方科技大学（本科 计算机科学与技术）· 香港中文大学（硕士 计算机科学与技术）·
全国中学生物理竞赛 铜牌 · 江西省一等奖 / 二等奖 · 法狗狗公司（应用工程师 · 实习）· 隐盾

## 如实边界

- GitHub profile 字段（bio / company / location）需要 OAuth `user` scope，
  当前本机 token 只有 `gist, public_repo, repo, workflow, write:packages`（无 `user`），
  本次**未授权也不能**调用 `PATCH /user`；如需补齐，由用户执行 `gh auth refresh -s user`
- fork（ted / teedyyyy / docs / linuxdo-scripts）如实标注「上游 fork · 早期实验」，不冒充原创
