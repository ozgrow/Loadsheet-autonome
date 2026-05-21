# Deferred items found during Phase 06 execution

## Pre-existing test harness crash (out-of-scope for 06-04)

`npm run verify` crashes at `tests/tests.html:671` because the test references
`wrap.querySelector('.material-recap')` but the Phase 1 modal output structure
(material-recap inside each ULD block) was removed by Plan 06-01/06-03 (UI
section globalized).

This crash is reproducible BEFORE Plan 06-04 changes (stashing all my changes
still produced the same TypeError). The test must be rewritten to query the
new global `#material-section` instead of per-ULD `.material-recap`.

Recorded by: executor 06-04 (parallel with 06-05)
Plan slated to address: 06-06 (tests + E2E adaptation)
