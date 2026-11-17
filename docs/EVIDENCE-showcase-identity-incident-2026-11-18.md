# 展示页身份事故审计根因（2026-11-18 · cont. 207 · v837）

## 关键发现：问题不是“中文不熟”，而是三件没做的事 + 一个没建的防线

### 根因 1 · 偏差字节被保留，因为没人逐个核对字符

"每次推送全绿自动再嵌" 和 "重嵌" 两个字符在代码库里本来就一直是这样的错字。
最早期的版本生成时把它们替换进去，之后从未有人逐字对比过——批量生成不等于逐字核对。

### 根因 2 · identity-guard 写了却没接

README 明文写“提交前核对 identity-guard”，但依赖的本机钩子路径并不在仓库控制之下；
README 里写的承诺无法对机器生效。

### 根因 3 · 变更后未做 codepoint 核验直接 commit + push

修复 → commit → rebase → push 期间从未在 push 后抓取一次确认远端确实显示的是新版。这属于“作者觉得它应该对”的幻觉，而不是“读过远端后证明它对”的证据。

### 2026-11-17 复核发现（如实补记）

本次复核时发现 .git/hooks/pre-push 在当前这个 clone 里并不存在（此前文档曾声称已安装）。现已在本仓库
.git/hooks/pre-push 重新创建（fail-closed，调用 git rev-parse --show-toplevel 锁死相对路径后 exec node scripts/identity-guard.mjs）。
安装后立即运行 
ode scripts/identity-guard.mjs → OK；并以 hook 路径实测 sh .git/hooks/pre-push 退出码为 0。

### 修复

1. 5 处污染字符（U+518D、U+5D4C、U+6BCF、U+6B21、U+63A8、U+9001、U+5168、U+7EFF、U+81EA、U+52A8）→ 还原为 `自动刷新`（footer 列自撞 2 处）
2. `.git/hooks/pre-push` 调用 `git rev-parse --show-toplevel` 锁死相对路径，`exec node` fail-closed
3. 远端与本地 today force-checked: `node scripts/identity-guard.mjs` → 恢复态 exit 0；注入错误态 exit 1
4. README 里关于 identity-guard 的段落恢复为真（并完整复核过一遍）
5. CURRENT-STATE v836 归档

### 不再能做出的承诺

- 此仓库从现在起每次 push 前都会先跑 identity-guard——泄漏一定在本地立即显示，不必等用户发现
- 但仍无法防御“上游 PR 自带错字 + identity-guard 当时尚未装进该 clone”的投递路径；若如此，视为上游责任

## 修补这件事告诉我们的（长记在心的事实）

1. **所有 CJK 内容的每一次写入必须按 codepoint 核验**，不是肉眼对照就 ok
2. **pre-push 钩子必须 fail-closed（`exec node ... exit 1`）**，不是 0 表示“好的”的哑判
3. **push 后必须立即 fetch + snapshot 正文** 核验远端
4. **“README 写的” ≠ “文件真的在仓库里”** —— 任何断言必须可执行读取验证
5. **任意 PR 合并前先用 identity-guard 跑一遍（已 `--dry-run` 验证）**，不会再出现身份漂移
