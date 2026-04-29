---
phase: 04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord
plan: 01
subsystem: api
tags: [azure-blob-storage, azure-functions, jwt, localstorage, jsdom, anti-xss, vanilla-js]

# Dependency graph
requires:
  - phase: 03-validation-locale-release-gate
    provides: "Release checklist 7 etapes, npm run verify harness Node+JSDOM"
provides:
  - "Backend Azure Function /api/recipients (GET+PUT) avec auth JWT + Blob Storage 404→[]"
  - "Frontend module static/js/lists.js (CRUD wrappers + helpers anti-XSS, switch dev/prod)"
  - "Suite de tests Listes de distribution (39 nouveaux asserts) — anti-regression Phase 1/2/3 preservee"
  - "Pattern d'extension pour ajouter d'autres Functions JSON Blob (template reutilisable)"
affects: ["phase 04-02 (UI integration), Release checklist Phase 4"]

# Tech tracking
tech-stack:
  added: ["@azure/storage-blob ^12.31.0"]
  patterns:
    - "Azure Function pattern reutilisable: verifyToken JWT + try/catch BlobNotFound 404→[]"
    - "Frontend mode-switchable LISTS_API_MODE = 'localStorage' | 'remote' (constante source-controlled, pas d'env runtime)"
    - "Anti-XSS via array module-scoped _listIds (analogue _savedIds app.js:13)"
    - "Regex emails dupliquee KISS frontend/backend (D-12 — pas de bundler ni module shared)"

key-files:
  created:
    - "api/recipients/index.js (132 lignes)"
    - "api/recipients/function.json"
    - "static/js/lists.js (159 lignes)"
    - ".planning/phases/04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord/04-01-SUMMARY.md"
  modified:
    - "api/package.json (+@azure/storage-blob ^12.31.0)"
    - "api/package-lock.json (regenere)"
    - "tests/run-harness.cjs (chargement lists.js inline avant app.js)"
    - "tests/tests.html (suite Listes de distribution + script tag lists.js)"

key-decisions:
  - "D-12 KISS: regex email DUPLIQUEE intentionnellement entre lists.js et api/recipients/index.js (pas de module partage frontend/backend, pas de bundler)"
  - "D-14 Defense in depth: validateLists revoit les emails au PUT cote serveur (rejette si raw.length !== valid.length)"
  - "D-17: switch LISTS_API_MODE est une constante source-controlled (pas d'env runtime) — switch en 'remote' est une etape Release Phase 4 explicite"
  - "D-19/LST-12: 404 BlobNotFound traite comme etat initial vide ([]) — premiere lecture jamais en erreur"
  - "Pitfall 5 fix: Buffer.byteLength(body, 'utf-8') au upload pour eviter troncature de noms accentues (Élite, Étoile)"
  - "_listIds module-scoped expose: contract d'interface pour le plan 04-02 (consomme via onclick=_listIds[idx])"

patterns-established:
  - "Pattern A: Azure Function CRUD JSON Blob avec gestion 404→[] et UTF-8 bytes correct"
  - "Pattern B: Mode-switch dev/prod par constante en haut du module (plus simple qu'une env var sans bundler)"
  - "Pattern C: Anti-XSS via array module-scoped + idx entier dans onclick — extension de _savedIds existant"

requirements-completed: ["LST-01", "LST-02", "LST-03", "LST-04", "LST-07", "LST-08", "LST-09", "LST-10", "LST-12", "LST-14"]

# Metrics
duration: 5min
completed: 2026-04-29
---

# Phase 04 Plan 01: Listes de distribution — Backend & data layer Summary

**Azure Function /api/recipients (GET+PUT JWT, Blob Storage 404→[]) + module frontend lists.js mode-switchable (localStorage dev, /api/recipients prod) + 39 nouveaux tests anti-regression — pret pour cablage UI au plan 04-02.**

## Performance

- **Duration:** ~5 min (289s)
- **Started:** 2026-04-29T06:58:20Z
- **Completed:** 2026-04-29T07:03:09Z
- **Tasks:** 2 (Task 1 backend Function, Task 2 frontend module + tests)
- **Files modified:** 7 (4 nouveaux, 3 modifies)

## Accomplishments

- **Backend pret prod**: Azure Function `/api/recipients` (GET+PUT) avec auth JWT identique `send-email`, validation defense-in-depth des emails (D-14), gestion explicite du 404 BlobNotFound → `[]` (D-19/LST-12), upload UTF-8 correct via `Buffer.byteLength` (Pitfall 5 evite).
- **Module CRUD switchable**: `static/js/lists.js` (159 lignes) expose 8 fonctions publiques (`listsCreate/Update/Delete/GetAll/SaveAll/Sorted` + `listValidateEmails/InvalidEmails/Uuid`) plus l'array module-scoped `_listIds` (anti-XSS, contract pour 04-02). Mode `localStorage` = dev d'abord (D-17), mode `remote` = post-deploy.
- **39 nouveaux tests** dans `tests/tests.html` suite "Listes de distribution - localStorage stub" — couvre round-trip CRUD, validation OK/echec, throw nom vide, tri francais avec accents (`Élite` avant `Étoile`), unicite UUID (1000 distincts), `[]` initial, JSON corrompu→`[]`, persistance cle correcte, `_listIds` expose, mode dev par defaut.
- **Harness Node+JSDOM mis a jour** : `tests/run-harness.cjs` charge `lists.js` INLINE avant `app.js` (sandbox JSDOM ne resout pas les chemins relatifs).
- **Anti-regression confirmee**: 591 tests Phase 1/2/3 restent verts (591/591 → 630/630 = +39 PASS, 0 FAIL).
- **Aucune modification accidentelle** de `static/js/app.js`, `index.html`, `staticwebapp.config.json`, `api/send-email/`, `api/login/` (core value preservee).

## Task Commits

Each task committed atomically:

1. **Task 1: Backend Function /api/recipients (GET+PUT) avec auth JWT, validation, 404→[]** — `3b2ee06` (feat)
2. **Task 2: Frontend module static/js/lists.js + suite de tests Listes de distribution** — `c0b9be6` (feat)

**Plan metadata commit:** (final commit a venir avec STATE.md + ROADMAP.md + REQUIREMENTS.md update + ce fichier SUMMARY.md)

## Files Created/Modified

### Created (4)
- `api/recipients/index.js` (132 lignes) — handler GET+PUT, verifyToken JWT, validateEmails source de verite, validateLists D-14, readLists 404→[], writeLists Buffer.byteLength UTF-8
- `api/recipients/function.json` — binding HTTP trigger anonymous, methods GET+PUT, route "recipients"
- `static/js/lists.js` (159 lignes) — module CRUD switchable + helpers (`listValidateEmails`, `listsSorted` localeCompare 'fr', `listUuid` randomUUID+fallback, `_listIds` module-scoped)
- `.planning/phases/04-.../04-01-SUMMARY.md` (ce fichier)

### Modified (3)
- `api/package.json` — ajout `@azure/storage-blob ^12.31.0` (vrai version installee : 12.31.0 verifie via `npm view`)
- `api/package-lock.json` — regenere par `npm install` (25 packages ajoutes, 43 audites)
- `tests/run-harness.cjs` — chargement `lists.js` inline avant `app.js` (replace `<script src="../static/js/lists.js"></script>` par contenu inline ; idem pour `app.js` deja en place)
- `tests/tests.html` — suite "Listes de distribution - localStorage stub" ajoutee (T1..T14 + T8b accents, ~165 lignes), script tag `<script src="../static/js/lists.js"></script>` ajoute avant `app.js`

## Interface Contracts (pour Plan 04-02)

Le plan 04-02 (UI) consommera ces symboles exposes par `static/js/lists.js` :

| Symbole | Type | Signature / valeur | Usage en 04-02 |
|---------|------|---------------------|----------------|
| `LISTS_API_MODE` | const | `'localStorage'` | Switch a `'remote'` en Release checklist Phase 4 |
| `_listIds` | array | `[]` (module-scoped) | Pattern onclick `onclick="listsOpenEdit(_listIds[' + idx + '])"` (anti-XSS) |
| `listsCreate(name, recipients)` | async fn | retourne array complet, throw sur nom vide ou email invalide | Bouton "+ Nouvelle liste" du modal |
| `listsUpdate(id, name, recipients)` | async fn | throw sur id introuvable ou validation echec | Bouton ✎ Modifier |
| `listsDelete(id)` | async fn | retourne array filtre | Bouton 🗑 Supprimer (apres `confirm()`) |
| `listsGetAll()` | async fn | retourne array (`[]` si vide ou corrompu) | Refresh dropdown + table modal |
| `listsSorted(all)` | sync fn | tri `localeCompare 'fr'` sensitivity 'base' | Dropdown options + table |
| `listValidateEmails(str)` | sync fn | retourne array d'addresses valides | Validation au save |
| `listInvalidEmails(str)` | sync fn | retourne array d'addresses invalides | Message d'erreur "Adresses invalides : INVALID" |
| `listUuid()` | sync fn | retourne string unique (UUID v4 ou fallback) | (consomme par listsCreate, pas usage direct attendu) |

## Decisions Made

Aucune decision nouvelle au-dela de ce qui etait deja decide dans `04-CONTEXT.md` (D-01..D-29). Toutes les decisions ont ete implementees telles quelles :

- **D-01 modele plat** `{id, name, recipients}` — applique
- **D-02 UUID** `crypto.randomUUID()` + fallback `Date.now() + Math.random()` — applique
- **D-03 array racine** au JSON Blob — applique
- **D-12 regex au save (KISS, pas de module shared)** — applique : regex DUPLIQUEE entre `lists.js` et `api/recipients/index.js`. Le commentaire en haut de chaque regex pointe vers l'autre fichier pour synchronisation manuelle si modification future.
- **D-14 defense in depth backend** — applique : `validateLists` revoit les emails au PUT et rejette avec message clair si raw.length !== valid.length
- **D-15 cle localStorage `recipients-lists-dev`** — applique
- **D-16 Function GET+PUT** — applique
- **D-17 constante `LISTS_API_MODE` (pas d'env runtime)** — applique avec commentaire bloquant en haut du module
- **D-19 first GET → []** — applique avec catch ciblé `err.statusCode === 404 || err.details.errorCode === 'BlobNotFound'`
- **D-23 JWT_SECRET reutilise** — applique : meme secret que `/api/send-email`

## Deviations from Plan

**None — plan executed exactly as written.**

Quelques choix de detail dans la zone "Claude's Discretion" :
- Test additionnel **T8b** ajoute pour valider explicitement le tri avec accents reels (`Élite` < `Étoile`) en plus du test T8 sans accents — couverture plus complete de LST-02.
- Le `node_modules/` du dossier `api/` n'a PAS ete commité (cohérent gitignore standard projet, et il n'est pas dans `files_modified` du plan).
- Le test T11 verifie en plus la valeur du `name` persiste (pas seulement la presence de la cle) — durcissement leger.

## Issues Encountered

**Aucun blocker.**

Note technique : L'ajout du script tag `<script src="../static/js/lists.js"></script>` dans `tests/tests.html` (necessaire pour les tests browser hors harness) imposait une mise a jour du harness `run-harness.cjs` pour qu'il replace AUSSI ce nouveau tag par son contenu inline (sinon JSDOM essaie de fetcher le fichier relatif et echoue silencieusement). Geré dans le commit Task 2.

L'audit npm signale 1 vulnérabilité high severity dans une transitive dep — pas dans le scope de cette tache (pre-existant ou amenee par une transitive non-evitable du SDK Azure). A documenter pour la Release checklist Phase 4 si besoin.

## User Setup Required (post-deploy uniquement)

**A executer AVANT push final master (Release checklist Phase 4) :**

1. **Creer Storage Account `loadsheetautonome`** dans Azure Portal :
   - Type : General Purpose v2
   - Replication : LRS (Locally Redundant)
   - Access tier : Hot
   - Cost : 0$ (5 GB always-free LRS hot blob storage)
2. **Creer container prive `loadsheet-data`** dans le Storage Account :
   - Storage Account → Containers → + Container
   - Access level : **Private** (no anonymous)
3. **Configurer `STORAGE_CONNECTION_STRING`** dans Azure SWA :
   - Azure Portal → Static Web App → Settings → Environment variables
   - Source : Storage Account → Security + networking → Access keys → key1 → Connection string
4. **Switcher `LISTS_API_MODE = 'remote'`** dans `static/js/lists.js` (commentaire bloquant en haut du fichier)
5. **Test E2E post-deploy** : creer une liste sur PC A, verifier qu'elle apparait sur PC B (validation du partage entre agents)

W-3 race condition `getJwt()` mode remote : le premier `refreshListsDropdown()` au `DOMContentLoaded` (plan 04-02) peut s'executer AVANT que `auth.js` ait initialise `getJwt()`. Acceptable car (a) `_remoteGet` throw est catch silencieusement dans `refreshListsDropdown` (`console.warn` only), (b) le re-fetch a l'ouverture du modal `≡ Listes` dispose du JWT. A documenter dans la Release Phase 4.

## Next Phase Readiness

**Plan 04-02 (Wave 2 — UI integration) PEUT demarrer :**

- Backend `/api/recipients` syntactiquement valide (`node -e "require(...)"` OK)
- Frontend module `static/js/lists.js` charge dans le harness JSDOM, toutes les fonctions accessibles
- Contract d'interface stable (tableau ci-dessus)
- Aucune modification de `app.js`/`index.html` faite — terrain libre pour le plan 04-02

**Tests baseline:** 591/591 → 630/630 (anti-regression Phase 1/2/3 confirmee, 0 FAIL).

**Avant push prod (Release Phase 4):**
- [ ] Switcher `LISTS_API_MODE` a `'remote'` dans `static/js/lists.js` (item bloquant tag-grepable : `AVANT PUSH PROD`)
- [ ] Configurer `STORAGE_CONNECTION_STRING` dans Azure SWA Settings
- [ ] Verifier creation Storage Account `loadsheetautonome` + container `loadsheet-data`
- [ ] Test E2E post-deploy multi-postes

---

## Self-Check: PASSED

Verification automatique des claims (executee 2026-04-29) :

**Files created (FOUND):**
- `api/recipients/index.js` — FOUND
- `api/recipients/function.json` — FOUND
- `static/js/lists.js` — FOUND
- `.planning/phases/04-.../04-01-SUMMARY.md` — FOUND (ce fichier)

**Files modified (FOUND):**
- `api/package.json` — FOUND (contains `@azure/storage-blob`)
- `api/package-lock.json` — FOUND (25 packages ajoutes par npm install)
- `tests/run-harness.cjs` — FOUND (contains `listsJs`, `lists.js`)
- `tests/tests.html` — FOUND (contains `Listes de distribution - localStorage stub`)

**Commits exist:**
- `3b2ee06` (Task 1) — FOUND in `git log`
- `c0b9be6` (Task 2) — FOUND in `git log`

**Tests execution:**
- `npm run verify` → `Summary: 630 / 630 tests OK — Tous les tests passent !` (FOUND in stdout)
- 0 FAIL — confirmed
- 39 new tests vs baseline 591 — confirmed (591 → 630 = +39)

**Anti-regression:**
- `git diff --name-only HEAD~2 -- static/js/app.js` → empty (FOUND : aucune modif)
- `git diff --name-only HEAD~2 -- index.html` → empty (FOUND)
- `git diff --name-only HEAD~2 -- staticwebapp.config.json` → empty (FOUND)
- `git diff --name-only HEAD~2 -- api/send-email/ api/login/` → empty (FOUND)

**Anti-leak Phase 1/2:**
- `grep -cE "(uld|VRAC|sangles|planchers|mat-no-billing)" static/js/lists.js` → 0 (FOUND)
- `grep -cE "(uld|VRAC|sangles|planchers)" api/recipients/index.js` → 0 (FOUND)

**Switch dev d'abord:**
- `grep -c "LISTS_API_MODE = 'remote'" static/js/lists.js` → 0 (FOUND : NE PAS basculer maintenant, item Release checklist)
- `grep -cE "AVANT PUSH PROD" static/js/lists.js` → 1 (FOUND : commentaire bloquant present)

---

*Phase: 04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord*
*Plan: 01*
*Completed: 2026-04-29*
