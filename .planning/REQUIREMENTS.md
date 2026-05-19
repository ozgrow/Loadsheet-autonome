# Requirements: Loadsheet-autonome

**Defined:** 2026-04-22
**Core Value:** La saisie d'un manifeste doit aboutir à un PDF correct envoyé aux bons destinataires, sans perte de données.

## v1 Requirements

### Matériel ULD

- [x] **MAT-01**: L'utilisateur peut saisir le nombre de sangles dans le modal d'édition ULD
- [x] **MAT-02**: L'utilisateur peut saisir le nombre de planchers bois europe (ou cocher "forfait négocié" en alternative)
- [x] **MAT-03**: L'utilisateur peut saisir le nombre de planchers bois standard (ou cocher "forfait négocié" en alternative)
- [x] **MAT-04**: L'utilisateur peut saisir le nombre de bois de calage
- [x] **MAT-05**: L'utilisateur peut saisir le nombre de bâches
- [x] **MAT-06**: L'utilisateur peut saisir le nombre d'intercalaires
- [x] **MAT-07**: L'utilisateur peut saisir le nombre de nids d'abeille
- [x] **MAT-08**: L'utilisateur peut saisir un commentaire libre sur l'ULD
- [x] **MAT-09**: Les champs matériel sont disponibles sur tous les types d'ULD (palettes + conteneurs)
- [x] **MAT-10**: Les manifestes sauvegardés avant cette évolution se chargent sans erreur (rétro-compat localStorage chiffré)
- [x] **MAT-11**: Le commentaire libre est échappé via `esc()` partout où il est affiché (anti-XSS)
- [x] **MAT-12**: Une case à cocher "Rien à facturer" est disponible dans le modal matériel (alternative explicite à la saisie de champs)
- [x] **MAT-13**: La saisie matériel est obligatoire pour chaque ULD avant ajout d'une nouvelle ULD ET avant génération PDF/email — au moins un champ matériel rempli OU la case "Rien à facturer" cochée
- [x] **MAT-14**: Le modal matériel s'ouvre automatiquement à chaque création d'une nouvelle ULD (sauf au rechargement d'un manifeste sauvegardé)

### VRAC

- [x] **VRAC-01**: "VRAC" apparaît comme type ULD officiel dans le sélecteur de type
- [x] **VRAC-02**: Les ULD de type VRAC sont exclues du compteur de palettes du récapitulatif
- [x] **VRAC-03**: Le récapitulatif affiche une ligne séparée "Vrac" (poids + nombre de colis) quand au moins une ULD VRAC est présente

### Récapitulatif

- [x] **RECAP-01**: Le récapitulatif écran affiche les infos matériel de chaque ULD (forme condensée)
- [x] **RECAP-02**: Le PDF généré inclut les infos matériel de chaque ULD
- [x] **RECAP-03**: Les champs matériel restent utilisables et lisibles sur mobile (≤ 768px)

### Tests & validation

- [x] **TEST-01**: Les nouvelles fonctionnalités sont couvertes par des tests dans `tests/tests.html`
- [x] **TEST-02**: Des tests de rétro-compatibilité vérifient que les anciens manifestes (sans champs matériel) se chargent correctement
- [x] **TEST-03**: L'application entière est testée en local via `npx serve .` avant tout push sur `master`

### Listes de distribution emails (Phase 4)

- [x] **LST-01**: L'utilisateur peut créer une liste de distribution avec un nom et une string d'emails séparés par virgules
- [x] **LST-02**: L'utilisateur peut lire/lister toutes les listes existantes (triées alphabétiquement)
- [x] **LST-03**: L'utilisateur peut modifier une liste existante (nom et/ou recipients)
- [x] **LST-04**: L'utilisateur peut supprimer une liste avec confirmation native `confirm()`
- [x] **LST-05**: Un bouton "≡ Listes" ouvre le modal CRUD depuis la section #generateSection
- [x] **LST-06**: Un dropdown `<select>` à côté de #recipients permet d'appliquer une liste (remplace intégralement la valeur)
- [x] **LST-07**: Pendant le développement, le stub localStorage (clé `recipients-lists-dev`) sert de backend ; switch vers vrai endpoint via constante `LISTS_API_MODE`
- [x] **LST-08**: En production, l'endpoint `/api/recipients` (GET + PUT) persiste les listes dans Azure Blob Storage (`recipients-lists.json`)
- [x] **LST-09**: L'API `/api/recipients` exige un JWT envoyé via header `x-auth-token` (cohérent `/api/send-email`)
- [x] **LST-10**: Les emails sont validés au save (regex), côté client ET serveur. Si invalide → alert listant adresses invalides
- [x] **LST-11**: Les champs `name` et `recipients` sont anti-XSS : passés par `esc()` partout en innerHTML
- [x] **LST-12**: Le premier GET sur un Blob inexistant retourne `[]` sans erreur (404 BlobNotFound traité comme état initial vide)
- [x] **LST-13**: Le modal CRUD reste utilisable et lisible sur mobile (≤ 768px)
- [x] **LST-14**: Tests anti-régression dans `tests/tests.html` : CRUD round-trip localStorage stub, validation, XSS, tri, sélection, mobile
- [x] **LST-15**: Test E2E lifecycle : créer une liste, l'utiliser pour pré-remplir #recipients avant envoi email simulé

### Clients (Phase 5)

- [ ] **CLI-01**: Modèle de données plat `{ id, code }` — un seul champ texte libre `code` par client. Persistance en Azure Blob Storage (fichier `clients.json` dans container `loadsheet-data`) en prod ; stub localStorage (clé `clients-dev`) en dev. Schéma racine = array JSON
- [ ] **CLI-02**: Azure Function `/api/clients` (GET + PUT) avec auth JWT (header `x-auth-token`, secret `JWT_SECRET` partagé avec `/api/send-email` et `/api/recipients`). GET retourne le contenu du Blob ; PUT remplace intégralement (last-write-wins)
- [ ] **CLI-03**: Module frontend `static/js/clients.js` avec auto-détection du mode par hostname (`localhost`/`127.0.0.1` → `'localStorage'`, autre → `'remote'`). Expose `clientsCreate/Update/Delete/GetAll/SaveAll`, helpers `clientsSorted/clientUuid`, et l'array module-scoped `_clientIds` pour onclick anti-XSS
- [ ] **CLI-04**: Modal CRUD `.clients-modal-*` (clone structurel de `.lists-modal-*` Phase 4) permettant créer / éditer / supprimer un client, avec tri alphabétique français (`localeCompare('fr', { sensitivity: 'base' })`). Bouton "≡ Clients" placé à côté du `<select id="clientName">` ouvre le modal
- [ ] **CLI-05**: Validation défense-en-profondeur : `code` non-vide après `trim()` ET unicité case-sensitive (refus si doublon), enforced côté frontend ET côté backend. Message d'erreur : `'Code déjà existant : "X"'`
- [ ] **CLI-06**: Le champ `<input type="text" id="clientName">` (index.html ligne 75) est remplacé par `<select id="clientName">` (l'id est conservé pour préserver les hooks `app.js` aux lignes 437/657/725). Première option : `<option value="">— Choisir un client —</option>`
- [ ] **CLI-07**: Seed initial : si `clientsGetAll()` retourne `[]` à l'init (premier accès Blob ou localStorage vide), le frontend appelle automatiquement `clientsSaveAll(INITIAL_CLIENTS)` une seule fois avec `INITIAL_CLIENTS = [{id, code: '1DAC-CDW'}, {id, code: '2SET-CDG'}]`
- [ ] **CLI-08**: Rétro-compatibilité manifestes legacy : quand `loadManifest` trouve un `data.client` (texte libre) qui ne matche aucune option du `<select>`, ajout d'une option éphémère `<option value="{legacy}" data-legacy="true">{legacy}</option>` sélectionnée par défaut. Aucune modification destructive du manifeste
- [ ] **CLI-09**: Anti-XSS strict : tous les `code` injectés en DOM (table modal, options dropdown, option legacy éphémère) passent par `_clientsEsc()` / `esc()` (innerHTML) ou `.textContent` (dropdown options). Les onclick utilisent `_clientIds[idx]` (pattern Phase 4 `_listIds`), jamais la string utilisateur
- [ ] **CLI-10**: Tests anti-régression dans `tests/tests.html` : suite `Clients - *` couvrant CRUD round-trip, validation (code vide + doublon), anti-XSS, tri alphabétique français, sélection, rétro-compat option éphémère, seed initial, mode dev (D-28 a→h)
- [ ] **CLI-11**: Le modal CRUD `.clients-modal-*` reste utilisable et lisible sur mobile (≤ 768px) — full-screen via media query (clone du pattern Phase 4 D-28)
- [ ] **CLI-12**: Test E2E lifecycle (D-29) : créer un client → recharger le module → vérifier qu'il est dans le dropdown → l'utiliser dans un manifeste → vérifier que `collectData().client === code`

## v2 Requirements

*(Aucun pour ce cycle — scope volontairement resserré sur les 2 features.)*

## Out of Scope

| Feature | Raison |
|---------|--------|
| Champs matériel conditionnels selon le type ULD | Décision projet : uniformes pour tous types, simplicité de modèle |
| Tracking du filet sur les ULD | Toujours présent, pas besoin de le compter |
| Convention de nom "VRAC" dans le nom/ID de l'ULD | Remplacé par un type officiel, plus fiable (pas de faux positifs) |
| Azure Functions Core Tools pour tests locaux | Les features touchent uniquement le frontend — API non modifiée |
| Migration forcée des anciens manifestes vers nouveau format | Rétro-compatibilité suffit, pas besoin d'upgrade destructif |
| Multi-tenant, RBAC, stockage cloud | Hors scope projet (cf. PROJECT.md) |
| Modèle riche client `{ code, name, notes, address, contact }` | Déféré Phase 5 (D-01) — schéma plat suffit ; nouvelle phase si demande agents |
| Normalisation case clients (toUpperCase) | Déféré Phase 5 (D-04, D-05) — code brut tel que saisi, unicité case-sensitive |
| Regex stricte format code client | Déféré Phase 5 (D-04) — souplesse libre pour évolutions futures |
| Migration auto des manifestes legacy vers code | Déféré Phase 5 — rétro-compat read-only via option éphémère D-14 suffit |
| Recherche/filtre dans dropdown clients | Déféré Phase 5 — tri alphabétique suffit (< 50 entrées) |
| ETag/lock optimiste sur Blob clients | Déféré Phase 5 — last-write-wins acceptable (10x/jour, 1 agent à la fois) |
| Factorisation `lists.js` + `clients.js` en module générique | Déféré Phase 5 — prématuré, possible Phase 7+ si plus de cas d'usage |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MAT-01 | Phase 1 | Complete |
| MAT-02 | Phase 1 | Complete |
| MAT-03 | Phase 1 | Complete |
| MAT-04 | Phase 1 | Complete |
| MAT-05 | Phase 1 | Complete |
| MAT-06 | Phase 1 | Complete |
| MAT-07 | Phase 1 | Complete |
| MAT-08 | Phase 1 | Complete |
| MAT-09 | Phase 1 | Complete |
| MAT-10 | Phase 1 | Complete |
| MAT-11 | Phase 1 | Complete |
| MAT-12 | Phase 1 | Complete |
| MAT-13 | Phase 1 | Complete |
| MAT-14 | Phase 1 | Complete |
| VRAC-01 | Phase 2 | Complete |
| VRAC-02 | Phase 2 | Complete |
| VRAC-03 | Phase 2 | Complete |
| RECAP-01 | Phase 1 | Complete |
| RECAP-02 | Phase 1 | Complete |
| RECAP-03 | Phase 1 | Complete |
| TEST-01 | Phase 3 | Complete |
| TEST-02 | Phase 1 | Complete |
| TEST-03 | Phase 3 | Complete |
| LST-01 | Phase 4 | Complete |
| LST-02 | Phase 4 | Complete |
| LST-03 | Phase 4 | Complete |
| LST-04 | Phase 4 | Complete |
| LST-05 | Phase 4 | Complete |
| LST-06 | Phase 4 | Complete |
| LST-07 | Phase 4 | Complete |
| LST-08 | Phase 4 | Complete |
| LST-09 | Phase 4 | Complete |
| LST-10 | Phase 4 | Complete |
| LST-11 | Phase 4 | Complete |
| LST-12 | Phase 4 | Complete |
| LST-13 | Phase 4 | Complete |
| LST-14 | Phase 4 | Complete |
| LST-15 | Phase 4 | Complete |
| CLI-01 | Phase 5 | Not started |
| CLI-02 | Phase 5 | Not started |
| CLI-03 | Phase 5 | Not started |
| CLI-04 | Phase 5 | Not started |
| CLI-05 | Phase 5 | Not started |
| CLI-06 | Phase 5 | Not started |
| CLI-07 | Phase 5 | Not started |
| CLI-08 | Phase 5 | Not started |
| CLI-09 | Phase 5 | Not started |
| CLI-10 | Phase 5 | Not started |
| CLI-11 | Phase 5 | Not started |
| CLI-12 | Phase 5 | Not started |

**Coverage:**
- v1 requirements: 50 total (20 initial + 3 gap closure Phase 1 + 15 Phase 4 listes de distribution + 12 Phase 5 clients dropdown)
- Mapped to phases: 50 ✓
- Unmapped: 0

**Distribution:**
- Phase 1 (Matériel ULD & rétro-compat): 18 requirements (MAT-01..14, RECAP-01..03, TEST-02)
- Phase 2 (Type ULD VRAC): 3 requirements (VRAC-01..03)
- Phase 3 (Validation locale & release gate): 2 requirements (TEST-01, TEST-03)
- Phase 4 (Listes de distribution emails): 15 requirements (LST-01..15)
- Phase 5 (Codes client en dropdown maintenable): 12 requirements (CLI-01..12)

---
*Requirements defined: 2026-04-22*
*Last updated: 2026-05-19 — added CLI-01..12 (Phase 5 codes client en dropdown maintenable, calque Phase 4 Blob backend)*
