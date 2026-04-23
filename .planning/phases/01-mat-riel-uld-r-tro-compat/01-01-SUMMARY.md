---
phase: 01-mat-riel-uld-r-tro-compat
plan: 01
subsystem: ULD material data model + modal UI
tags: [feat, material-uld, retro-compat, modal, xss, mobile]
dependency_graph:
  requires: []
  provides:
    - "10 material fields persisted per ULD (strapsCount, flooringEuCount/Forfait, flooringStdCount/Forfait, blocksCount, tarpsCount, dividersCount, honeycombCount, uldComment)"
    - "DOM source of truth: data-attributes on .uld-block"
    - "Public JS API: openMaterialModal, closeMaterialModal, applyMaterialToUld, toggleForfait, refreshMaterialBadge"
    - "CSS classes: .material-modal, .material-modal-overlay, .material-modal-grid, .material-badge, .btn-material"
    - "Retro-compat guarantee: old manifests (missing fields or pmcs format) load with defaults"
  affects:
    - "static/js/app.js addUld, loadManifest, collectData (3 extension points)"
    - "Saved localStorage payloads will acquire material fields on next saveManifest (D-11)"
tech-stack:
  added: []
  patterns:
    - "Modal dialog built from scratch (JS vanilla + CSS pur, no library)"
    - "Data-attributes on .uld-block as single source of truth (matches existing pattern: DOM as truth)"
    - "Defensive reading in loadManifest: parseInt(x) || 0, x === true, String(x || '')"
    - "Anti-XSS via textarea.value assignment (never innerHTML) for user free-text"
key-files:
  created: []
  modified:
    - path: "static/js/app.js"
      change: "+addUld data-attrs + btn-material + badge wrapper; +loadManifest defensive read + btn + badge + refreshMaterialBadge call; +collectData 10 new fields; +5 new functions (openMaterialModal, closeMaterialModal, applyMaterialToUld, toggleForfait, refreshMaterialBadge)"
    - path: "static/css/style.css"
      change: "+Material modal styles (.material-modal*, grid 2 cols desktop), +.material-badge, +.btn-material; +mobile full-screen modal + 1-col grid inside @media (max-width: 768px)"
    - path: "tests/tests.html"
      change: "+13 new suites (~60 new assertions): Materiel ULD collectData fields/defaults, loadManifest retro-compat (TEST-02), loadManifest new format, save/load round-trip, modal open/close, forfait UX, applyMaterialToUld writes data-attrs, badge conditional display, XSS uldComment"
decisions:
  - summary: "DOM source of truth via data-attributes on .uld-block (not in-memory state)"
    rationale: "Matches existing pattern of reading all ULD data from DOM in collectData"
  - summary: "Modal built from scratch in JS/CSS vanilla, no library"
    rationale: "Stack rule: no framework/library adds (CLAUDE.md)"
  - summary: "uldComment injected via textarea.value (not innerHTML)"
    rationale: "Defense-in-depth: textarea treats .value as text -> XSS payloads rendered as literal text. Reinforced by esc() elsewhere."
  - summary: "Neutral badge text 'Matériel saisi' (no user data in badge)"
    rationale: "Deferred from CONTEXT.md — keeps badge rendering trivially XSS-safe"
  - summary: "Forfait coché => count forced to 0 at applyMaterialToUld (D-07 strict mode)"
    rationale: "Eliminates the '3 planchers AND forfait' ambiguity in stored state"
metrics:
  duration_seconds: 822
  duration_human: "~14 min"
  completed: "2026-04-23"
  tasks_completed: 2
  tests_added: ~60
  files_modified: 3
---

# Phase 01 Plan 01: Matériel ULD data model + modal UI Summary

Saisie des 8 champs matériel ULD (sangles, planchers bois EU/Standard avec forfait, bois de calage, bâches, intercalaires, nids d'abeille, commentaire libre) via modal dialog construit from scratch, avec rétro-compatibilité totale des manifestes localStorage existants, badge indicateur conditionnel, responsivité ≤ 768px, protection XSS du commentaire libre, et 13 suites de tests couvrant collectData / loadManifest / modal / forfait / XSS.

## What Shipped

### 1. Data model: 10 fields per ULD

Added as flat keys to each ULD object in `data.ulds[i]` (alongside existing `uldNumber`, `rows`, `totalColis`, optional `weight`):

| Key | Type | Default | Purpose | Req |
|-----|------|---------|---------|-----|
| `strapsCount` | number | 0 | Nombre de sangles | MAT-01 |
| `flooringEuCount` | number | 0 | Nombre planchers bois EU | MAT-02 |
| `flooringEuForfait` | boolean | false | Mode forfait négocié EU | MAT-02 |
| `flooringStdCount` | number | 0 | Nombre planchers bois Standard | MAT-03 |
| `flooringStdForfait` | boolean | false | Mode forfait négocié Standard | MAT-03 |
| `blocksCount` | number | 0 | Bois de calage | MAT-04 |
| `tarpsCount` | number | 0 | Bâches | MAT-05 |
| `dividersCount` | number | 0 | Intercalaires | MAT-06 |
| `honeycombCount` | number | 0 | Nids d'abeille | MAT-07 |
| `uldComment` | string | `''` | Commentaire libre niveau ULD | MAT-08 |

**DOM storage:** data-attributes on `.uld-block` (`data-straps`, `data-flooring-eu`, `data-flooring-eu-forfait`, `data-flooring-std`, `data-flooring-std-forfait`, `data-blocks`, `data-tarps`, `data-dividers`, `data-honeycomb`, `data-uld-comment`). Read via `block.dataset.xxx`, written via `setAttribute`.

### 2. Modal dialog UI

New `.material-modal` dialog (overlay + centered box) built in `openMaterialModal(uldIndex)`:

**Fields layout (desktop, 2-column grid):**
1. Sangles (number)
2. Planchers bois EU (number + checkbox "Forfait négocié")
3. Planchers bois Standard (number + checkbox "Forfait négocié")
4. Bois de calage (number)
5. Bâches (number)
6. Intercalaires (number)
7. Nids d'abeille (number)
8. Commentaire ULD (textarea, full-width via `.mat-comment-label { grid-column: 1 / -1 }`)

**Buttons:** Fermer (header), Annuler (footer), Valider (footer).

**Forfait UX (D-06/D-07):**
- Cocher la checkbox forfait → input nombre disabled + value forced to `'0'` (via `toggleForfait`).
- Décocher → input re-enabled (value remains `'0'` unless user retypes).
- At `applyMaterialToUld`: `forfait === true` → `count` written as `0` regardless of input value (strict exclusivity).

### 3. Badge indicator (RECAP-01)

`refreshMaterialBadge(uldIndex)` conditionally inserts `<span class="material-badge">Matériel saisi</span>` inside `#material-badge-{i}` when any material field is non-zero/non-false/non-empty. Neutral badge text (no user data rendered) — trivially XSS-safe. Called after `applyMaterialToUld` and after `loadManifest` per-ULD reconstruction.

### 4. Responsive mobile (RECAP-03 / D-04)

`@media (max-width: 768px)` additions:
- `.material-modal-overlay { align-items: stretch; }` — modal takes full height
- `.material-modal { width: 100%; max-width: 100%; max-height: 100vh; height: 100vh; border-radius: 0; }` — full-screen
- `.material-modal-grid { grid-template-columns: 1fr; }` — 1-column stacking

### 5. Anti-XSS (MAT-11 / D-19)

Attack surface: `uldComment` is the only user-writable free-text material field. Defense:
- **In textarea rendering:** assigned via `modal.querySelector('.mat-uld-comment').value = uldComment` AFTER appending to DOM. Never via `innerHTML`. Textarea treats `.value` as literal text.
- **In data-attribute:** `setAttribute('data-uld-comment', uldComment)` — safe (attribute values are never parsed as HTML).
- **In badge:** text is hardcoded `'Matériel saisi'` — no user data injected.
- **Test:** Payload `<img src=x onerror="window._xss++">` saved via `applyMaterialToUld`, modal re-opened → `modal.querySelectorAll('img').length === 0` AND `window._xss === 0` verified.

### 6. Retro-compatibility (MAT-10 / TEST-02)

`loadManifest` defensive read (D-10) handles three cases identically:
- New format (all material fields present) → values restored as-is.
- Partial format (some fields missing) → missing fields default to `0` / `false` / `''`.
- Old format pre-evolution (no material fields at all) → all defaults; ULD loads without error; `collectData` post-load returns defaults.
- Legacy `pmcs` format (pre-rename) → also loads; material defaults applied via same path.

**No version field added (D-09):** differentiation by presence/absence of keys. Old manifests acquire material fields with default values upon re-save (D-11) — expected and acceptable.

## Public API Reference (for Plan 01-02 and beyond)

```js
// Existing, extended
function addUld()                // now sets 10 data-attrs + adds btn-material + badge wrapper
function collectData()            // now includes 10 material fields in each ulds[i]
async function loadManifest(id)   // now defensive-reads 10 material fields + refreshes badges

// New (added by Plan 01-01)
function openMaterialModal(uldIndex)          // opens modal pre-filled from data-attrs
function closeMaterialModal()                 // removes overlay (idempotent)
function applyMaterialToUld(uldIndex)         // writes modal values back to data-attrs + refreshes badge
function toggleForfait(checkbox, inputClass)  // enables/disables number input based on checkbox
function refreshMaterialBadge(uldIndex)       // shows/hides 'Matériel saisi' badge based on data-attrs
```

## CSS Classes Reference (for Plan 01-02 and beyond)

```css
.material-modal-overlay     /* fixed-position dimmer */
.material-modal             /* modal box, 600px desktop / full-screen mobile */
.material-modal-header      /* title + close button */
.material-modal-grid        /* 2-col desktop / 1-col mobile */
.material-modal-actions     /* Annuler/Valider footer */
.mat-straps, .mat-flooring-eu, .mat-flooring-eu-forfait, .mat-flooring-std, .mat-flooring-std-forfait,
.mat-blocks, .mat-tarps, .mat-dividers, .mat-honeycomb, .mat-uld-comment  /* field selectors */
.mat-forfait-label          /* small-caps label under flooring inputs */
.mat-comment-label          /* full-width grid span */
.material-badge-wrapper     /* badge container under .uld-header */
.material-badge             /* 'Matériel saisi' pill */
.btn-material               /* 'Matériel' button in uld-header */
```

## Tests Added (inventory for Plan 01-02 and Phase 3 TEST-01)

All in `tests/tests.html`, placed after suite "Retro-compatibilite ancien format (pmcs)" and before "Storage FIFO max 50":

| Suite | Assertions | Covers |
|-------|-----------|--------|
| Materiel ULD - collectData nouveaux champs | 13 | All 10 keys + types + values (strapsCount=5, flooringEuForfait=true, uldComment='Fragile', etc.) |
| Materiel ULD - collectData defaults | 10 | `addUld()` without material ⇒ all defaults 0/false/'' |
| Materiel ULD - loadManifest retro-compat (TEST-02) | 14 | Old manifest (no material) loads without error, data-attrs default, collectData post-load returns defaults |
| Materiel ULD - loadManifest nouveau format | 13 | All material data-attrs restored; collectData round-trip |
| Materiel ULD - save/load round-trip ancien manifeste | 6 | Old manifest → load → save → re-read ⇒ acquires material defaults (D-11) |
| Materiel ULD - modal ouverture | 12 | openMaterialModal creates overlay + modal with 10 input/checkbox/textarea |
| Materiel ULD - forfait desactive input (D-06) | 3 | toggleForfait disables/reactivates input |
| Materiel ULD - applyMaterialToUld ecrit data-attributes | 4 | modal values → data-attrs + modal closes |
| Materiel ULD - forfait efface le nombre (D-07) | 2 | Forfait + count entered ⇒ count = 0 at save |
| Materiel ULD - badge Materiel saisi | 2 | Badge appears when at least one field is non-zero |
| Materiel ULD - pas de badge si tout vide | 1 | Wrapper empty when all fields default |
| Materiel ULD - XSS uldComment (MAT-11) | 3 | Payload `<img src=x onerror=...>` not injected, `window._xss === 0` |
| Materiel ULD - closeMaterialModal | 3 | Modal open/close idempotent |

**Verified via Node+JSDOM harness:** all 13 new suites pass, plus all 189 pre-existing tests pass (no regressions). One pre-existing test `Session sans expiry => invalide` fails due to a `&&` short-circuit bug predating this work — documented in `deferred-items.md`.

## Deviations from Plan

### None

The plan executed exactly as written. No bugs or missing functionality found during execution. No authentication gates.

Key-points where the plan guidance was followed to the letter:
- TDD: tests added first in both tasks, then implementation.
- addUld and loadManifest both modified identically (duplicated HTML construction — plan explicitly flagged this as a "piège à gérer" and forbade refactor).
- Stubs for `openMaterialModal`, `closeMaterialModal`, `applyMaterialToUld`, `toggleForfait`, `refreshMaterialBadge` added at top of app.js in Task 1, replaced with real implementations in Task 2.
- Decisions D-01 through D-20 respected (modal from scratch, data-attrs as truth, defensive read, textarea.value for comment, neutral badge, mobile full-screen, forfait strict D-07, etc.).

## Deferred Issues (out of scope)

- Pre-existing test `Session sans expiry => invalide` returns `undefined` instead of `false` due to `&&` short-circuit. Documented in `deferred-items.md`. Fix home: Phase 3.
- Refactor DRY of `addUld` ↔ `loadManifest` duplicated HTML construction — explicitly deferred per CONTEXT.md (D-deferred).
- PDF and email rendering of material fields — that's Plan 01-02's job (RECAP-02, D-15, D-16, D-17, D-18).

## Manual verification steps (for Plan 01-02 agent or human)

Run `npx serve .` locally, log in with test session, then:

1. **New manifest** → create ULD → click "Matériel" → fill 3 fields (sangles=5, forfait EU coché, comment="Test Fragile") → Valider. Badge "Matériel saisi" apparaît sous le header ULD.
2. **Forfait UX** → rouvrir modal → champ Planchers EU grisé et disabled, checkbox cochée. Décocher → champ réactive.
3. **XSS** → rouvrir modal → comment → saisir `<script>alert(1)</script>` → Valider → pas d'alert. Rouvrir → textarea affiche le texte littéral.
4. **Save/load** → saveManifest → newManifest → charger le manifeste sauvegardé depuis la liste. Modal du nouveau bloc ULD affiche les valeurs restaurées, badge présent.
5. **Retro-compat** → si un manifeste pré-existait en localStorage chiffré (avant push), il se charge sans erreur console et avec data-attrs par défaut.
6. **Mobile** → DevTools simule ≤ 768px → modal full-screen, champs en 1 colonne, bouton Fermer accessible.
7. **Tests** → visiter `/tests/tests.html` → voir le summary. 282 / 283 tests OK (le seul échec est `Session sans expiry => invalide`, pré-existant, hors scope).

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 — Extend data model (addUld/collectData/loadManifest + 5 new tests) | `3107b5b` | static/js/app.js, tests/tests.html |
| 2 — Modal UI + badge + CSS responsive + 8 new tests | `5a5f2df` | static/js/app.js, static/css/style.css, tests/tests.html |

## Self-Check: PASSED

Verified 2026-04-23:
- FOUND: static/js/app.js
- FOUND: static/css/style.css
- FOUND: tests/tests.html
- FOUND: .planning/phases/01-mat-riel-uld-r-tro-compat/01-01-SUMMARY.md
- FOUND: .planning/phases/01-mat-riel-uld-r-tro-compat/deferred-items.md
- FOUND: commit 3107b5b (Task 1)
- FOUND: commit 5a5f2df (Task 2)
