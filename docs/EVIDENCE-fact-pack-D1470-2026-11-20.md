# EVIDENCE — D1470 milestone fact-pack sync (2026-11-20)

**Trigger.** Layer P CLOSED at chapter 158 (`hk-happy-valley-racecourt-east-gate-first-night-watch-chronicle`):
the reunion arc (145–158) hands the east-gate keys to Ah Muk. This is the "layer closure" heavy milestone
the operator's cadence rule names.

**Real numbers (authenticated GitHub REST, not hand-written).**
- NEXUS master head `2f38ea11628b9518713087bbeee9af2a1d94076f` (short `2f38ea1`), commit
  `D1470: chapter 158 CLOSES Layer P (the night watch handed on) - arc 158, atlas lockstep`.
- Total commits `1,716` (`Link: rel="last"` count).
- Arc 158 chapters, three arms; `chapter-en-arm.test.ts` 162/162; full AI suite and web suite green;
  `verify_all` NO OFFENDER; frozen atlas digest/index regenerated to 158 in the same commit.

**Showcase changes.** `assets/nexus-platform/latest.json` and both baked language arms of `index.html`
now carry `2f38ea1 / 1,716 / D1470 / 158 chapters / Layer P CLOSED`. The features list was rewritten
from actual work: six StateGraphs, eleven model-facing lanes on the frozen prefix, in-session
growing history, the fenced 87K-token auditor, the on-demand story recap, the io truth repair, the
640-request production stress evidence and the CI posture. `identity-guard` passed after the edit.

**Rule honoured.** No sync for the eleven intervening chapter commits — only at a layer closure
(or another unambiguous big improvement). The previous live-verified pack was D1466; this one is
the closure upgrade.

**Deploy.** `pages.yml` dispatched on this head; the live `https://xiaodernan.github.io/` must carry
`D1470 / 2f38ea1 / 1,716 / 158 chapters` before the milestone is considered done. If
`deploy-pages@v4` reports "Found 0 artifact(s)" immediately after a successful upload, re-dispatch
once (see `EVIDENCE-pages-deploy-retry-2026-11-20.md`).
