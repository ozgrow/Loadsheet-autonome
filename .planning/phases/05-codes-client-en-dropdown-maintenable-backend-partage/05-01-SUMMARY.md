---
phase: 05-codes-client-en-dropdown-maintenable-backend-partage
plan: 01
subsystem: Codes client / backend share + frontend CRUD module
tags: [backend, frontend, azure-blob, jwt-auth, tests, anti-xss, seed]
dependency-graph:
  requires:
    - phase-04 Azure Storage Account `loadsheetautonome` + container `loadsheet-data` (reuse, no new provisioning)
    - phase-04 `STORAGE_CONNECTION_STRING` env var in Azure SWA
    - phase-04 `JWT_SECRET` env var in Azure SWA
    - phase-04 `@azure/storage-blob ^12.31.0` already installed in api/package.json
    - phase-04 `lists.js` pattern (post-fix edefa95) — clone structurel direct
    - phase-04 `getJwt()` helper exposed by auth.js
  provides:
    - api/clients (GET + PUT) Azure Function with JWT auth, defense-in-depth validation, 404 BlobNotFound -> [], UTF-8 Buffer.byteLength
    - static/js/clients.js : CLIENTS_API_MODE auto-detection (hostname), clientsCreate/Update/Delete/GetAll/SaveAll, clientsSorted, clientUuid, _clientsEsc, _clientIds, INITIAL_CLIENTS, _clientsAutoSeed
    - Interface contract for plan 05-02 : _clientIds[idx] anti-XSS pattern + _clientsEsc fallback helper
    - tests harness coverage for clients store (19 tests T1..T19, ~40 asserts)
  affects:
    - tests/run-harness.cjs (loads clients.js between lists.js and app.js in JSDOM sandbox)
    - tests/tests.html (script tag + new suite `Clients - localStorage stub`)
tech-stack:
  added: []
  patterns:
    - Clone structurel direct de api/recipients/index.js et static/js/lists.js (Phase 4 source of truth)
    - Auto-detection mode par hostname (post-fix Phase 4 edefa95) au lieu de switch source-controlled (D-17 Phase 4 v1 deprecated)
    - Function declarations namespacees (_clientsLocalGet/Put au lieu de _localGet/Put) pour eviter collision globale avec lists.js dans le harness inlined
key-files:
  created:
    - api/clients/function.json (httpTrigger anonymous, GET+PUT, route 'clients')
    - api/clients/index.js (109 lignes : verifyToken, validateClients defense-in-depth, readClients 404->[], writeClients UTF-8)
    - static/js/clients.js (171 lignes : auto-detect mode, CRUD, helpers, seed INITIAL_CLIENTS, DOMContentLoaded auto-seed)
  modified:
    - tests/run-harness.cjs (chargement clients.js apres lists.js)
    - tests/tests.html (script tag + suite `Clients - localStorage stub` 19 tests T1..T19)
decisions:
  - D-01 modele plat {id, code} (pas de structure imbriquee)
  - D-02 UUID via crypto.randomUUID() avec fallback Date+Math.random
  - D-03 array racine JSON (cohérent recipients-lists.json)
  - D-04 code accepte = toute string non-vide apres trim (PAS de regex de validation contrairement Phase 4)
  - D-05 unicite case-sensitive (pas de toLowerCase pour normaliser)
  - D-06 validation defense-in-depth backend dans validateClients (rejette payload non-array, id manquant, code vide, doublon)
  - D-15 seed hardcode frontend INITIAL_CLIENTS = ['1DAC-CDW', '2SET-CDG'] avec auto-seed DOMContentLoaded
  - D-16 cle localStorage 'clients-dev' (pas de prefix recipients-*)
  - D-17 Function GET + PUT (pas POST/DELETE — pattern Phase 4 last-write-wins via PUT remplace blob entier)
  - D-18 auto-detect mode par hostname (M-01 polarite safe-default 'localStorage' si window.location.hostname undefined)
  - D-19 env vars CLIENTS_CONTAINER / CLIENTS_BLOB_NAME (fallback 'loadsheet-data' / 'clients.json')
  - D-20 404 BlobNotFound -> [] (premier acces jamais en erreur)
  - D-23 _clientsEsc fallback inline si esc() pas charge au require-time (pattern _listsEsc)
  - D-24 _clientIds array module-scoped (anti-XSS — consomme par onclick en 05-02)
  - D-25 JWT_SECRET reutilise (deja configure Phase 4)
  - D-27 tests dans tests.html via harness Node+JSDOM (suite `Clients - localStorage stub` + 19 tests T1..T19)
metrics:
  duration_seconds: 180
  completed: 2026-05-19T16:40:43Z
  task_count: 2
  file_count: 5
---

# Phase 05 Plan 01 : Backend Function /api/clients + module frontend clients.js + tests Summary

Backend Azure Function `/api/clients` (GET+PUT, auth JWT, validation defense-in-depth, 404 BlobNotFound -> []) + module frontend `static/js/clients.js` (auto-detect mode hostname, CRUD case-sensitive, seed INITIAL_CLIENTS, helpers anti-XSS) + 19 nouveaux tests T1..T19 verts via harness (656 -> 695, 0 FAIL).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Backend Function /api/clients (GET+PUT, auth JWT, validation defense-in-depth) | b8b5912 | api/clients/function.json, api/clients/index.js |
| 2 | Frontend module static/js/clients.js + 19 tests + harness | 9e839d9 | static/js/clients.js, tests/run-harness.cjs, tests/tests.html |

## Files Created

- `api/clients/function.json` — bindings httpTrigger anonymous, GET+PUT, route 'clients'
- `api/clients/index.js` (109 lignes) — verifyToken (x-auth-token), validateClients (Array + id + code non-vide + unicite case-sensitive D-05), readClients (404 BlobNotFound -> []), writeClients (Buffer.byteLength UTF-8), main handler (401/200/400/405/500)
- `static/js/clients.js` (171 lignes) — CLIENTS_API_MODE auto-detect hostname, clientsCreate/Update/Delete/GetAll/SaveAll, clientsSorted (localeCompare 'fr'), clientUuid, _clientsEsc fallback, _clientIds array, INITIAL_CLIENTS seed, _clientsAutoSeed au DOMContentLoaded

## Files Modified

- `tests/run-harness.cjs` — ajout de `const clientsJs = fs.readFileSync(...)` et nouvelle ligne `.replace('<script src="../static/js/clients.js"></script>', ...)` entre lists.js et app.js
- `tests/tests.html` — script tag `<script src="../static/js/clients.js"></script>` ligne 69 (entre lists.js et app.js) + nouvelle suite `Clients - localStorage stub` avec 19 tests T1..T19 (~40 asserts)

## Tests Added (T1..T19)

| # | Description | Requirement |
|---|-------------|-------------|
| T1 | clientsCreate roundtrip (1 entree, code correct, id genere) | CLI-01 |
| T2 | clientsUpdate roundtrip (code mis a jour, id preserve) | CLI-03 |
| T3 | clientsDelete roundtrip (1 entree restante, code preserve) | CLI-03 |
| T4 | clientsCreate throw sur code vide | CLI-05 (D-04) |
| T5 | clientsCreate throw sur whitespace seulement (trim applique) | CLI-05 (D-04) |
| T6 | clientsCreate throw sur doublon avec code dans message | CLI-05 (D-05) |
| T7 | case-sensitive : '1dac-cdw' et '1DAC-CDW' = 2 clients distincts | CLI-05 (D-05) |
| T8 | clientsUpdate avec meme code OK (pas de faux doublon) | CLI-05 |
| T9 | clientsUpdate throw si collision avec autre id | CLI-05 |
| T10 | XSS code stocke litteralement + _clientsEsc echappe `<` `>` | CLI-09 |
| T11 | Tri alphabetique francais avec accents (Cargolux/Élite/Étoile) | CLI-04 (D-11) |
| T12 | 1000 clientUuid distincts et non-vides | CLI-01 |
| T13 | clientsGetAll vide retourne [] | CLI-01 |
| T14 | JSON corrompu localStorage retourne [] | CLI-03 |
| T15 | Persistence localStorage cle 'clients-dev' correcte | CLI-03 (D-16) |
| T16 | _clientIds expose comme Array module-scoped | CLI-09 |
| T17 | Mode auto-detect localStorage en localhost (JSDOM) | CLI-03 (D-18) |
| T18 | INITIAL_CLIENTS 2 entrees ['1DAC-CDW', '2SET-CDG'] avec ids | CLI-07 (D-15) |
| T19 | Auto-seed manuel populate store vide avec INITIAL_CLIENTS | CLI-07 |

## Decisions Implemented

- **D-01** modele plat `{id, code}` (pas de structure imbriquee)
- **D-02** UUID via `crypto.randomUUID()` avec fallback Date+Math.random (cohérent listUuid)
- **D-03** array racine JSON (cohérent recipients-lists.json)
- **D-04** code accepte = toute string non-vide apres `trim()`, PAS de regex de validation
- **D-05** unicite case-sensitive (pas de toLowerCase)
- **D-06** validation defense-in-depth backend `validateClients` (rejette payload non-array, id manquant, code vide, doublon)
- **D-15** seed hardcode frontend `INITIAL_CLIENTS = [{id, code: '1DAC-CDW'}, {id, code: '2SET-CDG'}]` + auto-seed au `DOMContentLoaded` si store vide
- **D-16** cle localStorage `'clients-dev'`
- **D-17** Function GET + PUT (last-write-wins via PUT remplace blob entier — pattern Phase 4)
- **D-18** auto-detect mode par hostname (post-fix Phase 4 edefa95) — `M-01 polarite safe-default 'localStorage'` si window.location.hostname undefined
- **D-19** env vars `CLIENTS_CONTAINER` (fallback `'loadsheet-data'`) / `CLIENTS_BLOB_NAME` (fallback `'clients.json'`) — container Phase 4 reutilise
- **D-20** 404 BlobNotFound -> `[]` (premier acces jamais en erreur)
- **D-23** `_clientsEsc` fallback inline si `esc()` (app.js) pas encore charge au require-time
- **D-24** `_clientIds` array module-scoped expose (anti-XSS — consomme par onclick en 05-02)
- **D-25** `JWT_SECRET` reutilise (deja configure Phase 4)
- **D-27** tests dans `tests/tests.html` via harness Node+JSDOM (suite `Clients - localStorage stub` + 19 tests)

## Interface Contracts (for plan 05-02)

Functions exposed by `static/js/clients.js` (consume directly in 05-02 UI code) :

```js
// Async CRUD wrappers (mode-aware)
async clientsCreate(code) -> Promise<Array<{id, code}>>     // throws 'Code requis.' | 'Code deja existant : "X"'
async clientsUpdate(id, code) -> Promise<Array<{id, code}>> // throws 'Code requis.' | 'Code deja existant : "X"' | 'Client introuvable.'
async clientsDelete(id) -> Promise<Array<{id, code}>>
async clientsGetAll() -> Promise<Array<{id, code}>>
async clientsSaveAll(clients) -> Promise<void>

// Helpers
function clientsSorted(all) -> Array<{id, code}>            // localeCompare 'fr' sensitivity 'base'
function clientUuid() -> string                              // crypto.randomUUID() ou fallback
function _clientsEsc(str) -> string                          // esc() ou fallback inline anti-XSS
var _clientIds: Array<string>                                // module-scoped pour onclick en 05-02
var INITIAL_CLIENTS: Array<{id, code}>                       // ['1DAC-CDW', '2SET-CDG']
var CLIENTS_API_MODE: 'localStorage' | 'remote'              // auto-detect hostname
```

Functions a implementer en plan 05-02 (UI/DOM/dropdown) : `openClientsModal`, `closeClientsModal`, `renderClientsTable`, `clientsOpenEdit`, `clientsConfirmDelete`, `clientsOpenCreate`, `clientsSubmitForm`, `applyClientToField`, `refreshClientsDropdown`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renomme _localGet/_localPut/_remoteGet/_remotePut -> _clientsLocalGet/_clientsLocalPut/_clientsRemoteGet/_clientsRemotePut**

- **Found during:** Task 2 — premier `npm run verify` apres ecriture du module
- **Issue:** Le module `clients.js` declarait au top-level `function _localGet()`, `function _localPut()`, etc. — exactement les memes noms que `static/js/lists.js`. Le harness `tests/run-harness.cjs` inline les deux scripts dans le meme document JSDOM, et les function declarations sont **hoisted dans le scope global** ; la deuxieme declaration ecrasait la premiere. Resultat : `listsCreate(...)` appelait `_localPut(lists)` qui etait en realite la version clients (sauvegarde dans la cle `clients-dev`), et la lecture `localStorage.getItem('recipients-lists-dev')` retournait null. Phase 4 T11 crashait avec `TypeError: Cannot read properties of null (reading 'length')`.
- **Fix:** Renomme les 4 fonctions privees du module clients.js avec prefixe `_clients` (pattern projet : prefix obligatoire pour les helpers privates des modules vanilla). Pas de modification de `lists.js` (anti-regression).
- **Files modified:** `static/js/clients.js`
- **Commit:** 9e839d9
- **Tests:** Phase 4 (lists) toujours verts apres fix ; Phase 5 (clients) verts ; 695/695 PASS.

## Authentication Gates

Aucun gate d'authentification rencontre. Tous les tests harness utilisent le stub `window.getJwt = function() { return 'test-jwt-token'; }` (deja en place run-harness.cjs:51). En mode harness JSDOM hostname='localhost', le module clients.js utilise systematiquement `CLIENTS_API_MODE='localStorage'` (cf. T17), donc aucun fetch ne sort.

## Test Metrics

- **Baseline (avant Task 2):** 656 tests OK, 0 FAIL
- **Après Plan 05-01:** 695 tests OK, 0 FAIL
- **Delta:** +39 tests (T1..T19 + asserts internes)

## Anti-régression confirmée

- Phase 1 (Materiel ULD) : OK
- Phase 2 (Type ULD VRAC) : OK
- Phase 3 (Suite E2E + Release gate) : OK
- Phase 4 (Listes de distribution) : OK (apres fix [Rule 1] sur collision _localGet)

## Note pour la Release Phase 5

- **AUCUNE action requise** pour le switch dev/prod : `CLIENTS_API_MODE` est auto-detecte par hostname (`window.location.hostname !== 'localhost' && !== '127.0.0.1'` -> `'remote'`).
- Prérequis Phase 4 deja en place : Storage Account `loadsheetautonome`, container `loadsheet-data`, env var `STORAGE_CONNECTION_STRING` + `JWT_SECRET` configurees dans Azure SWA Settings.
- Le Blob `clients.json` sera cree automatiquement au premier PUT en prod (au moment ou un agent ajoute le premier client via le modal Plan 05-02).
- En cas de race au DOMContentLoaded en prod (M-04 / W-3 inherited Phase 4), le seed silencieusement echoue mais le modal `openClientsModal()` re-declenchera un fetch en plan 05-02.

## Plan 05-02 — Next Steps

Le plan 05-02 doit :
1. Remplacer `<input id="clientName">` par `<select id="clientName">` + bouton "≡ Clients" dans `index.html`
2. Implementer le modal CRUD (openClientsModal/closeClientsModal/renderClientsTable/clientsOpenEdit/clientsConfirmDelete/clientsOpenCreate/clientsSubmitForm)
3. Cabler le dropdown : `applyClientToField` + `refreshClientsDropdown`
4. Reuse `_clientIds[idx]` dans onclick (anti-XSS) et `_clientsEsc` partout en innerHTML
5. Ajouter tests UI + E2E (suite `Clients - UI` + `Clients - E2E`)
6. CSS modal isole (`.clients-modal-*` prefix, pattern `.lists-modal-*` Phase 4)

## Self-Check: PASSED

- All 5 files created/modified exist on disk : api/clients/function.json, api/clients/index.js, static/js/clients.js, tests/run-harness.cjs, tests/tests.html
- All 2 commits present in git log : b8b5912 (Task 1), 9e839d9 (Task 2)
- SUMMARY.md created at .planning/phases/05-codes-client-en-dropdown-maintenable-backend-partage/05-01-SUMMARY.md
- npm run verify : 695 / 695 OK, 0 FAIL
