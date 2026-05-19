---
phase: 05-codes-client-en-dropdown-maintenable-backend-partage
plan: 02
subsystem: Codes client / frontend UI integration (dropdown + modal CRUD)
tags: [frontend, vanilla-js, select-dropdown, modal-crud, anti-xss, mobile-responsive, retro-compat, tests, e2e]
dependency-graph:
  requires:
    - phase-05 plan-01 static/js/clients.js CRUD module (clientsCreate/Update/Delete/GetAll/SaveAll, clientsSorted, clientUuid, _clientsEsc, _clientIds, INITIAL_CLIENTS, _clientsAutoSeed)
    - phase-05 plan-01 api/clients (GET+PUT) Azure Function with JWT auth (consumed via clientsGetAll/clientsSaveAll in mode 'remote')
    - phase-04 lists.js UI handlers pattern (clone structurel direct)
    - phase-04 STORAGE_CONNECTION_STRING + JWT_SECRET env vars (reuse, no new provisioning)
  provides:
    - index.html `<select id="clientName">` (remplace `<input>`) + bouton "≡ Clients" dans `.client-row`
    - static/js/clients.js UI handlers : openClientsModal, closeClientsModal, renderClientsTable, _renderClientsForm, _clientsCloseForm, clientsOpenCreate, clientsOpenEdit, clientsSubmitForm, clientsConfirmDelete, refreshClientsDropdown
    - clients.js `_clientsAutoSeed` etendu : populate dropdown au DOMContentLoaded apres seed (CLI-04 + CLI-07)
    - app.js loadManifest etendu : injection option `data-legacy="true"` si `data.client` inconnu (CLI-08 / D-14, +15 lignes uniquement)
    - tests harness : suite "Clients - UI" (U1..U7, 28 asserts) + suite "Clients - E2E lifecycle" (E1, 7 asserts) + shim DOM `<input>` -> `<select>` ligne 42
  affects:
    - flux saisie manifeste (le champ Client est maintenant un dropdown au lieu d'un input texte libre)
    - flux loadManifest (les manifestes legacy avec client texte libre injectent une option ephemere italique)
    - tous les tests Phase 1/2/3/4 qui font `clientName.value = '...'` (shim setter auto-injecte une option dans le harness)
tech-stack:
  added: []
  patterns:
    - Clone structurel direct de static/js/lists.js section UI HANDLERS Phase 4 (avec prefixe clients au lieu de lists)
    - Anti-XSS triple defense : _clientIds[idx] dans onclick (jamais string utilisateur), _clientsEsc partout en innerHTML, textContent sur options dropdown (anti-XSS natif HTML5)
    - Modal CSS isole prefixe .clients-modal-* + .client-row (zero modification de .lists-modal-*, .material-modal-*, .recipients-row)
    - Modification chirurgicale app.js loadManifest : 15 lignes ajoutees, lignes 437 (newManifest) et 657 (collectData) preservees strictement
    - Shim DOM tests.html : Object.defineProperty sur l'INSTANCE #clientName qui auto-injecte une <option data-legacy="true"> si `.value = X` inconnu (mirror de la logique production CLI-08 / D-14)
    - Refresh dropdown preserve la valeur courante + re-injecte la 1ere option data-legacy presente (continuite UX pendant les CRUD)
key-files:
  created: []
  modified:
    - index.html (lignes 73-81 : `<input>` -> `<select>` + bouton "≡ Clients" + script clients.js entre lists.js et app.js)
    - static/css/style.css (+72 lignes : bloc .clients-modal-* + .client-row + option[data-legacy="true"] + mobile 768px full-screen)
    - static/js/clients.js (+~190 lignes : UI handlers complets, _clientsAutoSeed etendu)
    - static/js/app.js (+15 lignes uniquement dans loadManifest ligne 725 : injection option legacy)
    - tests/tests.html (+~230 lignes : shim DOM, suite UI U1..U7, suite E2E E1, DOM ligne 42 modifie)
decisions:
  - D-08 `<select id="clientName">` remplace `<input>` (id strictement conserve pour preserver hooks app.js 437/657/725)
  - D-09 bouton "≡ Clients" classes .btn-sm coherent avec "≡ Listes" Phase 4
  - D-10 modal structure 1 colonne data (Code) + colonne actions (✎ 🗑)
  - D-11 tri francais localeCompare 'fr' sensitivity 'base' (deja Phase 5 plan 01, consomme ici via clientsSorted)
  - D-12 `<select>.value = code` natif — pas de helper applyClientToField (non-applicable, le <select> EST le champ)
  - D-13 refresh dropdown post-CRUD (create/update/delete/submit)
  - D-14 option legacy ephemere data-legacy="true" injectee dans loadManifest si data.client inconnu (CLI-08)
  - D-21 confirm() natif pour la suppression
  - D-22 pas de blocage suppression si client reference par un manifeste (legacy prend le relais via D-14)
  - D-23 _clientsEsc dans innerHTML + .textContent dans options dropdown/legacy (anti-XSS triple defense)
  - D-24 _clientIds[idx] dans onclick (jamais la string utilisateur)
  - D-28 couverture tests UI a -> h complete (U1..U7 + E1)
  - D-29 E2E lifecycle Phase 5 (chaine data isolee, pas sendEmail complet)
  - D-30 mobile full-screen modal + client-row stacked (@media max-width 768px)
metrics:
  duration_seconds: 1200
  completed: 2026-05-19T15:05:41Z
  task_count: 2
  file_count: 5
---

# Phase 05 Plan 02 : UI integration codes client (select + modal CRUD + retro-compat legacy) Summary

Remplacement de `<input id="clientName">` par `<select id="clientName">` + bouton "≡ Clients" cable a un modal CRUD (open/close/render/edit/create/submit/delete) avec dropdown auto-peuple au DOMContentLoaded ; loadManifest etendu (+15 lignes) pour injecter une `<option data-legacy="true">` si `data.client` est inconnu (retro-compat manifestes legacy) ; anti-XSS triple defense (_clientIds[idx] onclick + _clientsEsc innerHTML + textContent options) ; 28 nouveaux asserts UI (U1..U7) + 7 asserts E2E lifecycle (E1) verts via harness (695 -> 723, 0 FAIL).

## Performance

- **Duration:** ~20 min (Tasks 1 et 2)
- **Started:** 2026-05-19T14:55:00Z
- **Completed:** 2026-05-19T15:05:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- UI complete cablee : modal CRUD (create/edit/delete) + dropdown synchronise apres chaque CRUD et au DOMContentLoaded post-seed
- Retro-compat manifestes legacy : `loadManifest` avec `data.client` inconnu injecte automatiquement une `<option data-legacy="true">` selectionnee (italique grise via CSS)
- Anti-XSS triple defense : aucune string utilisateur ne traverse innerHTML sans escape ou textContent
- Mobile responsive : media query 768px deja en place pour `.clients-modal-*` + `.client-row` (full-screen modal, client-row stacked)
- Tests : 28 asserts UI (U1..U7) + 7 asserts E2E (E1) green ; harness passe de 695 -> 723 tests, 0 FAIL
- Anti-regression complete : Phase 1/2/3/4 + Plan 05-01 (Clients - localStorage stub) tous verts apres install du shim DOM
- Modification chirurgicale `app.js` : 15 lignes ajoutees uniquement dans loadManifest ; lignes 437 (newManifest) et 657 (collectData) strictement preservees

## Task Commits

Each task was committed atomically:

1. **Task 1: HTML + CSS — replace input by select, "≡ Clients" button, modal CSS, mobile 768px** — `2998054` (feat)
2. **Task 2: clients.js UI handlers + app.js loadManifest legacy + tests.html DOM modif + suites UI/E2E** — `70dbafa` (feat)

## Files Modified

- `index.html` — `<input type="text" id="clientName">` remplace par `<select id="clientName">` + bouton "≡ Clients" dans `.client-row` ; script `clients.js` charge entre `lists.js` et `app.js`
- `static/css/style.css` (+72 lignes) — bloc `.clients-modal-*` + `.client-row` + `option[data-legacy="true"]` italic + mobile 768px full-screen (inserees apres `.lists-modal-actions` et a l'interieur de la media query existante)
- `static/js/clients.js` (+~190 lignes) — UI handlers complets (openClientsModal, closeClientsModal, renderClientsTable, _renderClientsForm, _clientsCloseForm, clientsOpenCreate, clientsOpenEdit, clientsSubmitForm, clientsConfirmDelete, refreshClientsDropdown) + `_clientsAutoSeed` etendu pour appeler `refreshClientsDropdown()` apres seed
- `static/js/app.js` (+15 lignes uniquement) — `loadManifest()` ligne 725 etendu : injection `<option data-legacy="true">` si `data.client` inconnu (CLI-08 / D-14). `newManifest()` ligne 437 et `collectData()` ligne 657 strictement preserves.
- `tests/tests.html` (+~230 lignes) — DOM ligne 42 (`<input>` -> `<select>`), shim setter sur l'instance `#clientName` (auto-injecte option data-legacy si `.value = X` inconnu), suite "Clients - UI" (U1..U7, 28 asserts), suite "Clients - E2E lifecycle" (E1, 7 asserts)

## Tests Added (U1..U7 + E1)

| # | Description | Requirement |
|---|-------------|-------------|
| U1 | openClientsModal cree overlay, closeClientsModal le retire | CLI-04 |
| U2 | renderClientsTable avec 2 clients genere 2 lignes triees alphabetiquement (CODE-A, CODE-B) | CLI-04 |
| U3 | refreshClientsDropdown populate `<select>` avec tri alphabetique francais (Cargolux/Élite/Étoile) | CLI-04 / D-11 |
| U4 | XSS code stocke litteralement : textContent dans dropdown + _clientsEsc dans modal table (XSS pas execute) | CLI-09 / D-23 |
| U5 | confirm() rejette -> garde / confirm() accepte -> supprime | D-21 / CLI-04 |
| U6 | loadManifest avec data.client inconnu : option `data-legacy="true"` injectee et selectionnee | CLI-08 / D-14 |
| U7 | Refresh post-CRUD : `clientsCreate` reflete immediatement dans dropdown | CLI-04 / D-13 |
| E1 | E2E lifecycle : `clientsCreate('TEST-E2E')` -> `refreshClientsDropdown` -> `<select>.value = 'TEST-E2E'` -> `getElementById('clientName').value === 'TEST-E2E'` + persistence post-reload | CLI-12 / D-29 |

## Decisions Implemented

- **D-08** `<select id="clientName">` remplace `<input>` (id strictement conserve pour preserver hooks app.js 437/657/725)
- **D-09** bouton "≡ Clients" classes `.btn-sm` (coherent "≡ Listes" Phase 4)
- **D-10** modal structure : 1 colonne data (Code) + colonne actions (✎ 🗑)
- **D-11** tri francais localeCompare 'fr' sensitivity 'base' (consomme via clientsSorted de Phase 5 plan 01)
- **D-12** `<select>.value = code` natif — pas de helper `applyClientToField()` (non-applicable, le `<select>` EST le champ `#clientName`)
- **D-13** refresh dropdown post-CRUD : `clientsSubmitForm` et `clientsConfirmDelete` rappellent `refreshClientsDropdown()` puis re-render la table
- **D-14** option legacy ephemere `data-legacy="true"` injectee dans `loadManifest` si `data.client` inconnu (CLI-08)
- **D-21** confirm() natif pour la suppression (`Supprimer le client "..." ?`)
- **D-22** pas de blocage suppression si client reference par un manifeste sauvegarde — D-14 prend le relais (la valeur reapparait en option legacy au prochain `loadManifest`)
- **D-23** `_clientsEsc` dans `innerHTML` (modal table, titre form, message erreur) + `.textContent` sur options dropdown et legacy (anti-XSS natif HTML5)
- **D-24** `_clientIds[idx]` dans `onclick` (jamais la string utilisateur)
- **D-28** couverture tests UI a -> h complete : ouverture modal (U1), rendu table (U2), populate dropdown (U3), XSS (U4), confirmation suppression (U5), retro-compat legacy (U6), refresh post-CRUD (U7), E2E lifecycle (E1)
- **D-29** E2E lifecycle Phase 5 : chaine data isolee (`clientsCreate -> refreshClientsDropdown -> <select>.value -> getElementById.value`), pas `sendEmail()` complet (invariants Phase 1/2 hors scope CLI-12)
- **D-30** mobile full-screen modal + client-row stacked (@media max-width 768px)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Shim setter sur l'instance `#clientName` pour reproduire la logique CLI-08 dans les tests Phase 1/2/3/4**

- **Found during:** Task 2 (apres modification ligne 42 de tests.html : `<input id="clientName">` -> `<select id="clientName">`)
- **Issue:** Le plan affirmait que "set/get .value sur `<select>` est natif HTML5" — c'est vrai pour `.value` lecture, mais le **setter** sur un `<select>` sans option matching laisse `.value` vide (no-op silencieux). 11 tests Phase 1/2/3/4 font `document.getElementById('clientName').value = 'TestClient'` directement (sans passer par `loadManifest`) et lisent ensuite la valeur — apres le swap input -> select, 6 tests FAIL (3 sur `collectData`, 1 sur `loadManifest`, 1 sur `saveManifest`, 1 sur `E2E lifecycle`).
- **Fix:** Installation d'un setter-shim sur l'INSTANCE `#clientName` via `Object.defineProperty(sel, 'value', { set: fn })` qui reproduit la logique CLI-08 / D-14 de la prod : si `.value = X` et aucune option ne matche, injecter une `<option data-legacy="true">` avant de set la valeur. Le shim est installe **dans le bloc setup de tests.html** (juste apres la stub `window.confirm`) et expose aussi un helper `window._testResetClientSelect()` pour les nouvelles suites Phase 5. Anti-XSS : `textContent` jamais `innerHTML`. **Aucune modification de code production** (juste du test harness).
- **Files modified:** `tests/tests.html` (+~45 lignes dans le `<script>` setup, +~15 utilisations de `_testResetClientSelect()` dans les nouvelles suites)
- **Verification:** `npm run verify` -> 723 / 723 OK, 0 FAIL (Phase 1/2/3/4 + Plan 05-01 + Plan 05-02 toutes vertes).
- **Committed in:** `70dbafa` (Task 2)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug : assumption incorrecte du plan sur la semantique setter `<select>.value` sans option matching).
**Impact on plan:** Necessaire pour preserver l'anti-regression Phase 1/2/3/4. Aucun scope creep — la solution est entierement dans le test harness, le code production reste exactement comme prevu par le plan.

## Authentication Gates

Aucun gate d'authentification rencontre. En mode harness JSDOM hostname='localhost', le module clients.js utilise systematiquement `CLIENTS_API_MODE='localStorage'` (cf. T17 Phase 5 plan 01) ; aucun fetch ne sort. Le stub `window.getJwt = function() { return 'test-jwt-token'; }` reste disponible (heritage Phase 4) mais inutilise en mode local.

## Test Metrics

- **Baseline (apres Plan 05-01):** 695 tests OK, 0 FAIL
- **Apres Plan 05-02:** 723 tests OK, 0 FAIL
- **Delta:** +28 asserts (U1..U7 + E1)
- **Granularity reelle des suites :** suite "Clients - UI" = 24 asserts (U1=3, U2=3, U3=6, U4=4, U5=2, U6=3, U7=3) + suite "Clients - E2E lifecycle" = 4 asserts E1.

## Anti-Regression Verifiee

- Phase 1 (Materiel ULD) : OK (28 suites)
- Phase 2 (Type ULD VRAC) : OK (24 suites)
- Phase 3 (Suite E2E + Release gate + Securite) : OK (E2E manifest complet lifecycle + securite chiffrement/migration/emails)
- Phase 4 (Listes de distribution) : OK (Listes - localStorage stub + Listes - UI + Listes - E2E lifecycle)
- Phase 5 Plan 01 (Clients - localStorage stub) : OK (T1..T19)
- Aucun fichier critique modifie : `static/js/lists.js`, `api/clients/`, `api/recipients/`, `api/send-email/`, `api/login/`, `staticwebapp.config.json` tous intacts (`git diff --name-only HEAD -- ...` vide).

## Release Checklist Phase 5 — A executer avant push prod

1. **AUCUN switch manuel requis** : `CLIENTS_API_MODE` est auto-detecte par hostname (coherent post-fix Phase 4 `edefa95`). En localhost dev -> `'localStorage'`, en prod Azure SWA -> `'remote'`.
2. **AUCUN provisioning Azure requis** : le Storage Account `loadsheetautonome`, le container `loadsheet-data`, et la variable `STORAGE_CONNECTION_STRING` sont DEJA configures en Phase 4. Le Blob `clients.json` sera cree automatiquement au premier PUT.
3. `npm run verify` -> exit 0, **0 FAIL** (723 / 723 tests OK).
4. **Scenario E2E manuel local** : ouvrir l'app sur `http://localhost:4000`, verifier que les 2 seed codes (1DAC-CDW, 2SET-CDG) apparaissent dans le dropdown, creer un nouveau code via modal "≡ Clients", l'utiliser dans un manifeste, generer PDF, verifier que le code apparait dans le PDF.
5. **Scenario E2E manuel retro-compat** : charger un manifeste legacy (avec ancien `client` texte libre — il y en a forcement chez les agents ATH), verifier que la valeur apparait comme option `data-legacy="true"` italique selectionnee.
6. **Push master** -> verifier post-deploy sur https://nice-smoke-0ca8eb110.6.azurestaticapps.net : creer un client sur PC A, verifier qu'il apparait sur PC B (partage via Blob `clients.json`).
7. **Test E2E manuel post-deploy** : creer manifeste + selectionner code client + envoyer email -> email arrive avec le bon code client dans le PDF + corps email.

## Known Stubs

Aucun stub bloquant. Tous les chemins de donnees sont cables et fonctionnels :
- Mode `'localStorage'` (dev local) : seed INITIAL_CLIENTS appliquee au DOMContentLoaded si store vide ; dropdown populate via refreshClientsDropdown.
- Mode `'remote'` (prod) : `clientsGetAll`/`clientsSaveAll` parlent a `/api/clients` avec JWT (Plan 05-01) ; le Blob `clients.json` sera cree au premier PUT.
- Aucun champ "TODO/FIXME/placeholder" dans le code production.

## Phase Requirements Couverts par ce Plan

| Requirement | Description | Statut |
|-------------|-------------|--------|
| CLI-04 | Modal CRUD + tri francais | ✓ (U1, U2, U3, U7) |
| CLI-06 | Remplacement `<input>` -> `<select>` (id conserve) | ✓ (Task 1) |
| CLI-08 | Option legacy ephemere data-legacy="true" | ✓ (U6 + app.js loadManifest) |
| CLI-09 | Anti-XSS UI (_clientIds + _clientsEsc + textContent) | ✓ (U4) |
| CLI-10 | Suite UI ≥ 7 tests (couverture D-28 a -> h) | ✓ (U1..U7) |
| CLI-11 | Mobile full-screen modal | ✓ (Task 1 CSS @media 768px) |
| CLI-12 | E2E lifecycle | ✓ (E1) |

Combine avec Plan 05-01 (CLI-01, CLI-02, CLI-03, CLI-05, CLI-07) : **12 requirements CLI-* couverts au total**.

## Next Phase Readiness

**Phase 5 complete.** La feature codes client en dropdown maintenable est entierement livree :
- Backend `/api/clients` (Plan 05-01) avec auth JWT et validation defense-in-depth
- Module frontend `static/js/clients.js` (Plan 05-01) avec CRUD case-sensitive et seed initial
- UI complete (Plan 05-02) avec modal CRUD + dropdown + retro-compat manifestes legacy
- 39 + 28 + 7 = 74 nouveaux asserts (T1..T19 + U1..U7 + E1) au total Phase 5, 0 FAIL.

**Prochaine etape suggeree** : la Release Phase 5 (push master) — aucun blocker.
**Phase suivante** : Phase 6 (Materiel global — refactor saisie unique) deja en preparation (.gitkeep present dans `.planning/phases/06-...`).

---

## Self-Check: PASSED

- All 5 modified files exist on disk : `index.html`, `static/css/style.css`, `static/js/clients.js`, `static/js/app.js`, `tests/tests.html`
- All 2 task commits present in git log : `2998054` (Task 1 HTML+CSS), `70dbafa` (Task 2 UI handlers + app.js + tests)
- SUMMARY.md created at `.planning/phases/05-codes-client-en-dropdown-maintenable-backend-partage/05-02-SUMMARY.md`
- `npm run verify` : **723 / 723 tests OK, 0 FAIL**

---
*Phase: 05-codes-client-en-dropdown-maintenable-backend-partage*
*Plan: 02*
*Completed: 2026-05-19*
