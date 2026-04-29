---
phase: 04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord
verified: 2026-04-29T00:00:00Z
status: human_needed
score: 6/6 success criteria verified (automated) — UAT manuel requis avant push prod
human_verification:
  - test: "Provision Azure Storage Account `loadsheetautonome` (GPv2 / LRS / Hot) + container privé `loadsheet-data`"
    expected: "Storage Account créé, container Private créé, key1 disponible"
    why_human: "Action Azure Portal — non automatisable, dépend du compte Azure du user"
  - test: "Configurer `STORAGE_CONNECTION_STRING` dans Azure SWA → Settings → Environment variables"
    expected: "Variable disponible côté Function avec key1 du Storage Account"
    why_human: "Action Azure Portal — non automatisable"
  - test: "Switcher `LISTS_API_MODE = 'localStorage'` → `'remote'` dans static/js/lists.js (ligne 11) AVANT push prod"
    expected: "Mode remote actif, requests vers /api/recipients"
    why_human: "Étape Release checklist Phase 4 explicite — l'agent ne doit pas la faire dans cette phase (dev local d'abord)"
  - test: "Test E2E manuel multi-postes post-deploy : créer une liste sur PC A, vérifier qu'elle apparaît sur PC B"
    expected: "La liste créée sur PC A est visible sur PC B après refresh (LST-08 partage entre agents)"
    why_human: "Nécessite 2 postes physiques connectés à la prod — réel partage Blob Storage"
  - test: "Test E2E manuel envoi email avec liste : créer manifeste + sélectionner liste via dropdown + sendEmail"
    expected: "Email arrive avec destinataires de la liste pré-remplis dans #recipients"
    why_human: "Nécessite SMTP réel et inbox de réception — UAT humain"
  - test: "Visual / mobile (≤768px) : ouvrir modal sur smartphone réel, vérifier full-screen + utilisabilité formulaire"
    expected: "Modal occupe 100% viewport, formulaire utilisable, .recipients-row stack vertical"
    why_human: "Apparence visuelle / UX mobile non testable en JSDOM (pas de viewport simulation)"
  - test: "1 email de test soi-même post-deploy (Release checklist projet step 7)"
    expected: "Email reçu avec bon rendu PDF (anti-régression core value Phase 4 vs Phases 1/2/3)"
    why_human: "SMTP + delivery réelle — UAT humain"
---

# Phase 04 — Listes de distribution emails Verification Report

**Phase Goal:** L'agent ATH peut gérer (CRUD) des listes de distribution nommées d'adresses email partagées entre tous les agents, et appliquer une liste en un clic pour pré-remplir #recipients lors de l'envoi de la loadsheet. Stockage centralisé Azure Blob Storage en production, stub localStorage pendant le développement.

**Verified:** 2026-04-29
**Status:** human_needed (toutes les vérifications automatisables PASS — items UAT manuel listés pour Release checklist Phase 4)
**Re-verification:** No — initial verification

---

## Goal Achievement — 6 Success Criteria

| # | Truth                                                                                                                                                          | Status     | Evidence                                                                                                                                                                                                  |
| - | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | L'agent ouvre le modal "Listes de distribution" depuis #generateSection et peut créer/modifier/supprimer des listes                                            | ✓ VERIFIED | `index.html:114-120` (.recipients-row + button#lists-btn + onclick=openListsModal()). `lists.js:178-228` openListsModal/renderListsTable. `lists.js:258-303` listsOpenCreate/Edit/SubmitForm/ConfirmDelete |
| 2 | Dropdown à côté de #recipients permet de sélectionner une liste qui remplace intégralement la valeur du champ                                                  | ✓ VERIFIED | `index.html:116` `<select id="lists-dropdown" onchange="applyListToRecipients(this.value)">`. `lists.js:305-317` applyListToRecipients : `input.value = liste.recipients`                                  |
| 3 | Listes persistées en localStorage (clé `recipients-lists-dev`) en dev ; en prod via Function `/api/recipients` GET+PUT lit/écrit `recipients-lists.json` Blob | ✓ VERIFIED | `lists.js:11-13` LISTS_API_MODE/LOCAL_KEY/API_URL. `lists.js:52-94` _localGet/Put + _remoteGet/Put. `api/recipients/index.js:69-92` readLists/writeLists avec downloadToBuffer/upload                       |
| 4 | Emails validés (regex) au save côté client ET serveur ; listes affichées triées alphabétiquement                                                              | ✓ VERIFIED | `lists.js:32-49` LIST_EMAIL_REGEX + listValidateEmails/InvalidEmails. `api/recipients/index.js:31-58` emailRegex + validateLists D-14. `lists.js:151-159` listsSorted localeCompare 'fr' sensitivity 'base' |
| 5 | Names + adresses anti-XSS via `esc()` partout en innerHTML ; modal utilisable mobile ≤768px                                                                    | ✓ VERIFIED | `lists.js:166-171` _listsEsc fallback. `lists.js:216,217,237` _listsEsc(l.name)/_listsEsc(preview). `lists.js:219-220` `_listIds[idx]` (jamais string user). `style.css:296,370-382` media query 768px      |
| 6 | Premier accès Blob inexistant retourne [] sans erreur ; tests anti-régression couvrent CRUD/validation/XSS/tri/sélection/mobile/E2E lifecycle                  | ✓ VERIFIED | `api/recipients/index.js:75-81` catch err.statusCode===404 \|\| BlobNotFound → return []. `tests/tests.html:3296,3480,3622` 3 nouvelles suites. `npm run verify` → **653/653 tests OK, 0 FAIL**            |

**Score:** 6/6 success criteria verified

---

## Required Artifacts — Levels 1+2+3 (exists, substantive, wired)

| Artifact                          | Expected                                                            | Status     | Details                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `api/recipients/index.js`         | Handler GET+PUT, verifyToken, validateEmails, readLists 404→[], writeLists Buffer.byteLength | ✓ VERIFIED | 132 lignes (≥80). Module charge sans erreur. Imports BlobServiceClient. Toutes les fonctions présentes              |
| `api/recipients/function.json`    | Binding HTTP trigger anonymous, methods GET+PUT, route 'recipients' | ✓ VERIFIED | `methods: ["get", "put"]`, `route: "recipients"`, `authLevel: "anonymous"`                                          |
| `api/package.json`                | Dépendance @azure/storage-blob ^12.31.0                            | ✓ VERIFIED | Présent ligne 6 + package-lock.json régénéré (25 packages ajoutés)                                                |
| `static/js/lists.js`              | Module CRUD switchable + UI handlers + _listIds + helpers           | ✓ VERIFIED | 350 lignes (≥120). Toutes les fonctions du contrat présentes (CRUD + UI + helpers + DOMContentLoaded hook)         |
| `tests/run-harness.cjs`           | Charge static/js/lists.js dans le harness avant app.js              | ✓ VERIFIED | Ligne 11 `const listsJs = ...`. Ligne 20 inject avant app.js. Tests passent                                         |
| `tests/tests.html`                | Suite "Listes de distribution - localStorage stub" + UI + E2E       | ✓ VERIFIED | 3 suites trouvées lignes 3296, 3480, 3622. 656 asserts PASS / 0 FAIL                                              |
| `index.html`                      | Bouton ≡ Listes + dropdown + script lists.js avant app.js           | ✓ VERIFIED | Lignes 114-120 .recipients-row complet. Ligne 133 lists.js avant 134 app.js avant 135 auth.js                      |
| `static/css/style.css`            | Classes .lists-modal-* + .recipients-row + media query 768px       | ✓ VERIFIED | 19+ occurrences `.lists-modal*` + 4× `.recipients-row` + media query 768px ligne 296 (étendue ligne 370-382 mobile) |

**All artifacts pass Levels 1+2+3.**

---

## Key Link Verification

| From                                  | To                                                       | Via                                  | Status   | Details                                                                                |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------ | -------- | -------------------------------------------------------------------------------------- |
| `static/js/lists.js`                  | localStorage clé 'recipients-lists-dev'                  | _localGet/_localPut                  | ✓ WIRED  | Lignes 52-64 + 12 (LISTS_LOCAL_KEY)                                                    |
| `static/js/lists.js`                  | /api/recipients                                          | fetch + x-auth-token (mode 'remote') | ✓ WIRED  | Lignes 67-94 (_remoteGet, _remotePut). 2× `x-auth-token`                               |
| `api/recipients/index.js`             | Azure Blob `loadsheet-data/recipients-lists.json`        | BlobServiceClient + downloadToBuffer/upload | ✓ WIRED  | Lignes 14-15 constants. 61-67 getBlockBlobClient. 69-92 readLists/writeLists           |
| `tests/run-harness.cjs`               | `static/js/lists.js`                                     | fs.readFileSync + injection avant app.js | ✓ WIRED  | Ligne 11 + 20                                                                          |
| `index.html #lists-btn`               | `openListsModal()`                                       | onclick attribute                    | ✓ WIRED  | Ligne 119 `onclick="openListsModal()"`                                                 |
| `index.html #lists-dropdown`          | `applyListToRecipients(this.value)`                      | onchange attribute                   | ✓ WIRED  | Ligne 116                                                                              |
| `static/js/lists.js renderListsTable` | `_listIds[idx]` (anti-XSS pattern)                       | onclick=listsOpenEdit/Delete         | ✓ WIRED  | Lignes 219-220 (`_listIds[' + idx + ']`) — 2 occurrences                              |
| `static/js/lists.js applyListToRecipients` | `document.getElementById('recipients').value`       | input.value = liste.recipients       | ✓ WIRED  | Ligne 312                                                                              |
| `lists.js renderListsTable / refreshListsDropdown` | `esc()` / `_listsEsc()`                          | innerHTML escaping + textContent      | ✓ WIRED  | _listsEsc lignes 166-171 + appels 200, 216-217, 237 + textContent ligne 334            |

**All key links verified WIRED.**

---

## Data-Flow Trace (Level 4)

| Artifact                  | Data Variable             | Source                              | Produces Real Data                       | Status     |
| ------------------------- | ------------------------- | ----------------------------------- | ---------------------------------------- | ---------- |
| Modal table (renderListsTable) | `lists` (via listsGetAll) | _localGet localStorage / _remoteGet | Yes — données utilisateur réelles via CRUD | ✓ FLOWING  |
| Dropdown (refreshListsDropdown) | `all` (via listsGetAll)   | localStorage / /api/recipients      | Yes — réflète CRUD                       | ✓ FLOWING  |
| #recipients (applyListToRecipients) | `liste.recipients`        | listsGetAll → find by id            | Yes — string réelle de la liste sélectionnée | ✓ FLOWING  |
| Backend GET                | `lists` array             | bbc.downloadToBuffer JSON.parse     | Yes — Blob réel ou [] si 404 (D-19)      | ✓ FLOWING  |
| Backend PUT                | `body` (lists payload)    | req.body validé via validateLists   | Yes — defense in depth D-14              | ✓ FLOWING  |

**No HOLLOW or DISCONNECTED data flows.**

---

## Behavioral Spot-Checks

| Behavior                                        | Command                                                 | Result                                       | Status |
| ----------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- | ------ |
| Backend module charge sans erreur               | `node -e "require('./api/recipients/index.js')"`        | exit 0, "OK module loads"                    | ✓ PASS |
| Test harness verify                             | `npm run verify`                                        | "Summary: 653 / 653 tests OK"; Passed: 656, Failed: 0 | ✓ PASS |
| Anti-régression Phases 1/2/3                    | `git diff 585610b..HEAD -- static/js/app.js api/send-email/ api/login/ staticwebapp.config.json` | empty (aucune modif)            | ✓ PASS |
| Switch dev localStorage actif                   | `grep "LISTS_API_MODE = 'localStorage'" static/js/lists.js` | match ligne 11                              | ✓ PASS |
| Aucun mode 'remote' actif                       | `grep "LISTS_API_MODE = 'remote'" static/js/lists.js`   | 0 matches                                    | ✓ PASS |
| Anti-leak Phase 1/2 (uld/VRAC/sangles/...) lists.js | `grep -i "(uld\|VRAC\|sangles\|planchers)" static/js/lists.js` | 0 matches                                    | ✓ PASS |
| Anti-leak Phase 1/2 backend                     | `grep -i "(uld\|VRAC\|sangles\|planchers)" api/recipients/index.js` | 0 matches                                    | ✓ PASS |
| `.material-modal-*` classes intactes (CSS)      | `git diff 7cf4af2~1 -- static/css/style.css \| grep '^-.*\.material-modal'` | empty                                       | ✓ PASS |
| Commentaire bloquant Release Phase 4 présent   | `grep "AVANT PUSH PROD" static/js/lists.js`             | 1 match ligne 4                              | ✓ PASS |
| Buffer.byteLength UTF-8 utilisé (Pitfall 5)    | `grep -n "Buffer.byteLength" api/recipients/index.js`   | usage ligne 89 dans bbc.upload               | ✓ PASS |

---

## Requirements Coverage — 15 LST-IDs

| Req       | Source Plan(s)   | Description                                                                  | Status     | Evidence                                                                                                              |
| --------- | ---------------- | ---------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| LST-01    | 04-01            | Créer une liste (nom + emails virgules)                                      | ✓ SATISFIED | `lists.js:109-121` listsCreate. Tests T1 + listsCreate throw nom vide T7                                             |
| LST-02    | 04-01, 04-02     | Lister triées alphabétiquement                                               | ✓ SATISFIED | `lists.js:151-159` listsSorted localeCompare 'fr'. Tests T8 + T8b accents + U6 dropdown                              |
| LST-03    | 04-01            | Modifier une liste                                                           | ✓ SATISFIED | `lists.js:123-141` listsUpdate. Test T2                                                                              |
| LST-04    | 04-01, 04-02     | Supprimer avec confirm()                                                     | ✓ SATISFIED | `lists.js:143-148` listsDelete. `lists.js:292-303` listsConfirmDelete. Tests T3 + U2/U3 confirm rejected/accepted   |
| LST-05    | 04-02            | Bouton ≡ Listes ouvre modal CRUD                                             | ✓ SATISFIED | `index.html:119` button. `lists.js:178-202` openListsModal. Tests U7 overlay créé/retiré                            |
| LST-06    | 04-02            | Dropdown remplace #recipients                                                | ✓ SATISFIED | `index.html:116` select onchange. `lists.js:305-317` applyListToRecipients. Tests U1 + E1                            |
| LST-07    | 04-01            | Mode dev = localStorage / mode prod via constante                            | ✓ SATISFIED | `lists.js:11` LISTS_API_MODE. Test T14 mode dev par défaut                                                          |
| LST-08    | 04-01            | Endpoint /api/recipients GET+PUT Blob Storage                                | ✓ SATISFIED | `api/recipients/{index.js,function.json}` créés. BlobServiceClient + container 'loadsheet-data'                     |
| LST-09    | 04-01            | JWT via header x-auth-token                                                  | ✓ SATISFIED | `api/recipients/index.js:18-28` verifyToken (copie send-email). `lists.js:67-94` _remoteGet/Put avec x-auth-token   |
| LST-10    | 04-01            | Validation regex emails client + serveur                                     | ✓ SATISFIED | `lists.js:32-49` listValidateEmails/InvalidEmails. `api/recipients/index.js:31-58` validateLists D-14. Tests T4-T6 |
| LST-11    | 04-01, 04-02     | esc() partout en innerHTML                                                   | ✓ SATISFIED | `lists.js:166-171` _listsEsc + 219-220 _listIds[idx] + 216-217,237 _listsEsc(name/preview). Tests T13 + U4/U5 XSS  |
| LST-12    | 04-01            | Premier GET Blob inexistant → []                                             | ✓ SATISFIED | `api/recipients/index.js:75-81` catch BlobNotFound. Tests T10 + T12 (corrupt JSON)                                  |
| LST-13    | 04-02            | Mobile ≤768px utilisable                                                     | ✓ SATISFIED | `style.css:370-382` media query .lists-modal-overlay full-screen + .recipients-row stack. Test U7 (overlay creation) — visuel UAT   |
| LST-14    | 04-01, 04-02     | Tests anti-régression dans tests.html                                        | ✓ SATISFIED | 62 nouveaux tests (591→653 baseline confirmée par SUMMARY) couvrant CRUD/validation/XSS/tri/sélection                 |
| LST-15    | 04-02            | Test E2E lifecycle (créer liste → applyListToRecipients → fetch send-email)  | ✓ SATISFIED | `tests/tests.html:3622` suite "Listes de distribution - E2E lifecycle" avec stub fetch direct (chaîne data isolée) |

**All 15 LST-IDs SATISFIED.**

**Aucune requirement orpheline détectée** : l'union des `requirements:` des 2 plans = exactement {LST-01..15} ; aucune ID Phase 4 supplémentaire dans REQUIREMENTS.md.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| (aucun) | — | — | — | Aucun TODO/FIXME/PLACEHOLDER ; aucun retour [] hardcodé non-couvert ; le `return []` ligne 78 et 60 sont des fallbacks corrects (404 BlobNotFound D-19, JSON corrompu) ; aucun `=> {}` empty handler |

---

## Anti-régression — Core value (envoi email + login)

| Fichier | Modifié dans Phase 4? | Status |
| ------- | --------------------- | ------ |
| `static/js/app.js` | NO | ✓ INTACT |
| `api/send-email/` | NO | ✓ INTACT |
| `api/login/` | NO | ✓ INTACT |
| `staticwebapp.config.json` | NO | ✓ INTACT |
| `static/js/auth.js` | NO | ✓ INTACT |
| `static/js/logo.js` | NO | ✓ INTACT |
| `.material-modal-*` CSS classes | NO supprimé / NO modifié | ✓ INTACT (17 occurrences toujours présentes) |

Vérifié : `git diff 585610b..HEAD -- static/js/app.js api/send-email/ api/login/ staticwebapp.config.json` → vide.

---

## Anti-leak Phase 1/2 — strict scope Phase 4

| Pattern | static/js/lists.js | api/recipients/index.js | Status |
| ------- | ------------------ | ----------------------- | ------ |
| `uld` (case-insensitive) | 0 | 0 | ✓ |
| `VRAC` | 0 | 0 | ✓ |
| `sangles` | 0 | 0 | ✓ |
| `planchers` | 0 | 0 | ✓ |
| `mat-no-billing` | 0 | 0 | ✓ |
| `uldComment` | 0 | 0 | ✓ (commentaire référençant uldComment retiré, remplacé par "Anti-XSS pattern" ligne 247) |

CSS scope strict : aucune classe `.lists-modal-*` ne se chevauche avec `.material-modal-*`.

---

## Tests harness — Output

```
Summary: 653 / 653 tests OK — Tous les tests passent !
Passed: 656, Failed: 0
```

Note: harness reporte 656 asserts PASS (incluant des sub-asserts dans certains blocs), 653 tests reportés par tests.html lui-même. **0 FAIL.**

Baseline pre-Phase-4: 591/591 (Phase 3 commit). Total Phase 4 = 591 + 62 = 653. ✓ Confirmé.

Suites Phase 4:
- Suite "Listes de distribution - localStorage stub" (T1..T14 + T8b accents) — ~39 asserts (Plan 04-01)
- Suite "Listes de distribution - UI" (U1..U8) — 19 asserts (Plan 04-02)
- Suite "Listes de distribution - E2E lifecycle" (E1) — 4 asserts (Plan 04-02)
- Total : ≥ 62 nouveaux asserts cohérent avec annonce SUMMARY (39 + 23)

---

## Switch dev/prod (Release Checklist Phase 4)

✓ `LISTS_API_MODE === 'localStorage'` au commit final (lists.js ligne 11) — **conforme contrainte phase "dev local d'abord"**.

✓ Commentaire bloquant explicite ligne 4 :
```javascript
// !!! AVANT PUSH PROD : verifier LISTS_API_MODE === 'remote' (Release checklist Phase 4)
// !!! Necessite STORAGE_CONNECTION_STRING configuree dans Azure SWA Settings.
```

✓ Note race condition W-3 (`getJwt()` au DOMContentLoaded) documentée — comportement acceptable (catch silencieux + re-fetch au openListsModal).

---

## Human Verification Required (UAT pre-push prod)

7 items UAT manuels à exécuter AVANT push final master (Release checklist Phase 4) :

### 1. Provision Azure Storage Account

**Test:** Créer Storage Account `loadsheetautonome` (GPv2 / LRS / Hot) + container privé `loadsheet-data` dans Azure Portal.
**Expected:** Storage Account créé, container Private créé, key1 disponible.
**Why human:** Action Azure Portal — non automatisable, dépend du compte Azure du user.

### 2. Configurer STORAGE_CONNECTION_STRING

**Test:** Configurer la variable `STORAGE_CONNECTION_STRING` dans Azure SWA → Settings → Environment variables.
**Expected:** Variable disponible côté Function avec key1 du Storage Account.
**Why human:** Action Azure Portal — non automatisable.

### 3. Switch LISTS_API_MODE → 'remote'

**Test:** Changer `LISTS_API_MODE = 'localStorage'` → `'remote'` dans `static/js/lists.js` ligne 11.
**Expected:** Mode remote actif, requests vers /api/recipients en fetch.
**Why human:** Étape Release checklist Phase 4 explicite — délibérément NON faite dans cette phase (contrainte "dev local d'abord").

### 4. Test E2E multi-postes (LST-08 partage agents)

**Test:** Créer une liste sur PC A, ouvrir l'app sur PC B, vérifier que la liste apparaît dans le dropdown.
**Expected:** La liste créée sur PC A est visible sur PC B après refresh (validation du partage Blob Storage entre agents).
**Why human:** Nécessite 2 postes physiques connectés à la prod — réel partage Blob.

### 5. Test E2E manuel envoi email avec liste

**Test:** Créer manifeste complet + sélectionner une liste via dropdown + cliquer "Envoyer par email".
**Expected:** Email arrive dans l'inbox des destinataires de la liste, avec le PDF joint.
**Why human:** SMTP réel + delivery + couverture flux complet `sendEmail()` (volontairement hors scope du test E1 automatisé pour éviter couplage avec invariants Phase 1/2).

### 6. Visual mobile (LST-13)

**Test:** Ouvrir l'app sur smartphone réel (≤768px), cliquer "≡ Listes", vérifier full-screen + utilisabilité formulaire (input name + textarea recipients lisibles).
**Expected:** Modal occupe 100% du viewport, formulaire utilisable, `.recipients-row` stack vertical (input #recipients + dropdown + bouton).
**Why human:** Apparence visuelle / UX mobile non testable en JSDOM (pas de viewport simulation).

### 7. Release Checklist projet (CLAUDE.md step 7)

**Test:** Post-deploy, se connecter en prod, envoyer 1 email de test à soi-même.
**Expected:** Email reçu avec bon rendu PDF + recipients corrects (anti-régression core value Phase 4 vs Phases 1/2/3).
**Why human:** SMTP + delivery réelle.

---

## Gaps Summary

**Aucun gap automatisable détecté.** Toutes les vérifications programmatiques passent :
- ✓ 6/6 success criteria ROADMAP
- ✓ 15/15 LST-* requirements (LST-01..15)
- ✓ 8/8 artifacts existent + substantive + wired
- ✓ 9/9 key links verified
- ✓ 5/5 data-flow traces FLOWING
- ✓ 10/10 behavioral spot-checks PASS
- ✓ Anti-régression core value (app.js, send-email, login, staticwebapp.config) intact
- ✓ Anti-leak Phase 1/2 (uld/VRAC/sangles/planchers/mat-no-billing/uldComment) = 0
- ✓ Switch dev/prod conservé : LISTS_API_MODE === 'localStorage' avec commentaire bloquant
- ✓ npm run verify : **653/653 tests OK, 0 FAIL** (baseline 591 + 62 nouveaux tests)

Le statut **`human_needed`** reflète uniquement les items UAT manuels nécessaires AVANT le push prod (Release checklist Phase 4) — actions Azure Portal, multi-postes, mobile, SMTP réel — explicitement hors scope CI/automatisable et explicitement délimitées par la contrainte "dev local d'abord" de la phase.

La feature est **complète et opérationnelle en mode dev local**. Les artefacts requis pour la prod (Storage Account + variable d'env + switch mode) sont documentés dans `04-01-SUMMARY.md §User Setup Required` et `04-02-SUMMARY.md §User Setup Required (post-deploy uniquement)`.

---

_Verified: 2026-04-29_
_Verifier: Claude (gsd-verifier)_
