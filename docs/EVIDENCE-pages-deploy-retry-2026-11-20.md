# EVIDENCE — Pages deploy incident + retry (2026-11-20)

**Symptom.** After the D1466 fact-pack push (`34a7d5b`, `8d25dd1`), the public page still served
`8b0678dc / D1447 / 1,689`. The two most recent `Deploy portfolio to GitHub Pages` runs
(`44596754728`, `44597448678`) had **failed**, so this was not CDN propagation.

**Diagnosis (from the downloaded Actions log, step `7_Deploy to GitHub Pages.txt`).**
- `Archive artifact (pwsh)` and `Upload artifact` both succeeded: `Artifact github-pages has been
  successfully uploaded! ... Artifact ID 14565059705`, 2,597,865 bytes.
- `actions/deploy-pages@v4` then reported `Found 0 artifact(s)` ~200 ms later at
  `Fetching artifact metadata for "github-pages"`. The artifact exists but was not yet visible
  through the metadata API — an eventual-consistency race between `upload-artifact@v4` and
  `deploy-pages@v4`, not a content or identity-guard problem (that step stayed green).
- Earlier history shows `ubuntu-latest` green deploys and self-hosted Windows runners failing
  deterministically at the upload step (no `/bin/bash` for `upload-pages-artifact@v3`); the workflow
  correctly stays on `ubuntu-latest`.

**Resolution.** One `workflow_dispatch` of `pages.yml` on master (`44606005273`, head `8d25dd10`)
completed **success**. The live `https://xiaodernan.github.io/` was then probed with a cache-buster:
`5274f9de` ×2 · `1,712` ×2 · `D1466` ×6 · `155 chapters` ×3 · `155 章` ×1 · `8b0678dc` 0 ·
`D1447` 0 · `NaN` 0.

**Rule for the future.** A fact-pack push is not finished until a Pages deploy on that head is green
AND the live page carries the new head. If `deploy-pages` reports "Found 0 artifact(s)" immediately
after a successful upload, re-dispatch once before investigating content.
