---
phase: 02-type-uld-vrac
plan: 01
subsystem: ui
tags: [vanilla-js, dom, data-attributes, localStorage-retrocompat, xss-defense, tdd]

# Dependency graph
requires:
  - phase: 01-mat-riel-uld-r-tro-compat
    provides: data-attributes pattern on .uld-block, formatCondensedMaterial/refreshMaterialBadge helpers, esc() anti-XSS, defensive read in loadManifest
provides:
  - ULD_TYPES constant [PMC, AKE, AKN, PAG, VRAC] + ULD_TYPE_DEFAULT
  - <select class="uld-type"> in addUld() and loadManifest() (5 options, PMC default)
  - data-uld-type attribute on .uld-block (DOM source of truth, D-06)
  - collectData().ulds[i].type key (string, validated against ULD_TYPES)
  - changeUldType(selectEl, uldIndex) handler (cascades updateRecap + refreshMaterialBadge + closes modal if open)
  - updateRecap() conditional annotation "dont Vrac : N (X colis, Y kg)" (D-07, D-08)
  - openMaterialModal() conditional hides planchers EU/Std when type=VRAC (D-18)
  - formatCondensedMaterial() excludes planchers from inline recap when type=VRAC (D-21)
  - CSS .uld-header .uld-type (desktop + mobile 100% width) + .mat-flooring-hidden { display: none; }
  - 21 test suites "Type ULD - ..." covering D-01..D-10, D-15..D-21
affects: [02-02 PDF/email rendering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fixed-list constant at top of app.js (ULD_TYPES array) — cheap to extend, single source of truth"
    - "Defensive enum validation via indexOf against ULD_TYPES on all 3 entry points (addUld default, loadManifest read, collectData read) — anti-XSS defense in depth"
    - "CSS-only conditional masking (display:none via class) preserves DOM + data-attributes (D-19) — no destructive reset on type change"
    - "Live DOM source of truth via <select>.value (matches existing .uld-number / .uld-weight pattern) — no separate in-memory state"
    - "Dedicated cascade handler changeUldType(): dataset sync + updateRecap + refreshMaterialBadge + close modal if open"

key-files:
  created: []
  modified:
    - static/js/app.js
    - static/css/style.css
    - tests/tests.html

key-decisions:
  - "D-01/D-02: Fixed 5-option list [PMC, AKE, AKN, PAG, VRAC] as constant ULD_TYPES, labels identical to codes"
  - "D-03: PMC is the default for any newly created ULD"
  - "D-04: <select> placed BEFORE <input class='uld-number'> in .uld-header (visual order: Type | N° ULD | Poids | Matériel | Supprimer)"
  - "D-05: collectData() adds key 'type' (string) to each ulds[i] entry"
  - "D-06: DOM source of truth = live <select>.value (data-attribute mirrors for defensive reads)"
  - "D-07/D-08: #liveRecap gets conditional 'dont Vrac : N (X colis, Y kg)' annotation only when vracCount > 0 — EXACT format without 'ULD' in annotation"
  - "D-09 Phase 2 nuance: ULD total counter kept (no relabel to 'Palettes'); agent infers palettes = ULD - Vrac. Must be documented in VERIFICATION.md (lesson from Phase 1 RECAP-01 gap)"
  - "D-10: Global Colis and Poids totals INCLUDE VRAC (no subtraction) — detail isolated in annotation"
  - "D-15: Defensive read in loadManifest — missing 'type' key falls back to PMC; value outside ULD_TYPES also falls back to PMC (XSS hardening against tampered localStorage)"
  - "D-16/D-17: No automatic migration, no ULD-number-prefix inference — PMC is the explicit default"
  - "D-18 (OVERRIDES D-09 Phase 1): Material is NO LONGER uniform across all ULD types. Planchers bois EU + Std labels (and their forfait checkbox) are hidden in the modal when type=VRAC"
  - "D-19: Planchers data-attributes (data-flooring-*) are PRESERVED when toggling to VRAC — not destructive. Rebasculating to non-VRAC restores the values visually (inputs were kept in DOM)"
  - "D-21: changeUldType cascades: dataset update + updateRecap + refreshMaterialBadge + close modal if open. formatCondensedMaterial also checks data-uld-type to skip planchers entries for VRAC"

patterns-established:
  - "Fixed-list constants for controlled enums (ULD_TYPES): cheap membership checks via indexOf, easy to extend, single source of truth"
  - "CSS-class-based conditional masking for preserving state across type toggles (.mat-flooring-hidden): avoids destructive DOM/state reset (D-19 applied)"
  - "Three-point defense in depth for type validation: default on create, validate on read from localStorage, validate on read from <select>"

requirements-completed: [VRAC-01, VRAC-02]

# Metrics
duration: 9min
completed: 2026-04-24
---

# Phase 2 Plan 02-01: Type ULD VRAC (selector + data model + recap annotation) Summary

**VRAC type selector with 5-option fixed list, defensive retro-compat (type absent → PMC), #liveRecap conditional "dont Vrac" annotation, and modal override D-18 (planchers hidden for VRAC) — groundwork for Plan 02-02 PDF/email.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-24T09:28:14Z
- **Completed:** 2026-04-24T09:37:20Z
- **Tasks:** 2
- **Files modified:** 3 (app.js, style.css, tests.html)

## Accomplishments

- `ULD_TYPES` constant declared as fixed 5-entry list (`['PMC', 'AKE', 'AKN', 'PAG', 'VRAC']`) with `ULD_TYPE_DEFAULT = 'PMC'`
- `<select class="uld-type">` injected before the N° ULD input in both `addUld()` and `loadManifest()` — VRAC selectable, PMC default
- Three-point defensive type validation (default on create, validated read on load, validated read on collect) — tampered localStorage values fall back to PMC, XSS payloads never reach the DOM
- `changeUldType(selectEl, uldIndex)` new handler cascades: `data-uld-type` sync → `updateRecap()` → `refreshMaterialBadge(uldIndex)` → closes open modal if any (D-21)
- `#liveRecap` now shows `ULD : N dont Vrac : M (X colis, Y kg) | Colis : ... | Poids : ... | LTA : ... | DGR` when ≥1 VRAC ULD; otherwise the format is unchanged (backward compatible visually)
- Global `Colis` and `Poids` totals INCLUDE VRAC (D-10) — no subtraction
- Modal masking of Planchers bois EU + Std (and their "Forfait négocié" checkbox) when type=VRAC (D-18) via CSS class `.mat-flooring-hidden { display: none; }` — preserves DOM + data-attributes (D-19)
- Inline condensed recap under each ULD header excludes the 2 planchers entries when type=VRAC (D-21), via `formatCondensedMaterial()` reading `block.dataset.uldType`
- Mobile CSS rule for `.uld-header .uld-type { width: 100% !important; }` under `@media (max-width: 768px)` — touchable on mobile
- **21 new test suites** `Type ULD - *` covering: default PMC, select positioning, data-attribute sync, `collectData` includes type, retro-compat absent→PMC, retro-compat XSS payload→PMC, save/load round-trip, `changeUldType` cascade, `updateRecap` annotation presence/absence/aggregation, global totals include VRAC, modal masking for VRAC, modal visible for AKE/AKN/PAG, D-19 persistence of flooring data when toggling VRAC, D-21 exclusion of planchers in condensed recap, changeUldType refresh cascade

## Task Commits

Each task was committed atomically:

1. **Task 1: Sélecteur type ULD + data model + rétro-compat + tests** — `9f7f766` (feat)
2. **Task 2: updateRecap annotation + modal planchers masking + formatCondensedMaterial exclusion + tests** — `89b684e` (feat)

**Plan metadata:** (pending — will be the final commit including SUMMARY.md + STATE.md + ROADMAP.md updates)

## Files Created/Modified

- `static/js/app.js` — ULD_TYPES constant declared in state section; addUld() injects `<select>` and `data-uld-type`; loadManifest() defensive read + validation vs ULD_TYPES + `<select>` with selected option; collectData() reads `.uld-type` select as source of truth with fallback; new `changeUldType()` handler (dataset + updateRecap + refreshMaterialBadge + close modal); `updateRecap()` aggregates `vracCount/vracColis/vracWeight` and injects conditional "dont Vrac" annotation; `openMaterialModal()` adds `isVrac` detection and `mat-flooring-hidden` class on the 2 planchers labels; `formatCondensedMaterial()` skips planchers entries for VRAC blocks.
- `static/css/style.css` — `.uld-header .uld-type { padding, border, min-width 90px }` (desktop); `@media (max-width: 768px) .uld-header .uld-type { width: 100% !important }` (mobile); `.material-modal-grid .mat-flooring-hidden { display: none }`.
- `tests/tests.html` — 21 new suites `Type ULD - ...` inserted between the "Materiel ULD - loadManifest restaure recap" suite and the "PLAN 01-02 : Materiel PDF" section header. Tests cover the full D-01..D-10 + D-15..D-21 decision set including defensive XSS and save/load round-trip.

## Decisions Made

- **Override D-09 Phase 1 via D-18 (contract change):** Material is no longer uniform across all ULD types. Planchers bois EU + Std fields are masked in the modal when type=VRAC, and excluded from the inline condensed recap. The override is documented here and in the plan frontmatter to protect against regression. Plan 02-02 will extend this to PDF + email rendering (D-20).
- **Nuance D-09 Phase 2 (ROADMAP criterion #2):** The ROADMAP literally says "le compteur de palettes du récapitulatif les exclut". We kept `ULD : N` as the total counter (no relabel to `Palettes`) and added a conditional `dont Vrac : M (X colis, Y kg)` annotation. Semantically equivalent — the agent deduces `Palettes = ULD - Vrac`. **Must be documented explicitly in 02-VERIFICATION.md** to avoid a RECAP-01-style gap.
- **CSS-only masking (`.mat-flooring-hidden { display: none; }`):** Preserves DOM and data-attributes across type toggles (D-19). No JS state deletion when the type flips, so rebasculating VRAC→AKE restores the planchers values transparently in the reopened modal.
- **Three-point defensive validation against ULD_TYPES:** addUld default (write), loadManifest read (indexOf check + fallback), collectData read (indexOf check + fallback). This mirrors Phase 1's MAT-10 retro-compat pattern and hardens the system against tampered localStorage (XSS payloads in `type` fall back to PMC, never reach the DOM).
- **Live DOM source of truth:** `<select>.value` is authoritative in `collectData()`; the `data-uld-type` attribute on `.uld-block` is a mirror for `formatCondensedMaterial()` and `openMaterialModal()` (which don't have direct access to the select during rendering). The mirror is maintained by `changeUldType()` on each user change.

## Deviations from Plan

None — plan executed exactly as written. All tasks followed the spec; no auto-fixes were needed; no architectural decisions requested; no auth gates hit.

## Issues Encountered

- The existing app.js source uses 6-character literal `°` (degree sign) and `é` (é) escapes in certain strings (`ULD N° :`, `Numéro`) — the `Edit` tool normalized these to the rendered Unicode chars in its old_string matching, which broke string matches. Worked around by applying the 4 surgical patches via a one-shot Node.js script that preserved the exact 6-byte `°`/`é` sequences. The temporary script `_patch_task1.cjs` was deleted after use; not committed.

## User Setup Required

None — no external service configuration required. The changes are entirely frontend (JS + CSS + tests). No new env vars, no new dependencies, no API changes.

**Validation steps before push to master:**
1. `npx serve .` locally and open the app
2. Verify: each new ULD has a `Type ▼` selector before the `N° ULD` field with PMC selected by default, 5 options total
3. Change a ULD type to VRAC, confirm `#liveRecap` shows `ULD : N dont Vrac : ...` annotation
4. Open material modal on a VRAC ULD, confirm Planchers bois EU + Standard rows are hidden
5. Open material modal on a PMC ULD, confirm Planchers bois fields are visible (backward compatible)
6. Save a manifest with VRAC type, reload via saved manifests, confirm type preserved
7. Open `tests/tests.html`, confirm `all-pass` summary (expected 91+ suites)
8. Test mobile layout (DevTools ≤768px): `<select>` takes full width, touchable

## Next Phase Readiness

- **VRAC-01:** SATISFIED (5-option `<select>` in every ULD, default PMC)
- **VRAC-02:** SATISFIED on-screen (conditional "dont Vrac" annotation in `#liveRecap`, D-09 Phase 2 nuance applies)
- **VRAC-03:** PARTIAL — the on-screen recap already shows the VRAC line (annotation). Plan 02-02 will extend this to the PDF page 1 récap (palettes / vrac split per D-12) and the email HTML mirror (D-14).

**Ready for Plan 02-02 (Wave 2):**
- Data model stable: each ULD has a validated `type` key in `collectData()` output
- `buildPdf()`, `sendEmail()`, and the 4 material helpers (`buildMaterialSummary`, `buildUldMaterialRows`, `buildMaterialSummaryHtml`, `buildUldMaterialHtml`) are INTACT — Plan 02-02 will extend them per D-11 (Type column in PDF ULD header), D-12 (page 1 palettes/vrac split), D-14 (email HTML mirror), D-20 (planchers excluded from VRAC rendering + `buildMaterialSummary` totals).
- No blockers.

## Self-Check: PASSED

- `static/js/app.js` exists and contains `ULD_TYPES`, `function changeUldType`, `dont Vrac`, `mat-flooring-hidden`, `isVrac` (verified via Grep/node script)
- `static/css/style.css` contains `.uld-header .uld-type` and `.mat-flooring-hidden` with mobile rule
- `tests/tests.html` contains 21 `suite('Type ULD - ...')` entries (verified via regex count)
- Commits `9f7f766` and `89b684e` present in `git log` (verified)
- JS syntax check passes: `node --check static/js/app.js` → OK
- Test script syntax check passes: new Function(extracted_test_script) → OK

---
*Phase: 02-type-uld-vrac*
*Completed: 2026-04-24*
