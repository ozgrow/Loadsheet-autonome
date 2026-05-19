---
phase: 05-codes-client-en-dropdown-maintenable-backend-partage
verified: 2026-05-19T17:30:00Z
status: human_needed
score: 9/9 success criteria verified (programmatic) — 3 items require human verification (prod Azure cross-PC sharing, real-PDF/email render, mobile rendering on device)
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Création + sélection d'un nouveau code client via le modal — vérifier que le PDF généré contient bien le code client et que l'email envoyé arrive avec le bon code en corps + PDF attaché"
    expected: "Le PDF affiche le code client sélectionné dans le dropdown ; l'email arrive au destinataire avec le bon code"
    why_human: "Le pipeline jsPDF (rendu visuel + autotable) et SMTP (envoi réel via Azure Communication Services) ne peuvent pas être validés purement par grep — exige un envoi de mail à soi-même"
  - test: "Rétro-compat manifeste legacy : charger un ancien manifeste avec `data.client` en texte libre inconnu (ex: 'AGENT-ATH-CDG-LEGACY')"
    expected: "Le `<select>` affiche l'option `data-legacy=\"true\"` italique grisée sélectionnée par défaut ; le PDF généré contient encore la valeur legacy"
    why_human: "Nécessite un manifeste réellement legacy en localStorage (créé en Phase 1/2/3/4 avant le swap input→select). Visuellement, vérifier le style italique gris (CSS render réel)"
  - test: "Partage cross-PC en prod : créer un client sur PC A après push master, ouvrir l'app sur PC B (autre navigateur), vérifier que le client apparaît dans le dropdown"
    expected: "Le client créé sur PC A est visible immédiatement sur PC B après refresh"
    why_human: "Exige le déploiement Azure SWA réel + accès à 2 navigateurs distincts + auth en prod — impossible en local"
  - test: "Modal CRUD sur mobile (≤ 768px) : ouvrir le modal `≡ Clients` sur un iPhone/Android réel"
    expected: "Modal full-screen, formulaire utilisable, bouton 'Enregistrer' atteignable, le `<select>` dropdown s'ouvre nativement"
    why_human: "Le rendu mobile + interaction tactile + scroll-lock ne peuvent pas être vérifiés en JSDOM. Le harness Node n'a pas de viewport mobile"
  - test: "Race au DOMContentLoaded en prod (M-04 / W-3 hérité Phase 4) : ouvrir l'app fraîche en prod, observer si le seed initial 1DAC-CDW + 2SET-CDG apparaît immédiatement OU si l'agent doit ouvrir le modal pour déclencher le fetch"
    expected: "Soit le seed apparaît tout seul, soit `openClientsModal()` recharge l'état (comportement acceptable selon M-04)"
    why_human: "Race timing avec `getJwt()` au DOMContentLoaded — comportement réel uniquement observable en prod authentifiée"
---

# Phase 5: Codes client en dropdown maintenable Verification Report

**Phase Goal:** Remplacer le champ libre `<input id="clientName">` par un dropdown `<select>` maintenable dont les valeurs sont gérées via un modal CRUD, persistées dans un JSON Blob Azure (`clients.json`) partagé entre tous les agents ATH, avec rétro-compatibilité des manifestes legacy (option éphémère pour anciennes valeurs texte libre) et seed initial de 2 codes (1DAC-CDW, 2SET-CDG). Calque structurel direct de Phase 4.

**Verified:** 2026-05-19T17:30:00Z
**Status:** human_needed — All automated/programmatic checks PASS, but 5 items require real prod/device verification
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Success Criteria from ROADMAP.md)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | L'agent ouvre le modal "Clients" via bouton `≡ Clients` et peut CRUD (créer/modifier/supprimer) ; dropdown re-trié après chaque CRUD | VERIFIED | `index.html:79` (bouton id=`clients-btn` onclick=`openClientsModal()`), `clients.js:194` (`openClientsModal`), `clients.js:221` (`renderClientsTable`), `clients.js:271` (`clientsOpenCreate`), `clients.js:275` (`clientsOpenEdit`), `clients.js:284` (`clientsSubmitForm`), `clients.js:303` (`clientsConfirmDelete`), `clients.js:294,310` (refresh post-CRUD), `clients.js:155` (`clientsSorted` localeCompare 'fr' base) ; tests U1, U2, U7 PASS |
| 2 | Premier lancement (store vide) → 2 codes `1DAC-CDW` + `2SET-CDG` automatiquement dans le dropdown | VERIFIED | `clients.js:39-42` (`INITIAL_CLIENTS = [{code: '1DAC-CDW'}, {code: '2SET-CDG'}]`), `clients.js:167` (`_clientsAutoSeed`), `clients.js:373-378` (DOMContentLoaded → setTimeout → `_clientsAutoSeed`), `clients.js:174` (auto-appel `refreshClientsDropdown`) ; tests T18, T19, U3 PASS |
| 3 | `<input id="clientName">` remplacé par `<select id="clientName">` (id conservé, hooks 437/657/725 intacts). Première option `<option value="">— Choisir un client —</option>` | VERIFIED | `index.html:76` (`<select id="clientName" class="field-input">`), `clients.js:337-340` (option default `— Choisir un client —`), `app.js:437` intact (`.value = ''`), `app.js:657` intact (`client: ...value`), `app.js:740` intact (`.value = data.client`) — seule modif chirurgicale `app.js:725-739` (+15 lignes injection legacy) |
| 4 | Manifeste legacy avec `data.client` inconnu → injecte `<option data-legacy="true">` éphémère sélectionnée | VERIFIED | `app.js:725-738` (détection legacy + injection avec `_legacyOpt.setAttribute('data-legacy', 'true')` + `textContent` anti-XSS natif) ; `clients.js:325-360` (refresh préserve l'option legacy) ; CSS `style.css:290-292` style italic ; test U6 PASS |
| 5 | Dev : localStorage clé `clients-dev` ; prod : Azure Function `/api/clients` GET+PUT lit/écrit `clients.json` dans container `loadsheet-data` (réutilise STORAGE_CONNECTION_STRING Phase 4) | VERIFIED | `clients.js:14-19` (auto-detect hostname → mode), `clients.js:20` (`CLIENTS_LOCAL_KEY = 'clients-dev'`), `clients.js:21` (`CLIENTS_API_URL = '/api/clients'`), `api/clients/index.js:14-15` (container `loadsheet-data`, blob `clients.json`), `api/clients/index.js:49-55` (`BlobServiceClient.fromConnectionString` → container → BlockBlobClient), `api/clients/index.js:60` (`downloadToBuffer`), `api/clients/index.js:77` (`upload`) ; tests T15, T17 PASS |
| 6 | Validation defense-in-depth : code non-vide après trim + unicité case-sensitive enforced frontend ET backend. Message: `'Code déjà existant : "X"'` | VERIFIED | Frontend `clients.js:113-125` (`clientsCreate` trim + check non-vide + check doublon strict), `clients.js:127-145` (`clientsUpdate` même validation). Backend `api/clients/index.js:33-46` (`validateClients` rejette non-array, id manquant, code vide, doublon — defense in depth). Messages identiques `'Code deja existant : "X"'` (note: SUMMARY mentionne accent ASCII "deja" backend mais ROADMAP/REQUIREMENTS écrit "déjà" avec accent — voir Notes ci-dessous). Tests T4, T5, T6, T7, T8, T9 PASS |
| 7 | Aucun XSS exécutable depuis `code` (esc via `_clientsEsc`/`textContent` + onclick `_clientIds[idx]` jamais string utilisateur) | VERIFIED | `clients.js:233` (`_clientsEsc(c.code)` dans innerHTML table), `clients.js:217,254` (`_clientsEsc` sur message erreur + titre form), `clients.js:339,345,357` (`opt.textContent = c.code` anti-XSS natif), `clients.js:235-236` (`onclick="...(_clientIds[' + idx + '])"` jamais string code), `clients.js:262-263` (`.value = code` pour input form jamais innerHTML) ; tests T10, U4 PASS |
| 8 | Modal CRUD utilisable mobile ≤ 768px (full-screen via media query, classes `.clients-modal-*`) | VERIFIED (code) — needs human (real device) | `style.css:368` (`@media (max-width: 768px)`), `style.css:454-464` (block mobile: `.clients-modal-overlay { align-items: stretch }`, `.clients-modal { width:100%; max-width:100%; max-height:100vh; border-radius:0 }`, `.client-row { flex-direction: column }`) — voir Step 8 (human verification mobile device) |
| 9 | Tests anti-régression `Clients - *` ≥ 8 tests (D-28 a→h) + 1 E2E (D-29) ; `npm run verify` 0 FAIL | VERIFIED | `npm run verify` → **723/723 OK, 0 FAIL** (confirmé). Suite `Clients - localStorage stub` (T1..T19 = 19 tests, ~80 asserts), suite `Clients - UI` (U1..U7 = 7 tests, ~37 asserts), suite `Clients - E2E lifecycle` (E1 = 1 test, ~11 asserts). Total 27 tests Phase 5 (>> requirement ≥ 9) |

**Score:** 9/9 success criteria verified programmatically. Truth #8 requires additional real-device verification (Step 8 below).

---

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `api/clients/function.json` | Binding httpTrigger anonymous, methods GET+PUT, route 'clients' | VERIFIED | Lines 1-17: `"authLevel": "anonymous"`, `"methods": ["get", "put"]`, `"route": "clients"` |
| `api/clients/index.js` | Handler GET+PUT, verifyToken (x-auth-token), validateClients (Array+id+code+unicité), readClients (404→[]), writeClients (UTF-8 Buffer.byteLength) | VERIFIED | 120 lines (>90 min). `verifyToken:18-28`, `validateClients:33-46` (rejette non-array L34, id manquant L39, code vide L40, doublon L42), `readClients:57-70` (404 BlobNotFound → [] L65-67), `writeClients:72-80` (Buffer.byteLength L77) |
| `static/js/clients.js` | Module CRUD + auto-detect hostname + INITIAL_CLIENTS + wrappers + UI handlers + auto-seed | VERIFIED | 380 lines (>140 min). All exports present : `clientsCreate:113`, `clientsUpdate:127`, `clientsDelete:147`, `clientsGetAll:101`, `clientsSaveAll:104`, `clientsSorted:155`, `clientUuid:30`, `_clientsEsc:45`, `INITIAL_CLIENTS:39`, `CLIENTS_API_MODE:14`, `_clientIds:27`, `openClientsModal:194`, `closeClientsModal:189`, `renderClientsTable:221`, `_renderClientsForm:246`, `_clientsCloseForm:266`, `clientsOpenCreate:271`, `clientsOpenEdit:275`, `clientsSubmitForm:284`, `clientsConfirmDelete:303`, `refreshClientsDropdown:316`, `_clientsAutoSeed:167` |
| `tests/run-harness.cjs` | Chargement de clients.js dans le harness Node+JSDOM (après lists.js, avant app.js) | VERIFIED | `run-harness.cjs:12` (`fs.readFileSync('static/js/clients.js')`), `run-harness.cjs:23` (`.replace('<script src="../static/js/clients.js"...', inline)`) |
| `tests/tests.html` | Suite `Clients - localStorage stub` ≥ 12 tests + suite `Clients - UI` ≥ 6 + suite `Clients - E2E` | VERIFIED | Line 113 `<script src="../static/js/clients.js">`, line 3735 `suite('Clients - localStorage stub')` (T1..T19), line 3940 `suite('Clients - UI')` (U1..U7), line 4078 `suite('Clients - E2E lifecycle')` (E1) |
| `index.html` | `<input>` → `<select>` + bouton `≡ Clients` dans `.client-row` + script tag clients.js | VERIFIED | Line 75 `<div class="client-row">`, line 76 `<select id="clientName" class="field-input">`, line 79 `<button id="clients-btn" onclick="openClientsModal()">≡ Clients</button>`, line 139 `<script src="/static/js/clients.js">` (entre lists.js et app.js) |
| `static/css/style.css` | Bloc `.clients-modal-*` + `.client-row` + media query 768px + style legacy italique | VERIFIED | Lines 281-330 (bloc desktop, `.client-row` flex L283-287, `option[data-legacy="true"]` italic L290-292, `.clients-modal-overlay/modal/header/table/form/actions/empty`), lines 454-464 (mobile @media 768px : full-screen modal + stacked client-row) |
| `static/js/app.js` | Modification chirurgicale `loadManifest` ligne 725 : injection option legacy ; lignes 437/657 préservées | VERIFIED | Line 437 intact (`document.getElementById('clientName').value = ''`), line 657 intact (`client: document.getElementById('clientName').value`), lines 725-739 ajoutées (+15 lignes legacy injection ; `_cnEl.tagName === 'SELECT'` check, parcours options, création `<option data-legacy="true">` avec `textContent` anti-XSS) |

All 8 artifacts: VERIFIED (exists + substantive + wired + data flows).

---

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `static/js/clients.js` | localStorage clé `'clients-dev'` | `_clientsLocalGet/_clientsLocalPut` | WIRED | `clients.js:20` (`CLIENTS_LOCAL_KEY = 'clients-dev'`), `clients.js:56-68` (`_clientsLocalGet/Put` lisent/écrivent la clé) — Test T15 confirme |
| `static/js/clients.js` | `/api/clients` | fetch avec header `x-auth-token` (mode 'remote') | WIRED | `clients.js:71-98` (`_clientsRemoteGet/Put`), L74 GET avec `'x-auth-token': jwt`, L86 PUT avec `'x-auth-token': jwt + 'Content-Type': application/json` |
| `api/clients/index.js` | Azure Blob `loadsheet-data/clients.json` | BlobServiceClient → BlockBlobClient downloadToBuffer/upload | WIRED | `api/clients/index.js:49-55` (`getBlockBlobClient` factory), L60 `downloadToBuffer`, L77 `upload(body, Buffer.byteLength, blobHTTPHeaders)` |
| `INITIAL_CLIENTS` | auto-seed `clientsSaveAll` si store vide | DOMContentLoaded → setTimeout 0 → `_clientsAutoSeed` | WIRED | `clients.js:39-42` (constants), `clients.js:167-181` (auto-seed L170 check empty, L171 `clientsSaveAll(INITIAL_CLIENTS)`, L175 chain `refreshClientsDropdown`), `clients.js:374-378` (DOMContentLoaded hook avec setTimeout 0 pour yield au microtask M-04) |
| `tests/run-harness.cjs` | `static/js/clients.js` | `fs.readFileSync` + injection script inline | WIRED | L12 read, L23 replace script tag with inline |
| `index.html #clients-btn` | `openClientsModal()` | onclick attribute | WIRED | `index.html:79` `onclick="openClientsModal()"` ; fonction définie `clients.js:194` |
| `index.html #clientName (select)` | `app.js collectData/loadManifest/newManifest` | `getElementById('clientName').value` | WIRED | `app.js:437` reset, `app.js:657` read, `app.js:740` set — tous fonctionnent nativement sur `<select>` |
| `renderClientsTable` | `_clientIds` (anti-XSS) | `onclick="...(_clientIds[idx])"` | WIRED | `clients.js:223` populate `_clientIds`, L235-236 onclick utilisent `_clientIds[idx]` jamais la string code |
| `refreshClientsDropdown` | `document.getElementById('clientName')` (select) | `.textContent = code` (anti-XSS natif) | WIRED | `clients.js:317` querySelect, L319 guard `tagName === 'SELECT'`, L345 `opt.textContent = c.code`, L357 `legacyOpt.textContent = legacyValue` |
| `app.js loadManifest` | détection legacy + injection option éphémère | `option.dataset.legacy / setAttribute('data-legacy', 'true')` | WIRED | `app.js:725-738`, condition L727 + check existence L728-731 + injection L733-737 (textContent + setAttribute data-legacy) |
| `_clientsAutoSeed` étendu | `refreshClientsDropdown()` | appel chaîné post-seed | WIRED | `clients.js:173-176` (après seed, si `refreshClientsDropdown` est défini → appelé) |

**All 11 key links: WIRED**. No NOT_WIRED, no PARTIAL.

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `refreshClientsDropdown` (select options) | `all` (clients array) | `clientsGetAll()` → mode-aware (`_clientsLocalGet` from localStorage OR `_clientsRemoteGet` from `/api/clients`) → eventually Azure Blob via `readClients` | YES — real DB/Blob read (or localStorage in dev) | FLOWING |
| `renderClientsTable` (modal table rows) | `clients` parameter | Caller `openClientsModal:212` calls `clientsGetAll()` first | YES — flows from same store | FLOWING |
| `_clientsAutoSeed` (seed bootstrap) | `INITIAL_CLIENTS` constant | Hardcoded `clients.js:39-42` — intentional seed only when empty | YES — written via `clientsSaveAll` to real backend | FLOWING (seed pattern, not stub) |
| `loadManifest` legacy option | `data.client` | From `getSavedManifests()` decrypted localStorage manifest | YES — real manifest data | FLOWING |
| `clientsCreate/Update/Delete` | array operations | Read via `clientsGetAll`, mutated, written via `clientsSaveAll` | YES — full read-modify-write cycle to real backend | FLOWING |

**All dynamic-data artifacts: FLOWING**. No HOLLOW, no DISCONNECTED, no HOLLOW_PROP.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Tests harness passe | `npm run verify` | `723 / 723 tests OK — Tous les tests passent !` `Passed: 726, Failed: 0` | PASS |
| Module `clients.js` exporte `clientsCreate` | `grep -n "function clientsCreate" static/js/clients.js` | Line 113 found | PASS |
| Backend declares GET+PUT | `grep -E "methods.*get.*put" api/clients/function.json` | Found `"methods": ["get", "put"]` | PASS |
| Anti-XSS pattern `_clientIds[idx]` dans onclick | `grep "_clientIds\[" static/js/clients.js` | Lines 235, 236 (onclick edit + delete) | PASS |
| Mobile media query `.clients-modal` 768px | `grep "@media.*768px" + ".clients-modal" /style.css` | Line 368 + lines 454-464 block | PASS |
| `<select>` remplace `<input>` | `grep "select id=.clientName" index.html` | Line 76 found | PASS |
| Storage Account dependency present | `grep "@azure/storage-blob" api/package.json` | `"@azure/storage-blob": "^12.31.0"` (réutilise Phase 4) | PASS |
| Commits Task 1 & Task 2 plan 05-01 + 05-02 | `git log --oneline` | b8b5912 (Task 1 plan 1), 9e839d9 (Task 2 plan 1), 2998054 (Task 1 plan 2), 70dbafa (Task 2 plan 2) — all present | PASS |

**8/8 behavioral spot-checks: PASS.**

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| **CLI-01** | 05-01 | Modèle `{id, code}` + persistance Azure Blob (prod) + localStorage stub (dev) + schéma array racine | SATISFIED | `clients.js:39-42` schema, `api/clients/index.js:14-15` blob, `clients.js:20` localStorage key. Tests T1, T12, T13. |
| **CLI-02** | 05-01 | Azure Function `/api/clients` GET+PUT avec auth JWT (`x-auth-token`, `JWT_SECRET`), GET retourne Blob, PUT last-write-wins | SATISFIED | `api/clients/function.json:8` methods get+put, `api/clients/index.js:18-28` verifyToken via x-auth-token, L91-110 GET+PUT handler. Tests not run live (needs prod) — code path verified. |
| **CLI-03** | 05-01 | Module `static/js/clients.js` auto-detect hostname + CRUD wrappers + helpers + `_clientIds` | SATISFIED | `clients.js:14-19` auto-detect, exports complets confirmés. Tests T2, T3, T13, T14, T15, T16, T17. |
| **CLI-04** | 05-02 | Modal CRUD `.clients-modal-*` + tri français + bouton `≡ Clients` à côté du select | SATISFIED | `index.html:79` bouton, `clients.js:194-318` modal handlers, `clients.js:155-163` tri français, CSS `.clients-modal-*` lignes 294-330. Tests U1, U2, U3, U7. |
| **CLI-05** | 05-01 | Validation defense-in-depth code non-vide trim + unicité case-sensitive, frontend ET backend, message `'Code déjà existant : "X"'` | SATISFIED | Frontend `clients.js:113-125, 127-145` + backend `api/clients/index.js:33-46`. Tests T4, T5, T6, T7, T8, T9. ⚠ Voir Notes : message backend `"deja"` ASCII (sans accent) — divergence cosmétique avec REQUIREMENTS mais cohérent SUMMARY D-05/D-06 plan. |
| **CLI-06** | 05-02 | `<input id="clientName">` → `<select id="clientName">` (id conservé, hooks 437/657/725 intacts), première option `— Choisir un client —` | SATISFIED | `index.html:76` select avec id conservé, `clients.js:337-340` option default, `app.js:437,657,740` hooks intacts. |
| **CLI-07** | 05-01 | Seed `INITIAL_CLIENTS = [{1DAC-CDW}, {2SET-CDG}]` auto-appliqué une seule fois si store vide | SATISFIED | `clients.js:39-42` constant, `clients.js:167-181` auto-seed + DOMContentLoaded hook L374-378. Tests T18, T19. |
| **CLI-08** | 05-02 | Rétro-compat manifeste legacy : injection `<option data-legacy="true">` éphémère sélectionnée si `data.client` inconnu | SATISFIED | `app.js:725-738` injection + setAttribute data-legacy + textContent. CSS L290-292 style italic. Test U6 PASS. |
| **CLI-09** | 05-01 + 05-02 | Anti-XSS strict : `_clientsEsc`/`esc()` sur innerHTML + `.textContent` sur options + `_clientIds[idx]` dans onclick | SATISFIED | `clients.js:45-50` _clientsEsc, L233/254 innerHTML escape, L339/345/357 textContent options, L235-236 onclick _clientIds[idx]. Tests T10, U4. |
| **CLI-10** | 05-01 + 05-02 | Suite `Clients - *` ≥ 8 tests couvrant D-28 a→h + tri + sélection + retro-compat + seed + dev mode | SATISFIED | 27 tests Phase 5 (T1..T19 + U1..U7 + E1) >> 8 minimum. `npm run verify` 723/723 OK 0 FAIL. |
| **CLI-11** | 05-02 | Modal utilisable mobile ≤ 768px full-screen via media query, classes `.clients-modal-*` | SATISFIED (code) — needs real-device check | CSS `style.css:454-464` block media query 768px. Render visuel à valider sur appareil mobile réel (cf. human_verification). |
| **CLI-12** | 05-02 | Test E2E lifecycle (D-29) : créer client → reload → dropdown → manifeste → `collectData().client === code` | SATISFIED | Test E1 dans suite `Clients - E2E lifecycle` (tests.html:4078) — chaîne `clientsCreate('TEST-E2E')` → `refreshClientsDropdown` → `<select>.value = 'TEST-E2E'` → `getElementById('clientName').value === 'TEST-E2E'`. PASS dans harness. |

**12/12 CLI-* requirements: SATISFIED (programmatically).** Aucun orphelin — chaque CLI déclaré dans REQUIREMENTS.md figure dans le frontmatter d'un plan (05-01 ou 05-02) et est implémenté dans le code. Aucun requirement attendu manquant.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| (aucun) | — | TODO/FIXME/placeholder/coming soon dans `clients.js`/`api/clients/index.js`/`app.js` (lignes Phase 5) | — | Scan `grep -E "TODO\|FIXME\|placeholder\|coming soon\|not yet implemented" static/js/clients.js api/clients/index.js` → 0 matches dans le code production |
| `static/js/clients.js` | 27, 56-68 | Namespace rename `_clientsLocalGet/Put` (au lieu de `_localGet/Put`) suite collision avec `lists.js` | Info | Auto-fixed Rule 1 documented in SUMMARY 05-01 (Deviation). Justifié (function declarations hoisted globalement dans le harness inlined). Pas un anti-pattern — c'est un fix correct. |
| `tests/tests.html` | setup block | Shim DOM Object.defineProperty sur `#clientName.value` setter pour reproduire CLI-08 dans tests legacy | Info | Auto-fixed Rule 1 documented in SUMMARY 05-02 (Deviation). Justifié — uniquement dans test harness, aucune modif de prod. |
| `api/clients/index.js` | 42 | Message d'erreur backend `"Code deja existant"` (ASCII) au lieu de `"Code déjà existant"` (UTF-8) | Info | Divergence cosmétique avec REQUIREMENTS.md texte. Cohérent avec D-05/D-06 du plan. Pas un bug fonctionnel mais à signaler. Le frontend `clients.js:119/138` utilise aussi `"deja"` ASCII — donc round-trip cohérent. |

**Aucun blocker, aucun warning. 3 items Info documentés.**

---

### Human Verification Required

Voir le frontmatter `human_verification` ci-dessus. Récapitulatif :

1. **Création client → PDF + email réel** — Vérifier que le code client choisi se retrouve dans le PDF généré et dans l'email envoyé (rendu jsPDF + envoi SMTP Azure Communication Services).
2. **Manifeste legacy chargement** — Charger un manifeste sauvegardé avant Phase 5 (`data.client` en texte libre) et vérifier visuellement l'option italique grise.
3. **Partage cross-PC en prod** — Créer un client sur PC A, vérifier sur PC B (Blob `clients.json` partagé).
4. **Modal sur mobile réel** — Tester sur iPhone/Android : modal full-screen, dropdown natif, formulaire utilisable.
5. **Race DOMContentLoaded prod (M-04 / W-3)** — Premier login post-deploy : seed visible immédiatement ou après ouverture du modal ?

---

### Gaps Summary

**Aucun gap programmatique.** Tous les artefacts existent, sont substantifs (>min_lines), sont câblés, et les données réelles transitent. Tous les key links sont WIRED. Tous les 12 requirements CLI-* sont SATISFIED. Tous les 27 tests Phase 5 (T1..T19 + U1..U7 + E1) passent dans le harness (723/723 OK). Aucun TODO/FIXME/stub dans le code production.

Les 5 items de vérification humaine sont **structurellement attendus pour cette phase** :
- 3 sont liés à des composants externes (Azure Blob en prod réel, SMTP réel, manifeste legacy concret)
- 1 est lié au rendu mobile réel (impossible en JSDOM)
- 1 est lié au timing race condition en prod (impossible en local)

Ces items ne sont **pas des bugs** mais des validations à faire avant d'annoncer la phase opérationnelle aux agents ATH.

**Notes complémentaires de l'orchestrateur :**
- Deux deviations auto-fixed sont déjà documentées et justifiées dans les SUMMARYs (rename namespace `_clientsLocalGet/Put` plan 05-01 ; shim DOM `<input>→<select>` setter dans test harness plan 05-02). Aucune dérive scope.
- `npm run verify` confirme **723/723 tests OK, 0 FAIL** — anti-régression Phase 1/2/3/4 préservée.

---

## Conclusion

**Status: human_needed** — Le code est complet, testé et fonctionnel en harness. Les 9 success criteria de ROADMAP sont satisfaits programmatiquement. Avant la **Release checklist Phase 5** (push master), l'utilisateur doit effectuer les 5 vérifications humaines listées (notamment scénario E2E manuel local + scenario retro-compat manifeste legacy + test post-deploy cross-PC + test email réel + test mobile).

Si ces vérifications humaines passent → la phase est validée et la feature peut être annoncée aux agents ATH.

---

_Verified: 2026-05-19T17:30:00Z_
_Verifier: Claude (gsd-verifier)_
