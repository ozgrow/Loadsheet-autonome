---
phase: 06-materiel-global-refactor-saisie-unique
plan: 06
subsystem: tests
tags: [tests, refactor, anti-regression, retro-compat, mat-13-global, d-47, d-48]

# Dependency graph
requires:
  - 06-01-SUMMARY.md (section #material-section + handlers globaux)
  - 06-02-SUMMARY.md (migrateLegacyMaterial helper)
  - 06-03-SUMMARY.md (collectData/loadManifest/addUld refactor data.material)
  - 06-04-SUMMARY.md (rendu PDF/email symetrique depuis data.material)
  - 06-05-SUMMARY.md (manifestHasMaterial helper + MAT-13 globalise)
provides:
  - "Suite tests entierement adaptee au modele data.material global"
  - "Couverture anti-regression Phase 6 (D-32, D-33, D-37, D-42, D-46, D-47, D-48) restauree"
  - "npm run verify : 559 tests OK (0 FAIL) — gate pre-phase-verification satisfaite"
  - "Test retro-compat D-47 explicite (chargement Phase 1 -> Phase 6 via migrateLegacyMaterial avec assertion couche chiffrement AES-256-GCM)"
  - "Test E2E lifecycle adapte saisie unique + 3 assertions D-48 (BLOCKER #1 garantie saisie unique cote rendu)"
affects:
  - "Aucun fichier production modifie — pure adaptation de la suite tests/tests.html"
  - "tests/run-harness.cjs : polyfill Element.prototype.scrollIntoView pour JSDOM (sendEmail/generatePdf scrollent vers #material-section sur blocage MAT-13)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Helper local _resetMatSection() dans tests.html pour reset propre de #material-section avant chaque suite materiel (pattern reset-then-write applique cote tests)"
    - "Stub fetch mock pour capturer le htmlBody envoye a /api/send-email (pattern Plan 04 + 05 reutilise pour D-48 a + sendEmail XSS esc())"
    - "Wrapper jsPDF.jsPDF constructor pour instrumenter doc.text et compter les appels (D-48 c pattern)"
    - "Static source inspection via sendEmail.toString().indexOf('buildUldMaterialHtml(u)') === -1 (D-48 b pattern — pas besoin d'executer pour verifier)"
    - "Anti-XSS testing : payload '<script>...<\\/script>' dans literals JS (escape obligatoire pour eviter JSDOM HTML parser sort du bloc <script>)"

key-files:
  created:
    - .planning/phases/06-materiel-global-refactor-saisie-unique/06-06-SUMMARY.md
  modified:
    - tests/tests.html (suppression ~40 suites obsoletes + adaptation 5 suites + ajout 13 nouvelles suites + adaptation E2E lifecycle)
    - tests/run-harness.cjs (polyfill scrollIntoView pour JSDOM)

key-decisions:
  - "Phase 06 P06: testDOM (tests.html ligne 38-51) augmente avec un bloc inline #material-section (12 inputs + 1 textarea) pour permettre aux nouveaux tests Phase 6 de fonctionner — sans cela manifestHasMaterial/collectData renvoient des defaults"
  - "Phase 06 P06: polyfill Element.prototype.scrollIntoView dans run-harness.cjs beforeParse — JSDOM ne l'implemente pas, sendEmail/generatePdf l'appellent sur le blocage MAT-13 (cas reproductible suites 'generatePdf bloque', 'sendEmail bloque')"
  - "Phase 06 P06: D-47 assertion couche chiffrement testee explicitement via localStorage.getItem('loadsheet_manifests').indexOf('MAN-LEGACY-TEST') < 0 (preuve AES-256-GCM actif, le manifestId ne fuit pas en clair)"
  - "Phase 06 P06: D-48 (a) email — match /<h3[^>]*>Matériel<\\/h3>/g sur captured.htmlBody = EXACTEMENT 1 match (assure saisie unique dans le rendu email, pas N+1 fois en boucle ULD)"
  - "Phase 06 P06: D-48 (b) email — assertion statique sendEmail.toString().indexOf('buildUldMaterialHtml(u)') === -1 (pas d'execution, pas de mock — pure inspection source code, robuste a tout future regression)"
  - "Phase 06 P06: D-48 (c) PDF — wrapper jsPDF.jsPDF constructor pour intercepter doc.text(str) et compter les appels avec str === 'Materiel' — fallback statique sur buildPdf.toString() si jspdf non instrumentable"
  - "Phase 06 P06: addUld(false, true) -> addUld() bulk replace 19 occurrences — addUld() est sans parametre depuis Plan 06-03 (D-36 — MAT-14 supprimee). JS ignore les args supplementaires mais le pattern obsolete vit dans le code, nettoyage cosmetique"
  - "Phase 06 P06: conservation explicite des 14 fonctions Phase 1 orphelines dans app.js (openMaterialModal, applyMaterialToUld, buildMaterialSummary, etc.) — pas de cleanup massif Plan 06-06. Risque : si les tests Phase 2 VRAC referencent indirectement ces helpers (ex: buildEmailHtmlForTest), supprimer en chaine briserait les tests sans benefice immediat. Cleanup defere a une eventuelle Phase 7 de pruning"

requirements-completed: [MAT-01, MAT-02, MAT-03, MAT-04, MAT-05, MAT-06, MAT-07, MAT-08, MAT-09, MAT-10, MAT-11, MAT-12, MAT-13, RECAP-01, RECAP-02, RECAP-03]

# Metrics
duration: 75min
completed: 2026-05-21
---

# Phase 06 Plan 06: Tests + cleanup adaptation au modele data.material — Summary

**La suite tests/tests.html est entièrement adaptée au modèle "matériel global manifeste" : suppression de ~40 suites obsolètes (modal materiel par-ULD, MAT-13 par-ULD, MAT-14 auto-open, recap inline par-ULD, helpers PDF/email deprecated), adaptation de 5 suites collectData/loadManifest/round-trip pour data.material top-level, ajout de 13 nouvelles suites Phase 6 (UI handlers section globale, validation MAT-13 globalisée, anti-XSS manifestComment, sendEmail HTML esc), adaptation de la suite E2E lifecycle avec 3 assertions D-48 garantissant la "saisie unique" côté rendu PDF + email. `npm run verify` passe avec 559 tests OK et 0 FAIL — le gate pre-phase-verification est satisfait. Cleanup des 14 fonctions Phase 1 orphelines DELIBÉREMENT NON FAIT (Claude's Discretion non-bloquant — risque de casser indirectement les tests Phase 2 VRAC qui passent via le helper buildEmailHtmlForTest, defere a une eventuelle Phase 7 pruning).**

## Performance

- **Duration:** ~75 min (5 commits atomic + verify continu)
- **Started:** 2026-05-21
- **Completed:** 2026-05-21 (en attente checkpoint Task 6 Release Checklist humaine)
- **Tasks:** 6 (5 code + 1 human-verify checkpoint final Release Checklist)
- **Files modified:** 2 (tests/tests.html, tests/run-harness.cjs)

## Accomplishments

### Task 1 — Suppression suites obsoletes (b9e8e7f)

**~40 suites supprimees, ~843 lignes :**

- **A. MAT-13 par-ULD (5 suites)** : `addUld bloque si ULD existante vide`, `addUld OK si ULD existante a noMaterialToBill`, `showGenerateSection bloque + ouvre modal sur 1ere ULD incomplete`, `generatePdf re-ouvre modal sur 1ere ULD incomplete`, `sendEmail re-ouvre modal sur 1ere ULD incomplete` (D-34 blocage MAT-13 par-ULD retire, D-35 showGenerateSection libre)
- **B. MAT-14 auto-open (6 suites)** : `addUld autoOpen defaut true ouvre modal`, `addUld(false) n'ouvre pas modal`, `loadManifest n'ouvre pas modal`, `newManifest n'ouvre PAS modal pour 1ere ULD`, `addUld bloque par MAT-13 n'ouvre pas un 2e modal`, `addUld(false, true) skipValidation + autoOpen=false` (D-36 MAT-14 entierement supprime)
- **C. Recap inline par-ULD (10 suites)** : `recap inline remplace badge neutre`, `pas de recap si tout vide`, `recap inline condense`, `recap forfait litteral`, `recap omet zeros`, `recap XSS uldComment`, `recap uldComment tronque`, `recap vide = pas de span`, `loadManifest restaure recap`, `Materiel ULD - XSS uldComment (MAT-11)` + tous les tests rien-a-facturer recap inline (RECAP-01, MAT-12 par-ULD obsoletes)
- **D. Modal/VRAC masquage planchers (7 suites)** : `Modal masque planchers si VRAC`, `Modal affiche planchers si PMC`, `Modal affiche planchers pour AKE AKN PAG`, `Persistance data-flooring-* quand toggle VRAC`, `formatCondensedMaterial exclut planchers VRAC`, `formatCondensedMaterial inclut planchers si non-VRAC`, `changeUldType declenche refreshMaterialBadge` (D-38 modal disparait + D-21 helpers orphelins)
- **E. Helpers PDF deprecated (8 suites)** : `buildMaterialSummary`, `buildMaterialSummary retro-compat sans champs`, `buildUldMaterialRows omet zeros`, `buildUldMaterialRows forfait litteral`, `buildUldMaterialRows inclut commentaire`, `formatFlooringDisplay`, `buildPdf avec materiel`, `buildPdf manifeste ancien format` (D-21 + D-41 helpers Phase 1 orphelins)
- **F. Type ULD - buildMaterialSummary VRAC variants (6 suites)** : `buildMaterialSummary exclut planchers VRAC`, `buildMaterialSummary VRAC ignore forfait planchers`, `buildMaterialSummary VRAC conserve non-planchers`, `buildUldMaterialRows exclut planchers VRAC`, `buildUldMaterialRows non-VRAC conserve planchers`, `buildUldMaterialRows retro-compat type absent` (D-20 logique migree dans migrateLegacyMaterial deja testee Plan 02)
- **G. Email HTML deprecated (4 suites)** : `Materiel email HTML - summary`, `ULD section`, `SECU XSS uldComment`, `sendEmail inclut sections materiel` (D-26..D-28 helpers Phase 1 orphelins)
- **H. Email HTML VRAC D-20 (2 suites)** : `Type ULD - email HTML totaux materiel excluent planchers VRAC`, `Type ULD - email HTML bloc ULD VRAC exclut planchers` (D-20 logique migree dans migrateLegacyMaterial)
- **I. Modal Rien a facturer par-ULD (12 suites)** : tout le bloc "rien a facturer" Phase 1 (checkbox modal, applyMaterialToUld, loadManifest restore par-ULD, retro-compat, etc.) — MAT-12 desormais cote section globale

**Adaptations Task 1 :**

- `buildEmailHtmlForTest` helper (utilise par les suites Phase 2 VRAC `email HTML scission Palettes/Vrac`, etc.) : suppression des appels `buildMaterialSummaryHtml(data.ulds)` et `buildUldMaterialHtml(u)` (helpers orphelins) — le helper de test focusse uniquement sur la scission Palettes/Vrac D-14
- `tests/run-harness.cjs` : polyfill `Element.prototype.scrollIntoView = function() {}` dans `beforeParse` (JSDOM ne l'implemente pas, requis par sendEmail/generatePdf sur blocage MAT-13)
- `tests/tests.html` testDOM : ajout d'un bloc `<section id="material-section">` inline avec 12 inputs + 1 textarea pour permettre aux nouveaux tests Phase 6 de fonctionner

### Task 2 — Adaptation suites collectData/loadManifest/round-trip (cbf9d86)

**5 suites Phase 1 (collectData / loadManifest / save-load round-trip) remplacees par 5 suites Phase 6 :**

1. `Materiel global - collectData lit #material-section dans data.material` — saisie via inputs `#mat-global-*` + verification `data.material.strapsCount` + assertions D-10 (`data.ulds[0].strapsCount === undefined`)
2. `Materiel global - collectData defaults section vide` — defauts 0/false/'' pour tous les champs material
3. `Materiel global - loadManifest retro-compat Phase 1 (D-47 + MAT-10)` — charge manifeste format Phase 1 (champs par-ULD) + assertion explicite **D-47 couche chiffrement** (`localStorage.getItem('loadsheet_manifests').indexOf('MAN-LEGACY-TEST') < 0`) + verifications sommes D-13..D-18 (sangles incl. VRAC, planchers EU VRAC exclues, forfait Std OR, concatenation 1-based comment, noBilling AND)
4. `Materiel global - loadManifest Phase 6 format idempotent (D-19)` — manifeste avec `data.material` existant : migrateLegacyMaterial retourne tel quel
5. `Materiel global - round-trip Phase 6 save/load preserve data.material` — saisie via section globale → save → reset → load → verifications data.material top-level + ULDs sans champs material

**Helper local `_resetMatSection()` ajoute** au debut des tests pour reset propre de #material-section avant chaque suite.

### Task 3 — Nouvelles suites Phase 6 (0016fba)

**13 nouvelles suites ajoutees juste apres les 8 suites Plan 02 Migration helper purs :**

UI handlers section globale (5 suites) :
- `Materiel global - UI handlers section (toggleMaterialSectionForfait)` — D-06/D-07 cocher/decocher forfait
- `Materiel global - UI handlers section (toggleMaterialSectionNoBilling)` — D-08 cocher noBilling
- `Materiel global - UI handlers section (noBilling decoche preserve forfait D-06)` — interaction forfait+noBilling
- `Materiel global - resetMaterialSection (D-37)`
- `Materiel global - newManifest reset la section (D-37)`

Validation MAT-13 globalise (6 suites + alias) :
- `Materiel global - Validation MAT-13 manifestHasMaterial (D-32, D-33)` — section vide => false
- `Materiel global - manifestHasMaterial noBilling => true`
- `Materiel global - manifestHasMaterial count > 0 => true`
- `Materiel global - manifestHasMaterial forfait coche => true`
- `Materiel global - manifestHasMaterial comment non-vide => true`
- `Materiel global - manifestHasMaterial comment whitespace => false`

Blocage generatePdf/sendEmail (2 suites) :
- `Materiel global - generatePdf bloque si section vide (MAT-13 globalise)` — verifie alert "Saisie matériel obligatoire"
- `Materiel global - sendEmail bloque si section vide (MAT-13 globalise)` — verifie alert + fetch NON appele

Anti-XSS manifestComment (2 suites) :
- `Materiel global - XSS manifestComment via section UI (MAT-11 / D-42)` — defense par construction (.value, jamais innerHTML)
- `Materiel global - sendEmail HTML esc(manifestComment)` — defense au rendu via esc() (stub fetch capture htmlBody, verifie esc applique)

**Note technique** : les literals `</script>` dans les payloads XSS doivent etre escaped `<\/script>` pour eviter que JSDOM ne sorte du bloc `<script>...</script>` de tests.html (debug session).

### Task 4 — Adaptation E2E lifecycle + 3 assertions D-48 (2d78277)

**`E2E - manifest complet lifecycle` adaptee pour Phase 6 :**

- Remplace `uld1.setAttribute('data-straps', '8')` + autres setAttribute par-ULD par **une seule saisie globale** dans `#material-section` (D-46)
- Payload XSS deplace de `uld2.setAttribute('data-uld-comment', ...)` vers `document.getElementById('mat-global-comment').value = '<script>...<\/script>'` (D-42 defense par construction)
- Assertions adaptees : `block.dataset.straps` (obsolete) → `data.material.strapsCount` (Phase 6)
- Ajout assertion D-02 : `addUld()` ne cree plus de bouton `.btn-material` sur l'ULD
- Ajout assertion D-10 : `data.ulds[0].strapsCount === undefined`

**3 assertions D-48 (warning checker BLOCKER #1) ajoutees a la fin de la suite :**

- **D-48 (a)** : `<h3>Matériel</h3>` apparait EXACTEMENT 1 fois dans `captured.htmlBody` envoye a /api/send-email (regex `/<h3[^>]*>Matériel<\/h3>/g`) — garantit saisie unique cote email. Plus bonus : XSS echappe via esc() (`captured.htmlBody.indexOf('<script>window._xss++') < 0` + `indexOf('&lt;script&gt;') >= 0`)
- **D-48 (b)** : `sendEmail.toString().indexOf('buildUldMaterialHtml(u)') === -1` — assertion statique (pas d'execution) garantit que le source code de sendEmail ne reference plus le helper deprecated
- **D-48 (c)** : wrapper `window.jspdf.jsPDF` constructor pour intercepter `doc.text(str)` et compter les appels avec `str === 'Materiel'` → EXACTEMENT 1 (section page 1, pas N+1 fois sur pages detail ULD). Fallback statique sur `buildPdf.toString().match(/doc\.text\(['"]Materiel['"]/g)` si jspdf non instrumentable.

**Bonus fix** : suite Phase 2 `Type ULD - sendEmail integration htmlBody contient scission + [VRAC] (D-14)` adaptee — remplace `setAttribute('data-no-billing', 'true')` par `#mat-global-no-billing.checked = true` (MAT-13 Phase 6 globalise lit la section globale).

### Task 5 — Final cleanup addUld(false, true) -> addUld() (717d3ea)

**19 occurrences de `addUld(false, true)` remplacees par `addUld()` :**

- suites Phase 1 (saveManifest/loadManifest, removeUld, etc.)
- suites Phase 2 VRAC (updateRecap annotation, buildPalettesVracSplit, buildPdf scission, etc.)
- suite E2E lifecycle (deja adaptee Task 4 — restait quelques addUld(false, true) en marge)

`addUld()` est sans parametre depuis Plan 06-03 (D-36 — MAT-14 supprimee). JS ignore les args supplementaires mais le pattern obsolete vivait dans le code — modification cosmetique pure (559 tests passing -> 559 tests passing, aucun changement comportemental).

### Task 6 — Checkpoint Release Checklist humaine (EN ATTENTE)

`npm run verify` passe (gate technique satisfait). Le checkpoint humain Task 6 demande a l'utilisateur d'executer le scenario E2E manuel complet dans l'app (login, creation manifeste avec materiel global, save/load round-trip, PDF, email reel) avant push master. Voir `<how-to-verify>` du PLAN 06-06.

## Task Commits

| Hash    | Task | Type | Message                                                                                          |
|---------|------|------|--------------------------------------------------------------------------------------------------|
| b9e8e7f | 1    | test | remove obsolete Materiel ULD test suites (~40 suites, 843 lignes)                                |
| cbf9d86 | 2    | test | adapt collectData/loadManifest/round-trip suites for data.material global model (5 suites)       |
| 2d78277 | 4    | test | adapt E2E lifecycle suite for Phase 6 + add D-48 saisie unique assertions                        |
| 0016fba | 3    | test | add new Materiel global UI/validation/XSS suites (13 nouvelles suites Phase 6)                   |
| 717d3ea | 5    | test | final cleanup addUld(false, true) -> addUld() across remaining Phase 2/3/4 suites (19 occurrences) |
| —       | 6    | —    | Checkpoint Release Checklist (no commit) — EN ATTENTE de validation humaine                      |

**Plan metadata commit:** a venir apres self-check (docs: complete 06-06 plan).

## Files Created/Modified

- **`tests/tests.html`** :
  - testDOM augmente avec `<section id="material-section">` (12 inputs + 1 textarea) pour permettre aux tests Phase 6 de fonctionner
  - 5 suites Materiel ULD adaptees (collectData / loadManifest / round-trip) pour data.material global model
  - ~40 suites obsoletes supprimees (modal materiel, MAT-13 par-ULD, MAT-14, recap inline par-ULD, helpers PDF/email deprecated, modal masking VRAC)
  - 13 nouvelles suites Phase 6 (UI handlers section globale, manifestHasMaterial validation, anti-XSS manifestComment, sendEmail HTML esc)
  - E2E lifecycle adaptee + 3 assertions D-48 saisie unique (BLOCKER #1)
  - Helper local `_resetMatSection()` ajoute
  - Suite Phase 2 D-14 sendEmail integration adaptee pour MAT-13 globalise
  - `buildEmailHtmlForTest` helper : appels `buildMaterialSummaryHtml(data.ulds)` + `buildUldMaterialHtml(u)` supprimes (helpers orphelins)
  - 19 occurrences `addUld(false, true)` remplacees par `addUld()`

- **`tests/run-harness.cjs`** :
  - Polyfill `window.Element.prototype.scrollIntoView = function() {}` dans `beforeParse` (JSDOM ne l'implemente pas, requis par sendEmail/generatePdf sur blocage MAT-13)

## Decisions Made

1. **testDOM augmente inline** (vs charger index.html en iframe) : KISS, evite la complexite d'un setup hierarchique. Le bloc `<section id="material-section">` mirror exact des IDs de production index.html.

2. **Polyfill scrollIntoView au lieu de stub dans app.js** : modification non-intrusive cote production. JSDOM est l'environnement test specifique ; le polyfill vit dans run-harness.cjs et n'affecte pas le code de production. Pattern symetrique a Node webcrypto + jsPDF deja en place dans beforeParse.

3. **D-47 assertion couche chiffrement explicite** (warning checker #3) : le test rétro-compat ne se contente pas de verifier la migration en memoire — il prouve aussi que `writeSavedManifests` chiffre bien le payload (AES-256-GCM) en verifiant que le manifestId ne fuit pas en clair dans `localStorage.getItem('loadsheet_manifests')`. Defense contre une future regression du chiffrement.

4. **D-48 3 assertions multi-vecteur** (BLOCKER #1) : 3 angles d'attaque pour garantir la saisie unique :
   - (a) **comportemental email** : compter les occurrences de `<h3>Matériel</h3>` dans le htmlBody capture via stub fetch — EXACTEMENT 1
   - (b) **statique email** : `sendEmail.toString()` ne contient plus `buildUldMaterialHtml(u)` — pas besoin d'executer, simple inspection source
   - (c) **comportemental PDF** : wrapper jsPDF constructor pour compter les appels `doc.text('Materiel', ...)` — EXACTEMENT 1 (avec fallback statique)
   
   Ce triplet protege contre 3 types de regression independants (rendu email N+1, refactor accidentel, rendu PDF N+1).

5. **Cleanup massif 14 fonctions orphelines NON FAIT** (Claude's Discretion non-bloquant) : les fonctions `openMaterialModal`, `closeMaterialModal`, `toggleForfait`, `toggleNoBilling`, `applyMaterialToUld`, `formatCondensedMaterial`, `uldHasMaterial`, `findIncompleteUlds`, `refreshMaterialBadge`, `buildMaterialSummary`, `formatFlooringDisplay`, `buildUldMaterialRows`, `buildMaterialSummaryHtml`, `buildUldMaterialHtml` restent definies dans app.js. **Pourquoi pas supprime** : (a) le helper `buildEmailHtmlForTest` dans tests.html appelait `buildMaterialSummaryHtml` et `buildUldMaterialHtml` pour les suites Phase 2 VRAC ; j'ai supprime ces appels (D-14 helper test focusse seulement sur scission) mais d'autres helpers Phase 1 peuvent etre indirectement utilises par des paths execution edge ; (b) le risque de regression silencieuse est non-nul pour un gain quasi-nul (code mort en memoire = quelques Ko ; pas d'impact perf utilisateur). **Defere a une eventuelle Phase 7 de pruning** apres stabilisation Phase 6 en prod.

6. **`addUld(false, true)` -> `addUld()` bulk replace** : conformance acceptance criteria stricte (`grep -c 'addUld(false' = 0`). JS ignore les args supplementaires, donc le changement est cosmetique pur — mais le pattern obsolete dans le code est un piege pour les futurs lecteurs (laisserait penser que MAT-14 existe encore).

7. **`</script>` escape dans literals JS** : decouvert lors du premier ajout de la suite XSS — JSDOM HTML parser sort du `<script>` block au premier `</script>` litteral dans une string. Pattern `<\/script>` (avec backslash devant le slash) est la solution canonique. Documente dans les commentaires de tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] Polyfill scrollIntoView pour JSDOM**
- **Found during:** Task 1 verification — apres deletion des suites obsoletes, npm run verify crashait sur les nouvelles suites generatePdf/sendEmail bloque avec `TypeError: section.scrollIntoView is not a function`
- **Issue:** JSDOM ne polyfill pas Element.prototype.scrollIntoView (introduit dans CSSOM View Module non implemente). sendEmail/generatePdf l'appellent sur le blocage MAT-13 globalise (Plan 06-05).
- **Fix:** Polyfill no-op `window.Element.prototype.scrollIntoView = function() {}` dans `tests/run-harness.cjs beforeParse`. Pattern symetrique a webcrypto + jsPDF deja en place.
- **Files modified:** tests/run-harness.cjs
- **Commit:** b9e8e7f (Task 1, bundle avec les deletions)

**2. [Rule 3 - Blocker] testDOM augmente avec #material-section pour Phase 6**
- **Found during:** Pre-Task-1 inspection — manifestHasMaterial/collectData/sendEmail referencent `document.getElementById('material-section')` qui n'existait pas dans testDOM (tests.html ligne 38-51).
- **Issue:** Sans le bloc #material-section, tous les tests Phase 6 echouent silencieusement (manifestHasMaterial retourne false, collectData renvoie defaults).
- **Fix:** Ajout d'un bloc inline `<section id="material-section">` mirror exact des IDs production index.html.
- **Files modified:** tests/tests.html
- **Commit:** b9e8e7f (Task 1, bundle avec les deletions + polyfill)

**3. [Rule 1 - Bug] `</script>` dans literals JS casse JSDOM HTML parser**
- **Found during:** Task 3 — apres ajout des nouvelles suites XSS, npm run verify crashait avec `SyntaxError: Invalid or unexpected token` et `*** TIMEOUT — dumping partial results ***`
- **Issue:** Le HTML parser de JSDOM sort du `<script>` block au premier `</script>` litteral dans une string JS — meme si la string est entre guillemets. C'est une "feature" du HTML5 spec (script content terminated by `</script>`).
- **Fix:** Escape `<\/script>` dans 3 literals (XSS payload `<script>alert("XSS")<\/script>` + `<script>alert(1)<\/script>` x2 dans le test + assertion).
- **Files modified:** tests/tests.html
- **Commit:** 0016fba (Task 3, debug session integre)

**4. [Rule 1 - Bug] Phase 2 D-14 sendEmail integration suite — adaptation MAT-13 globalise**
- **Found during:** Task 4 verification — la suite `Type ULD - sendEmail integration htmlBody contient scission + [VRAC] (D-14)` (Phase 2) faisait `setAttribute('data-no-billing', 'true')` sur les ULDs pour bypass MAT-13 par-ULD. Avec Phase 6 (MAT-13 globalise), `manifestHasMaterial()` lit `#mat-global-no-billing` et retourne false — sendEmail bloque, fetch jamais appele, test FAIL.
- **Issue:** Suite Phase 2 dependait de la semantique MAT-13 par-ULD obsolete.
- **Fix:** Remplace `setAttribute('data-no-billing', 'true')` par `document.getElementById('mat-global-no-billing').checked = true` (apres `_resetMatSection()`).
- **Files modified:** tests/tests.html
- **Commit:** 2d78277 (Task 4, dans le meme commit que l'adaptation E2E lifecycle)

**5. [Documentaire] 3 occurrences `buildUldMaterialHtml(` restantes**
- **Found during:** Task 5 final scan
- **Issue:** L'acceptance criterion `grep -c "buildUldMaterialHtml(" tests/tests.html = 0` n'est pas strictement satisfait — il reste 3 occurrences. **Mais** ces 3 occurrences sont **DELIBÉRÉES** dans la suite E2E D-48 (b) : le test vérifie justement que `sendEmail.toString().indexOf('buildUldMaterialHtml(u)') === -1`. Ce sont le commentaire de l'assertion, la string literale dans `.indexOf(...)`, et le message d'assertion.
- **Fix:** Aucun — ces 3 occurrences sont fondamentales pour D-48 (b). Le critere acceptance est trop strict, documente ici comme justification.
- **Impact:** Zero functional impact, criterion adapte de facto.

---

**Total deviations:** 5 (3 blockers auto-fixed Rule 3, 1 bug auto-fixed Rule 1, 1 doc adjustment criterion)
**Impact on plan:** Aucun — toutes les corrections etaient inline, npm run verify 559 passing 0 FAIL.

## Tests Status

- **`npm run verify`** : **559 tests passing, 0 FAIL** ✓ — gate pre-phase-verification satisfait
- **Total suites** : 99 (guard-rail positif ≥ 90 PASS) — aucun vidage accidentel
- **Suites Phase 1/2/3/4/5 non-materiel** : INTACTES (collectData, loadManifest, validateRequired, getAllLtas, updateRecap, save/load, FIFO, SECU XSS, SECU chiffrement, validation emails, etc.)
- **Suites Plan 06-02 Migration helper purs (8 suites)** : INTACTES (helper pur, isole du DOM, independant du refactor data layer)
- **Suites Phase 2 VRAC actives** : INTACTES (`buildPalettesVracSplit`, `updateRecap annotation dont Vrac`, `buildPdf page 1 scission Palettes/Vrac`, `email HTML scission Palettes/Vrac` — la logique D-20 VRAC exclusion planchers a ete migree dans `migrateLegacyMaterial` qui est deja testee Plan 02)
- **Suites Phase 4 LSTL-01..15 (Listes)** : INTACTES
- **Suites Phase 5 CLI-01..18 (Clients)** : INTACTES
- **Validation manuelle Release Checklist** : EN ATTENTE Task 6 (checkpoint humain)

## Auth Gates

None.

## Known Stubs

None. La couche tests est entièrement câblée sur le nouveau modèle data.material. Les 3 occurrences de `buildUldMaterialHtml(` restantes sont des STRING LITERALS dans l'assertion D-48 (b) — pas du code mort ni des stubs.

## Verification — Final acceptance criteria check

| Critere                                             | Attendu   | Obtenu                                                    | Status |
|-----------------------------------------------------|-----------|-----------------------------------------------------------|--------|
| `npm run verify` exit code                          | 0         | 0                                                         | PASS   |
| `npm run verify` output                             | 0 FAIL    | "Tous les tests passent !"                                | PASS   |
| `grep -c "openMaterialModal("` tests.html           | 0         | 0                                                         | PASS   |
| `grep -c "applyMaterialToUld("` tests.html          | 0         | 0                                                         | PASS   |
| `grep -c "formatCondensedMaterial("` tests.html     | 0         | 0                                                         | PASS   |
| `grep -c "buildMaterialSummary("` tests.html        | 0         | 0                                                         | PASS   |
| `grep -c "buildUldMaterialRows("` tests.html        | 0         | 0                                                         | PASS   |
| `grep -c "buildMaterialSummaryHtml("` tests.html    | 0         | 0                                                         | PASS   |
| `grep -c "buildUldMaterialHtml("` tests.html        | 0 (strict)| 3 (D-48 b string literals — adapte)                       | ADAPTÉ |
| `grep -c "uldHasMaterial("` tests.html              | 0         | 0                                                         | PASS   |
| `grep -c "findIncompleteUlds("` tests.html          | 0         | 0                                                         | PASS   |
| `grep -c "block.dataset.straps"` tests.html         | 0         | 0                                                         | PASS   |
| `grep -c "addUld(false"` tests.html                 | 0         | 0                                                         | PASS   |
| `grep -c "MAT-14"` tests.html                       | 0         | 0                                                         | PASS   |
| Total suites                                        | ≥ 90      | 99                                                        | PASS   |
| Migration helper purs (Plan 02 conserved)           | ≥ 6       | 8                                                         | PASS   |
| Validation MAT-13 globalise (nouvelle suite)        | ≥ 1       | 7 (manifestHasMaterial coverage)                          | PASS   |
| loadManifest retro-compat Phase 1 + D-47            | 1         | 2 occurrences (D-47 assertion + suite name)               | PASS   |
| D-48 assertions (BLOCKER #1)                        | ≥ 3       | 15 (a + b + c + bonus + variantes)                        | PASS   |
| Phase 2 VRAC buildPalettesVracSplit conserved       | ≥ 1       | 13 occurrences                                            | PASS   |
| Phase 4 Listes de distribution conserved            | ≥ 1       | 3 suites                                                  | PASS   |
| Phase 5 Clients - localStorage conserved            | ≥ 1       | 1 suite                                                   | PASS   |

## Next Phase Readiness

- **Phase 6 verification (`/gsd:verify-phase`)** : ready — npm run verify gate satisfait, couverture anti-regression restauree, 3 assertions D-48 explicites pour la saisie unique.
- **Phase 6 Release Checklist humaine (Task 6)** : EN ATTENTE — l'utilisateur doit executer le scenario E2E manuel complet dans l'app (login, creation manifeste, save/load, PDF, email reel) avant push master.
- **Push master** : sous reserve d'approbation Task 6 + completion du checkpoint Release Checklist.
- **Aucun blocker technique** restant.

## Self-Check: PASSED

- File `.planning/phases/06-materiel-global-refactor-saisie-unique/06-06-SUMMARY.md` exists — VERIFIED
- Commit `b9e8e7f` (Task 1: suppression suites obsoletes + polyfill + testDOM) — VERIFIED in `git log --oneline`
- Commit `cbf9d86` (Task 2: adaptation collectData/loadManifest/round-trip) — VERIFIED in `git log --oneline`
- Commit `2d78277` (Task 4: adaptation E2E lifecycle + D-48 assertions) — VERIFIED in `git log --oneline`
- Commit `0016fba` (Task 3: nouvelles suites UI/validation/XSS) — VERIFIED in `git log --oneline`
- Commit `717d3ea` (Task 5: cleanup addUld(false, true) → addUld()) — VERIFIED in `git log --oneline`
- File `tests/tests.html` contient `Materiel global - Validation MAT-13 manifestHasMaterial` — VERIFIED via grep
- File `tests/tests.html` contient `D-47: localStorage chiffré` — VERIFIED via grep
- File `tests/tests.html` contient `D-48 (a)`, `D-48 (b)`, `D-48 (c)` — VERIFIED via grep
- File `tests/tests.html` ne contient PAS `openMaterialModal(`, `applyMaterialToUld(`, `addUld(false` — VERIFIED (grep 0)
- `npm run verify` exit code 0 + "Tous les tests passent !" — VERIFIED (live test)

---
*Phase: 06-materiel-global-refactor-saisie-unique*
*Completed: 2026-05-21 (Task 1-5 atomic commits, Task 6 Release Checklist en attente validation humaine)*
