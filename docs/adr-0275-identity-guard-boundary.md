# ADR 0275 — 展示页个人信息《藏语钉》（identity-guard）的安装边界与维护约定

日期：2026-11-18
状态：已接受

## 背景

用户个人展示页（`xiaodernan.github.io/`）多次出现 personal-info / 汉字 字形错误（同义相近字：`再→重`、`嵌→嵌/臌`）。
展示页仓库内置 `.github/workflows/`（页面部署）与 `scripts/identity-guard.mjs`：后者是 README 描述为
"pre-push 强制身份对账钩子"。

关键点：`.git/hooks/pre-push` 在本仓**没有安装**（用户本人仓库的 hooks 目录为空），README 也明示
"GitHub 端创建 workflow 需要 `workflow` 权限 PAT，当前 PAT 仅 `repo` 权限，无法把闩锁装进 GitHub Actions"。
因此 identity-guard 只能通过本机 pre-push 钩子执行（且钩子尚未安装），CI 侧目前无任何身份/汉字自动对账。

## 选项

A. 擅自配置 PAT 或修改用户 GitHub 仓库的 secrets/permissions——越权操作，拒绝。
B. 装 `git config core.hooksPath = scripts/hooks`（`.git/info/hooksPath`）——把本仓控制下的钩子目录挂到每个人对这个仓库的克隆里；`git push` 前会自动跑 `identity-guard.mjs`。缺点：`--no-verify` 可绕过，与 "Git 约定不改用户全局配置" 冲突，且 `.git/hooks/` 目录并未 commit，工作流不透明。
C. **仅保持 pre-push 钩子文档化且不擅自安装；工作流层面用"更新后人工核验"的方式管理**（README 已注明可用 `workflow` PAT 装入 GitHub Actions）。本 ADR 是对选项 C 的显式接受，把用户当前"不自取 PAT、不乱装钩子"的状态正式定好，不留歧义。
D. 每次改动展示页后，手动（或自动）`node scripts/identity-guard.mjs` 并且页在本地预览时逐段对账。

## 决定（采纳 C + D）

- `.git/hooks/pre-push` 保持**未安装**。不为本文仓库修改用户机器的全局 git config，不创建额外 PAT；GitHub Actions 侧仍由用户获得 `workflow` PAT 后按需启用
- 所有页面内容改动后（含加入 latest.json 刷新同步），必须：
  1. `node scripts/identity-guard.mjs` 返回 OK（所有 need 命中 + 全部 ban 零命中）
  2. 复核展示页主页每一段含中文的可见文本（含 `<!-- latest-start --> … <!-- latest-end -->` 两侧共 ~170 段）byte-decode 无乱字
  3. `git diff` 按行显示改动，确认每一行改动是有意识的（不引入 new CJK 字符未经人工对账）
- 出现任何 personal-info / 汉字疑似错误，**必须**用 `unicodedata` 或等价工具按 codepoint 核对后再提交
- 本文档定义了本仓库对用户身份事实的唯一核对执行路径；任何内容往 `identity-guard.mjs` 添加/删除需词都必须与用户确认

## 后果

- 身份信息回归风险从 "每次推送都是盲测" 收到 "每次提交都有文档化卡位 + 显式人工对账"
- README 身份对账段落与 identity-guard 同步，README 自身字形（README 中 `隐盾` 而非 `隐图`）也已复核一篇
- 展示页不会因 PAT 权限不足而悄悄错乱个人身份——风险被显式记录、隔离、兜底

## 待办（非本 ADR，仅登记）

- 用户若提供带 `workflow` 权限的细粒度 PAT，可仿照现有 `sync-*.yml` 的模式，安装 `.github/workflows/identity-guard.yml`
  （运行 `node scripts/identity-guard.mjs` 作为 check job，fail-closed，提升展示仓主页级防线）
- 本文档随 identity-guard 的任何需词改动必须一并更新
