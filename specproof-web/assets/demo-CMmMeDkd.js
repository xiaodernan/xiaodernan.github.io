import{o as e}from"./i18n-DGbzqO_7.js";var t={repo_path:`demo/spring-backend`,spec_path:`demo/requirement.txt`,base_ref:`base`,head_ref:`head-v1`},n="首次使用先运行 `specproof demo` 或 pwsh scripts/prepare_demo_repo.ps1 为演示仓库创建 git 版本",r=`若执行服务运行在其他目录, 请改用 demo/spring-backend 的绝对路径。`,i="On first use, run `specproof demo` or pwsh scripts/prepare_demo_repo.ps1 to prepare the demo repository",a=`If the worker runs elsewhere, use the absolute path of demo/spring-backend instead.`,o={zh:{prepare:n,absPath:r,repo:n+`; `+r},en:{prepare:i,absPath:a,repo:i+`; `+a}};function s(t=e()){return o[t]}var c={zh:{task_name:`修复 double 函数`,spec_text:`修复 calc.py 中 double 函数的 bug：它目前把输入除以 2，应返回输入的两倍 (x * 2)。
验收: 覆盖正数、负数和零的现有测试全部通过。
禁止: 修改或删除测试文件。
影响: calc.py test_calc.py`},en:{task_name:`Fix the double function`,spec_text:`Fix the bug in calc.py's double function: it currently divides the input by 2; it should return twice the input (x * 2).
Acceptance: all existing tests covering positive, negative and zero pass.
Forbidden: modifying or deleting test files.
Scope: calc.py test_calc.py`}};function l(t=e()){return c[t]}o.zh.prepare,o.zh.absPath,o.zh.repo,c.zh;export{l as n,s as r,t};