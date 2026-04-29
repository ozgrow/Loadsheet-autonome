---
phase: 04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord
plan: 02
subsystem: ui
tags: [vanilla-js, anti-xss, modal-crud, localstorage, jsdom-tests, mobile-responsive]

# Dependency graph
requires:
  - phase: 04 plan 01
    provides: "Module static/js/lists.js (CRUD wrappers + helpers + _listIds + listsSorted)"
provides:
  - "UI complete listes de distribution : bouton ≡ Listes, dropdown <select>, modal CRUD avec table+formulaire, applyListToRecipients qui remplace #recipients"
  - "Pattern modal CSS .lists-modal-* (overlay, table, form, actions, mobile full-screen 768px)"
  - "Suite de tests UI (8 tests, 19 asserts) + suite E2E lifecycle (1 test, 4 asserts) — chaine data Phase 4 isolee de sendEmail()"
affects: ["Release checklist Phase 4 (switch LISTS_API_MODE='remote' + STORAGE_CONNECTION_STRING)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Modal CRUD vanilla JS reutilise pattern .material-modal-* avec prefixe distinct .lists-modal-*"
    - "Anti-XSS strict : _listIds[idx] dans onclick (pattern _savedIds), esc()/_listsEsc() partout en innerHTML, textarea via .value, option dropdown via textContent"
    - "DOMContentLoaded + setTimeout 0 pour init refreshListsDropdown (W-3 race tolerant si getJwt pas encore initialise en mode remote)"
    - "Tests E2E chaine data isolee : stub fetch direct vers /api/send-email (PAS sendEmail() complet) — evite couplage avec invariants Phase 1/2"
    - "Pattern try/finally pour restauration window.fetch + window.confirm (W-2 garantit no-leak entre suites)"

key-files:
  created:
    - ".planning/phases/04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord/04-02-SUMMARY.md"
  modified:
    - "index.html (bouton ≡ Listes + <select id=lists-dropdown> dans .recipients-row entre #recipients et #cc + <script src=/static/js/lists.js> avant app.js)"
    - "static/css/style.css (+62 lignes : .recipients-row + .lists-modal-* + media query 768px full-screen mobile)"
    - "static/js/lists.js (+218 lignes : 9 fonctions UI handlers + _listsEsc fallback + DOMContentLoaded hook)"
    - "tests/tests.html (+200 lignes : suite Listes-UI U1..U8 + suite E2E lifecycle E1)"

key-decisions:
  - "D-04 applique : bouton '≡ Listes' a droite de #recipients dans #generateSection"
  - "D-05 applique : prefixe CSS strict .lists-modal-* (pas de modification de .material-modal-*)"
  - "D-06 applique : modal contient table CRUD + formulaire inline (input name + textarea recipients)"
  - "D-07 applique : largeur ~600px desktop (cohérent .material-modal)"
  - "D-08 applique : dropdown trie alphabetiquement via listsSorted (localeCompare 'fr')"
  - "D-09 applique : applyListToRecipients REMPLACE intégralement #recipients.value (pas concat)"
  - "D-10 applique : #cc reste manuel (pas affecte par la selection)"
  - "D-11 applique : refreshListsDropdown appele apres chaque CRUD (Submit + Delete)"
  - "D-13 applique : alert(message) + textarea.focus() en cas d'erreur validation"
  - "D-20 applique : confirm() natif pour suppression (pattern deleteSavedManifest)"
  - "D-22 applique : esc() partout en innerHTML pour name + recipients (anti-XSS strict)"
  - "D-28 applique : modal full-screen mobile via media query 768px + .recipients-row stack vertical"
  - "Test E1 E2E lifecycle : chaine data Phase 4 SEULEMENT (PAS sendEmail() complet, invariants Phase 1/2 hors scope LST-15) — stub fetch direct vers /api/send-email"
  - "_listsEsc() fallback inline si esc() pas dispo (defensive — important car DOMContentLoaded peut firer avant app.js init dans certains contextes)"
  - "U4 / U5 XSS payloads : split 'scr'+'ipt' et '<\\/textarea>' pour eviter que les literals <script> / </textarea> ferment le bloc <script> de tests.html prematurement (pitfall HTML-in-script)"

patterns-established:
  - "Pattern D : modal CRUD copie .material-modal-* avec prefixe distinct (reutilisation visuelle, isolation comportementale)"
  - "Pattern E : test E2E chaine data isolee (skip sendEmail() complet, stub fetch direct) pour eviter couplage transversal avec invariants d'autres phases"

requirements-completed: ["LST-05", "LST-06", "LST-11", "LST-13", "LST-15"]

# Metrics
duration: 5min30s
completed: 2026-04-29
---

# Phase 04 Plan 02: Listes de distribution — UI integration Summary

**Modal CRUD vanilla JS + dropdown <select> dans #generateSection + applyListToRecipients qui remplace #recipients + 23 nouveaux tests (UI U1..U8 + E2E lifecycle E1) — feature complete en mode dev localStorage, prete pour Release checklist Phase 4 (switch 'remote').**

## Performance

- **Duration:** ~5 min 30s (330s)
- **Started:** 2026-04-29T07:07:58Z
- **Completed:** 2026-04-29T07:13:28Z
- **Tasks:** 2 (Task 1 HTML+CSS, Task 2 JS handlers + tests)
- **Files modified:** 4 (1 nouveau SUMMARY + 4 modifies dans le code source)

## Accomplishments

- **UI complete** : bouton '≡ Listes' + dropdown `<select>` dans `.recipients-row` (flex desktop, stack mobile) entre #recipients et #cc. Click bouton → modal CRUD `.lists-modal-overlay` avec en-tete + table + bouton '+ Nouvelle liste' + zone formulaire inline. Mobile full-screen via media query 768px.
- **9 fonctions UI handlers** ajoutees a `static/js/lists.js` (218 lignes nouvelles, total 377) :
  - `openListsModal` / `closeListsModal` / `renderListsTable`
  - `_renderListsForm` / `_listsCloseForm` / `listsOpenCreate` / `listsOpenEdit`
  - `listsSubmitForm` (try/catch alert + focus textarea, D-13)
  - `listsConfirmDelete` (confirm natif, D-20)
  - `applyListToRecipients` (remplace #recipients.value, D-09)
  - `refreshListsDropdown` (textContent anti-XSS, sync post-CRUD D-11)
- **Anti-XSS strict (LST-11)** : `_listIds[idx]` dans tous les onclick (jamais string utilisateur), `_listsEsc()` partout en innerHTML (avec fallback inline si esc() pas charge), textarea via `.value`, option dropdown via `textContent` (esc natif).
- **23 nouveaux tests** (baseline 630 → 653) :
  - **Suite 'Listes de distribution - UI'** (U1..U8, 19 asserts) : applyListToRecipients remplace #recipients ; confirm() rejected vs accepted ; XSS sur name (script tag echappe) ; XSS sur recipients (textarea.value brut, pas de DOM injection) ; tri alphabetique francais (Cargolux < Élite < Étoile) ; openListsModal/closeListsModal create/remove overlay ; refreshListsDropdown synchronise post-CRUD (D-11).
  - **Suite 'Listes de distribution - E2E lifecycle'** (E1, 4 asserts) : chaine data Phase 4 — listsCreate -> applyListToRecipients -> #recipients pre-rempli -> fetch /api/send-email stubbe direct -> fetchBody.recipients === recipients de la liste. Pattern try/finally pour restauration `window.fetch` (W-2).
- **CSS scope strict** : nouveau bloc `.lists-modal-*` + `.recipients-row` (62 lignes ajoutees), classes `.material-modal-*` existantes intactes. Media query 768px etendue (modal full-screen + stack vertical .recipients-row).
- **Anti-régression complete** : 0 modification de `static/js/app.js`, `api/send-email/`, `api/login/`, `staticwebapp.config.json`. Suites Phase 1/2/3 + 04-01 localStorage stub restent vertes (630 -> 653 = +23 PASS, 0 FAIL).
- **Switch dev confirme** : `LISTS_API_MODE === 'localStorage'` (le switch vers `'remote'` est l'etape 1 de la Release checklist Phase 4).

## Task Commits

Each task committed atomically:

1. **Task 1: HTML + CSS — bouton, dropdown, modal CRUD avec responsive 768px** — `7cf4af2` (feat)
2. **Task 2: JS UI handlers + tests UI + E2E lifecycle** — `6a16aa4` (feat)

**Plan metadata commit:** (final commit a venir avec STATE.md + ROADMAP.md + REQUIREMENTS.md update + ce fichier SUMMARY.md)

## Files Created/Modified

### Created (1)
- `.planning/phases/04-.../04-02-SUMMARY.md` (ce fichier)

### Modified (4)
- `index.html` — section #generateSection : `<div class="recipients-row">` autour de #recipients + nouveau `<select id="lists-dropdown">` + `<button id="lists-btn">≡ Listes</button>` ; ajout `<script src="/static/js/lists.js">` AVANT app.js (cohérent harness 04-01)
- `static/css/style.css` (+62 lignes) — bloc `/* LISTES DE DISTRIBUTION — Phase 4 */` apres `.material-modal-actions` : `.recipients-row` + `.lists-modal-overlay`/`.lists-modal`/`.lists-modal-header`/`.lists-modal-table`/`.lists-modal-empty`/`.lists-modal-form`/`.lists-modal-actions` ; section media query 768px etendue avec full-screen mobile + recipients-row stacked
- `static/js/lists.js` (+218 lignes) — section `// UI HANDLERS — Phase 4 plan 04-02` apres `listsSorted` : 11 fonctions/blocs (`_listsEsc`, `closeListsModal`, `openListsModal`, `renderListsTable`, `_renderListsForm`, `_listsCloseForm`, `listsOpenCreate`, `listsOpenEdit`, `listsSubmitForm`, `listsConfirmDelete`, `applyListToRecipients`, `refreshListsDropdown`, hook DOMContentLoaded)
- `tests/tests.html` (+200 lignes) — apres suite "Listes de distribution - localStorage stub" : suites "Listes de distribution - UI" (U1..U8) + "Listes de distribution - E2E lifecycle" (E1)

## Decisions Made

Aucune decision nouvelle au-dela de ce qui etait deja decide dans `04-CONTEXT.md` (D-01..D-29). Toutes les decisions UI ont ete implementees telles quelles. Quelques choix d'implementation dans la zone "Claude's Discretion" :

- **Bouton label** : "≡ Listes" (icone hamburger U+2261 + texte court) — cohérent avec D-04 / pattern btn-secondary btn-sm
- **Aperçu troncature** : 30 chars + "…" (U+2026) — cohérent avec uldComment recap Phase 1
- **Default option dropdown** : "— Choisir une liste —" (em-dashes pour distinguer visuellement)
- **`_listsEsc()` fallback inline** : si `esc()` n'est pas encore defini (cas tests harness ou DOMContentLoaded avant app.js), un fallback identique inline est utilise. Coût : ~5 lignes ; bénéfice : module lists.js robuste au load order.
- **Hook init** : `document.addEventListener('DOMContentLoaded', ...)` + `setTimeout(refreshListsDropdown, 0)` — pas de modification de `app.js` (W-3 acceptable : `_remoteGet` throw catch silent dans `refreshListsDropdown`, refresh modal au open garantit le re-fetch dispose du JWT).
- **Tests U4 / U5 XSS payloads** : split string `'scr' + 'ipt'` et escape `'<\\/textarea>'` pour contourner le pitfall HTML-in-script (le parser HTML voit le literal `</script>` ou `</textarea>` et ferme le bloc — pattern projet existant ligne 2233, 2273).

## Deviations from Plan

**None — plan executed exactly as written.**

Aucune deviation Rule 1/2/3 (aucun bug a fixer, aucun missing critical, aucun blocker). Les seuls ajustements sont dans la zone "Claude's Discretion" (deja explicitement permise par le plan).

## Issues Encountered

**Aucun blocker.**

**Note technique mineure (pitfall HTML-in-script)** : le premier essai de payload XSS U4 utilisait `'<script>window._xss=1</script>XSS'` litteral. Le parser HTML de tests.html a ferme le bloc `<script>` au premier `</script>` rencontre dans la string, causant une erreur de syntaxe JS et un timeout du harness. Fix immediat (1 ligne par payload) : split `'<scr' + 'ipt>...<\\/scr' + 'ipt>'` (pattern projet existant a tests.html:2233, 2273, 2733, 2807, 2826). U5 idem pour `</textarea>`. Couvre LST-11 strictement et le test passe.

## User Setup Required (post-deploy uniquement, Release checklist Phase 4)

**A executer AVANT push final master :**

1. **Switcher `LISTS_API_MODE = 'remote'`** dans `static/js/lists.js` (constante en haut de fichier, commentaire bloquant `AVANT PUSH PROD` deja present)
2. **Configurer `STORAGE_CONNECTION_STRING`** dans Azure SWA → Settings → Environment variables (depuis Storage Account → Access keys → Connection string)
3. **Creer Storage Account `loadsheetautonome`** + container prive `loadsheet-data` (cf. 04-01-SUMMARY §User Setup Required pour details)
4. **`npm run verify`** → 0 FAIL (baseline 653/653)
5. **Test E2E manuel post-deploy multi-postes** : creer une liste sur PC A, verifier qu'elle apparait sur PC B
6. **Test E2E manuel envoi email** : creer manifeste + selectionner une liste via dropdown + sendEmail → email arrive avec destinataires de la liste

## Next Phase Readiness

**Phase 4 features completes en mode dev** — feature operable end-to-end localement (modal CRUD + dropdown + applyListToRecipients + persistance localStorage). Prochaine action = Release checklist Phase 4 ci-dessus, hors scope de ce plan.

**Tests baseline:** 630/630 → 653/653 (anti-regression Phase 1/2/3 + 04-01 confirmee, 0 FAIL).

**Phase requirements Phase 4 — couverture complete** :
- LST-01..04, LST-07..10, LST-12, LST-14 : Plan 04-01 (backend + module CRUD)
- LST-02, LST-05, LST-06, LST-11, LST-13, LST-15 : Plan 04-02 (UI + tests UI + E2E)
- **15 / 15 LST-* requirements completed** au commit final de ce plan

---

## Self-Check: PASSED

Verification automatique des claims (executee 2026-04-29) :

**Files modified (FOUND):**
- `index.html` — FOUND (contains `lists-btn`, `lists-dropdown`, `lists.js` script tag avant app.js)
- `static/css/style.css` — FOUND (contains `.lists-modal-overlay`, `.lists-modal-form`, `.recipients-row`, media query 768px)
- `static/js/lists.js` — FOUND (contains `openListsModal`, `applyListToRecipients`, `refreshListsDropdown`, `_listIds[`, `DOMContentLoaded`)
- `tests/tests.html` — FOUND (contains `Listes de distribution - UI`, `Listes de distribution - E2E lifecycle`)

**Commits exist:**
- `7cf4af2` (Task 1) — FOUND in `git log`
- `6a16aa4` (Task 2) — FOUND in `git log`

**Tests execution:**
- `npm run verify` → `Summary: 653 / 653 tests OK — Tous les tests passent !` (FOUND in stdout)
- 0 FAIL — confirmed
- 23 new tests vs baseline 630 — confirmed (630 → 653 = +23 ; ≥ +8 required by plan)

**Anti-regression:**
- `git diff --name-only 00386a7..HEAD -- static/js/app.js` → empty (FOUND : aucune modif depuis pre-plan 04-02)
- `git diff --name-only 00386a7..HEAD -- api/send-email/` → empty (FOUND)
- `git diff --name-only 00386a7..HEAD -- api/login/` → empty (FOUND)
- `git diff --name-only 00386a7..HEAD -- staticwebapp.config.json` → empty (FOUND)

**Anti-leak Phase 1/2 dans lists.js:**
- `grep -cE "(VRAC|sangles|planchers|mat-no-billing|uldComment)" static/js/lists.js` → 0 (FOUND : commentaire `uldComment` retire et remplace par "Anti-XSS pattern")

**CSS scope strict:**
- `grep -c "\.lists-modal" static/css/style.css` → ≥ 19 (FOUND, nouvelles classes ajoutees)
- `grep -c "\.material-modal" static/css/style.css` → 17 (FOUND, classes Phase 1 intactes)
- `git diff 7cf4af2~1 -- static/css/style.css | grep -E "^-.*\.material-modal"` → empty (FOUND : aucune ligne `.material-modal-` supprimee)

**Switch dev d'abord:**
- `grep -c "LISTS_API_MODE = 'remote'" static/js/lists.js` → 0 (FOUND : NE PAS basculer maintenant, item Release checklist Phase 4)
- `grep -c "LISTS_API_MODE = 'localStorage'" static/js/lists.js` → 1 (FOUND, ligne 11)

**W-1 anti-régression `_alertLog.length = 0`:**
- `grep -c "_alertLog\\.length = 0" tests/tests.html` → 6 (FOUND : 6 occurrences existantes Phase 1/2 lignes 1243, 1264, 1282, 1308, 1329, 1408 — INTACTES, aucune nouvelle ajoutee par U1..U8 + E1)

**W-2 try/finally restauration:**
- `grep -c "finally" tests/tests.html` → 8 (FOUND : restauration window.confirm en U2 + window.fetch en E1)

**E2E LST-15 chaine data Phase 4 (PAS sendEmail() complet):**
- `grep -c "/api/send-email" tests/tests.html` → 4 (FOUND : stub fetch direct vers /api/send-email dans E1)
- `grep -c "window.fetch = function" tests/tests.html` → 2 (FOUND : stub fetch existant ligne ~2284 + nouveau E1)
- E1 n'appelle PAS `sendEmail()` directement (verifie a la lecture du test)

---

*Phase: 04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord*
*Plan: 02*
*Completed: 2026-04-29*
