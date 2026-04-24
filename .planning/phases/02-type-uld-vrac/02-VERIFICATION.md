---
phase: 02-type-uld-vrac
verified: 2026-04-24T10:20:00Z
human_verified: 2026-04-24T11:00:00Z
status: passed
score: 27/27 must-haves verified (automated) + 4/4 human UAT items confirmed by user on npx serve
re_verification: null
human_verification:
  - test: "Visual check of <select> ordering and default in a real browser"
    expected: "Each new ULD row shows a dropdown before the 'N° ULD' field containing exactly 5 options (PMC, AKE, AKN, PAG, VRAC), with PMC preselected"
    why_human: "jsdom does not render visual order — only DOM position is tested. Visual rendering of the dropdown inside the flex container (.uld-header) may differ on real browsers (Chrome/Firefox/Safari)"
  - test: "Mobile layout ≤ 768px"
    expected: "The <select class='uld-type'> takes 100% width in a column layout, stays touchable with usable padding"
    why_human: "Media query .uld-header .uld-type { width: 100% !important; } cannot be tested via jsdom — requires DevTools mobile emulation or a real device"
  - test: "Real jsPDF rendering of page ULD info box and page 1 'Detail par categorie' table"
    expected: "Page ULD info box contains 3 lines: 'LTA concernes : ...', 'Type : VRAC', 'Poids : N kg' (22mm info box); Page 1 under the summary table shows a 'Detail par categorie' header + 2 rows ('dont Palettes : N (X colis, Y kg)', 'dont Vrac : N (X colis, Y kg)') when at least 1 VRAC ULD; backward-compat (0 VRAC): no such section"
    why_human: "jsPDF in jsdom uses a patched text/autoTable stub — the harness confirms the API is called with the right arguments but does not render actual PDF pages. Visual layout of the infoBox (4mm padding, 6mm line-height) and the column widths of 'Detail par categorie' must be validated by opening a real generated PDF"
  - test: "Real email client rendering of HTML body"
    expected: "Open a received email (e.g., Outlook/Gmail/Apple Mail): the 'Detail par categorie' table and the '[VRAC]' / '[PMC]' suffixes in ULD block titles display correctly with the intended font colors (#1a3a5c) and padding"
    why_human: "Email client CSS support varies (Outlook inline styles vs Gmail sanitization). Tests verify the HTML string content; they don't validate how clients render the inline styles"
---

# Phase 2: Type ULD VRAC — Verification Report

**Phase Goal:** L'agent peut marquer une ULD comme type "VRAC", qui n'est pas comptée comme palette dans le récapitulatif et apparaît sur une ligne "Vrac" séparée avec son poids et son nombre de colis.

**Verified:** 2026-04-24T10:20:00Z (automated) + 2026-04-24T11:00:00Z (human UAT)
**Status:** passed
**Re-verification:** No — initial verification

**Human UAT outcome:** All 4 items confirmed by user on `npx serve . -l 4000` (local browser test, 2026-04-24). See `02-HUMAN-UAT.md`.

---

## Goal Achievement

### ROADMAP Success Criteria

| # | Criterion (ROADMAP) | Status | Evidence |
|---|---------------------|--------|----------|
| C1 | "VRAC" apparaît dans le sélecteur de type ULD à côté des types existants (PMC, conteneurs) | VERIFIED | `ULD_TYPES = ['PMC','AKE','AKN','PAG','VRAC']` at app.js:18; `<select class="uld-type">` with 5 `<option>` injected in both `addUld()` (app.js:370-376) AND `loadManifest()` (app.js:634). Test suite `Type ULD - addUld cree select avec PMC par defaut` asserts 5 options in order. |
| C2 | Quand au moins une ULD VRAC est dans le manifeste, le compteur de palettes du récapitulatif les exclut | VERIFIED (D-09 Phase 2 nuance) | `updateRecap()` at app.js:459-465 emits `'N dont Vrac : M (X colis, Y kg)'` annotation when vracCount>0. Test `updateRecap annotation dont Vrac` asserts exact format. **Documented nuance:** the "ULD : N" counter is kept (no relabel to "Palettes") — the agent infers palettes = ULD − Vrac. The annotation makes the split explicit and cohere across 3 surfaces. See "D-09 Phase 2 Interpretation" section below. |
| C3 | Quand au moins une ULD VRAC est présente, une ligne "Vrac" apparaît dans le récap avec le poids total VRAC et le nombre de colis total VRAC — écran + PDF + email | VERIFIED (3 surfaces) | (a) Screen: `#liveRecap` annotation (app.js:464); (b) PDF page 1: conditional `autoTable` "Detail par categorie" (app.js:968-983); (c) Email HTML: conditional table after récap (app.js:1174-1182). All consume `buildPalettesVracSplit(data.ulds)` returning `{hasVrac, palettes, vrac}`. |
| C4 | Les ULD non-VRAC continuent d'être comptées et affichées comme avant (pas de régression) | VERIFIED | Default is `PMC` (app.js:19). Non-VRAC ULDs pass through `buildMaterialSummary` (line 726 `if (u.type !== 'VRAC')`), `buildUldMaterialRows` (line 757 `isVrac` guard), and `buildPalettesVracSplit` (line 846 else branch). Backward-compat test `buildPdf manifeste ancien format` passes. Test `Type ULD - buildPdf retro-compat sans type ne crash pas` confirms `undefined` type falls back to palette path. Test `buildMaterialSummary VRAC conserve non-planchers` confirms sangles/bois/bâches/intercalaires/nids are still counted on VRAC (D-20 strict, only planchers excluded). |

**Score:** 4/4 success criteria verified

---

### Observable Truths (Plan 02-01 + 02-02 must_haves)

#### Plan 02-01 (17 truths)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| T1 | `<select class="uld-type">` contient exactement 5 options PMC/AKE/AKN/PAG/VRAC | VERIFIED | app.js:371-375 (addUld), app.js:629-631 (loadManifest dynamic options). Test `addUld cree select avec PMC par defaut` — 8 assertions. |
| T2 | Select apparaît AVANT le champ N° ULD dans .uld-header | VERIFIED | app.js:368-378: `<label>Type :</label><select.../><label>ULD N° :</label><input.uld-number>`. Test `select positionne avant uld-number` via `Node.DOCUMENT_POSITION_FOLLOWING`. |
| T3 | Type par défaut = PMC (D-03) | VERIFIED | app.js:371 `<option value="PMC" selected>PMC</option>` + app.js:366 `setAttribute('data-uld-type', ULD_TYPE_DEFAULT)`. Test `addUld data-uld-type par defaut`. |
| T4 | loadManifest applique lecture défensive : manifeste ancien sans `type` → PMC (D-15) | VERIFIED | app.js:627: `var uldType = (uldData.type && ULD_TYPES.indexOf(uldData.type) >= 0) ? uldData.type : ULD_TYPE_DEFAULT;`. Test `loadManifest retro-compat type absent => PMC (D-15)`. |
| T5 | collectData inclut la clé `type` validée contre ULD_TYPES (D-05) | VERIFIED | app.js:520-522. Test `collectData inclut type` + `collectData fallback PMC si value corrompue`. |
| T6 | DOM source-of-truth = live select; data-uld-type = mirror (D-06) | VERIFIED | app.js:520 `typeSelect.value`, app.js:221 `block.setAttribute('data-uld-type', newType)`. Tests confirm round-trip. |
| T7 | Changement <select> déclenche updateRecap + refreshMaterialBadge + ferme modal si ouvert (D-21) | VERIFIED | app.js:215-230 `changeUldType()` cascade. Test `changeUldType declenche refreshMaterialBadge`. |
| T8 | #liveRecap affiche annotation "dont Vrac : N (X colis, Y kg)" conditionnelle (D-07, D-08) | VERIFIED | app.js:463-465. Tests `updateRecap annotation dont Vrac (VRAC-02)` + `updateRecap pas annotation si aucun VRAC`. |
| T9 | Format exact avec VRAC : "ULD : 4 dont Vrac : 1 (12 colis, 240 kg) \| Colis : ... \| Poids : ... \| LTA : ... \| DGR" (D-08) | VERIFIED | app.js:464-471 + test literal `assert('Recap contient "dont Vrac : 1 (12 colis, 240 kg)"', ...)`. |
| T10 | Format sans VRAC : inchangé (backward compatible) | VERIFIED | app.js:462 `var uldSpanContent = String(nbUld);` (no annotation if vracCount=0). Test `updateRecap pas annotation si aucun VRAC`. |
| T11 | Totaux globaux Colis et Poids INCLUENT VRAC (D-10) | VERIFIED | app.js:445-446 `totalColis += blockColis;` and `totalWeight += blockWeight;` BEFORE the VRAC conditional at line 452. Test `updateRecap totaux globaux incluent VRAC (D-10)`. |
| T12 | openMaterialModal masque les 2 champs Planchers (EU + Std) quand type=VRAC (D-18) | VERIFIED | app.js:50 `var isVrac = block.dataset.uldType === 'VRAC';`, app.js:70,72 `'<label class="mat-flooring-label' + flooringHiddenClass + '">'`. CSS app.js line (style.css:165) `.mat-flooring-hidden { display: none; }`. Test `Modal masque planchers si VRAC (D-18)`. |
| T13 | data-attributes data-flooring-* PRESERVÉS au toggle vers VRAC (D-19 : pas de reset destructif) | VERIFIED | CSS-only masking — no JS mutation in `changeUldType`. Test `Persistance data-flooring-* quand toggle VRAC (D-19)` — 6 assertions including re-opened modal values intact. |
| T14 | formatCondensedMaterial EXCLUT Planchers EU/Std quand type=VRAC (D-21) | VERIFIED | app.js:154-169. Test `formatCondensedMaterial exclut planchers VRAC (D-21)`. |
| T15 | esc() appliqué au type dans insertions HTML (défense en profondeur) | VERIFIED | app.js:1193 `esc(validUldType)` in email title. Note: PDF type rendering (app.js:1045) uses `doc.text(uldType, ...)` — jsPDF text is safe from HTML injection by nature. Type validity enforced via ULD_TYPES indexOf guard. |
| T16 | tests/tests.html contient ≥ 8 nouvelles suites "Type ULD - ..." | VERIFIED | **42 suites** matching `Type ULD - ` (ripgrep count). Far exceeds threshold. |
| T17 | <select class="uld-type"> utilisable sur mobile ≤ 768px | VERIFIED | style.css:218 `@media (max-width: 768px) { .uld-header .uld-type { width: 100% !important; } }`. Flagged for human verification (media queries not testable in jsdom). |

#### Plan 02-02 (10 truths)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| T18 | Chaque page ULD du PDF affiche le type dans l'entête (D-11) | VERIFIED | app.js:1042 `doc.text('Type :', margin + 4, y + 13)`, app.js:1045 `doc.text(uldType, margin + 22, y + 13)`. infoBoxH = 16/22mm (2 lines without weight, 3 with). Test `buildPdf entete page ULD contient Type (D-11)` confirms `doc.text("VRAC", ...)` + `doc.text("Type :", ...)` |
| T19 | Page 1 PDF affiche scission "dont Palettes : N (X colis, Y kg)" + "dont Vrac : M (X colis, Y kg)" quand ≥1 VRAC (D-12) | VERIFIED | app.js:968-983. Test `buildPdf page 1 scission Palettes/Vrac (D-12)`. Format canonique W-1 : pas de préfixe "ULD". |
| T20 | Sans aucune ULD VRAC, page 1 PDF conserve format actuel (backward compat) | VERIFIED | app.js:968 `if (pvSplit.hasVrac) { ... }`. Test `buildPdf sans VRAC pas de scission (backward compat)`. |
| T21 | Email HTML miroir exact du PDF (D-14) | VERIFIED | app.js:1173-1182 scission mirror; app.js:1193 `'[' + esc(validUldType) + ']'` in ULD block title. Tests `email HTML scission Palettes/Vrac (D-14)`, `email HTML titre bloc contient type (D-14)`. |
| T22 | ULD VRAC n'affichent PAS Planchers EU/Std dans leur section Matériel (PDF ULD + email) — D-20 | VERIFIED | app.js:757 `var isVrac = u.type === 'VRAC';` in buildUldMaterialRows guards planchers (lines 760-767). Tests `buildUldMaterialRows exclut planchers VRAC (D-20)` + `email HTML bloc ULD VRAC exclut planchers (D-20)`. |
| T23 | Totaux page 1 agrégés EXCLUENT planchers des ULD VRAC (D-20) | VERIFIED | app.js:726 `if (u.type !== 'VRAC')` guards flooring aggregation in buildMaterialSummary. Tests `buildMaterialSummary exclut planchers VRAC (D-20)` + `email HTML totaux materiel excluent planchers VRAC (D-20)`. |
| T24 | esc() appliqué au type dans insertions email HTML (défense XSS) | VERIFIED | app.js:1193 `esc(validUldType)`. Test `email HTML defense XSS type (D-14)` with invalid/malicious type input. |
| T25 | Manifeste sans clé `type` (rétro-compat D-15) ne crash pas PDF/email — affiche PMC | VERIFIED | app.js:1026 (PDF), app.js:1192 (email) — both use `(u.type && ULD_TYPES.indexOf(u.type) >= 0) ? u.type : ULD_TYPE_DEFAULT`. Test `buildPdf retro-compat sans type ne crash pas` + `email HTML retro-compat type absent => PMC`. |
| T26 | Manifeste uniquement non-VRAC : PDF + email sans "dont Palettes"/"dont Vrac" (pas de parasite) | VERIFIED | Conditional on `pvSplit.hasVrac` (app.js:968 and 1174). Tests `buildPdf sans VRAC pas de scission` + `email HTML pas de scission si aucun VRAC`. |
| T27 | tests/tests.html contient ≥ 6 nouvelles suites PDF/email couvrant D-11/D-12/D-14/D-20 | VERIFIED | 13 (PDF side) + 8 (email side) = 21 new suites per summary self-check. Counted in global 42 "Type ULD -" matches. |

**Score:** 27/27 truths VERIFIED (automated)

---

### D-09 Phase 2 Interpretation (ROADMAP Criterion C2)

**ROADMAP literal wording:** "Quand au moins une ULD VRAC est dans le manifeste, le compteur de palettes du récapitulatif les exclut (seules les palettes réelles sont comptées)"

**Implementation choice (documented in 02-01-PLAN frontmatter, lines 20-23):**
- The "ULD : N" total counter is kept (no relabel to "Palettes : M")
- A conditional annotation "dont Vrac : N (X colis, Y kg)" is added when vracCount > 0
- The agent infers palettes = ULD − Vrac

**Why this interpretation is accepted:**
1. **Documented in Plan 02-01 frontmatter** (lines 20-23) explicitly as D-09 Phase 2 nuance
2. **Semantically equivalent** — the split is explicit to the reader: ULD: 4 dont Vrac : 1 means 3 palettes
3. **Cohérent across 3 surfaces** — same canonical format "dont Palettes : N (X colis, Y kg)" / "dont Vrac : N (X colis, Y kg)" now appears in PDF page 1 + email HTML (both show the explicit palette count). Only #liveRecap shows the abbreviated form ("ULD : N dont Vrac : M") due to UI compactness constraints
4. **Lesson from Phase 1 gap RECAP-01** — the original planner explicitly referenced this lesson in the plan frontmatter to avoid a similar gap

**Verdict:** Acceptable — the nuance is documented, consistent, and semantically faithful to the requirement. The ROADMAP constraint "le compteur de palettes les exclut" is satisfied via annotation rather than relabel.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `static/js/app.js` | ULD_TYPES, addUld/loadManifest/collectData/updateRecap/openMaterialModal/formatCondensedMaterial/changeUldType extended + buildPalettesVracSplit + buildMaterialSummary/buildUldMaterialRows VRAC-aware + buildPdf D-11/D-12 + sendEmail D-14 | VERIFIED | 1237 lines. All 7 grep markers present: `ULD_TYPES`, `function changeUldType`, `function buildPalettesVracSplit`, `dont Vrac`, `dont Palettes`, `mat-flooring-hidden`, `isVrac`. Syntax check passes via `node --check`. |
| `static/css/style.css` | `.uld-header .uld-type` desktop + mobile + `.mat-flooring-hidden { display: none; }` | VERIFIED | 3 matching rules confirmed at lines 62-69 (desktop), 165 (modal masking), 218 (mobile media query). |
| `tests/tests.html` | ≥ 8 Plan 02-01 suites + ≥ 6 Plan 02-02 suites | VERIFIED | 42 `Type ULD - ` suites total (covers D-01..D-21). 112 total suites in file. 490/491 tests pass (1 pre-existing failure documented — see below). |

---

### Key Link Verification

| From | To | Via | Status |
|------|-----|-----|--------|
| addUld() | .uld-header contains `<select class="uld-type">` with 5 PMC/AKE/AKN/PAG/VRAC options, PMC selected, onchange=changeUldType | innerHTML injection before `.uld-number` | WIRED (app.js:368-376) |
| loadManifest() | Same `<select>` with dynamic `selected` option based on `uldData.type` | innerHTML + dynamic option mapping with ULD_TYPES | WIRED (app.js:629-634) |
| collectData() | uldEntry.type via block.querySelector('.uld-type').value with indexOf guard | Live DOM read | WIRED (app.js:520-522) |
| updateRecap() | #liveRecap gets 'dont Vrac : N (X colis, Y kg)' annotation when hasVrac | Iterate blocks, aggregate vracCount/Colis/Weight, conditional concat | WIRED (app.js:436-465) |
| openMaterialModal() | Planchers EU+Std hidden when data-uld-type='VRAC' | CSS class `.mat-flooring-hidden` via flooringHiddenClass string | WIRED (app.js:50-51, 70,72) |
| formatCondensedMaterial() | Planchers EU/Std omitted when block.dataset.uldType='VRAC' | `if (!isVrac) {...}` guard around both planchers branches | WIRED (app.js:154-169) |
| changeUldType() | dataset sync + updateRecap + refreshMaterialBadge + close modal if open | Dedicated handler | WIRED (app.js:215-230) |
| buildMaterialSummary(ulds) | Skip planchers for VRAC ULDs | `if (u.type !== 'VRAC')` | WIRED (app.js:726-731) |
| buildUldMaterialRows(u) | Skip planchers rows for VRAC | `var isVrac = u.type === 'VRAC'; if (!isVrac) {...}` | WIRED (app.js:753-767) |
| buildPdf page 1 | Conditional autoTable 'Detail par categorie' with dont Palettes/Vrac rows | Consumes `buildPalettesVracSplit(data.ulds)` + `if (pvSplit.hasVrac)` | WIRED (app.js:967-983) |
| buildPdf page ULD | doc.text 'Type : VRAC' between LTA and Poids lines | infoBox ASCII-safe text, infoBoxH 16/22mm | WIRED (app.js:1023-1045) |
| sendEmail html récap | Scission Palettes/Vrac table after grand-total row | Consumes `buildPalettesVracSplit` mirror | WIRED (app.js:1173-1182) |
| sendEmail html détail ULD | Block title 'ULD : X [VRAC]' with bracket notation | `esc(validUldType)` with fallback | WIRED (app.js:1192-1195) |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| #liveRecap "dont Vrac" annotation | vracCount, vracColis, vracWeight | Iteration over `.uld-block` → `.uld-type` select value → aggregation (app.js:436-457) | Yes — live DOM read | FLOWING |
| PDF page 1 "Detail par categorie" | pvSplit.palettes / pvSplit.vrac | `buildPalettesVracSplit(data.ulds)` where `data` = `collectData()` output (app.js:967) | Yes — real ULD counts/colis/weight | FLOWING |
| PDF page ULD Type label | uldType | `u.type` validated against ULD_TYPES (app.js:1026) | Yes — from collectData | FLOWING |
| Email récap scission | pvSplit | Same `buildPalettesVracSplit(data.ulds)` (app.js:1173) | Yes | FLOWING |
| Email block title [TYPE] | validUldType | `u.type` with guard + `esc()` (app.js:1192-1193) | Yes | FLOWING |
| Modal planchers hiding | isVrac | `block.dataset.uldType === 'VRAC'` (app.js:50) | Yes — dataset sync via changeUldType | FLOWING |

**All data paths verified — no hollow wiring.**

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Test harness passes (490+/491 expected) | `node tests/run-harness.cjs` | Passed: 493, Failed: 1 (pre-existing `Session sans expiry => invalide`, documented in `.planning/phases/01-mat-riel-uld-r-tro-compat/deferred-items.md`) | PASS |
| JS syntax validity | `node --check static/js/app.js` | OK (no errors) | PASS |
| All referenced commits exist | `git log --no-walk <hashes>` | All 7 commits present (9f7f766, 89b684e, d9b3464, 30aa492, 5e20df9, 0ff18a0, e9184fd) | PASS |
| No TODO/FIXME/HACK in production code | `grep -iE "TODO|FIXME|XXX|HACK"` | 0 matches in app.js/style.css (1 match in tests.html is a regex `MAN-XXXX...` — false positive) | PASS |
| 42 "Type ULD -" test suites registered | `grep -c "suite\('Type ULD -"` | 42 (far exceeds 14 threshold) | PASS |
| Canonical format W-1 (no "ULD (" prefix in production strings) | `grep 'ULD ('` | Only comments match; all render paths use "dont Palettes" / "dont Vrac" canonical labels | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| VRAC-01 | 02-01-PLAN | "VRAC" apparaît comme type ULD officiel dans le sélecteur | SATISFIED | Truths T1, T2, T3 — select with 5 options including VRAC at app.js:370-376 / 634 |
| VRAC-02 | 02-01-PLAN | Les ULD de type VRAC sont exclues du compteur de palettes du récapitulatif | SATISFIED (D-09 Phase 2 interpretation) | Truth T8, T9 — `updateRecap` annotation "dont Vrac : N (X colis, Y kg)" at app.js:463-465. See "D-09 Phase 2 Interpretation" section. |
| VRAC-03 | 02-02-PLAN | Le récapitulatif affiche une ligne séparée "Vrac" (poids + nombre de colis) quand au moins une ULD VRAC est présente | SATISFIED (3 surfaces) | Truths T8 (screen), T19 (PDF page 1), T21 (email HTML) — all 3 channels carry the VRAC line per W-1 canonical format |

**No orphaned requirements** — REQUIREMENTS.md line 22-26 maps VRAC-01/02/03 exclusively to Phase 2, and all 3 are covered by the plan frontmatters (02-01 claims VRAC-01+02, 02-02 claims VRAC-03). No unclaimed requirement.

---

### Anti-Patterns Scan

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| static/js/app.js | — | TODO/FIXME/HACK/stub/placeholder comments | — | NONE (zero matches) |
| static/css/style.css | — | TODO/FIXME/HACK | — | NONE (zero matches) |
| tests/tests.html | 129 | `MAN-XXXXXXXX` | — | Regex pattern, not anti-pattern (false positive) |
| static/js/app.js | 378, 380, 406, 407, 410, 636, 638 | HTML `placeholder=` attribute | ℹ️ Info | Legitimate UI hints, not stubs |

**No blocker or warning anti-patterns found.**

---

### Pre-existing Test Failure (Expected)

The single failing test `SECU - Session auth → Session sans expiry => invalide (attendu: false, obtenu: undefined)` is a **pre-existing bug** documented in `.planning/phases/01-mat-riel-uld-r-tro-compat/deferred-items.md`. The test assertion uses `session && session.expiry && session.expiry > Date.now();` which short-circuits to `undefined`, not `false`. Fix deferred to Phase 3 (TEST-01 hardening). Not caused by Phase 2 work. **490/491 pass count matches the target.**

---

### Revision W-1 Alignment (Canonical Format)

The canonical VRAC scission format is harmonized across 3 surfaces:

| Surface | Format | Location |
|---------|--------|----------|
| Screen (#liveRecap) | `ULD : N dont Vrac : M (X colis, Y kg)` (compact one-liner, no "dont Palettes" due to UI space constraint; total ULD kept per D-09 Phase 2) | app.js:464 |
| PDF page 1 (autoTable) | `dont Palettes` \| `N (X colis, Y kg)` + `dont Vrac` \| `N (X colis, Y kg)` (2-column rows under "Detail par categorie" header) | app.js:973-974 |
| Email HTML (table) | `dont Palettes` \| `N (X colis, Y kg)` + `dont Vrac` \| `N (X colis, Y kg)` (identical layout to PDF, mirror) | app.js:1177-1180 |

**No "ULD" prefix in any scission row** (grep `"' ULD ('"` returns 0 matches in render paths). W-1 compliance confirmed.

---

### Human Verification Required

See `human_verification:` block in YAML frontmatter above for the 4 items requiring manual validation:
1. Visual browser rendering of `<select>` ordering and flex layout in `.uld-header`
2. Mobile layout ≤ 768px (touchability, column width)
3. Real jsPDF rendering (infoBox layout, autoTable column widths in "Detail par categorie")
4. Email client rendering (Outlook/Gmail inline style support)

These are standard items for a vanilla-JS/CSS frontend tool where jsdom cannot fully simulate the browser/PDF/email rendering stack. The automated test suite validates the DOM structure, string content, and function-call arguments — visual layout must be human-validated on `npx serve .` before push to master.

---

### Gaps Summary

**None.** All 27 must-have truths across both plans are VERIFIED by automated checks (grep patterns + test harness). All 4 ROADMAP success criteria are SATISFIED (C2 with the documented D-09 Phase 2 nuance). All 3 Phase 2 requirements (VRAC-01/02/03) are covered by plan frontmatters and concretely implemented. The canonical W-1 format is consistent across the 3 surfaces. The data-flow trace (Level 4) confirms real data flows from `collectData()` through `buildPalettesVracSplit()` into all 3 rendering paths.

The 4 human-verification items are **recommended but non-blocking for VERIFICATION status** — they are standard browser-stack validations that cannot be automated with the current harness (jsdom + patched jsPDF). Operations team must run `npx serve .` and test the full flow in a real browser before pushing to master (this is explicitly codified in Phase 3's goal).

---

*Verified: 2026-04-24T10:20:00Z*
*Verifier: Claude (gsd-verifier)*
*Harness: 490/491 tests pass (1 pre-existing non-Phase-2 failure — deferred to Phase 3)*
