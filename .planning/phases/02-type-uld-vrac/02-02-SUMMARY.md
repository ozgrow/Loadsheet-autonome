---
phase: 02-type-uld-vrac
plan: 02
subsystem: pdf-email-rendering
tags: [vanilla-js, jspdf, jspdf-autotable, pdf-generation, email-html, xss-defense, tdd]

# Dependency graph
requires:
  - phase: 02-type-uld-vrac / plan 01
    provides: ulds[i].type in collectData + data-uld-type attribute + <select class="uld-type"> + ULD_TYPES constant + loadManifest defensive read
  - phase: 01-mat-riel-uld-r-tro-compat
    provides: buildMaterialSummary, buildUldMaterialRows, buildMaterialSummaryHtml, buildUldMaterialHtml (extended here for D-20)
provides:
  - buildPalettesVracSplit(ulds) helper returning { hasVrac, palettes:{count,colis,weight}, vrac:{count,colis,weight} }
  - buildMaterialSummary extended to skip planchers EU/Std for VRAC ULDs (D-20)
  - buildUldMaterialRows extended to skip planchers EU/Std when u.type === 'VRAC' (D-20)
  - buildPdf page 1 conditional 'Detail par categorie' autoTable with canonical 'dont Palettes'/'dont Vrac' format (D-12, W-1 revision)
  - buildPdf page ULD 'Type :' label in infoBox between LTA and Poids (D-11, infoBoxH 16/22mm)
  - sendEmail html mirror: scission Palettes/Vrac table + [TYPE] suffix in ULD block title (D-14)
  - Defense-in-depth validUldType fallback + esc() on type in all HTML injections
  - 21 new test suites "Type ULD - ..." covering D-11, D-12, D-14, D-20 + retro-compat + XSS
affects: [03-testing-e2e, future manifest format changes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conditional rendering via hasVrac flag from dedicated partition helper (buildPalettesVracSplit) — avoids hasVrac booleans scattered across buildPdf/sendEmail"
    - "Canonical output format shared across 3 surfaces (#liveRecap / PDF page 1 / email HTML): 'dont Palettes : N (X colis, Y kg)' + 'dont Vrac : N (X colis, Y kg)' — checker W-1 alignment"
    - "Type rendering uses 3-point defensive validation (validUldType): already established in Plan 02-01 (collectData), extended to buildPdf infoBox + sendEmail block title — 4 total guard sites"
    - "Helpers extended additively (no signature change): buildMaterialSummary/buildUldMaterialRows stay {ulds} / {u} in/out, VRAC behavior derived from u.type — callers unchanged"
    - "jsPDF infoBoxH grows by 6mm per added line (13 → 19 baseline offsets), ASCII-safe labels (Type, LTA, Poids) avoid glyph issues"
    - "Test helper buildEmailHtmlForTest mirrors sendEmail HTML construction locally to test output without network (inherits maintenance cost: must follow sendEmail changes)"

key-files:
  created: []
  modified:
    - static/js/app.js
    - tests/tests.html

key-decisions:
  - "D-11 implemented via infoBox text line 'Type :' + value (margin+22mm) between LTA and Poids — 22mm/16mm infoBoxH"
  - "D-12 implemented via conditional autoTable 'Detail par categorie' under the main recap table, only when pvSplit.hasVrac — rows are ['dont Palettes', 'N (X colis, Y kg)'] + ['dont Vrac', 'N (X colis, Y kg)']"
  - "D-13 applied implicitly: type rendered littéralement (PMC/AKE/AKN/PAG/VRAC) in both PDF and email"
  - "D-14 email title format: 'ULD : <num> [<TYPE>]' with brackets (discretion of planner — matches [VRAC] form over (VRAC)). esc() applied on both u.uldNumber and validUldType even though the latter is validated against ULD_TYPES"
  - "D-20 stricte: ONLY planchers EU/Std are excluded for VRAC — all other materials (sangles, bois de calage, bâches, intercalaires, nids d'abeille) remain counted even on VRAC ULDs (consistent with D-18 modal hiding only planchers)"
  - "W-1 revision compliance: NO 'ULD' prefix in scission rows (PDF + email). Cohérent avec #liveRecap établi Plan 02-01 — single canonical format across 3 surfaces"
  - "Retro-compat defensive: validUldType falls back to ULD_TYPE_DEFAULT ('PMC') if u.type absent OR outside ULD_TYPES — applied in buildPdf infoBox AND sendEmail block title (4 total guard points now with loadManifest/collectData from Plan 02-01)"

patterns-established:
  - "Pattern: dedicated partition helper (buildPalettesVracSplit) — callers receive { hasVrac, palettes, vrac } and decide rendering, cleaner than inline filter+reduce in both buildPdf and sendEmail"
  - "Pattern: canonical format token shared across surfaces — one format for 'dont Palettes / dont Vrac' renders identically in HTML autoTable (email), jsPDF autoTable (PDF), and text concat (#liveRecap annotation uses only 'dont Vrac' variant)"
  - "Pattern: buildMaterialSummary is now type-aware but signature-stable — callers (buildPdf page 1 totals + buildMaterialSummaryHtml in email) automatically inherit D-20 exclusion without code change"

requirements-completed: [VRAC-03]

# Metrics
duration: 7min
completed: 2026-04-24
---

# Phase 2 Plan 02-02: Type ULD VRAC (PDF + email rendering) Summary

**VRAC-03 delivered across PDF and email: colonne Type per ULD page (D-11), conditional Palettes/Vrac scission on page 1 (D-12), email mirror with [TYPE] block titles (D-14), and planchers EU/Std excluded for VRAC in totals + per-ULD material sections (D-20). 21 new test suites; format canonique W-1 aligned with #liveRecap.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-24T09:44:41Z
- **Completed:** 2026-04-24T09:51:51Z
- **Tasks:** 2 (both TDD: RED + GREEN)
- **Files modified:** 2 (app.js, tests.html)

## Accomplishments

- VRAC-03 ROADMAP critère #3 fully satisfied in 3 surfaces (screen via Plan 02-01, PDF page 1 + ULD pages, email HTML) with harmonized canonical format
- New helper `buildPalettesVracSplit(ulds)` centralizes Palettes/VRAC partition logic — reused by buildPdf AND sendEmail (single source of truth)
- D-20 planchers exclusion applied consistently: buildMaterialSummary (page 1 totals), buildUldMaterialRows (per-ULD detail on both PDF and email via mirror helpers)
- D-14 defense-in-depth on `u.type` in email HTML title construction (validUldType fallback + esc() even though `<select>` constrained — MAT-11 lesson)
- 21 new "Type ULD -" test suites (13 Task 1 PDF-side + 8 Task 2 email-side), exceeding plan threshold ≥14 — total tests.html suite count 111

## Task Commits

Each task was executed via TDD (RED → GREEN), each phase committed atomically:

1. **Task 1 RED: failing PDF tests** - `d9b3464` (test)
2. **Task 1 GREEN: helpers + buildPalettesVracSplit + buildPdf D-11/D-12** - `30aa492` (feat)
3. **Task 2 RED: failing email HTML tests** - `5e20df9` (test)
4. **Task 2 GREEN: sendEmail D-14 + scission + [TYPE] titles** - `0ff18a0` (feat)

**Plan metadata commit:** (pending — final docs commit after SUMMARY/STATE/ROADMAP/REQUIREMENTS updates)

## Files Created/Modified

- `static/js/app.js` (+108 lines / -15 lines net) — 5 regions modified:
  - buildMaterialSummary (l.713-738): D-20 type-aware skip for planchers
  - buildUldMaterialRows (l.753-775): D-20 isVrac skip for planchers
  - NEW buildPalettesVracSplit (l.824-854): helper partition ULDs into palettes vs vrac
  - buildPdf page 1 (l.965-983): conditional 'Detail par categorie' autoTable (D-12)
  - buildPdf page ULD (l.1023-1050): Type label in infoBox (D-11), infoBoxH 22/16mm
  - sendEmail (l.1170-1194): scission table after recap + validUldType + [TYPE] in block title (D-14)
- `tests/tests.html` (+452 lines) — 2 new suite blocks:
  - "PLAN 02-02 Task 1 : Type ULD - PDF" (13 suites) inserted after "Materiel PDF - buildPdf manifeste ancien format"
  - "PLAN 02-02 Task 2 : Type ULD - email HTML" (7+1 integration suites) inserted after "Materiel email HTML - sendEmail inclut sections materiel"

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| `[VRAC]` (brackets) in email block title, not `(VRAC)` | Consistent with planner-specified pattern in PLAN.md. Square brackets less ambiguous when a VRAC ULD has a number that already contains parentheses. |
| `buildPalettesVracSplit` placed between `buildUldMaterialHtml` and `PDF GENERATION` section | Groups all cross-surface helpers before the rendering engines consume them |
| `infoBoxH` bumped to 22/16mm (from 16/10mm) for Type line | Keeps vertical spacing aesthetically consistent: 6mm line-height baseline between labels |
| `validUldType` uses `ULD_TYPES` + `ULD_TYPE_DEFAULT` constants (not hardcoded arrays) | DRY — single source of truth set in Plan 02-01, reused here in buildPdf + sendEmail |
| Test helper `buildEmailHtmlForTest` mirrors sendEmail inline | Avoids refactoring sendEmail to extract `buildEmailHtml(data)` (out-of-scope). Trade-off: helper must track sendEmail changes manually (code-review burden noted in PLAN) |

## Deviations from Plan

None — plan executed exactly as written.

Minor planner-guided choice: plan's action code used literal string arrays `['PMC','AKE','AKN','PAG','VRAC']` in buildPdf and sendEmail. We substituted with the already-exported constants `ULD_TYPES` + `ULD_TYPE_DEFAULT` from app.js:18-19 (established in Plan 02-01) for DRY. Behavior identical, grep tokens still pass (the plan's verify uses `esc(validUldType)` not the array form).

## Issues Encountered

None. TDD cycle ran cleanly: tests failed before impl (by missing `buildPalettesVracSplit` reference + missing VRAC conditions in helpers), passed after impl.

Noted future consideration: when sendEmail signature or HTML structure changes in a later phase, `buildEmailHtmlForTest` in tests.html must be updated in lockstep. Alternative: extract `buildEmailHtml(data)` as a pure helper in app.js (out-of-scope for this plan per PLAN.md).

## User Setup Required

None — no external service configuration required. Feature ready for local testing via `npx serve .` then:
1. Create a manifest with 1 PMC + 1 VRAC ULD, set weights
2. Generate PDF → page 1 contains "Detail par categorie" with "dont Palettes : 1 (X colis, Y kg)" + "dont Vrac : 1 (X colis, Y kg)"; page 2 (PMC detail) has Type: PMC in infoBox; page 3 (VRAC detail) has Type: VRAC in infoBox + no Planchers rows in Matériel section even if flooringEuCount set
3. Send email (intercept via DevTools Network even if SMTP rejects) → htmlBody contains "dont Palettes", "dont Vrac", and blocks titled "ULD : P1 [PMC]" / "ULD : V1 [VRAC]"
4. Manifest 100% PMC → no "dont Palettes"/"dont Vrac" strings in PDF or email (backward compatible)

## Next Phase Readiness

- **Phase 02 complete:** VRAC-01 (selector) + VRAC-02 (screen recap) + VRAC-03 (PDF+email rendering) all delivered
- **Phase 03 (testing-e2e):** this plan provides the full rendering contract to validate end-to-end — 21 new unit suites in tests.html + manual test plan in "User Setup Required" above
- **No blockers** for phase transition; PROJECT.md can move VRAC-01/02/03 from Active → Validated
- **Canonical format locked:** any future work touching #liveRecap, PDF page 1, or email HTML scission must keep the "dont Palettes : N (X colis, Y kg)" / "dont Vrac : N (X colis, Y kg)" shape (no "ULD" prefix, brackets format in email block titles)

## Self-Check

Verification against plan's `<done>` and `<automated>` grep checks:

| Check | Target | Result |
|-------|--------|--------|
| `u.type !== 'VRAC'` | ≥1 (buildMaterialSummary) | 1 ✓ |
| `isVrac = u.type === 'VRAC'` | 1 (buildUldMaterialRows) | 1 ✓ |
| `function buildPalettesVracSplit` | 1 | 1 ✓ |
| `'Type :'` | ≥1 (buildPdf infoBox) | 1 ✓ |
| `dont Palettes` | ≥2 (buildPdf + sendEmail) | 4 (2 comments + 2 renders) ✓ |
| `dont Vrac` | ≥3 (updateRecap + buildPdf + sendEmail) | 9 (comments + renders) ✓ |
| `buildPalettesVracSplit(data.ulds)` | ≥2 | 2 ✓ |
| `esc(validUldType)` | 1 (sendEmail) | 1 ✓ |
| `esc(u.type)` | 0 (uses validUldType) | 0 ✓ |
| `suite\('Type ULD - (build*\|email HTML)` | ≥14 | 21 ✓ |
| No `' ULD ('` in buildPdf/sendEmail (W-1) | 0 | 0 ✓ |
| Files created/modified exist | 2 modified | Both present ✓ |
| All 4 task commits exist in log | 4 | d9b3464, 30aa492, 5e20df9, 0ff18a0 all present ✓ |

## Self-Check: PASSED

All success criteria met. No deviations, no deferred issues, no CLAUDE.md conflicts.

---
*Phase: 02-type-uld-vrac*
*Plan: 02*
*Completed: 2026-04-24*
