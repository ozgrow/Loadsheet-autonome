# Phase 5: Codes client en dropdown maintenable (backend partagé) - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 remplace le champ libre `#clientName` (index.html:75, `<input type="text">`) par un **dropdown maintenable** dont les valeurs sont gérées via un **modal CRUD**, persistées dans un **JSON Blob centralisé** (`clients.json` sur Azure Blob Storage) et partagées entre tous les agents ATH.

**Stratégie : calque direct de Phase 4** (listes de distribution).
- Mode auto-détect par hostname : `localhost`/`127.0.0.1` → stub localStorage (clé `clients-dev`), autre hostname → endpoint `/api/clients` avec JWT.
- Même Storage Account, même container Blob (`loadsheet-data`), même Function pattern.
- Même pattern modal CRUD vanilla (préfixe `.clients-modal-*` cloné depuis `.lists-modal-*`).
- Même approche validation défense-en-profondeur (frontend + backend).
- Tests dans `tests/tests.html` selon couverture minimale Phase 4.

**Inclus :**
- Modèle de données : `{ id, code }` — un seul champ texte libre par client (D-01).
- Module frontend `static/js/clients.js` (clone structurel de `lists.js`).
- Azure Function `api/clients/index.js` (clone structurel de `api/recipients/index.js`).
- Modal CRUD avec création / édition / suppression / tri alphabétique.
- Dropdown remplaçant l'`<input>` actuel, lié à `#clientName` (lecture/écriture preserve les hooks app.js existants : init, collectData, loadManifest).
- Seed initial : 2 codes `1DAC-CDW` et `2SET-CDG` disponibles au premier usage.
- Validation : code non-vide + unicité enforced frontend + backend (refus si doublon).
- Rétro-compat manifestes localStorage chiffrés existants (l'ancien `client` texte libre ne doit pas casser `loadManifest`).
- Tests anti-régression (CRUD round-trip stub localStorage, validation, unicité, XSS, tri, mobile, sélection).

**Hors scope (explicitement) :**
- Modèle riche `{ code, name, notes, address, contact, ... }` — déféré.
- Catégories ou groupes de clients — déféré.
- Multi-sélection ou historique des clients utilisés — déféré.
- Recherche / filtre dans le dropdown — déféré (tri alphabétique suffit).
- Migration automatique des manifestes legacy vers le format code — déféré (rétro-compat read-only suffit).
- ETag / lock optimiste sur le JSON Blob — last-write-wins acceptable (10x/jour, 1 agent à la fois en pratique).
- Normalisation case (toUpperCase) du code — déféré (code brut tel que saisi, voir D-04).
- Validation regex stricte du format de code — déféré (libre suffit, voir D-03).

</domain>

<decisions>
## Implementation Decisions

### Modèle de données
- **D-01 :** Une entrée client = `{ id: string, code: string }`. Schéma plat, un seul champ libre `code` (ex: `"1DAC-CDW"`, `"2SET-CDG"`). **Pas** de `name`, `notes`, ou champ secondaire. Si plus tard les agents demandent un libellé, c'est une nouvelle phase.
- **D-02 :** `id` = UUID généré côté client via le helper `clientUuid()` (réutilise pattern `listUuid()` de [lists.js:25-30](../../static/js/lists.js#L25-L30) — `crypto.randomUUID()` natif si dispo, fallback `Date.now()+random`).
- **D-03 :** Schéma racine du fichier JSON Blob : array d'objets — identique au pattern Phase 4.
  ```json
  [
    { "id": "a1b2c3...", "code": "1DAC-CDW" },
    { "id": "d4e5f6...", "code": "2SET-CDG" }
  ]
  ```

### Validation
- **D-04 :** Code accepté = toute string non-vide après `trim()`. **Pas** de regex de format imposé — souple si évolution future du format.
- **D-05 :** **Unicité enforced** : le frontend ET le backend refusent un PUT si le `code` existe déjà (case-sensitive — pas de toUpperCase). Erreur : `'Code déjà existant : "X"'`.
- **D-06 :** Validation backend défense-en-profondeur : Azure Function `/api/clients` PUT revérifie `(a) Array.isArray(payload)`, `(b) chaque entrée a id+code non-vides`, `(c) unicité des codes`. Pattern identique à `validateLists` de [api/recipients/index.js:42-58](../../api/recipients/index.js#L42-L58).

### Affichage
- **D-07 :** Code brut tel que saisi affiché partout : dans le `<select>` (option label), dans le champ visible une fois sélectionné, dans le PDF généré, dans l'email HTML, dans le récap écran. **Pas** de transformation (pas de toUpperCase, pas de prefixe, pas de format `code — name`).

### UI — Intégration et remplacement
- **D-08 :** `Claude's Discretion :` Le `<input id="clientName" type="text">` actuel ([index.html:75](../../index.html#L75)) est **remplacé** par un `<select id="clientName">` (l'`id` est conservé pour préserver les hooks `app.js` existants : `document.getElementById('clientName').value = '...'` aux lignes 437/657/725). Première option par défaut : `<option value="">— Choisir un client —</option>`. Le planner peut proposer un layout différent (hybride / datalist) si justifié, mais le défaut est `<select>` pur car le but est "controlled, maintainable backend" — pas de saisie libre.
- **D-09 :** Bouton "≡ Clients" à côté du `<select>` ouvre le modal CRUD (pattern Phase 4 D-04). Class `.btn-sm` cohérente avec "≡ Listes".
- **D-10 :** Modal CRUD `.clients-modal-*` : structure identique au modal listes de Phase 4 (header titre + close, table 2 colonnes [Code | Actions], bouton "+ Nouveau client", zone form inline). Adapter le tableau pour 1 seule colonne data (le code) + colonne actions.

### UX dropdown
- **D-11 :** Tri alphabétique du dropdown via `localeCompare('fr', { sensitivity: 'base' })` — pattern Phase 4 D-08, gère les accents français correctement.
- **D-12 :** Sélection d'un client → `#clientName.value = code` (équivalent au `applyListToRecipients`). Le record dropdown se reset visuellement à l'option vide après application pour permettre de re-sélectionner facilement (cohérent UX Phase 4 D-09, mais pour client le pattern est : "le select EST le champ", pas "le select pré-remplit le champ"). **À reconsidérer en planification selon D-08 final.**
- **D-13 :** Le dropdown se rafraîchit après chaque CRUD (création / édition / suppression visible immédiatement) — pattern Phase 4 D-11.

### Rétro-compatibilité manifestes legacy
- **D-14 :** `Claude's Discretion :` Quand `loadManifest` trouve un `client` (texte libre legacy ou code disparu du Blob) qui ne matche aucune option du `<select>`, le frontend :
  - Ajoute une `<option>` éphémère `<option value="{legacyValue}" data-legacy="true">{legacyValue}</option>` au dropdown, sélectionnée par défaut.
  - L'option éphémère persiste tant que l'agent ne choisit pas un autre client.
  - **Aucune** modification destructive de l'ancien manifeste (pas de remplacement automatique).
  - Le planner peut proposer une variante (badge "legacy" visible, alerte info, etc.).

### Seed initial des codes 1DAC-CDW / 2SET-CDG
- **D-15 :** `Claude's Discretion :` Seed via **hardcode frontend** dans `clients.js`. Constante module `INITIAL_CLIENTS = [{ id: <uuid>, code: '1DAC-CDW' }, { id: <uuid>, code: '2SET-CDG' }]`. Si `clientsGetAll()` retourne `[]` à l'init (premier accès Blob ou stub localStorage vide), le frontend appelle automatiquement `clientsSaveAll(INITIAL_CLIENTS)` une seule fois pour amorcer. Plus testable et pas de changement backend. Alternative : auto-seed dans la Function GET si Blob inexistant — moins testable, plus de couplage backend. **Le planner tranche en planification.**

### Persistance — Stratégie dev local + prod
- **D-16 :** Pendant dev (localhost / 127.0.0.1) : stub localStorage avec clé `'clients-dev'`. Pas de chiffrement (donnée non-sensible). Pattern Phase 4 D-15.
- **D-17 :** En prod : Azure Function `/api/clients` avec 2 endpoints :
  - `GET /api/clients` → retourne le contenu du Blob (array JSON).
  - `PUT /api/clients` → remplace intégralement le contenu du Blob (last-write-wins).
  - Auth : header `x-auth-token` (JWT, `JWT_SECRET`) cohérent avec `/api/send-email` et `/api/recipients`.
- **D-18 :** Switch dev↔prod via **auto-détection hostname** (pattern Phase 4 [lists.js:11-14](../../static/js/lists.js#L11-L14)). Constante `CLIENTS_API_MODE` calculée à l'init du module.
- **D-19 :** Le fichier Blob s'appelle `clients.json` dans le **même container** `loadsheet-data` que `recipients-lists.json` (Phase 4 D-18). Variables d'environnement : `STORAGE_CONNECTION_STRING` (déjà configurée), `CLIENTS_CONTAINER` (default `'loadsheet-data'`), `CLIENTS_BLOB_NAME` (default `'clients.json'`).
- **D-20 :** Premier accès Blob inexistant → `[]` (D-19 Phase 4, gestion 404 `BlobNotFound`). Combiné avec D-15, le frontend amorce les 2 codes initiaux à la première utilisation réelle.

### Suppression UX
- **D-21 :** Click sur 🗑 → `confirm('Supprimer le client "X" ?')` natif. Pattern Phase 4 D-20.
- **D-22 :** **Pas** de blocage si le code est référencé par des manifestes sauvegardés (rétro-compat D-14 prend le relais — l'ancien manifeste continuera de charger avec l'option éphémère).

### Sécurité
- **D-23 :** `code` injecté dans le DOM (table modal, options dropdown, champ legacy éphémère) DOIT passer par `esc()` ou `textContent` partout. Particulièrement critique : la table modal utilise `innerHTML` (pattern Phase 4 `_listsEsc`).
- **D-24 :** Le pattern `_clientIds` module-scoped (équivalent de `_listIds` de [lists.js:22](../../static/js/lists.js#L22)) — IDs dans un array, consommés via `onclick="clientsOpenEdit(_clientIds[' + idx + '])"`. Évite l'injection de string utilisateur dans `onclick`.
- **D-25 :** L'auth JWT du backend `/api/clients` réutilise le même `JWT_SECRET` que `/api/recipients` et `/api/send-email`. Pattern `verifyToken()` identique.
- **D-26 :** CSP existant dans `staticwebapp.config.json` — vérifier autorisation `/api/clients` (probablement déjà couverte via `connect-src 'self'`, mais à confirmer en planification).

### Tests
- **D-27 :** Tests dans `tests/tests.html` (pattern existant, harness Node+JSDOM via `npm run verify`).
- **D-28 :** Couverture minimum :
  - (a) CRUD round-trip localStorage stub : create → read → update → delete.
  - (b) Validation : code vide refusé, doublon refusé (unicité).
  - (c) Anti-XSS : `code` avec caractères HTML/JS (`<script>`, `&`, `"`) — vérifier rendu littéral.
  - (d) Tri alphabétique : codes avec accents/casse mixte triés correctement.
  - (e) Application au champ `#clientName` : sélection → `.value` mis à jour.
  - (f) Rétro-compat : `loadManifest({ client: 'Legacy Free Text Inc' })` injecte une option éphémère `data-legacy`.
  - (g) Seed initial : premier accès vide → 2 codes (`1DAC-CDW`, `2SET-CDG`) chargés et persistés.
  - (h) Mobile ≤ 768px : modal CRUD full-screen, table responsive.
- **D-29 :** Test E2E lifecycle : créer un client → recharger l'app → vérifier qu'il est dans le dropdown → l'utiliser dans un manifeste → vérifier rendu PDF (le code apparaît) → simuler envoi email.

### Mobile (≤ 768px)
- **D-30 :** Modal CRUD en full-screen sur mobile, pattern Phase 4 D-28 (réutilise les media query `.lists-modal-*`).
- **D-31 :** Le `<select id="clientName">` reste utilisable sur mobile — pas de surcharge spécifique requise vs l'input existant.

### Claude's Discretion
- Strategy exacte du remplacement UI (D-08) — `<select>` pur recommandé, mais le planner peut proposer datalist HTML5 ou hybride si UX justifie.
- Rendu du record legacy (D-14) — option éphémère recommandée, le planner peut affiner (badge, info bulle, etc.).
- Choix entre hardcode frontend vs auto-seed backend pour le seed initial (D-15) — hardcode frontend recommandé pour testabilité.
- Nom exact des fonctions (`openClientsModal`, `manageClientCodes`, etc.) et CSS selectors (`.clients-modal-*` recommandé).
- Éventuelle factorisation `_listsEsc` ↔ `_clientsEsc` ↔ `esc()` (Phase 4 a dupliqué — Phase 5 peut suivre ou extraire).
- Style exact du bouton "≡ Clients" (icône, label, position dans la rangée).

### Folded Todos
None — pas de todos en attente liés à cette phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Vision, core value, contraintes prod
- `.planning/REQUIREMENTS.md` — Liste des requirements (NB: Phase 5 ajoutera de nouveaux REQ-IDs en planification — préfixe `CLI-*` recommandé pour CLient)
- `.planning/ROADMAP.md` §Phase 5 — Goal et description
- `.planning/STATE.md` §Roadmap Evolution — Justification ajout Phase 5 (calque direct Phase 04, seed 1DAC-CDW/2SET-CDG)

### Project conventions
- `CLAUDE.md` §Conventions — JS vanilla, CSS desktop-first + media query 768px, mobile responsive
- `CLAUDE.md` §Sécurité — `esc()` obligatoire pour innerHTML, CSP, Azure SWA single * rule
- `CLAUDE.md` §Variables d'environnement — JWT_SECRET, STORAGE_CONNECTION_STRING (configurée pour Phase 4)
- `CLAUDE.md` §Tests — règle : toute nouvelle feature avec tests dans `tests/tests.html`
- `CLAUDE.md` §Release checklist — 7 étapes avant push master (dont `npm run verify`, scenario E2E)

### Phase 4 — Précédent direct (calque)
- `.planning/phases/04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord/04-CONTEXT.md` — Toutes les décisions architecturales pertinentes (modal, JWT, validation, tests, mobile)
- `.planning/phases/04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord/04-01-PLAN.md` — Plan backend Function + frontend module
- `.planning/phases/04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord/04-02-PLAN.md` — Plan UI integration + tests + E2E lifecycle

### Code source à cloner / réutiliser
- `static/js/lists.js` — **Module complet à cloner structurellement en `static/js/clients.js`** (mode switch, UUID helper, validation, CRUD operations, modal UI, anti-XSS pattern, dropdown refresh, DOMContentLoaded init)
- `api/recipients/index.js` — **Azure Function à cloner en `api/clients/index.js`** (auth `verifyToken`, validation payload, Blob read/write, gestion 404 BlobNotFound, upload UTF-8)
- `api/recipients/function.json` — **Config bindings à cloner en `api/clients/function.json`**
- `api/package.json` — Dépendance `@azure/storage-blob` déjà présente (Phase 4)
- `static/css/style.css` §`.lists-modal-*`, §`.material-modal-*` — Patterns CSS modal à dupliquer avec préfixe `.clients-modal-*`
- `static/css/style.css` §`@media (max-width: 768px)` — Section mobile à étendre pour le nouveau modal

### Code source à modifier
- `index.html:74-75` — Remplacer `<input type="text" id="clientName">` par `<select id="clientName">` + bouton "≡ Clients" à proximité
- `index.html` — Inclure le nouveau script `<script src="static/js/clients.js"></script>` (après `app.js` et `lists.js`)
- `static/js/app.js:437` (`newManifest`) — Reset `<select>` à option vide (la ligne `getElementById('clientName').value = ''` continue de fonctionner)
- `static/js/app.js:657` (`collectData`) — `getElementById('clientName').value` retourne la valeur sélectionnée (compatibilité maintenue)
- `static/js/app.js:725` (`loadManifest`) — `getElementById('clientName').value = data.client || ''` ; ajouter logique D-14 pour injecter option éphémère si valeur inconnue
- `staticwebapp.config.json` — Vérifier (et si nécessaire ajouter) la route `/api/clients/*` et autorisation CSP `connect-src`
- `tests/tests.html` — Nouvelle suite `Clients - *` avec ≥ 8 tests (couverture D-28)

### Notes
- Pas d'ADR / spec externe au projet
- Le projet n'a pas de bundler — `CLIENTS_API_MODE` est calculé runtime via hostname
- Pas de TypeScript — code JS vanilla pur
- Référence Azure : [Microsoft Learn — Azure Blob Storage SDK Node](https://learn.microsoft.com/en-us/azure/storage/blobs/) — déjà utilisé en Phase 4, pas de nouvelle dépendance à introduire

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`esc(str)` (app.js:16-19)** — fonction anti-XSS, à utiliser pour `code` injecté en DOM (cohérent avec usage Phase 4).
- **Pattern modal `.lists-modal-*`** (style.css, Phase 4) — overlay, layout, full-screen mobile à 768px — à cloner avec préfixe `.clients-modal-*` ou factorisé en classe partagée si justifié.
- **Pattern auto-detect hostname** (lists.js:11-14) — exact pattern à reproduire pour `CLIENTS_API_MODE`.
- **Pattern UUID helper `listUuid()`** (lists.js:25-30) — clone direct.
- **Pattern `_listIds` anti-XSS dans onclick** (lists.js:22) — clone direct en `_clientIds`.
- **Pattern Azure Function `verifyToken`** (api/recipients/index.js:18-28, api/send-email/index.js) — auth JWT identique.
- **Pattern Blob read avec 404 fallback** (api/recipients/index.js:69-82) — clone direct pour `readClients()`.
- **Pattern Blob write UTF-8 safe** (api/recipients/index.js:84-92) — clone direct pour `writeClients()`.
- **`confirm()` natif** — déjà utilisé Phase 4 et `deleteSavedManifest` ; pattern reproduit pour suppression client.

### Established Patterns
- **HTML inline via innerHTML dans .js** — pattern modal (Phase 4 `openListsModal`) à reproduire ; `code` doit passer par `_clientsEsc()` partout.
- **Mode switch source-controlled** — `CLIENTS_API_MODE` runtime calculé via `window.location.hostname`, pas de variable d'env frontend.
- **Storage backend** — `clients-dev` localStorage clé (non chiffrée — donnée non-sensible, cohérent Phase 4 D-15).
- **Azure Functions pattern** — `module.exports = async function (context, req)`, lecture body, validation, réponse via `context.res`.
- **Tests harness** — `suite('Foo', function() { test('bar', function() { assert(...); }); });` dans `tests.html`, exécutable browser ET Node via `run-harness.cjs`.

### Integration Points
- **`index.html:74-75`** — Section `#manifest-fields` : remplacer `<input>` par `<select>` + bouton à proximité.
- **`static/js/app.js:437, 657, 725`** — Hooks existants conservés : la lecture/écriture de `getElementById('clientName').value` continue de fonctionner sur un `<select>` HTML standard.
- **`api/`** — Nouveau dossier `api/clients/` avec `index.js` + `function.json` (clone direct de `api/recipients/`).
- **`api/package.json`** — Dépendance `@azure/storage-blob` déjà présente (Phase 4), aucun ajout requis.
- **Container `loadsheet-data` sur Azure Blob Storage** — déjà provisionné Phase 4, le nouveau Blob `clients.json` s'y ajoute sans configuration additionnelle.
- **`staticwebapp.config.json`** — Vérifier la route `/api/clients/*` et CSP (probablement déjà couvert via `/api/*` et `connect-src 'self'`).
- **`tests/tests.html`** — Nouvelle suite `Clients - *` avec ≥ 8 tests (D-28). Suite E2E lifecycle (D-29) — soit étendre la suite existante Phase 3+4, soit ajouter un nouveau fichier.

</code_context>

<specifics>
## Specific Ideas

- **Schéma minimaliste** : `{ id, code }` — un seul champ libre. L'utilisateur a explicitement écarté un schéma riche (code + libellé + notes). Si plus tard les agents demandent un libellé, c'est une nouvelle phase (déféré).
- **Code brut tel que saisi** : pas de `toUpperCase()` automatique. Si un agent saisit `1dac-cdw` en minuscules, c'est stocké et affiché tel quel. L'unicité est case-sensitive. Cohérent avec la souplesse "libre + unique" voulue.
- **Validation `non-vide + unique`** : refus au save si `code.trim()` vide OU si un autre client a déjà le même `code` (case-sensitive). Message d'erreur : `'Code déjà existant : "X"'`. Le frontend ET le backend vérifient.
- **Seed initial 1DAC-CDW / 2SET-CDG** : ces 2 codes sont les "exemples seeds" connus de l'agent ATH — le format suggère "prefix-aéroport CDG" mais aucune règle stricte n'est imposée (cohérent D-04 libre).
- **Pattern Phase 4 = source de vérité** : tous les choix techniques (mode switch, JWT, Blob, validation defense-in-depth, modal CRUD, tests) sont des clones directs structurels. Le planner doit privilégier la reproductibilité de Phase 4 plutôt que la factorisation prématurée.

</specifics>

<deferred>
## Deferred Ideas

- **Modèle riche** `{ code, name, notes, address, contact }` — utile si les agents demandent un libellé lisible. Pas voulu actuellement (D-01).
- **Normalisation case** (toUpperCase au save / case-insensitive unicity) — refusé en discussion (D-04, D-05).
- **Regex stricte de format** (ex: `^[0-9][A-Z]{3}-[A-Z]{3}$`) — refusé pour souplesse future (D-04).
- **Migration automatique des manifestes legacy** vers le format code — pas voulu (rétro-compat read-only via option éphémère D-14 suffit).
- **Catégories / groupes de clients** — non demandé.
- **Recherche / filtre dans le dropdown** — utile au-delà de ~50 entrées. Tri alphabétique suffit.
- **Multi-sélection ou historique** des clients récemment utilisés — non demandé.
- **ETag / lock optimiste** sur le Blob — last-write-wins acceptable à 10x/jour.
- **Blocage suppression si client référencé dans manifestes** — refusé (D-22, rétro-compat D-14 prend le relais).
- **Interface admin de purge/reset** — pas urgent.
- **Factorisation `lists.js` + `clients.js`** dans un module générique `crud-blob.js` — possible mais prématuré ; Phase 5 clone, future Phase 7+ pourrait factoriser si plus de cas d'usage.
- **Listes par-utilisateur (privées) + listes globales** — actuellement tous les clients sont partagés. Si besoin de listes privées plus tard → nouvelle phase auth user-aware.

### Reviewed Todos (not folded)
Aucun — `gsd-tools todo match-phase 5` retourne 0 matches.

</deferred>

---

*Phase: 05-codes-client-en-dropdown-maintenable-backend-partage*
*Context gathered: 2026-05-19*
