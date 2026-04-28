# Phase 4: Listes de distribution emails (JSON Blob backend) — dev local d'abord - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 livre la **gestion (CRUD) de listes de distribution nommées d'adresses email** côté agent ATH, pour pré-remplir rapidement le champ `#recipients` lors de l'envoi de la loadsheet par email. Les listes sont **partagées entre tous les agents** (centralisées) et stockées dans un fichier JSON unique sur **Azure Blob Storage** en production.

**Stratégie dev local first :** pendant le développement, l'API stub utilise localStorage côté client. Le switch vers le vrai endpoint Azure Blob Storage se fait via une variable de mode (env ou flag) en fin de phase, après validation locale complète.

**Inclus :**
- Modèle de données (1 liste = nom + string d'emails séparés par virgules)
- UI modal CRUD accessible depuis la section "Envoi de la Loadsheet"
- Dropdown de sélection qui REMPLACE le contenu de `#recipients` lors de l'application
- Stub localStorage pendant dev + endpoint Azure Function `/api/recipients` pour prod
- JSON Blob `recipients-lists.json` sur Azure Blob Storage (Storage Account existant ou nouveau, à décider en research)
- Tests anti-régression dans `tests/tests.html`
- Validation regex des adresses au moment de la sauvegarde (réutilise `validateEmails` côté serveur)
- Mobile ≤ 768px responsive

**Hors scope (explicitement) :**
- Modèle riche (To/CC séparés, catégories, rôles par destinataire) — déféré
- Multi-sélection / combinaison de listes — déféré
- Recherche / filtre dans le dropdown — déféré (tri alphabétique simple suffit)
- Validation live pendant la frappe — déféré
- Modal de confirmation custom — `confirm()` natif suffit
- Toast / undo après suppression — déféré
- Migration depuis manifestes existants pour pré-peupler les listes — déféré
- ETag / lock optimiste sur le JSON Blob — last-write-wins acceptable à 10x/jour

</domain>

<decisions>
## Implementation Decisions

### Modèle de données
- **D-01:** Une liste de distribution = `{ id: string, name: string, recipients: string }` où `recipients` est une **string plate** au format `"a@b.com, c@d.com"` (même format que le champ `#recipients` existant). **Pas** de structure To/CC séparée — le champ `#cc` reste manuel à l'envoi.
- **D-02:** `id` = UUID généré côté client (réutiliser ou créer un helper équivalent à `crypto.randomUUID()` ; fallback `Date.now()+random` si pas dispo).
- **D-03:** Schema racine du fichier JSON Blob : **array d'objets** (pas d'objet keyed, pas de wrapper metadata).
  ```json
  [
    { "id": "a1b2c3...", "name": "Cargolux Paris", "recipients": "ops@cargolux.fr, manager@cargolux.fr" },
    { "id": "d4e5f6...", "name": "ATH Internal", "recipients": "ops@ath.fr" }
  ]
  ```

### UI — Localisation et accès
- **D-04:** Bouton **"≡ Listes ▾"** (ou label équivalent) ajouté à droite du champ `#recipients` dans la section `#generateSection` d'`index.html`. Click → ouvre le **modal CRUD**.
- **D-05:** Le modal CRUD est construit en **JS vanilla + CSS pur** (pas de librairie), pattern réutilisé du modal matériel ULD (`.material-modal-overlay` / `.material-modal`). Nouveau préfixe CSS : `.lists-modal-*`.
- **D-06:** Le modal contient :
  - En-tête avec titre "Listes de distribution" + bouton fermer
  - Tableau des listes existantes avec colonnes : Nom, Aperçu destinataires (tronqué), Actions (✎ Modifier / 🗑 Supprimer)
  - Bouton "+ Nouvelle liste"
  - Zone d'édition inline (ou modal secondaire) pour créer/modifier : 2 champs `<input name>` + `<textarea recipients>` + boutons "Annuler" / "Enregistrer"
- **D-07:** Layout du modal : grille 1 colonne sur mobile, largeur fixe ~600px sur desktop (cohérent avec le modal matériel).

### UX de sélection (application d'une liste)
- **D-08:** **Dropdown `<select>` natif** placé entre le champ `#recipients` et le bouton "Listes". L'option par défaut vide ("— Choisir une liste —"), puis les listes triées alphabétiquement par nom.
- **D-09:** Sélection d'une liste → **REMPLACE** intégralement la valeur de `#recipients`. Si l'agent veut combiner, il sélectionne une liste puis ajoute manuellement (pas de combinaison automatique).
- **D-10:** Le champ `#cc` n'est pas affecté par la sélection — toujours manuel. Cohérent avec D-01.
- **D-11:** Le dropdown se rafraîchit après chaque CRUD opération sur les listes (création/édition/suppression visible immédiatement).

### Validation
- **D-12:** Validation des adresses email **uniquement au moment de la sauvegarde** d'une liste (clic "Enregistrer"). Réutilise la même logique regex que `api/send-email/index.js validateEmails` (extraire en helper partageable JS — `static/js/email-validation.js` ou inline dans app.js).
- **D-13:** Si validation échoue : `alert()` listant les adresses invalides + le focus va sur le champ recipients du formulaire d'édition. Pas de validation pendant la frappe.
- **D-14:** Validation côté serveur (Azure Function `/api/recipients`) : revérifier les adresses au PUT — defensive depth.

### Persistance — Stratégie dev local + prod
- **D-15:** **Pendant dev (avant push prod)** : stub localStorage avec clé `'recipients-lists-dev'`. Pas de chiffrement (la donnée n'est pas sensible — c'est une liste d'emails déjà destinataires connus).
- **D-16:** **En prod** : Azure Function `/api/recipients` avec 2 endpoints :
  - `GET /api/recipients` → retourne le contenu actuel du Blob (array JSON)
  - `PUT /api/recipients` → remplace intégralement le contenu du Blob (last-write-wins)
  - Auth : header `x-auth-token` (JWT) cohérent avec `/api/send-email` existant (CLAUDE.md).
- **D-17:** Switch dev↔prod via une **constante en haut du nouveau module JS** (ex: `var LISTS_API_MODE = 'localStorage' | 'remote';`). Fin de phase : changer la constante à `'remote'` au moment du push prod. **PAS** de variable d'env runtime (pas de bundler).
- **D-18:** Le fichier Blob s'appelle `recipients-lists.json` dans un container dédié (nom à définir en research, ex: `loadsheet-data` ou réutilisation d'un container existant).
- **D-19:** Aucune migration / seed initial : la première lecture sur un Blob inexistant retourne `[]` (et au premier PUT, le fichier est créé).

### Suppression UX
- **D-20:** Click sur 🗑 → `confirm('Supprimer la liste "X" ?')` natif. Si OK → suppression immédiate (réutilise pattern `deleteSavedManifest`).
- **D-21:** Pas de undo / toast — confirmation suffit.

### Sécurité
- **D-22:** Anti-XSS : `name` et `recipients` injectés dans le DOM (table, dropdown options, textarea) DOIVENT passer par `esc()` partout en innerHTML. **Particulièrement critique** car `name` est un texte libre.
- **D-23:** L'auth JWT du backend `/api/recipients` doit utiliser le même secret JWT (`JWT_SECRET`) et même format que `/api/send-email` — réutilisable directement.
- **D-24:** CSP existant dans `staticwebapp.config.json` doit autoriser le nouvel endpoint `/api/recipients` (à vérifier — probablement déjà autorisé via `connect-src 'self'`).

### Tests
- **D-25:** Tests dans `tests/tests.html` (pattern existant, harness Node+JSDOM via `npm run verify`).
- **D-26:** Couverture minimum : (a) round-trip create/read/update/delete localStorage stub, (b) validation regex emails, (c) anti-XSS sur `name` et `recipients`, (d) tri alphabétique du dropdown, (e) sélection remplace bien `#recipients`, (f) UI mobile (modal full-screen, table responsive).
- **D-27:** Tests E2E lifecycle (suite `tests/e2e-lifecycle.test.html` ou nouvelle suite équivalente) : créer une liste, l'utiliser pour envoyer un email simulé.

### Mobile (≤ 768px)
- **D-28:** Modal CRUD en full-screen sur mobile (pattern matériel ULD). Tableau des listes : colonnes "Aperçu destinataires" tronquée plus agressivement, ou format card stacké.
- **D-29:** Le bouton "≡ Listes" reste accessible et lisible mobile (même classe `.btn-sm` que les boutons existants).

### Claude's Discretion
- Style exact du bouton "≡ Listes" (icône, label, position précise dans la rangée)
- HTML/CSS exact du modal (overlay, animation, focus trap basique)
- Nom de la fonction principale (`openListsModal`, `manageRecipientLists`, etc.)
- Format exact de l'aperçu destinataires dans le tableau (troncature 30 chars + "…" recommandé, à confirmer en planification)
- Helper UUID : `crypto.randomUUID()` natif si supporté, fallback simple sinon
- Choix entre extraction de la regex email dans un module partagé `email-validation.js` OU duplication minimale (fonction inline dans app.js qui réutilise le même regex string)
- Storage Account / Container Azure Blob Storage : à investiguer (réutilisation Azure Communication Services existant ou nouveau Storage Account)
- Nom exact de la nouvelle constante `LISTS_API_MODE` ou équivalent

### Folded Todos
None — pas de todos en attente liés à cette phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Vision, core value, contraintes prod
- `.planning/REQUIREMENTS.md` — Liste des requirements v1 (NB: phase 4 ajoutera de nouveaux REQ-IDs en planification — préfixe LST-* recommandé)
- `.planning/ROADMAP.md` §Phase 4 — Goal et description

### Project conventions
- `CLAUDE.md` §Conventions — JS vanilla, CSS desktop-first + media query 768px, mobile responsive
- `CLAUDE.md` §Sécurité — `esc()` obligatoire pour innerHTML, CSP, Azure SWA single * rule
- `CLAUDE.md` §Variables d'environnement — JWT_SECRET, AUTH_USERNAME, etc. (SMTP_HOST, etc.)
- `CLAUDE.md` §Tests — règle : toute nouvelle feature avec tests dans `tests/tests.html`
- `CLAUDE.md` §Release checklist — 7 étapes avant push master (dont npm run verify, scenario E2E)

### Code source à lire avant implémentation
- `static/js/app.js:1262-1380` (`sendEmail()`) — Pattern fetch /api/send-email avec JWT, gestion erreurs, points d'intégration champ recipients
- `static/js/app.js:439, 661, 727, 793-794` — usages existants de `#recipients` et `#cc` (init, collectData, loadManifest)
- `static/js/auth.js` (si existant) — Pattern JWT et `getJwt()` côté client
- `api/send-email/index.js` — Pattern Azure Function : auth header `x-auth-token`, parsing body, validation regex emails (`validateEmails`), réponses HTTP
- `api/send-email/index.js:25-95` (`validateEmails`) — **Source de vérité** pour le regex/parsing emails à réutiliser
- `index.html:111-120` (`#generateSection`) — Lieu d'intégration UI du bouton "≡ Listes" et dropdown
- `static/css/style.css` (.material-modal-*, @media 768px) — Pattern modal full-screen mobile à reproduire
- `staticwebapp.config.json` — CSP / routes Azure SWA, à vérifier autorisation `/api/recipients`
- `tests/tests.html` — Pattern de test pour nouvelle suite (harness Node+JSDOM)
- `tests/run-harness.cjs` (si existant) — Harness Node pour `npm run verify`

### Notes
- Pas d'ADR / spec externe au projet
- Le projet n'a pas de bundler — pas de variable d'env runtime côté frontend
- Pas de TypeScript — code JS vanilla pur
- Référence Azure : [Microsoft Learn — Azure Blob Storage REST API for Node.js](https://learn.microsoft.com/en-us/azure/storage/blobs/) à consulter en research (lecture/écriture d'un fichier JSON simple via SDK officiel `@azure/storage-blob`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`esc(str)` (app.js:16-19)** — fonction anti-XSS, utiliser systématiquement pour `name` et `recipients` injectés en DOM
- **Pattern modal `.material-modal-*`** (style.css:119-225) — overlay, layout grid, full-screen mobile à 768px, à dupliquer avec préfixe `.lists-modal-*` ou réutilisé/factorisé
- **Pattern fetch JWT** (app.js sendEmail ligne 1276+) — `getJwt()` + header `x-auth-token`, gestion erreurs 401, à reproduire pour `/api/recipients`
- **`validateEmails` (api/send-email/index.js)** — Source de vérité regex à réutiliser côté client ET serveur du nouvel endpoint
- **`confirm()` natif** (utilisé déjà dans `deleteSavedManifest`) — pattern à reproduire pour suppression liste

### Established Patterns
- **HTML inline dans app.js** : les nouveaux éléments DOM (modal CRUD) sont construits via `document.createElement` ou `innerHTML` direct dans une fonction `init` appelée au login. Pas de templating engine.
- **Storage frontend** : le projet utilise déjà localStorage chiffré pour les manifestes. Pour les listes, **pas besoin de chiffrement** (donnée non-sensible) — clair JSON dans localStorage pendant dev.
- **Azure Functions in `api/`** : pattern `module.exports = async function (context, req)`, lecture body, validation, réponse via `context.res = { status, body }`.
- **Tests harness** : pattern `suite('Foo', function() { test('bar', function() { assert(...); }); });` dans tests.html, exécutable browser ET Node via run-harness.cjs.

### Integration Points
- **`index.html:111-120`** — Section `#generateSection` : ajouter le bouton "≡ Listes" + dropdown entre `<input id="recipients">` et `<input id="cc">`.
- **`static/js/app.js:439, 727, 793-794`** — Pas de modification des points existants ; juste lecture/écriture du champ `#recipients` via `document.getElementById('recipients').value = ...` au moment de l'application d'une liste.
- **`api/`** — Nouveau dossier `api/recipients/` avec `index.js` + `function.json` (configuration Azure Function bindings).
- **`api/package.json`** — Ajouter dépendance `@azure/storage-blob` (Azure Blob Storage SDK officiel, ~50 KB).
- **`staticwebapp.config.json`** — Vérifier (et si nécessaire ajouter) la route `/api/recipients/*` dans la liste des routes autorisées et CSP.
- **`tests/tests.html`** — Nouvelle suite `Listes de distribution - *` avec ≥ 6 tests (CRUD localStorage stub, validation, XSS, tri, sélection, mobile).

</code_context>

<specifics>
## Specific Ideas

- **Bouton "≡ Listes ▾"** : préférence pour un label texte court avec une icône hamburger ou une flèche down indiquant l'action. Le rendu exact à la discrétion du planner.
- **Tronquage aperçu** : ~30 caractères dans la colonne "Aperçu" du tableau, puis "…" si plus long. Cohérent avec la troncature `uldComment` du récap inline (Phase 1).
- **Tri alphabétique** : `Array.prototype.sort` avec `localeCompare` pour gérer correctement les accents français (ex: "Élite" avant "Étoile").
- **Endpoint REST minimaliste** : `GET /api/recipients` (pas de query string), `PUT /api/recipients` (body = array JSON complet, pas de PATCH par item). Cohérent avec last-write-wins et 10x/jour.
- **Pas de plage de sécurité supplémentaire** : Azure Functions managed authentication + JWT vérifié côté server est suffisant. Pas de RBAC, pas de signed URLs.

</specifics>

<deferred>
## Deferred Ideas

- **Modèle riche (To/CC séparés, catégories, rôles)** — utile si les agents demandent plus tard à pré-remplir CC. Pour l'instant, le `#cc` manuel suffit (cas rare).
- **Multi-sélection de listes pour combiner** — utile si un envoi nécessite l'union de plusieurs groupes. Pas demandé actuellement.
- **Recherche / filtre dans le dropdown** — utile si la liste dépasse 50 entrées. Tri alphabétique suffit jusque-là.
- **Validation live pendant la frappe** — UX plus riche mais 30+ lignes JS supplémentaires. Pas justifié à 10x/jour.
- **Modal de confirmation custom pour suppression** — `confirm()` natif suffit.
- **Toast undo après suppression** — pattern moderne mais nouveau dans le projet, à introduire seulement si plusieurs features y gagnent.
- **Migration / seed initial des listes depuis les manifestes existants** — possible mais ajoute complexité ; les agents préfèrent probablement saisir manuellement leurs vrais groupes.
- **ETag / lock optimiste sur le Blob** — utile si plusieurs agents éditent simultanément. À 10x/jour avec probablement 1 agent à la fois, last-write-wins acceptable.
- **Listes par-utilisateur (privées) + listes globales** — actuellement toutes les listes sont partagées. Si besoin de listes privées plus tard → nouvelle phase avec auth user-aware.
- **Interface admin de purge / reset des listes** — si le fichier devient pollué un jour. Pas urgent.
- **Refactor de `validateEmails` en module partagé client+server** — actuellement décision laissée au planner (extraire ou dupliquer minimalement). Si refactor, l'aligner avec le pattern de packaging Azure Functions du projet.

</deferred>

---

*Phase: 04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord*
*Context gathered: 2026-04-28*
