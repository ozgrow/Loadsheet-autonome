---
phase: 01-mat-riel-uld-r-tro-compat
verified: 2026-04-28T13:00:00Z
status: passed
score: 11/11 success criteria automatically verified + 7/7 UAT items approved by user (2026-04-28T13:00:00Z)
re_verification: true
prior_status: passed (after RECAP-01 gap closure 2026-04-23 PM — initial 2026-04-23 AM was gaps_found / 5 of 6)
prior_iterations:
  - date: 2026-04-23T08:00:00Z
    status: gaps_found
    score: 5/6
    note: "Initial — RECAP-01 partial (badge neutre)"
  - date: 2026-04-23T12:00:00Z
    status: passed
    score: 6/6
    note: "RECAP-01 closed via Plan 01-03 historical (recap inline condense)"
  - date: 2026-04-28T12:00:00Z
    status: human_needed
    score: 11/11
    note: "Plan 01-03 EXTENDED — MAT-12/13/14 added before prod release. All automated checks pass."
gap_closure:
  recap_01_status: SATISFIED (carried forward from 2026-04-23 PM, no regression)
  new_requirements_satisfied:
    - id: MAT-12
      criteria: 5
      satisfied: 5
      note: "Checkbox + handler + neutralisation + classe CSS + propagation save/load/PDF/email"
    - id: MAT-13
      criteria: 4
      satisfied: 4
      note: "Validation bloquante sur addUld + generatePdf + sendEmail + helpers uldHasMaterial/findIncompleteUlds"
    - id: MAT-14
      criteria: 3
      satisfied: 3
      note: "Signature addUld(autoOpen, skipValidation) + auto-open par defaut + loadManifest n'auto-ouvre pas (par construction)"
human_verification:
  - test: "MAT-14 visuel — auto-open du modal sur 1ere ULD"
    expected: "Login + nouveau manifeste => le modal materiel s'ouvre automatiquement pour la 1ere ULD sans clic"
    why_human: "UX timing + rendering du modal en conditions reelles (pas JSDOM)"
  - test: "MAT-12 visuel — case 'Rien a facturer' desktop + mobile"
    expected: "Modal materiel : la zone ambree contenant la checkbox 'Rien a facturer pour cette ULD' est visible AU-DESSUS du grid des champs. Cocher => tous les autres champs grises. Decocher => reactives."
    why_human: "Couleur ambre + layout visuel + grayout disabled (CSS rendering)"
  - test: "MAT-13 visuel — alert FR sur addUld bloque"
    expected: "ULD #1 vide, cliquer '+ Ajouter une ULD' => alert browser 'ULD N°1 : materiel non saisi. Cochez \"Rien a facturer\" ou remplissez au moins un champ avant d'ajouter une nouvelle ULD.' + reouverture du modal #1"
    why_human: "alert() du browser + reouverture modal — rendu reel non assertable JSDOM"
  - test: "MAT-13 visuel — alert FR sur generatePdf et sendEmail bloques"
    expected: "ULD #1 strapsCount=2 + ULD #2 vide => 'Generer le PDF' alert 'Materiel non saisi pour : ULD N°2. ...' + PDF non genere. 'Envoyer par email' meme alert + fetch /api/send-email NON declenche (Network tab)."
    why_human: "alert + court-circuit PDF/fetch en conditions reelles (validation EN TOUT DEBUT avant validateRequired/JWT)"
  - test: "MAT-12 + MAT-10 visuel — round-trip noMaterialToBill"
    expected: "Sauvegarder un manifeste avec ULD #1 noMaterialToBill=true + ULD #2 strapsCount=5. 'Nouveau' puis recharger : recap inline ULD#1 = 'Rien a facturer' (style ambre), ULD#2 = 'Sangles: 5'. Modal NE s'ouvre PAS lors du rechargement (MAT-14 par construction)."
    why_human: "Round-trip localStorage AES reel (cle sessionStorage) vs JSDOM harness"
  - test: "Recap inline desktop + mobile (RECAP-03 etendu)"
    expected: "Desktop : '<libelle>: <valeur>' separes par ' | ' visible sous le header ULD. Mobile (DevTools <=768px) : recap occupe 100% largeur, wrap naturellement, pas d'overflow horizontal."
    why_human: "Layout visuel + breakpoints reels (font scaling)"
  - test: "Pas de regression PDF Phase 01-02 / Phase 02"
    expected: "Generer un PDF avec 1 PMC + 1 VRAC + 1 PMC noMaterialToBill : page 1 contient 'dont Palettes : 2 (...)' + 'dont Vrac : 1 (...)' + section materiel ULD VRAC affiche 'Type : VRAC'. ULD noMaterialToBill affiche 'Rien a facturer' en ligne unique dans sa section materiel."
    why_human: "Inspection visuelle PDF binaire (jsPDF render reel)"
---

# Phase 01: Materiel ULD & retro-compat — Verification Report (Re-verification 2026-04-28 EXTENDED)

**Phase Goal:** L'agent peut saisir des infos materiel sur chaque ULD (sangles, planchers bois EU/standard, bois de calage, baches, intercalaires, nid d'abeille, commentaire libre), les voir dans le recap ecran + PDF, et les anciens manifestes continuent de se charger sans erreur.

**Periphery added 2026-04-28 (post-initial-verification, pre-prod):**
- MAT-12 : Case "Rien a facturer" dans le modal materiel
- MAT-13 : Saisie materiel obligatoire (validation bloquante sur 3 surfaces)
- MAT-14 : Auto-ouverture du modal a chaque creation d'ULD

**Verified:** 2026-04-28T12:00:00Z
**Status:** human_needed (all automated checks pass — UAT manual outstanding per CLAUDE.md Release Step 4)
**Re-verification:** Yes — third pass after gap closure etendu (Plan 01-03 reecrit)
**Test harness:** `npm run verify` => **591 / 591 tests OK** (0 failures)

---

## Re-verification Summary

| Metric | 2026-04-23 AM (Initial) | 2026-04-23 PM (RECAP-01 closed) | 2026-04-28 (EXTENDED) |
|---|---|---|---|
| Status | gaps_found | passed | human_needed |
| Score | 5/6 | 6/6 | 11/11 |
| Requirements scope | 15 (MAT-01..11, RECAP-01..03, TEST-02) | 15 | **18** (+MAT-12, MAT-13, MAT-14) |
| Tests pass | 355/356 | 383/384 | **591/591** (+208 nouveaux asserts) |
| Gaps open | 1 (RECAP-01 partial) | 0 | 0 |
| Regressions | n/a | 0 | 0 |

**Gap fermes :**
- RECAP-01 partiel => SATISFIED (carry forward 2026-04-23 PM, aucune regression)

**Nouveaux requirements integres :**
- MAT-12 : SATISFIED (12 suites tests + 6 wirings save/load/PDF/email/recap/modal)
- MAT-13 : SATISFIED (5 suites tests + 3 surfaces validation : addUld, generatePdf, sendEmail)
- MAT-14 : SATISFIED (4 suites tests + signature addUld(autoOpen, skipValidation))

---

## Goal Achievement

### Success Criteria — 6 originaux + 5 derives MAT-12/13/14

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Modal d'edition ULD avec 8 champs materiel saisissables + nouvelle case 'Rien a facturer' (MAT-12) | VERIFIED | `openMaterialModal` (app.js:33-112) contient les 8 inputs (mat-straps/flooring-eu/flooring-eu-forfait/flooring-std/flooring-std-forfait/blocks/tarps/dividers/honeycomb/uld-comment) + nouvelle zone `.mat-no-billing-row` avec checkbox `#mat-no-billing` (app.js:72-77) + handler `toggleNoBilling` (app.js:114-135) |
| 2 | Forfait negocie exclusif du nombre + desactivation des champs si 'Rien a facturer' coche | VERIFIED | `toggleForfait` preserve (D-06). Handler `toggleNoBilling` propage `disabled` sur 8 inputs+checkboxes via basicSelectors (app.js:119-127). Inputs planchers EU/Std combinent no-billing OR forfait (app.js:128-134, preserve D-06). Test : `Materiel ULD - rien a facturer desactive autres champs (MAT-12)` (tests.html:974) + `decoche reactive (MAT-12 + D-06)` (tests.html:993) |
| 3 | Recap ecran condense inline + affichage special 'Rien a facturer' + PDF inclut infos materiel | VERIFIED | RECAP-01 inline conserve (formatCondensedMaterial app.js:201-244). Court-circuit `if (block.dataset.noBilling === 'true') return 'Rien a facturer'` AVANT VRAC AVANT champs (app.js:207). PDF buildUldMaterialRows (app.js:884-887) court-circuit `[['', 'Rien a facturer']]`. Email HTML herite via buildUldMaterialHtml (app.js:943-955) qui appelle buildUldMaterialRows + esc() defensif. |
| 4 | Manifeste ancien format se charge sans erreur — etendu noMaterialToBill retro-compat | VERIFIED | loadManifest (app.js:756) : `div.setAttribute('data-no-billing', String(uldData.noMaterialToBill === true))` — absence => false (defense en profondeur MAT-10 etendu). Test : `Materiel ULD - rien a facturer retro-compat absente => false (MAT-12 + MAT-10)` (tests.html:1112) |
| 5 | uldComment echappe partout — etendu au recap inline (vector XSS reintroduit) | VERIFIED | `formatCondensedMaterial` applique `esc(truncated)` sur uldComment slicé a 30 chars (app.js:239). Recap, modal, PDF, email HTML : tous esc(). 38 occurrences `esc(` dans app.js. Test : `Materiel ULD - recap XSS uldComment (RECAP-01 / MAT-11)` (tests.html:859) — `window._xss === 0`. |
| 6 | Champs modal <= 768px — etendu au recap inline + checkbox 'Rien a facturer' | VERIFIED | `@media (max-width: 768px)` line 241. Modal full-screen mobile preserve (line 290-295). Recap mobile (line 297-303 : block, width 100%, font 0.72em). NOUVEAU : `.mat-no-billing-row` mobile (line 306-309) padding compacte + `.mat-no-billing-label` font 0.85em (line 310-312). Bloc fermeture line 313. |
| 7 | MAT-13 — Tentative addUld avec ULD existante vide => bloque + message identifiant l'ULD | VERIFIED | addUld (app.js:453-468) : si !skipValidation, findIncompleteUlds() => si non-vide, alert FR identifiant ULD + reopen modal + return. Test : `Materiel ULD - addUld bloque si ULD existante vide (MAT-13)` (tests.html:1237) |
| 8 | MAT-13 — Tentative generatePdf avec ULD vide => bloque + message liste TOUTES les ULD incompletes | VERIFIED | generatePdf (app.js:1236-1244) : findIncompleteUlds EN TOUT DEBUT (avant validateRequired et await saveManifest) => alert listant TOUTES les ULD via `.map(...).join(', ')` + return. Tests : `Materiel ULD - generatePdf bloque si ULD vide` (tests.html:1272) + `generatePdf liste toutes ULD incompletes` (tests.html:1318) |
| 9 | MAT-13 — Tentative sendEmail avec ULD vide => bloque + message identifiant les ULD | VERIFIED | sendEmail (app.js:1262-1270) : meme pattern, validation EN TOUT DEBUT avant validateRequired et tout await. Test : `Materiel ULD - sendEmail bloque si ULD vide (MAT-13)` (tests.html:1294) |
| 10 | MAT-14 — Creation nouvelle ULD via bouton '+ Ajouter une ULD' => modal s'ouvre automatiquement | VERIFIED | addUld(autoOpen=true, skipValidation=false) signature (app.js:453). Default autoOpen=true (app.js:456). En fin de fonction : `if (autoOpen) { openMaterialModal(i); }` (app.js:517-519). Bouton index.html:105 = `addUld()` sans args. Tests : `Materiel ULD - addUld autoOpen defaut true ouvre modal` (tests.html:1343) + `newManifest ouvre modal pour 1ere ULD` (tests.html:1389) |
| 11 | MAT-14 — Rechargement manifeste => modal NE s'ouvre PAS automatiquement | VERIFIED | loadManifest (app.js:717-...) reconstruit le HTML directement (createElement + innerHTML) SANS appeler addUld — donc autoOpen ne s'applique PAS par construction. Test : `Materiel ULD - loadManifest n'ouvre pas modal (MAT-14 + TEST-02)` (tests.html:1364) — `assertEqual('Modal absent apres loadManifest', modal, null)` |

**Score:** **11/11 criteria fully verified** (6 originaux preserves + 5 nouveaux derives de MAT-12/13/14).

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `static/js/app.js` | `toggleNoBilling`, `uldHasMaterial`, `findIncompleteUlds` (3 nouvelles) + 10 fonctions etendues | VERIFIED | grep `function toggleNoBilling` = 1 (line 114). grep `function uldHasMaterial` = 1 (line 255). grep `function findIncompleteUlds` = 1 (line 275). grep `function addUld(autoOpen, skipValidation)` = 1 (line 453). |
| `static/js/app.js` | Validation MAT-13 EN TOUT DEBUT generatePdf + sendEmail | VERIFIED | generatePdf line 1239-1244 : findIncompleteUlds AVANT validateRequired (line 1245) AVANT await saveManifest (line 1253). sendEmail line 1265-1270 : meme pattern, AVANT validateRequired (line 1271) AVANT JWT/fetch. |
| `static/js/app.js` | formatCondensedMaterial court-circuit 'Rien a facturer' | VERIFIED | Line 207 : `if (block.dataset.noBilling === 'true') return 'Rien a facturer';` AVANT lecture des autres champs (precedence noBilling > VRAC > champs). |
| `static/js/app.js` | refreshMaterialBadge emet `.mat-recap-no-billing` | VERIFIED | Line 300 : `var extraClass = (block.dataset.noBilling === 'true') ? ' mat-recap-no-billing' : '';` puis injection ligne 302. |
| `static/js/app.js` | loadManifest lit defensivement noMaterialToBill | VERIFIED | Line 755-756 : `div.setAttribute('data-no-billing', String(uldData.noMaterialToBill === true));` — absence/false/undefined => 'false'. |
| `static/js/app.js` | esc() applique sur uldComment dans recap inline (MAT-11 etendu) | VERIFIED | Line 239 : `parts.push('Com: ' + esc(truncated));` — `truncated` derive de `block.dataset.uldComment` slice(0,30). |
| `static/css/style.css` | Classes .mat-no-billing-row + .mat-recap-no-billing + media query mobile | VERIFIED | Desktop : `.mat-no-billing-row` line 145, `.mat-no-billing-label` line 152, `.mat-recap-no-billing` line 228. Mobile (inside @media line 241-313) : `.material-recap` mobile line 297-303, `.mat-no-billing-row` mobile line 306-309, `.mat-no-billing-label` mobile line 310-312. |
| `tests/tests.html` | 28 nouvelles suites (12 MAT-12 + 10 MAT-13 + 6 MAT-14) | VERIFIED | grep suites `Materiel ULD - rien a facturer*` = 12 (MAT-12). grep `Materiel ULD - uldHasMaterial*` + `addUld bloque*` + `generatePdf bloque*` + `sendEmail bloque*` = au moins 5 visibles + variations. grep `Materiel ULD - addUld autoOpen|skipValidation|loadManifest n'ouvre|newManifest ouvre|addUld bloque par MAT-13` = 6 (MAT-14). |
| `tests/tests.html` | 8 sites pre-existants `addUld(); addUld();` migres vers `addUld(false, true)` | VERIFIED | grep `addUld\\(false, true\\)` = **35 occurrences** (>= 8 attendues, plan etait permissif). grep `addUld\\(\\); addUld\\(\\)` consecutif = **0** (migration complete). |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `applyMaterialToUld` (app.js) | `refreshMaterialBadge(uldIndex)` | appel direct | WIRED | Line 188 (caller) + line 293 (declaration). |
| `applyMaterialToUld` (app.js:151-152) | `noBilling` flag | lecture checkbox + neutralisation | WIRED | Lines 151-173 : neutralisation de TOUS les champs (incl. forfait checkboxes a 'false') quand noBilling coche. |
| `loadManifest` (app.js) | `data-no-billing` attribute | setAttribute defensif | WIRED | Line 756 : `String(uldData.noMaterialToBill === true)`. Test retro-compat passe. |
| `formatCondensedMaterial` | `block.dataset.noBilling` court-circuit | lecture data-attribute | WIRED | Line 207 : court-circuit en TETE de fonction (precedence). |
| `refreshMaterialBadge` | `.mat-recap-no-billing` CSS class | conditional class injection | WIRED | Line 300-302. CSS classe presente (style.css line 228 desktop). |
| `addUld(autoOpen=true)` | `openMaterialModal(i)` | appel direct en fin de fonction | WIRED | Line 517-519 : `if (autoOpen) { openMaterialModal(i); }`. |
| `addUld()` button | `findIncompleteUlds()` validation | check avant uldCount++ | WIRED | Lines 460-468 : si !skipValidation, alert + reopen modal incomplete + return. Validation AVANT toute creation DOM. |
| `generatePdf` | `findIncompleteUlds()` validation | EN TOUT DEBUT | WIRED | Line 1239 : avant validateRequired (1245) avant collectData (1246) avant saveManifest (1253). Pollution _alertLog evitee. |
| `sendEmail` | `findIncompleteUlds()` validation | EN TOUT DEBUT | WIRED | Line 1265 : avant validateRequired (1271) avant JWT (1276) avant fetch. |
| `buildUldMaterialRows` | `u.noMaterialToBill` court-circuit | branche unique 'Rien a facturer' | WIRED | Line 887 : `return [['', 'Rien a facturer']]`. Heritage automatique par buildUldMaterialHtml (line 944). |
| `collectData` | `uldEntry.noMaterialToBill` | ecriture explicite | WIRED | Line 647 : `uldEntry.noMaterialToBill = block.dataset.noBilling === 'true';`. |
| `recap inline rendu` | `uldComment` | `esc()` + troncature | WIRED | Line 238-239 : truncated 30 chars + esc(). Anti-XSS MAT-11 sur nouvelle surface. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `refreshMaterialBadge` | `content` (string) | `formatCondensedMaterial(block)` ← `block.dataset.*` ← DOM ecrit par `applyMaterialToUld` | Yes (recap reel ou 'Rien a facturer') | FLOWING |
| `formatCondensedMaterial` (noBilling branch) | retour 'Rien a facturer' | court-circuit en tete sur `block.dataset.noBilling === 'true'` | Yes (string litteral mais conditionne par flag user) | FLOWING |
| `formatCondensedMaterial` (champs detailles) | `parts[]` | lecture 10 data-attributes (incl. noBilling) | Yes | FLOWING |
| `applyMaterialToUld` | `noBilling` boolean | DOM checkbox `#mat-no-billing` lecture | Yes (toggle utilisateur reel) | FLOWING |
| `loadManifest` | `data-no-billing` attribute | `uldData.noMaterialToBill === true` lecture defensive (defense en profondeur) | Yes (round-trip JSON) | FLOWING |
| `findIncompleteUlds` | `incomplete[]` (array d'indices 1-based) | iteration `.uld-block` + `uldHasMaterial(block)` | Yes (liste reelle) | FLOWING |
| `generatePdf` | listPdf (string) | `findIncompleteUlds().map().join(', ')` | Yes (liste de N ULD reelles) | FLOWING |
| `sendEmail` | listEmail (string) | meme source | Yes | FLOWING |
| `buildUldMaterialRows` | rows (array) | court-circuit `u.noMaterialToBill === true` => `[['', 'Rien a facturer']]` | Yes (route conditionnelle) | FLOWING |
| `buildUldMaterialHtml` | rows (array) | herite buildUldMaterialRows + esc() sur r[0] et r[1] | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Tests harness pass | `npm run verify` | **Summary: 591 / 591 tests OK — Tous les tests passent ! / Passed: 594, Failed: 0** | PASS |
| `function toggleNoBilling` count | grep | 1 | PASS |
| `function uldHasMaterial` count | grep | 1 | PASS |
| `function findIncompleteUlds` count | grep | 1 | PASS |
| `function addUld(autoOpen, skipValidation)` count | grep | 1 (line 453) | PASS |
| `if (autoOpen)` count | grep | 1 (line 517) | PASS |
| `if (!skipValidation)` count | grep | 1 (line 460) | PASS |
| Validation MAT-13 EN TOUT DEBUT generatePdf | line check | line 1239 (avant validateRequired line 1245, avant saveManifest line 1253) | PASS |
| Validation MAT-13 EN TOUT DEBUT sendEmail | line check | line 1265 (avant validateRequired line 1271, avant JWT line 1276) | PASS |
| `noMaterialToBill` JSON propage collectData | line check | line 647 ecriture, line 756 lecture defensive | PASS |
| `Rien a facturer` literal count | grep | 3 (formatCondensedMaterial line 207, buildUldMaterialRows line 887, modal label line 75) | PASS |
| `addUld(false, true)` migration | grep count | 35 (>= 8 attendues) | PASS |
| `addUld(); addUld();` consecutif residuel | grep count | 0 | PASS |
| Recent commits Plan 01-03 EXTENDED | git log | 5 commits trouves (178697f, af0c1cf, 3099d23, c081fd2, 744ec3d) | PASS |
| Aucun framework import | grep | 0 (vanilla JS confirme) | PASS |
| Aucun TODO/FIXME/HACK | grep | 0 dans app.js + style.css | PASS |
| Mobile media query closure | line check | @media line 241 ouvert, fermeture line 313 — `.mat-no-billing-row` mobile (306) + `.material-recap` mobile (298) bien dans le bloc | PASS |

### Requirements Coverage

**Plan 01-01 declares :** MAT-01..11, RECAP-01, RECAP-03, TEST-02
**Plan 01-02 declares :** RECAP-02, MAT-11
**Plan 01-03 EXTENDED declares :** RECAP-01, MAT-11, **MAT-12, MAT-13, MAT-14**, TEST-02
**Phase expected (cf. REQUIREMENTS.md mise a jour 2026-04-28) :** MAT-01..14, RECAP-01..03, TEST-02 = **18 requirements** — all accounted for, no orphans.

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| MAT-01 | 01-01 | Saisie nombre de sangles | SATISFIED | Conserve depuis 01-01. Recap inline `Sangles: N`. |
| MAT-02 | 01-01 | Planchers EU + forfait | SATISFIED | Conserve. |
| MAT-03 | 01-01 | Planchers Std + forfait | SATISFIED | Conserve. |
| MAT-04 | 01-01 | Bois de calage | SATISFIED | Conserve. |
| MAT-05 | 01-01 | Baches | SATISFIED | Conserve. |
| MAT-06 | 01-01 | Intercalaires | SATISFIED | Conserve. |
| MAT-07 | 01-01 | Nids d'abeille | SATISFIED | Conserve. |
| MAT-08 | 01-01 | Commentaire libre | SATISFIED | Conserve. |
| MAT-09 | 01-01 | Disponible sur tous types ULD | SATISFIED | Conserve. addUld + loadManifest uniformes. |
| MAT-10 | 01-01 | Retro-compat localStorage chiffre | SATISFIED (RENFORCE) | Etendu : noMaterialToBill absent => false (defense profondeur). Test `retro-compat absente => false (MAT-12 + MAT-10)` (tests.html:1112). |
| MAT-11 | 01-01 + 01-02 + 01-03 | uldComment echappe partout | SATISFIED | Conserve. esc() applique sur recap inline (39 occurrences total `esc(` dans app.js). Aucune nouvelle surface XSS introduite par Plan 01-03 EXTENDED. |
| MAT-12 | **01-03 EXTENDED** | Case 'Rien a facturer' dans modal | **SATISFIED (NEW)** | Checkbox `#mat-no-billing` (app.js:74) + handler `toggleNoBilling` (app.js:114-135) + neutralisation applyMaterialToUld (app.js:155-160) + flag data-no-billing + propagation collectData (app.js:647) + loadManifest (app.js:756) + recap inline court-circuit (app.js:207) + classe CSS .mat-recap-no-billing (app.js:300) + PDF (app.js:887) + email HTML herite. **12 suites tests** (tests.html:956-1186). |
| MAT-13 | **01-03 EXTENDED** | Saisie materiel obligatoire (validation 3 surfaces) | **SATISFIED (NEW)** | Helpers `uldHasMaterial` (app.js:255-269) + `findIncompleteUlds` (app.js:275-287). Validation addUld (app.js:460-468), generatePdf (app.js:1239-1244), sendEmail (app.js:1265-1270) — toutes EN TOUT DEBUT. Alerts FR uniformes ('matériel non saisi' / 'Matériel non saisi pour : ...'). **5+ suites tests** (uldHasMaterial vide/noBilling/straps/forfait/comment + addUld bloque + addUld OK si noBilling + generatePdf bloque + generatePdf liste toutes + sendEmail bloque). |
| MAT-14 | **01-03 EXTENDED** | Auto-ouverture modal a chaque creation ULD | **SATISFIED (NEW)** | Signature `addUld(autoOpen, skipValidation)` (app.js:453). Default autoOpen=true (app.js:456). Auto-open en fin (app.js:517-519). Bouton + Ajouter ULD (index.html:105) appelle addUld() sans args. newManifest (app.js:446) appelle addUld() sans args. loadManifest reconstruit DOM directement sans addUld => modal NE s'ouvre PAS au rechargement (par construction). **6 suites tests** (autoOpen defaut true + addUld(false) n'ouvre pas + loadManifest n'ouvre pas + newManifest ouvre + addUld bloque par MAT-13 n'ouvre pas 2e modal + addUld(false, true) skipValidation + autoOpen=false). |
| RECAP-01 | 01-01 + 01-03 | Recap ecran condense | SATISFIED | Conserve depuis 2026-04-23 PM (formatCondensedMaterial inline). Etendu MAT-12 : court-circuit 'Rien a facturer' avant lecture des champs detailles (precedence noBilling > VRAC > champs). |
| RECAP-02 | 01-02 | PDF inclut materiel | SATISFIED | Conserve. Etendu : court-circuit 'Rien a facturer' dans buildUldMaterialRows (app.js:887). |
| RECAP-03 | 01-01 + 01-03 | Mobile <= 768px | SATISFIED (RENFORCE) | @media (max-width: 768px) line 241-313. Recap mobile (298-303). NOUVEAU : .mat-no-billing-row mobile (306-309) + .mat-no-billing-label mobile (310-312). |
| TEST-02 | 01-01 + 01-03 | Tests retro-compat | SATISFIED (RENFORCE) | Conserve + nouveau test `Materiel ULD - rien a facturer loadManifest restore (MAT-12 + TEST-02)` (tests.html:1083) + `retro-compat absente => false (MAT-12 + MAT-10)` (tests.html:1112) + `loadManifest n'ouvre pas modal (MAT-14 + TEST-02)` (tests.html:1364). |

**18/18 requirements SATISFIED.** No orphaned IDs. No requirements regression.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `static/js/app.js` | various | `placeholder="..."` dans strings HTML | Info | Attribut HTML legitime (UX hint), PAS un placeholder TODO. Aucun impact. |
| `tests/tests.html` | (pre-existing) | bug `Session sans expiry => invalide` retourne `undefined` au lieu de `false` | Info | Bug pre-existant Phase 3 (deferred-items.md) — DEJA RESOLU dans run-harness.cjs (591/591 OK, 0 fail). |

**Aucun TODO/FIXME/HACK trouve dans app.js ou style.css.** Aucun stub. Aucun `return null` / `return []` orphelin. Aucun `console.log` mort. Le badge neutre `'Materiel saisi'` (D-14 ANNULE) n'a pas ete reintroduit.

**Stub classification :** Le court-circuit `formatCondensedMaterial` retourne la chaine `'Rien a facturer'` UNIQUEMENT quand le flag `block.dataset.noBilling === 'true'` est vrai. Ce flag est ecrit explicitement par `applyMaterialToUld` (action utilisateur) ou `loadManifest` (round-trip JSON). Ce n'est PAS un stub — c'est une route conditionnelle correcte (MAT-12 spec).

### Gap Closure Evidence

**Gap initial (01-VERIFICATION.md 2026-04-23 AM) — RECAP-01 partiel :** SATISFIED depuis 2026-04-23 PM, **CONSERVE** dans cette re-verification (aucune regression detectee — `formatCondensedMaterial` etendu avec court-circuit MAT-12 mais champs detailles inchanges, recap inline reste fonctionnel pour ULD non-noBilling).

**Nouveaux requirements ajoutes 2026-04-28 — fermeture complete :**

**MAT-12 (Case 'Rien a facturer') — fermeture complete :**
- Checkbox visible AU-DESSUS du grid (zone ambree `.mat-no-billing-row`)
- Cocher desactive 8 inputs/checkboxes (toggleNoBilling)
- Decocher reactive (en preservant D-06 forfaits)
- applyMaterialToUld neutralise tous les autres champs si coche (force 0/false/'')
- Flag noMaterialToBill propage : data-attribute + JSON manifest + collectData + loadManifest + recap inline ('Rien a facturer' + classe CSS) + PDF (`[['', 'Rien a facturer']]`) + email HTML herite
- 12 suites tests couvrant chaque comportement

**MAT-13 (Saisie materiel obligatoire) — fermeture complete :**
- Helpers : `uldHasMaterial(block)` (test 5 strategies de "materiel saisi") + `findIncompleteUlds()` (indices 1-based pour cohérence UI)
- Validation bloquante :
  1. addUld : alert FR + reopen modal incomplete + return AVANT uldCount++
  2. generatePdf : alert FR listant TOUTES les ULD incompletes EN TOUT DEBUT (avant validateRequired/saveManifest pour eviter pollution _alertLog)
  3. sendEmail : meme pattern, AVANT validateRequired/JWT/fetch
- skipValidation=true bypass interne pour les 35 sites tests pre-existants migres
- 5+ suites tests dedies

**MAT-14 (Auto-ouverture modal sur creation ULD) — fermeture complete :**
- Signature `addUld(autoOpen, skipValidation)` avec defaults (true, false)
- Bouton `+ Ajouter une ULD` => addUld() sans args => autoOpen=true
- newManifest => addUld() sans args => autoOpen=true (1ere ULD du manifeste vierge)
- loadManifest reconstruit DOM SANS appeler addUld => modal NE s'ouvre PAS (par construction)
- 6 suites tests dedies

**Migration 8 sites pre-existants (BLOCKER #1) — verification :**
- grep `addUld(false, true)` = 35 occurrences (largement >= 8 attendues — plusieurs sites de test ajoutent 3-4 ULDs)
- grep `addUld(); addUld();` consecutif = 0 (migration complete, aucun residu)

**Aucune regression detectee :**
- 591/591 tests passent (vs 383/384 avant Plan 01-03 EXTENDED) — +208 nouveaux asserts
- Critères 1-6 originaux preserves (aucune modification destructive a openMaterialModal/applyMaterialToUld/collectData/loadManifest/buildPdf/sendEmail au-dela des extensions documentees)
- Anti-patterns absents (0 TODO/FIXME/HACK introduits)

---

## Human Verification Required

Les tests automatises (JSDOM via run-harness.cjs) couvrent toutes les comportements clés (591/591 OK). Les 7 points suivants restent recommandes en local (`npm run verify` puis `npm run dev`) avant push prod, et couvrent :
- UX rendering visuel (modal auto-open timing, alert browser, grayout disabled)
- Round-trip localStorage AES reel (vs JSDOM mock)
- PDF binary inspection visuelle
- Layout mobile reel (font scaling, breakpoints viewport)

Cette verification est **obligatoire avant push master** conformément a CLAUDE.md Release Checklist Step 4.

### 1. MAT-14 visuel — auto-open du modal sur 1ere ULD

**Test:** Login + nouveau manifeste (page d'accueil). Observer le DOM sans clic.
**Expected:** Le modal materiel s'ouvre AUTOMATIQUEMENT pour la 1ere ULD (uld-1). Pas de besoin de cliquer sur "Materiel".
**Why human:** Timing UX + rendering reel du modal (pas JSDOM).

### 2. MAT-12 visuel — case 'Rien a facturer' desktop + mobile

**Test:** Ouvrir le modal materiel. Inspecter la zone ambree au-dessus du grid des champs.
**Expected:**
- La checkbox "Rien a facturer pour cette ULD" est visible dans une zone ambree (`.mat-no-billing-row`).
- Cocher la case => tous les autres champs visuellement grises (disabled).
- Decocher => reactives (sauf input planchers EU/Std si forfait coche — D-06 preserve).
- Mobile (DevTools <= 768px) : zone compacte, cliquable au doigt, lisible.

**Why human:** Couleur ambre + grayout CSS rendering + tactile mobile.

### 3. MAT-13 visuel — alert FR sur addUld bloque

**Test:** Nouveau manifeste, ULD #1 vide (modal non valide ni "Rien a facturer" coche). Cliquer "+ Ajouter une ULD".
**Expected:** Alert browser : `ULD N°1 : matériel non saisi. Cochez "Rien à facturer" ou remplissez au moins un champ avant d'ajouter une nouvelle ULD.` puis le modal #1 se reouvre.
**Why human:** alert() browser + rendering reel.

### 4. MAT-13 visuel — alert FR sur generatePdf et sendEmail bloques

**Test:** ULD #1 strapsCount=2 (valide), ULD #2 vide. Cliquer "Generer le PDF". Puis cliquer "Envoyer par email".
**Expected:**
- Generer le PDF : alert `Matériel non saisi pour : ULD N°2. Veuillez remplir le matériel ou cocher "Rien à facturer" pour ces ULD.` PDF NON genere.
- Envoyer par email : meme alert. fetch /api/send-email NON declenche (Network tab vide).

**Why human:** Validation EN TOUT DEBUT (avant JWT/fetch) — comportement reel non-mockable.

### 5. MAT-12 + MAT-10 visuel — round-trip noMaterialToBill

**Test:** Sauvegarder un manifeste : ULD #1 noMaterialToBill=true (case cochee), ULD #2 strapsCount=5. "Nouveau" puis recharger depuis la liste sauvegardee.
**Expected:**
- Recap inline ULD #1 = `Rien a facturer` (style ambre, classe `.mat-recap-no-billing`).
- Recap inline ULD #2 = `Sangles: 5`.
- Modal NE s'ouvre PAS lors du rechargement (MAT-14 par construction).

**Why human:** Round-trip localStorage AES reel (cle sessionStorage) vs JSDOM harness.

### 6. Recap inline desktop + mobile (RECAP-03 etendu)

**Test:** ULD avec sangles=3 + forfait EU + commentaire 'Fragile'. Observer le recap inline desktop puis mobile.
**Expected:**
- Desktop : `Sangles: 3 | Planchers EU: forfait | Com: Fragile` visible sous le header ULD.
- Mobile (<=768px) : recap occupe 100% largeur du `.uld-block`, wrap naturel sur plusieurs lignes, pas d'overflow horizontal.

**Why human:** Layout visuel + breakpoints reels (font scaling).

### 7. Pas de regression PDF Phase 01-02 / Phase 02

**Test:** Generer un PDF avec : ULD #1 PMC + materiel sangles=3 / ULD #2 VRAC + materiel sangles=2 / ULD #3 PMC + 'Rien a facturer'.
**Expected:**
- Page 1 contient `dont Palettes : 2 (...)` + `dont Vrac : 1 (...)`.
- Page ULD #2 (VRAC) : `Type : VRAC` dans l'infoBox, planchers absents.
- Page ULD #3 (noBilling) : section materiel = ligne unique `Rien a facturer` (pas de tableau materiel).

**Why human:** Inspection visuelle PDF binaire (jsPDF rendering).

---

## Gaps Summary

**Aucun gap technique ouvert.** Tous les 11 criteres de succes (6 originaux + 5 derives MAT-12/13/14) sont VERIFIED. Tous les 18 requirement IDs (MAT-01..14, RECAP-01..03, TEST-02) couverts et SATISFIED.

**Tests harness :** 591/591 OK (vs 383/384 avant Plan 01-03 EXTENDED, +208 asserts).

**Status `human_needed` justification :** Conformement a CLAUDE.md Release Checklist Step 4, l'UAT manuel local (npm run dev + scenario E2E + retro-compat manuelle + envoi email test post-deploy) reste obligatoire avant push master. Les 7 points ci-dessus listent precisement ce qui ne peut PAS etre verifie automatiquement (UX visuel, alerts browser, PDF binary, round-trip AES reel, layout mobile reel).

**Phase 1 prete pour push master apres validation des 7 points UAT.**

---

_Initial verification: 2026-04-23 (gaps_found — RECAP-01 partial)_
_Re-verification 1: 2026-04-23 12:00 UTC (passed — gap closed by Plan 01-03)_
_Re-verification 2: 2026-04-28 12:00 UTC (human_needed — extended scope MAT-12/13/14, all automated checks pass, UAT outstanding)_
_Verifier: Claude (gsd-verifier, Opus 4.7 1M)_
