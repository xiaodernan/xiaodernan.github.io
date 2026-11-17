# 展示页身份事故审计根因（2026-11-18 · cont. 207 · v837）

## 关键发现：问题不是"我对中文不熟"，而是三件没做的事 + 一个没建的防线

### 根因 1 · 偏差字节被保留是因为没人逐个核对字符
`"每次推送全绿自动再嵌"` 和 `"重嵌"` 字符在代码库里本来就一直是这种错字。
最早期的版本生成时替换为 naheless 空串的越轨 — 从 generator 算法错位取字符，后来从未有人对比过。

### 根因 2 · identity-guard 是写了却没接
`README.md` 明文写"pre-push（`.git/hooks/pre-push`）"，但 `.git/hooks/pre-push` **从未创建**。
README 里的承诺对机器讲没有任何力量，所以机器听从了真正手写的 fallback（缺省拿主/HEAD/origin 里的影子文件）。

### 根因 3 · 变更后未做 codepoint 核验直接 commit+push
修复 → commit → rebase → push 期间我从未在 push 后抓取一次确认远端确实显示的是新版。这是"作者觉得它应该对的" 幻觉，不是"读过远端后证明它对的" 证据。

### 修复
1. 5 处污染字符（U+518D U+5D4C、U+6BCF U+6B21 U+63A8 U+9001 U+5168 U+7EFF U+81EA U+52A8 U+518D U+5D4C）→ 还原为 `"自动刷新"` / `"自动刷新"`（footer 列自撞 2 处）
2. `.git/hooks/pre-push` 调用 `git rev-parse --show-toplevel` 锁死相对路径，`exec node` fail-closed
3. 远端与本地 today force-checked: node scripts/identity-guard.mjs → exit 0 on restore; exit 1 on atomic break
4. 把 README 里关于 identity-guard 的段落恢复为真 "并加全参数"（read README）
5. CURRENT-STATE v836 归档

### 不再能做出的承诺
- 此仓库从现在起任何 push 都会先跑 identity-guard——泄漏一定在本地立即显示，不必等用户发现
- 但仍无法防御"上游 PR 是错字 + identity-guard 此时尚未装进这次 clone"的投递路径；若如此，视为上游责任

## 修补这件事告诉我们的（长记在心的事实）

1. **所有 CJK 内容的每一次写入必须按 codepoint 核验**，不是肉眼对照就 ok
2. **pre-push hook 必须是 fail-closed（`exec node ...exit 1`），不是 0 表示"好的"哑判**
3. **push 后必须立即 fetch+snapshot 正文** 核验远端
4. **"README 写的" ≠ "文件真的在仓库里"** —— 任何 "at least E444" 级断言必须可执行读取验证
5. **任意 PR 合并前先用 identity-guard（已 `--dry-run`/read-me 验证）** 不会再出现完全一致的中文身份漂移
