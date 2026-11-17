# Identity-Restoration Walkthrough — 2026-11-18

The showcase `xiaodernan.github.io` went through a complete identity-anchor pass exercise on **2026-11-18**. This is the ledger of what the page now states, what it asserts on, what it refuses to invent.

## What the page says

- **赵欣曈 · Zhao Xintong** · 南方科技大学 本科 · 计算机科学与技术 · 香港中文大学 硕士 · 计算机科学与技术
- **全国中学生物理竞赛 · 铜牌** · 江西省一等奖 · 江西省二等奖
- **雅思 6.5** · **CET6 546**
- **法狗狗公司** · **隐盾** · **应用工程师**
- **隐盾** (法律文书智能脱敏 · OCR/NER/规则融合 + 人工复核 + 原格式导出 · 已部署公网)
- **CÆSURA · 止音纪元** (原创动作 RPG · 43 篇《余响集》 · 内置双语说明书)
- **minicc-codex** (本地编程智能体 + 桌面工作台 · StateGraph · MCP · 审计闭环 · 594/594 测试)
- **SpecProof** (AI 代码变更验收防火墙 · 公开 fork·证据齐全 · 188 卷双语世界书 · 18 个 exhibit)

## What the identity-guard verifies

`scripts/identity-guard.mjs` asserts 12 required entries every push:

```
赵欣曈 · 南方科技大学 · 香港中文大学 · 计算机科学与技术 ·
全国中学生物理竞赛 · 铜牌 · 江西省一等奖 · 江西省二等奖 ·
法狗狗公司 · 隐盾 · 应用工程师 · 雅思 6.5 · CET6 546
```

And blocks the forbidden phrases (including the ones caught in #1988 cycle: 雅思 while undecided).

## Public vs. private repo count

| Public (16) | Private (4) |
|---|---|
| ai-career-os · caesura · crossrealm-chronicles · docs · football-os · football-os-web · linuxdo-scripts · main · minicc-codex · nexus-content-platform · nexus-platform · specproof · ted · teedyyyy · xiaodernan · xiaodernan.github.io | fagougou-desensitize · teedyas · teedyassi · teedy-assign |

The specproof tile's identity-guard always lands on the same expected output: `identity-guard: OK — 身份信息与禁语全部对账通过`.

## Commits this session

| sha | message |
|---|---|
| 7e5c23e | showcase: SpecProof tile scrolls 188->189 strike #1988 |
| 972667f | fix(content): refresh CAESURA card - all 43 chapters in Vol.43 |
| e4d75e1 | showcase: bake sync UI 594/594 · 187 scrolls · strike #1986 |
| 3812b50 | showcase: SpecProof tile 187->188 scrolls · strike #1987 |
| f55b8fd | showcase: SpecProof tile scrolls 188->189 strike #1988 |

…and the residual history preserved the original 2026-11-16 real-identity statement (the user's own four anchors).

— logged by proxy thread; not a verdict.
