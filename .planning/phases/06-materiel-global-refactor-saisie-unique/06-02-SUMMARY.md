---
phase: 06-materiel-global-refactor-saisie-unique
plan: 02
subsystem: data-migration
tags: [helper, pure-function, migration, material, retro-compat, tests]
requires: []
provides:
  - migrateLegacyMaterial(data) pure helper (global function declaration in app.js)
  - "Test suite 'Materiel global - Migration helper purs' (8 suites, 34 asserts, D-45a-g + D-19 + defensive)"
affects:
  - static/js/app.js (added 1 function, no behavior change to existing helpers)
  - tests/tests.html (added 8 test suites, 34 new asserts, no existing test modified)
tech-stack:
  added: []
  patterns:
    - Pure function (no DOM side effects, deterministic, testable in isolation)
    - Idempotence guard (data.material present => return as-is)
    - Defensive defaults (null/{}/empty inputs return safe defaults)
    - pmcs fallback for retro-compat (ancien nom de cle)
key-files:
  created:
    - .planning/phases/06-materiel-global-refactor-saisie-unique/06-02-SUMMARY.md
  modified:
    - static/js/app.js (lines ~983-1075, new helper migrateLegacyMaterial)
    - tests/tests.html (lines ~1538-1672, new migration test suites)
decisions:
  - Plan code referenced API test()/assertEq() which doesn't exist in tests.html harness; adapted to existing suite()+IIFE+assertEqual(desc,actual,expected) pattern (Rule 1 deviation, mechanical)
  - 34 asserts delivered across 8 suites (plan required >=7 scenarios; over-delivered for robustness as plan itself specified 18 tests)
  - migrateLegacyMaterial is NOT wired into loadManifest() in this plan (Plan 03 responsibility) - helper isolated and validated first per plan intent
metrics:
  duration_seconds: 510
  completed: 2026-05-19T18:55:18Z
  tasks: 2
  files_changed: 2
  tests_added: 34
  tests_total_before: 733
  tests_total_after: 767
---

# Phase 06 Plan 02: migrateLegacyMaterial helper + tests — Summary

`migrateLegacyMaterial(data)` is a pure helper that fuses Phase 1 per-ULD material fields into a single global `data.material` object per Phase 6 schema (D-09), with full coverage of rules D-13..D-19 and 34 unit tests across 8 suites.

## What Was Built

### Task 1 — Pure helper `migrateLegacyMaterial(data)` in app.js
- Inserted at the seam between `buildUldMaterialHtml` (line 981) and the `// PALETTES / VRAC SPLIT` section (now line ~1078).
- Function declaration (hoisted, globally accessible — testable without import/export, consistent with rest of file).
- Documented inline with explicit D-13..D-18 rule references in the leading comment.
- Pure: no DOM access, no global mutation, deterministic for a given input.
- Idempotent (D-19): if `data.material` is already an object, returns it as-is without recalculation.
- Defensive: null/non-object input, missing `ulds`/`pmcs`, empty array all return safe defaults without crash.
- Retro-compat: falls back to `data.pmcs` if `data.ulds` absent (covers legacy ancien nom).

**Rules implemented:**
- D-13 (sum): `strapsCount`, `blocksCount`, `tarpsCount`, `dividersCount`, `honeycombCount` summed across all ULDs (incl. VRAC — consistent with `buildMaterialSummary` D-20 strict).
- D-14 (VRAC-exclusive sum): `flooringEuCount`, `flooringStdCount` summed only on non-VRAC ULDs.
- D-15 (VRAC-exclusive OR): `flooringEuForfait`, `flooringStdForfait` are OR'd only on non-VRAC ULDs.
- D-16 (exclusivite post-fusion): if any non-VRAC ULD had `flooringEuForfait:true`, the merged `flooringEuCount` is forced to 0 (same for Std).
- D-17 (concatenation): `uldComment` non-empty values prefixed with `'ULD N°' + (idx+1) + ' : '` (1-based), joined by `\n`, empty comments omitted.
- D-18 (AND): `noMaterialToBill` true only if every ULD had `noMaterialToBill === true` (strict equality — missing field = false = safe default).

### Task 2 — Test suite `Materiel global - Migration helper purs` in tests.html
- 8 suites, 34 asserts, inserted between line 1537 (end of MAT-13/14 tests) and line 1538 (start of Phase 02-01 Type ULD VRAC suites) — grouped with existing material tests for logical adjacency.
- Each suite mirrors a D-45 scenario from CONTEXT.md (a-g) plus idempotence D-19 and defensive cases.
- Uses the existing harness API: `suite('name')` + IIFE + `assertEqual(desc, actual, expected)`.
- Asserts cover both happy paths and edge cases (e.g., ULD without `noMaterialToBill` flag => AND result false, semantically safe).

## Verification

| Check | Status |
|-------|--------|
| `grep -q "function migrateLegacyMaterial" static/js/app.js` | PASS |
| `grep -q "D-12..D-18" static/js/app.js` | PASS |
| `grep -q "'ULD N°'" static/js/app.js` | PASS |
| `grep -q "result.noMaterialToBill = true" static/js/app.js` | PASS (AND init) |
| `grep -q "result.flooringEuCount = 0" static/js/app.js` | PASS (D-16) |
| Idempotence guard present | PASS |
| 8 test suites present (D-45a..g, D-19, defensive) | PASS |
| `migrateLegacyMaterial(` calls in tests.html | 19 calls (>=18 required) |
| `npm run verify` | **767/767 PASS, 0 FAIL** (was 733; +34 tests) |
| No regression in Phase 1/2/3/4/5 suites | CONFIRMED |
| `loadManifest()` not modified | CONFIRMED (Plan 03 responsibility) |
| `collectData()` not modified | CONFIRMED (Plan 03 responsibility) |
| Existing helpers (`buildMaterialSummary`, `buildUldMaterialRows`, etc.) not modified | CONFIRMED |

## Smoke test (manual node REPL)
12 scenarios verified directly via `node -e`:
- D-45a defaults (incl. noMaterialToBill false for empty ULDs)
- D-45b sum simple (5)
- D-45c VRAC planchers excluded (2 instead of 5)
- D-45d forfait+count exclusivite (forfait true, count forced 0)
- D-45e concatenation with 1-based index + newlines
- D-45f AND true if all true / D-45g AND false on mix
- Idempotence (existing material returned verbatim)
- Defensive (null, {}, empty [], pmcs fallback)

All PASS.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan test code used non-existent harness API**
- **Found during:** Task 2 (before insertion)
- **Issue:** Plan provided test code using `test('desc', function() { ... })` and `assertEq(actual, expected, desc)` — neither of these APIs exists in `tests/tests.html` (the harness uses `suite('name')` + IIFE + `assertEqual(desc, actual, expected)`).
- **Fix:** Adapted all 18 test scenarios into the existing harness pattern: 8 `suite()` calls wrapping IIFEs that use `assertEqual(desc, actual, expected)`. Semantics identical to plan intent; the 18 scenarios became 34 individual asserts (some logical "tests" required multiple equality checks, e.g. D-45a defaults checks 11 fields).
- **Files modified:** tests/tests.html (insertion only, no other code touched)
- **Commit:** 3481c6a

**2. [Rule 3 - Blocker] Smoke acceptance criteria's node eval snippet was non-functional**
- **Found during:** Task 1 verification
- **Issue:** Plan's "OPTIONAL" node smoke snippet `eval(s.replace(/document\..*?;/g,'').replace(/window\..*?;/g,''))` would mangle app.js (regex too greedy + cross-line). Plan flagged it OPTIONAL with preference for Task 2 test suite — followed plan preference.
- **Fix:** Used the formal Task 2 test suite (now passing all 34 asserts in JSDOM via `npm run verify`) as authoritative validation. Additionally ran a targeted `node -e` smoke test extracting just the helper by string slicing — 12 scenarios PASS.
- **Files modified:** None (just verification approach)

No architectural changes (Rule 4) needed.

## Auth Gates

None.

## Known Stubs

None. The helper is fully wired and tested. **Plan 03 will integrate it into `loadManifest()` and `collectData()`** — that's the next plan's scope, not a stub.

## Commits

| Hash    | Task | Message                                                                          |
|---------|------|----------------------------------------------------------------------------------|
| ff6f585 | 1    | feat(06-02): add migrateLegacyMaterial helper (D-12..D-18, D-45)                |
| 3481c6a | 2    | test(06-02): add migrateLegacyMaterial suite (8 suites, 34 asserts, D-45a-g + D-19 + defensive) |

## Self-Check: PASSED

- File `static/js/app.js` exists and contains `function migrateLegacyMaterial` — VERIFIED
- File `tests/tests.html` exists and contains 8 new "Materiel global - Migration helper purs" suites — VERIFIED
- Commit `ff6f585` in git log — VERIFIED
- Commit `3481c6a` in git log — VERIFIED
- `npm run verify` exit 0, 767/767 OK, 0 FAIL — VERIFIED
