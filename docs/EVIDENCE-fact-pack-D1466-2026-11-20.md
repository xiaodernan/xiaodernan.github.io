# EVIDENCE — D1466 fact-pack sync (2026-11-20)

**What changed.** `assets/nexus-platform/latest.json` and the two baked language arms of `index.html`
were refreshed from the authoritative NEXUS master and the real corpus:

- head `5274f9de` (commit `D1466: chapter 155 joins Layer P (parcel opened, 1960 race card)`);
- total commits `1,712` — from authenticated GitHub REST `GET /repos/xiaodernan/nexus-platform/commits?per_page=1`,
  `Link: rel="last"` page count (not hand-written);
- milestone `D1466`, arc **155 chapters**, Layer P running (not closed);
- features list rewritten from the actual work: five StateGraphs, frozen-prefix discipline across all
  ten model lanes, codex-style growing-history chapter companion, fenced 87K-token arc auditor,
  the io truth repair (phantom repos removed), 640-request production stress evidence, CI posture.

**Why now.** The previous pack (D1447, 144 chapters) was from the Layer O closure. Since then the arc
grew 11 chapters and gained four new model-driven lanes and one identity repair — unambiguously the
"有大提升再更新" threshold in the operator's mandate. This is a *mid-layer* sync, not a closure:
the next heavy sync still happens at Layer P closure.

**Verification.** `node scripts/identity-guard.mjs` → OK; no stale `D1447` / `8b0678dc` / `1,689`
markers remain in `index.html`; live `raw.githubusercontent` value was the source of truth for the
old pack and remains the hydration source for the new one. `xiaodernan.github.io` Pages edge was still
serving the old build immediately after push (expected ~10 min propagation); the page itself carries
`no-cache` headers and a live hydration path that repaints from `latest.json`.

**Boundaries.** No secret in this file or in any commit. The NEXUS head hash baked here is the value at
sync time; subsequent NEXUS commits do not retroactively change this artifact until the next milestone.
