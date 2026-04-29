# Phase 4: Listes de distribution emails (JSON Blob backend) — dev local d'abord - Research

**Researched:** 2026-04-28
**Domain:** Azure Static Web Apps managed Functions + Azure Blob Storage (JSON object), JS vanilla frontend, JWT auth, anti-XSS
**Confidence:** HIGH

## Summary

Phase 4 ajoute la **gestion CRUD de listes de distribution emails** partagées (côté agent ATH), persistées en Azure Blob Storage via une nouvelle Azure Function (`/api/recipients`) et exposées en frontend par un modal CRUD + dropdown qui remplace `#recipients`. La stratégie "dev local first" impose un stub localStorage pendant le développement, switchable vers le vrai endpoint via une constante `LISTS_API_MODE`.

Toutes les décisions structurelles sont déjà prises dans `04-CONTEXT.md` (29 décisions D-01..D-29). Cette recherche **ne ré-explore pas les alternatives** : elle consolide le **comment** technique — choix exact du SDK Azure (`@azure/storage-blob` 12.31.0), pattern code GET/PUT pour la Function, pattern frontend mode-switchable, structure de fichiers, REQ-IDs LST-* à ajouter à REQUIREMENTS.md, risques identifiés et tests recommandés.

**Primary recommendation:** Utiliser `@azure/storage-blob` 12.31.0 avec `BlobServiceClient.fromConnectionString()` + `BlockBlobClient.upload()`/`downloadToBuffer()`, gérer le 404 BlobNotFound en retournant `[]` (premier accès), réutiliser intégralement le pattern JWT/x-auth-token de `api/send-email/index.js`, et placer la nouvelle Function dans `api/recipients/` avec `function.json` HTTP trigger anonymous (auth fait dans le code).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Modèle de données**
- **D-01:** Une liste = `{ id: string, name: string, recipients: string }` où `recipients` est une **string plate** `"a@b.com, c@d.com"` (même format que `#recipients`). **Pas** de To/CC séparé — `#cc` reste manuel.
- **D-02:** `id` = UUID généré côté client (`crypto.randomUUID()`, fallback `Date.now()+random`).
- **D-03:** Schema racine du JSON Blob = **array d'objets** (pas d'objet keyed, pas de wrapper metadata).

**UI — Localisation et accès**
- **D-04:** Bouton **"≡ Listes ▾"** ajouté à droite de `#recipients` dans `#generateSection`. Click → modal CRUD.
- **D-05:** Modal CRUD en JS vanilla + CSS pur, pattern `.material-modal-*` réutilisé. Préfixe : `.lists-modal-*`.
- **D-06:** Contenu modal : titre + bouton fermer, tableau des listes (Nom / Aperçu / Actions ✎🗑), bouton "+ Nouvelle liste", zone d'édition inline (input name + textarea recipients + Annuler / Enregistrer).
- **D-07:** Layout : 1 colonne mobile, ~600px desktop.

**UX de sélection**
- **D-08:** Dropdown `<select>` natif entre `#recipients` et bouton "Listes". Option par défaut "— Choisir une liste —" + listes triées alphabétiquement par nom.
- **D-09:** Sélection → **REMPLACE** intégralement `#recipients` (pas de combinaison auto).
- **D-10:** `#cc` non affecté par la sélection — toujours manuel.
- **D-11:** Dropdown rafraîchi après chaque CRUD.

**Validation**
- **D-12:** Validation regex emails **uniquement au save**. Réutilise la regex de `api/send-email/index.js validateEmails`.
- **D-13:** Si validation échoue : `alert()` listant adresses invalides + focus sur recipients du formulaire.
- **D-14:** Validation côté serveur (Function `/api/recipients`) : revérifier au PUT (defense in depth).

**Persistance — dev local + prod**
- **D-15:** Dev : stub localStorage clé `'recipients-lists-dev'`. Pas de chiffrement (donnée non-sensible).
- **D-16:** Prod : Azure Function `/api/recipients` (GET retourne array, PUT remplace intégralement, last-write-wins). Auth `x-auth-token` (JWT) cohérent avec `/api/send-email`.
- **D-17:** Switch dev↔prod via constante `LISTS_API_MODE = 'localStorage' | 'remote'` en haut du module JS. **PAS** de variable d'env runtime.
- **D-18:** Blob = `recipients-lists.json` dans un container dédié (nom à préciser ici, voir Standard Stack).
- **D-19:** Pas de migration / seed initial : première lecture sur Blob inexistant → `[]`.

**Suppression UX**
- **D-20:** `confirm('Supprimer la liste "X" ?')` natif. OK → suppression immédiate.
- **D-21:** Pas de undo / toast.

**Sécurité**
- **D-22:** `name` et `recipients` injectés via `esc()` partout en innerHTML (DOM, dropdown, table, textarea).
- **D-23:** Auth JWT `/api/recipients` → même `JWT_SECRET` que `/api/send-email`.
- **D-24:** CSP existant dans `staticwebapp.config.json` autorise déjà `connect-src 'self'` → `/api/recipients` couvert.

**Tests**
- **D-25:** Tests dans `tests/tests.html` (harness Node+JSDOM via `npm run verify`).
- **D-26:** Couverture min : (a) round-trip CRUD localStorage stub, (b) validation regex emails, (c) anti-XSS sur name & recipients, (d) tri alphabétique dropdown, (e) sélection remplace `#recipients`, (f) UI mobile.
- **D-27:** Tests E2E lifecycle : créer liste → l'utiliser pour envoyer email simulé.

**Mobile (≤ 768px)**
- **D-28:** Modal full-screen mobile (pattern matériel ULD). Aperçu tronqué + format card stacké si nécessaire.
- **D-29:** Bouton "≡ Listes" responsive (classe `.btn-sm`).

### Claude's Discretion

- Style exact bouton "≡ Listes" (icône, label, position)
- HTML/CSS exact du modal (overlay, animation, focus trap basique)
- Nom fonction principale (`openListsModal`, `manageRecipientLists`, …)
- Format aperçu destinataires dans tableau (recommandé : 30 chars + "…")
- Helper UUID : `crypto.randomUUID()` natif si dispo, fallback simple
- Extraction regex email en module partagé `email-validation.js` OU duplication minimale inline
- Storage Account / Container Azure Blob Storage : à investiguer (recherche ci-dessous → recommandation)
- Nom exact constante `LISTS_API_MODE` ou équivalent

### Deferred Ideas (OUT OF SCOPE)

- Modèle riche (To/CC séparés, catégories, rôles)
- Multi-sélection / combinaison de listes
- Recherche / filtre dans le dropdown
- Validation live pendant la frappe
- Modal de confirmation custom (`confirm()` natif suffit)
- Toast / undo après suppression
- Migration / seed initial depuis manifestes existants
- ETag / lock optimiste (last-write-wins acceptable à 10x/jour)
- Listes par-utilisateur (privées) vs globales
- Interface admin de purge / reset
- Refactor `validateEmails` en module partagé client+server (laissé à la discrétion du planner)

</user_constraints>

## Project Constraints (from CLAUDE.md)

| # | Directive | Source |
|---|-----------|--------|
| C-1 | **JS vanilla uniquement** — pas de framework frontend | §Conventions |
| C-2 | **CSS desktop par défaut, mobile via `@media (max-width: 768px)`** | §Conventions |
| C-3 | **Toutes données utilisateur en innerHTML doivent passer par `esc()`** (anti-XSS) | §Sécurité |
| C-4 | **Azure SWA managed Functions ne reçoivent pas le header `Authorization`** — utiliser **`x-auth-token`** | §Conventions |
| C-5 | **Auth JWT** : signer avec `JWT_SECRET`, vérifier dans chaque Function | §Conventions, code `api/send-email/index.js` |
| C-6 | **Toute nouvelle feature → tests dans `tests/tests.html`** | §Tests |
| C-7 | **Release checklist (7 étapes) avant push master** : `npm run verify` (0 FAIL), `npm run dev` à http://localhost:4000, scénario E2E manuel, push, post-deploy email test | §Release checklist |
| C-8 | **Azure SWA n'accepte qu'un seul `*` dans exclude paths** (pas `**`) | §Conventions |
| C-9 | **CSP** dans `staticwebapp.config.json` — `connect-src 'self'` couvre déjà `/api/recipients` | §Sécurité, fichier `staticwebapp.config.json` |
| C-10 | **JAMAIS mot de passe en clair** dans commentaires code | §Sécurité |
| C-11 | **Pas de bundler** côté frontend → toute config = constantes JS source-controlled | §Conventions implicites |

<phase_requirements>
## Phase Requirements

> NB : ces REQ-IDs sont **proposés** par cette recherche (préfixe LST-* recommandé par le contexte). Le planner doit les valider et les ajouter à `.planning/REQUIREMENTS.md` (section "v2 Requirements" ou nouvelle section "Phase 4 Requirements") avant la décomposition en plans.

| ID | Description | Research Support |
|----|-------------|------------------|
| **LST-01** | L'utilisateur peut **créer** une liste de distribution avec un nom et une string d'emails séparés par virgules | D-01, D-02, D-06 ; pattern frontend `manageRecipientLists()` + appels CRUD wrapper |
| **LST-02** | L'utilisateur peut **lire/lister** toutes les listes existantes (triées alphabétiquement) | D-08, D-11 ; SDK `containerClient.getBlockBlobClient(name).downloadToBuffer()` + tri `localeCompare` |
| **LST-03** | L'utilisateur peut **modifier** une liste existante (nom et/ou recipients) | D-06 ; PUT remplace intégralement le JSON Blob (last-write-wins) |
| **LST-04** | L'utilisateur peut **supprimer** une liste avec confirmation native `confirm()` | D-20, D-21 ; pattern existant `deleteSavedManifest` |
| **LST-05** | Un **bouton "≡ Listes"** ouvre le modal CRUD depuis `#generateSection` | D-04, D-29 ; ajout HTML dans `index.html:111-120` |
| **LST-06** | Un **dropdown `<select>`** placé à côté de `#recipients` permet d'**appliquer une liste** (remplace intégralement la valeur) | D-08, D-09, D-10 |
| **LST-07** | Pendant le développement, le stub **localStorage** (clé `recipients-lists-dev`) sert de backend ; le switch vers le **vrai endpoint** se fait via la constante `LISTS_API_MODE` | D-15, D-17 ; constante en haut du nouveau module JS |
| **LST-08** | En production, l'endpoint **`/api/recipients` (GET + PUT)** persiste les listes dans **Azure Blob Storage** (`recipients-lists.json` dans un container dédié) | D-16, D-18 ; SDK `@azure/storage-blob` v12.31.0 |
| **LST-09** | L'API `/api/recipients` exige un **JWT** envoyé via header `x-auth-token` (cohérent `/api/send-email`) | D-23, C-4, C-5 ; copie de `verifyToken(req)` |
| **LST-10** | Les emails sont **validés au save** (regex), côté client ET côté serveur. Si invalide → `alert()` listant adresses invalides | D-12, D-13, D-14 ; regex source de vérité = `api/send-email/index.js validateEmails` |
| **LST-11** | Les champs `name` et `recipients` sont **anti-XSS** : passés par `esc()` partout en innerHTML (table, dropdown, modal) | D-22, C-3 ; pattern `esc()` app.js:22 |
| **LST-12** | Le **premier GET** sur un Blob inexistant retourne `[]` sans erreur (404 BlobNotFound traité comme état initial vide) | D-19 ; SDK pattern `try { downloadToBuffer() } catch (e if statusCode===404) { return []; }` |
| **LST-13** | Le modal CRUD reste **utilisable et lisible sur mobile (≤ 768px)** : full-screen ou layout adapté | D-07, D-28, C-2 |
| **LST-14** | Tests anti-régression dans `tests/tests.html` : CRUD round-trip localStorage stub, validation, XSS, tri, sélection, mobile | D-25, D-26, C-6 |
| **LST-15** | Test E2E lifecycle : créer une liste, l'utiliser pour pré-remplir `#recipients` avant envoi email simulé | D-27 |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@azure/storage-blob` | **12.31.0** (verified `npm view` 2026-04-28) | SDK officiel JS pour Azure Blob Storage | Recommandation Microsoft Learn ; seul SDK supporté pour Node ≥ 20 ; intègre `BlobServiceClient.fromConnectionString()` + `BlockBlobClient.upload()`/`downloadToBuffer()` |
| `jsonwebtoken` | `^9.0.0` (déjà installé) | Vérification JWT côté Function | Réutilisation directe du pattern `api/send-email/index.js` |

### Supporting

Aucun. Tout le reste (`bcryptjs`, `nodemailer`) est utilisé par d'autres Functions et n'est pas requis pour `/api/recipients`.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@azure/storage-blob` SDK | Bindings input/output Blob d'Azure Functions (déclaratif via `function.json`) | Bindings élégants pour cas trivial, mais **mauvaise gestion du 404** (le binding échoue si le blob n'existe pas, pas de `try/catch`). SDK manuel est plus flexible et explicite. **Locked: SDK manuel.** |
| `@azure/storage-blob` SDK | `node-fetch` + REST API Azure Storage signée à la main | Pas de dépendance ajoutée, mais 80+ lignes pour générer signature SAS / Shared Key vs 5 lignes avec SDK. **Locked: SDK.** |
| Azure Blob Storage | Azure Cosmos DB (free tier 1000 RU/s + 25 GB) | Cosmos = écriture par item, atomic. Mais 60+ lignes Function vs 25 et coût opérationnel léger inutile à 10x/jour. **Locked: Blob (cf. ROADMAP STATE).** |

**Installation:**
```bash
cd api
npm install @azure/storage-blob@^12.31.0
```

**Version verification (2026-04-28):**
- `npm view @azure/storage-blob version` → **12.31.0**
- Last published : **2026-03-19** (recent, actively maintained)
- `engines.node` : **>=20.0.0**
- Unpacked size : **~15 MB** (transitive deps incluses : `@azure/core-*`, `@azure/abort-controller`, `tslib`)
- Azure SWA managed Functions runtime : Node 20 LTS ✓ compatible

**Bundle size impact (cold start) :** ~15 MB unpacked sur disque, mais l'impact réel sur Functions cold start est **modéré** : Azure Functions Node v4 charge les modules CJS à la demande, et le SDK fait du tree-shaking via `dist/commonjs/index.js`. Sur la même Function App qui charge déjà `nodemailer` (~10 MB) et `bcryptjs`, l'overhead est acceptable. Pas de mesure précise — à monitorer post-deploy si la latence devient problématique (très improbable à 10 req/jour).

## Architecture Storage Account

### Décision : nouveau Storage Account vs réutilisation

**Constat (vérifié) :**
- Le projet utilise déjà **Azure Communication Services** pour SMTP (cf. CLAUDE.md §Variables d'environnement). Azure Communication Services **n'expose pas** de Storage Account public.
- Azure SWA **managed Functions** n'ont **pas** de Storage Account associé par défaut (contrairement à un Function App standalone qui exige `AzureWebJobsStorage`). Confirmé par [Microsoft Learn — Configure application settings for Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/application-settings) : seules les variables d'environnement définies via Settings → Environment variables sont disponibles.

**Donc : il faut créer un nouveau Storage Account dédié.**

### Pattern recommandé

| Resource | Nom suggéré | Type / Tier |
|----------|-------------|-------------|
| Storage Account | `loadsheetautonome` (3-24 chars, lowercase, alphanumériques) | **General Purpose v2**, **LRS** (Locally Redundant), **Hot** access tier |
| Container | `loadsheet-data` | Access level : **Private** (no anonymous access) — l'API Function lit/écrit avec credentials |
| Blob | `recipients-lists.json` | Block blob, ~quelques KB |

### Coût

Vérifié via [Azure Free Services](https://azure.microsoft.com/en-us/pricing/free-services) :
- **5 GB LRS hot block blob storage** + **20 000 reads + 10 000 writes/mois** sont **always-free** (pas seulement les 12 premiers mois).
- À 10 listes éditées par jour avec un fichier ~1 KB, on est **largement sous le seuil gratuit** (≈ 300 reads/writes/mois × 1 KB).
- Si dépassement : tarif **~0.018 USD/GB/mois** (négligeable à cette échelle).

**Pas de coût opérationnel attendu pour Phase 4.**

### Variables d'environnement à ajouter (Azure SWA → Settings → Environment variables)

| Variable | Valeur | Source |
|----------|--------|--------|
| `STORAGE_CONNECTION_STRING` | Connection string complète du Storage Account (format `DefaultEndpointsProtocol=https;AccountName=loadsheetautonome;AccountKey=…;EndpointSuffix=core.windows.net`) | Azure Portal → Storage Account → Security + networking → Access keys → key1 → Connection string |
| `RECIPIENTS_CONTAINER` *(optionnel — défaut hardcodé acceptable)* | `loadsheet-data` | Constante côté Function ; surchargeable via env si besoin |
| `RECIPIENTS_BLOB_NAME` *(optionnel)* | `recipients-lists.json` | Constante côté Function |

> **Note sécurité :** la connection string contient l'AccountKey complète qui donne tous les droits sur le compte. Acceptable pour ce projet (1 Storage Account dédié à un usage unique). Pour durcissement futur (déféré) : Managed Identity + RBAC `Storage Blob Data Contributor` sur le container uniquement.

### CORS

**Pas besoin de configurer CORS côté Storage Account** : tous les appels Blob viennent de la Function (server-side). Le browser n'appelle jamais directement Azure Storage.

## Architecture Patterns

### Recommended Project Structure

```
api/
├── login/                       # existant
├── send-email/                  # existant
├── recipients/                  # NOUVEAU
│   ├── function.json            # HTTP trigger anonymous, methods GET+PUT
│   └── index.js                 # GET + PUT handler, JWT verify, validateEmails, Blob SDK
├── _shared/                     # OPTIONNEL (Claude's discretion D-12)
│   └── validateEmails.js        # extraction regex partagée client/server (à arbitrer en plan)
├── package.json                 # +@azure/storage-blob
└── generate-hash.js             # existant

static/js/
├── app.js                       # existant — ajouter une zone "Listes de distribution"
├── auth.js                      # existant
├── lists.js                     # NOUVEAU — module CRUD listes (LISTS_API_MODE switch + helpers)
└── logo.js                      # existant

index.html                       # +bouton "≡ Listes" + dropdown dans #generateSection (lignes 111-120)
static/css/style.css             # +.lists-modal-* styles + media query 768px
tests/tests.html                 # +suite "Listes de distribution" (≥ 7 tests)
staticwebapp.config.json         # vérifier — probablement aucune modification (CSP connect-src 'self' couvre déjà /api/recipients)
```

> **Note :** le découpage `static/js/lists.js` séparé vs tout dans `app.js` est laissé à la **discrétion du planner**. Recommandation research : module séparé pour limiter la taille de `app.js` (déjà ~1400 lignes) et faciliter les tests unitaires. Le module doit être chargé **avant** `auth.js` dans `index.html` si `initApp()` doit l'invoquer.

### Pattern 1: Azure Function GET + PUT minimal (`api/recipients/index.js`)

**What:** une seule Function gérant les 2 méthodes HTTP via `req.method`.
**When to use:** endpoint REST minimaliste, last-write-wins, pas de PATCH.
**Example:**

```javascript
// api/recipients/index.js
// Source: https://learn.microsoft.com/en-us/javascript/api/overview/azure/storage-blob-readme
//         https://github.com/Azure/azure-sdk-for-js/issues/77 (404 BlobNotFound handling)
var jwt = require("jsonwebtoken");
var { BlobServiceClient } = require("@azure/storage-blob");

var CONTAINER = process.env.RECIPIENTS_CONTAINER || "loadsheet-data";
var BLOB_NAME = process.env.RECIPIENTS_BLOB_NAME || "recipients-lists.json";

// --- Auth (pattern identique à send-email/index.js) ---
function verifyToken(req) {
  var token = req.headers["x-auth-token"] || null;
  if (!token) {
    var auth = req.headers["authorization"] || "";
    token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  }
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch (e) { return null; }
}

// --- Validation (regex source de vérité — copie de send-email validateEmails) ---
var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var angleBracketRegex = /<([^>]+)>/;
function validateEmails(str) {
  return String(str || '').split(/[,;]/).map(function(e) { return e.trim(); })
    .filter(Boolean).map(function(e) {
      var m = angleBracketRegex.exec(e);
      return m ? m[1].trim() : e;
    }).filter(function(e) { return emailRegex.test(e); });
}

// --- Validation lists payload ---
function validateLists(payload) {
  if (!Array.isArray(payload)) return { ok: false, error: "Payload doit être un array." };
  for (var i = 0; i < payload.length; i++) {
    var l = payload[i];
    if (!l || typeof l !== 'object') return { ok: false, error: "Liste " + i + " invalide." };
    if (typeof l.id !== 'string' || !l.id) return { ok: false, error: "Liste " + i + " : id manquant." };
    if (typeof l.name !== 'string' || !l.name.trim()) return { ok: false, error: "Liste " + i + " : nom manquant." };
    if (typeof l.recipients !== 'string') return { ok: false, error: "Liste " + i + " : recipients manquant." };
    // Defense in depth (D-14) : revalider les emails au PUT
    var raw = l.recipients.split(/[,;]/).map(function(e){return e.trim();}).filter(Boolean);
    var valid = validateEmails(l.recipients);
    if (raw.length !== valid.length) {
      return { ok: false, error: "Liste \"" + l.name + "\" contient des adresses invalides." };
    }
  }
  return { ok: true };
}

// --- Storage helpers ---
function getBlockBlobClient() {
  var conn = process.env.STORAGE_CONNECTION_STRING;
  if (!conn) throw new Error("STORAGE_CONNECTION_STRING manquante.");
  var svc = BlobServiceClient.fromConnectionString(conn);
  var container = svc.getContainerClient(CONTAINER);
  return container.getBlockBlobClient(BLOB_NAME);
}

async function readLists() {
  var bbc = getBlockBlobClient();
  try {
    var buf = await bbc.downloadToBuffer();
    var parsed = JSON.parse(buf.toString('utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // D-19 : Blob inexistant au premier accès → état initial vide
    if (err.statusCode === 404 || (err.details && err.details.errorCode === 'BlobNotFound')) {
      return [];
    }
    throw err;
  }
}

async function writeLists(lists) {
  var bbc = getBlockBlobClient();
  var body = JSON.stringify(lists);
  // upload(body, contentLength, options) — overwrite par défaut pour BlockBlob
  await bbc.upload(body, Buffer.byteLength(body, 'utf-8'), {
    blobHTTPHeaders: { blobContentType: 'application/json; charset=utf-8' }
  });
}

// --- Main handler ---
module.exports = async function (context, req) {
  var user = verifyToken(req);
  if (!user) {
    context.res = { status: 401, body: { error: "Non autorise." } };
    return;
  }

  try {
    if (req.method === 'GET') {
      var lists = await readLists();
      context.res = { status: 200, headers: { "Content-Type": "application/json" }, body: lists };
      return;
    }

    if (req.method === 'PUT') {
      var body = req.body;
      var v = validateLists(body);
      if (!v.ok) {
        context.res = { status: 400, body: { error: v.error } };
        return;
      }
      await writeLists(body);
      context.res = { status: 200, body: { success: true, count: body.length } };
      return;
    }

    context.res = { status: 405, body: { error: "Method not allowed." } };
  } catch (err) {
    context.log.error("Recipients error:", err.message);
    context.res = { status: 500, body: { error: "Erreur stockage: " + err.message } };
  }
};
```

**`api/recipients/function.json`** (pattern identique à `send-email/function.json`) :

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "put"],
      "route": "recipients"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

> **Note `authLevel: "anonymous"`** : c'est le pattern existant du projet (`send-email/function.json` ligne 4). L'authentification réelle est faite **dans le code** via JWT, pas par le système de clés Azure Functions. Cohérent avec C-4/C-5.

### Pattern 2: Frontend wrapper switchable (`static/js/lists.js`)

**What:** wrapper CRUD qui aiguille entre localStorage stub et fetch `/api/recipients` selon `LISTS_API_MODE`.
**When to use:** dev local sans Azure Functions Core Tools (le projet n'utilise pas `func start`), tests sans backend.
**Example:**

```javascript
// static/js/lists.js
// Source: pattern fetch JWT issu de app.js sendEmail (lignes 1276-1382)

// --- Mode switch (D-17) ---
// Changer en 'remote' au moment du push prod final.
var LISTS_API_MODE = 'localStorage'; // 'localStorage' | 'remote'
var LISTS_LOCAL_KEY = 'recipients-lists-dev';
var LISTS_API_URL = '/api/recipients';

// --- UUID helper (D-02) ---
function listUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// --- Email validation (D-12, mirror api/recipients/index.js validateEmails) ---
var LIST_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var LIST_ANGLE_REGEX = /<([^>]+)>/;
function listValidateEmails(str) {
  return String(str || '').split(/[,;]/).map(function(e){ return e.trim(); })
    .filter(Boolean).map(function(e) {
      var m = LIST_ANGLE_REGEX.exec(e);
      return m ? m[1].trim() : e;
    }).filter(function(e) { return LIST_EMAIL_REGEX.test(e); });
}
function listInvalidEmails(str) {
  var raw = String(str || '').split(/[,;]/).map(function(e){ return e.trim(); }).filter(Boolean);
  var valid = listValidateEmails(str);
  return raw.filter(function(e) {
    var m = LIST_ANGLE_REGEX.exec(e);
    var addr = m ? m[1].trim() : e;
    return valid.indexOf(addr) === -1;
  });
}

// --- Backend: localStorage stub ---
function _localGet() {
  try {
    var raw = localStorage.getItem(LISTS_LOCAL_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
}
function _localPut(lists) {
  localStorage.setItem(LISTS_LOCAL_KEY, JSON.stringify(lists));
}

// --- Backend: remote (Azure Function) ---
async function _remoteGet() {
  var jwt = typeof getJwt === 'function' ? getJwt() : null;
  if (!jwt) throw new Error('Session expirée.');
  var res = await fetch(LISTS_API_URL, {
    method: 'GET',
    headers: { 'x-auth-token': jwt }
  });
  if (!res.ok) throw new Error('GET /api/recipients ' + res.status);
  return await res.json();
}
async function _remotePut(lists) {
  var jwt = typeof getJwt === 'function' ? getJwt() : null;
  if (!jwt) throw new Error('Session expirée.');
  var res = await fetch(LISTS_API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': jwt },
    body: JSON.stringify(lists)
  });
  if (!res.ok) {
    var err = await res.json().catch(function(){ return {}; });
    throw new Error(err.error || ('PUT /api/recipients ' + res.status));
  }
}

// --- Public API (mode-aware) ---
async function listsGetAll() {
  return LISTS_API_MODE === 'remote' ? await _remoteGet() : _localGet();
}
async function listsSaveAll(lists) {
  if (LISTS_API_MODE === 'remote') await _remotePut(lists);
  else _localPut(lists);
}

// --- CRUD operations ---
async function listsCreate(name, recipients) {
  var trimmedName = String(name || '').trim();
  var trimmedRcpts = String(recipients || '').trim();
  if (!trimmedName) throw new Error('Nom requis.');
  var invalid = listInvalidEmails(trimmedRcpts);
  if (invalid.length > 0) throw new Error('Adresses invalides : ' + invalid.join(', '));

  var all = await listsGetAll();
  all.push({ id: listUuid(), name: trimmedName, recipients: trimmedRcpts });
  await listsSaveAll(all);
  return all;
}

async function listsUpdate(id, name, recipients) { /* ... */ }
async function listsDelete(id) { /* ... */ }

// --- Sort helper (D-08) ---
function listsSorted(all) {
  return all.slice().sort(function(a, b) {
    return String(a.name).localeCompare(String(b.name), 'fr', { sensitivity: 'base' });
  });
}
```

> **Note pattern :** la même fonction `listValidateEmails` est dupliquée intentionnellement dans `lists.js` (frontend) et `api/recipients/index.js` (backend) — le projet n'a pas de bundler ni de système de modules partagés cross-frontend/backend. La regex est identique aux deux endroits, donc défense en profondeur.
>
> **Alternative discrétionnaire (D-12 Claude's Discretion) :** extraire la regex dans un fichier statique `static/js/email-validation.js` chargé par `index.html`, ET dans `api/_shared/validateEmails.js` chargé par `api/recipients/index.js` ET `api/send-email/index.js`. Plus DRY mais 2 fichiers à maintenir au lieu de duplications inline. À arbitrer dans le plan.

### Pattern 3: Modal CRUD HTML inline (intégration dans app.js ou lists.js)

**What:** modal full-screen mobile + 600px desktop, pattern réutilisé `.material-modal-*`.
**When to use:** UI cohérente avec le modal matériel ULD existant.
**Example:** structure similaire à `openMaterialModal()` (app.js:33+) : créer un overlay `.lists-modal-overlay` + container `.lists-modal`, populer un `<table>` listant les listes existantes (avec `esc()` sur name + recipients), bouton "+ Nouvelle liste" qui swap la vue vers le formulaire d'édition (input name + textarea recipients), boutons "Annuler" / "Enregistrer". Tous les `innerHTML` qui injectent des données utilisateur DOIVENT passer par `esc()`.

```javascript
// Extrait illustratif — anti-XSS
function renderListsTable(lists) {
  var sorted = listsSorted(lists);
  var rowsHtml = sorted.map(function(l, idx) {
    var preview = l.recipients.length > 30 ? l.recipients.slice(0, 30) + '…' : l.recipients;
    return '<tr>' +
      '<td>' + esc(l.name) + '</td>' +
      '<td>' + esc(preview) + '</td>' +
      '<td>' +
        '<button onclick="listsOpenEdit(\'' + esc(l.id) + '\')">✎</button>' +
        '<button onclick="listsConfirmDelete(\'' + esc(l.id) + '\', \'' + esc(l.name).replace(/'/g, '\\\'') + '\')">🗑</button>' +
      '</td></tr>';
  }).join('');
  document.getElementById('listsTable').innerHTML = rowsHtml;
}
```

> **⚠️ Anti-XSS critique** : passer un `id` ou un `name` en argument d'`onclick` via concaténation est un vecteur XSS si l'`id` contient des `'` ou `\`. Recommandation **forte** : utiliser le pattern existant `_savedIds[idx]` (cf. `app.js:807`) — stocker les IDs dans un array module-scoped et passer l'`idx` (entier sûr) à l'onclick. Le planner doit retenir ce pattern.

### Anti-Patterns to Avoid

- **Concaténer un `id` ou `name` directement dans `onclick="...id..."`** → vecteur XSS si la chaîne contient `'` ou `"`. Utiliser le pattern `_savedIds[idx]` array module-scoped (existant `app.js:13`).
- **Injecter `recipients` dans un `<textarea>` via `innerHTML`** → XSS via `</textarea><script>…`. Préférer `textarea.value = data` (pattern existant pour `uldComment`, cf. STATE.md decision Phase 01 ligne 79).
- **Ne pas gérer le 404 BlobNotFound côté Function** → l'API plante au premier accès en prod. Le SDK `downloadToBuffer()` lève une `RestError` avec `statusCode === 404` au premier accès — toujours wrapper dans un `try/catch` qui retourne `[]`.
- **Oublier `Buffer.byteLength(body, 'utf-8')` au upload** → caractères multi-bytes (accents, `é`, `→`) tronqueraient le blob (`String.length` ≠ bytes UTF-8).
- **Garder `LISTS_API_MODE = 'localStorage'` au push prod** → l'agent ne voit jamais ses listes en prod (pas de partage). Inscrire dans la **Release checklist Phase 4** un item explicite : "Switcher `LISTS_API_MODE` à `'remote'` AVANT push final".

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentification Azure Storage | Génération SAS / signature Shared Key à la main | `BlobServiceClient.fromConnectionString()` | 80+ lignes vs 1 ; signature HMAC-SHA256 avec date format strict, error-prone |
| Lecture/écriture Blob via REST API | Appels `node-fetch` vers `https://{account}.blob.core.windows.net/{container}/{blob}` avec headers `x-ms-version`, `x-ms-date`, `Authorization` | `BlockBlobClient.upload()` + `downloadToBuffer()` | Headers exacts versionnés, SDK gère le retry, le streaming, les 304 |
| Détection 404 sur Blob inexistant | Parser le body XML d'erreur Azure | `try/catch` sur `err.statusCode === 404` ou `err.details.errorCode === 'BlobNotFound'` | SDK normalise `RestError` ; check explicite documenté ([GitHub issue #77](https://github.com/Azure/azure-storage-js/issues/77)) |
| Validation email | Re-créer une regex / parser RFC 5322 | Réutiliser `validateEmails` existant (`api/send-email/index.js:33-42`) | Source de vérité projet, déjà testée en prod, gère format `"Name <a@b.com>"` |
| UUID generation | Réécrire `Math.random()`-based en s'inspirant de StackOverflow | `crypto.randomUUID()` natif (Node 16+, browsers modernes) avec fallback | RFC 4122 v4 compliant out-of-the-box |
| Tri alphabétique avec accents français | Comparer `.toLowerCase()` brut | `String.prototype.localeCompare(b, 'fr', { sensitivity: 'base' })` | "Élite" / "Étoile" / "etoile" triés correctement |
| HTML escape | Implémenter sa propre fonction | Réutiliser `esc()` (app.js:22) | Fonction projet existante, déjà partout |
| Modal overlay / focus trap | Inventer | Réutiliser pattern `.material-modal-*` (style.css) | Cohérence UX, déjà mobile-friendly |

**Key insight:** la valeur ajoutée de Phase 4 est **l'intégration et le câblage**, pas la réinvention de primitives. Tous les morceaux existent déjà soit dans `@azure/storage-blob`, soit dans le code projet. Le plan doit en tirer parti et ajouter un minimum de code custom.

## Runtime State Inventory

> Phase 4 ajoute un **nouveau** flux (pas un rename ni un refactor). Cette section reste pertinente car elle documente les nouveaux états à provisionner.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **Nouveau Blob `recipients-lists.json` à créer** dans le container `loadsheet-data`. État initial vide acceptable (D-19). | Aucune migration ; le premier PUT crée le fichier. |
| Live service config | Aucune dépendance externe en dehors d'Azure Storage. SMTP / Communication Services intacts. | Aucun changement aux services existants. |
| OS-registered state | None — verified by code review (pas de pm2 / Task Scheduler / cron). | None |
| Secrets/env vars | **Nouvelle variable `STORAGE_CONNECTION_STRING`** à ajouter dans Azure SWA → Settings → Environment variables. `JWT_SECRET` réutilisé tel quel. | Ajout en post-deploy (étape Release checklist). |
| Build artifacts | `api/node_modules/@azure/storage-blob` à installer après `npm install`. Le `.gitignore` du projet exclut déjà `node_modules` (vérifier — pattern standard). | `cd api && npm install` après pull. |

## Common Pitfalls

### Pitfall 1: Connection string manquante en prod → 500 silencieux

**What goes wrong:** au premier appel `/api/recipients`, la Function plante avec `process.env.STORAGE_CONNECTION_STRING` undefined. Le frontend reçoit un 500 générique sans message clair.
**Why it happens:** la variable d'env doit être ajoutée manuellement dans Azure SWA → Settings → Environment variables ET le service redémarré (changement automatique en SWA, mais peut prendre quelques minutes).
**How to avoid:** code de la Function vérifie explicitement la présence (cf. pattern `getBlockBlobClient()` qui throw `STORAGE_CONNECTION_STRING manquante.`). Inclure dans la Release checklist Phase 4 un item "Vérifier que `STORAGE_CONNECTION_STRING` est settée AVANT push final".
**Warning signs:** premier GET en prod renvoie 500 avec body `{ error: "Erreur stockage: STORAGE_CONNECTION_STRING manquante." }`.

### Pitfall 2: 404 BlobNotFound traité comme erreur fatale au premier accès

**What goes wrong:** le SDK `downloadToBuffer()` lève une `RestError` au premier accès (Blob jamais créé). Sans `try/catch` ciblé sur `statusCode === 404`, l'API renvoie 500 et le frontend affiche "Erreur stockage" au premier login.
**Why it happens:** D-19 décide explicitement que premier accès = état initial vide. Mais le SDK ne fait pas cette distinction par défaut.
**How to avoid:** wrapper `readLists()` qui catch et retourne `[]` sur 404. Pattern code fourni ci-dessus.
**Warning signs:** test E2E "premier login sur Blob vide" échoue ; logs Function : `BlobNotFound`.

### Pitfall 3: Concaténation `id`/`name` dans `onclick="..."` → XSS

**What goes wrong:** un attaquant (ou un utilisateur ATH copy-pastant un nom de liste contenant `'`) crée une liste nommée `Cargolux'); listsDelete('xxx`. Le rendu `onclick="listsOpenEdit('Cargolux'); listsDelete('xxx')"` exécute du JS arbitraire.
**Why it happens:** `esc()` échappe `'` en `&#39;` pour le contenu textuel d'un élément, mais **pas** pour un attribut JS. L'`id` UUID est sûr (`crypto.randomUUID()` ne produit que `[0-9a-f-]`), mais le `name` est utilisateur-libre.
**How to avoid:** **suivre le pattern `_savedIds[idx]` du projet existant** (app.js:13, 807). Stocker les IDs dans un array module-scoped et passer l'`idx` (entier) à l'onclick : `onclick="listsOpenEdit(_listIds[5])"`. Aucune string utilisateur ne traverse jamais l'attribut.
**Warning signs:** test XSS dédié dans `tests.html` qui crée une liste avec un nom contenant `'<script>` ne déclenche jamais `_xss++`.

### Pitfall 4: Last-write-wins → perte silencieuse en édition concurrente

**What goes wrong:** Agent A ouvre le modal et liste 3 listes. Agent B crée une 4ème liste pendant ce temps. Agent A enregistre une modification → son PUT remplace intégralement le Blob avec ses 3 listes (sans la 4ème de B). La liste de B disparaît.
**Why it happens:** D-CONTEXT explicite : `last-write-wins acceptable à 10x/jour` (CONTEXT.md ligne 31).
**How to avoid (mitigations dans le scope Phase 4) :**
1. **Refresh à l'ouverture du modal** : recharger les listes depuis le backend au moment d'ouvrir, pas depuis un cache local.
2. **Refresh juste avant le PUT** : option défensive — re-lire avant écrire et merger. **Hors scope Phase 4** mais à documenter comme évolution future si la collision devient observable.
3. Documenter le risque dans la VERIFICATION.md Phase 4 (visible pour audit futur).
**Warning signs:** rapport utilisateur "j'ai créé une liste, elle a disparu". À 10x/jour avec ~1 agent simultané, probabilité est marginale.

### Pitfall 5: Caractères UTF-8 multi-bytes tronqués au upload

**What goes wrong:** un nom de liste contenant `Élite` ou `→` est uploadé avec `body.length` (caractères Unicode) au lieu de `Buffer.byteLength(body, 'utf-8')` (octets UTF-8). Le blob contient un JSON tronqué illisible.
**Why it happens:** le SDK signature `upload(body, contentLength, options)` attend des **bytes**, pas des caractères. `String.length` retourne des unités UTF-16 ≠ bytes UTF-8.
**How to avoid:** toujours utiliser `Buffer.byteLength(body, 'utf-8')`. Pattern code fourni ci-dessus.
**Warning signs:** GET retourne JSON malformé après PUT contenant un caractère accentué.

### Pitfall 6: Switch `LISTS_API_MODE` oublié au push final

**What goes wrong:** le développeur teste tout en local avec `LISTS_API_MODE = 'localStorage'`, push, et chaque agent en prod voit ses propres listes localStorage (pas de partage). Le pretendu "partagé entre agents" est cassé.
**Why it happens:** D-17 retient explicitement la constante manuelle (pas d'env var runtime). C'est un trade-off acceptable mais fragile.
**How to avoid:**
1. Inscrire dans la **Release checklist Phase 4** un item explicite : "Modifier `LISTS_API_MODE` à `'remote'` AVANT le push final".
2. Test E2E manuel post-deploy : créer une liste sur PC A, vérifier qu'elle apparaît sur PC B.
3. **Optionnel** : ajouter un commentaire bloquant en haut de `lists.js` : `// !!! Avant push prod : vérifier LISTS_API_MODE === 'remote'`.
**Warning signs:** post-deploy test "agent A crée liste, agent B ne la voit pas".

### Pitfall 7: Bundle SDK Azure ralentit cold start Function

**What goes wrong:** `@azure/storage-blob` + transitive deps (~15 MB unpacked) augmentent le temps de cold start de la Function App. À 10 req/jour, chaque appel peut être un cold start.
**Why it happens:** Azure SWA managed Functions tournent sur un plan Consumption sans pre-warming.
**How to avoid:**
1. **Mesurer post-deploy** : si le premier GET est > 3s, le coût est réel. Sinon, pas de problème.
2. Utiliser l'import sélectif `var { BlobServiceClient } = require("@azure/storage-blob");` (déjà dans le pattern code).
3. **Hors scope Phase 4** : passer à un Function App dédié (BYOF) avec Always On si la latence devient inacceptable.
**Warning signs:** premier appel chaque matin > 5s ; appels suivants < 200ms.

## Code Examples

### Exemple 1: GET liste listes côté Function

```javascript
// Source: extrait du Pattern 1 ci-dessus
// Réf: https://learn.microsoft.com/en-us/javascript/api/overview/azure/storage-blob-readme
async function readLists() {
  var bbc = getBlockBlobClient();
  try {
    var buf = await bbc.downloadToBuffer();
    var parsed = JSON.parse(buf.toString('utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.statusCode === 404 || (err.details && err.details.errorCode === 'BlobNotFound')) {
      return [];
    }
    throw err;
  }
}
```

### Exemple 2: PUT avec calcul correct des bytes UTF-8

```javascript
// Source: BlockBlobClient.upload signature — Azure SDK docs
async function writeLists(lists) {
  var bbc = getBlockBlobClient();
  var body = JSON.stringify(lists);
  await bbc.upload(body, Buffer.byteLength(body, 'utf-8'), {
    blobHTTPHeaders: { blobContentType: 'application/json; charset=utf-8' }
  });
}
```

### Exemple 3: Frontend wrapper mode-aware

```javascript
// Source: extrait du Pattern 2 ci-dessus
async function listsGetAll() {
  return LISTS_API_MODE === 'remote' ? await _remoteGet() : _localGet();
}
async function listsSaveAll(lists) {
  if (LISTS_API_MODE === 'remote') await _remotePut(lists);
  else _localPut(lists);
}
```

### Exemple 4: Tri alphabétique français

```javascript
// Source: MDN Intl.Collator / String.prototype.localeCompare
function listsSorted(all) {
  return all.slice().sort(function(a, b) {
    return String(a.name).localeCompare(String(b.name), 'fr', { sensitivity: 'base' });
  });
}
```

### Exemple 5: Pattern anti-XSS array de IDs (module-scoped)

```javascript
// Source: app.js:13 _savedIds, app.js:807-825 (refreshSavedList)
// Évite la concaténation d'IDs/names utilisateur dans onclick=
var _listIds = [];

function renderListsTable(lists) {
  _listIds = lists.map(function(l) { return l.id; });
  var html = lists.map(function(l, idx) {
    var preview = l.recipients.length > 30 ? l.recipients.slice(0, 30) + '…' : l.recipients;
    return '<tr>' +
      '<td>' + esc(l.name) + '</td>' +
      '<td>' + esc(preview) + '</td>' +
      '<td>' +
        '<button onclick="listsOpenEdit(_listIds[' + idx + '])">✎</button>' +
        '<button onclick="listsConfirmDelete(_listIds[' + idx + '])">🗑</button>' +
      '</td></tr>';
  }).join('');
  document.getElementById('listsTable').innerHTML = html;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `azure-storage` (legacy SDK npm) | `@azure/storage-blob` v12.x | 2019 (v12.0.0 GA) | Le legacy `azure-storage` est en maintenance only. Tous nouveaux projets doivent utiliser `@azure/storage-blob`. |
| Connection string en clair | Managed Identity + RBAC | Best practice 2022+ | Plus sûr en environnements multi-tenant. **Hors scope Phase 4** (1 Storage Account dédié, projet mono-app). |
| Azure Functions Node v3 (script-based) | Azure Functions Node v4 (programming model) | 2023 GA | SWA managed Functions supportent les deux. Le projet est **v3** (pattern `module.exports = async function (context, req) {…}` + `function.json`) — conserver pour cohérence. |

**Deprecated/outdated:**
- Pattern `azure-storage` legacy : ne pas utiliser
- `BlockBlobURL` (SDK v10) : remplacé par `BlockBlobClient` (v12)

## Open Questions

1. **Refactor de `validateEmails` en module partagé client+server**
   - What we know : D-12 Claude's Discretion explicite — choix laissé au planner. La regex est identique aux deux endroits.
   - What's unclear : valeur du refactor vs simplicité de duplication minimale. À 2 endroits avec une regex de 1 ligne, le DRY est marginal.
   - Recommandation : **dupliquer inline** dans Phase 4 (KISS, pas de nouveau pattern de packaging à introduire). Si une 3ème Function ou un 3ème module en a besoin → extraire à ce moment-là.

2. **Découpage `static/js/lists.js` séparé vs tout dans `app.js`**
   - What we know : aucune décision contextuelle. Le projet n'a pas de bundler.
   - What's unclear : seuil à partir duquel `app.js` devient trop gros (déjà ~1400 lignes).
   - Recommandation : **module séparé `static/js/lists.js`** pour limiter la taille de `app.js`, charger via `<script src="/static/js/lists.js"></script>` AVANT `auth.js` dans `index.html`. Le harness Node+JSDOM `tests/run-harness.cjs` doit aussi charger ce fichier (à modifier : ligne 17).

3. **Gestion concurrence (last-write-wins)**
   - What we know : CONTEXT.md ligne 31 explicite "ETag / lock optimiste sur le JSON Blob — last-write-wins acceptable à 10x/jour". C'est un risque assumé.
   - What's unclear : à quel seuil d'usage le risque deviendrait inacceptable.
   - Recommandation : documenter le risque dans VERIFICATION.md Phase 4. Si le projet observe une perte de données, ouvrir une nouvelle phase pour ajouter ETag (`If-Match` header sur PUT).

4. **Bouton "≡ Listes" — emplacement exact dans `#generateSection`**
   - What we know : D-04 le place à droite de `#recipients`. Mais `index.html:111-120` montre que `#recipients` est suivi de `#cc` puis de la rangée de boutons d'actions.
   - What's unclear : doit-on insérer le bouton entre `#recipients` et `#cc`, ou entre `#recipients` et son `<input>` ? Layout exact à choisir.
   - Recommandation : placer le bouton + dropdown SUR la même ligne que `#recipients` (input + dropdown + bouton sur 1 ligne flex), au-dessus de `#cc`. Layout flex responsive.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `npm install`, harness tests, Azure Functions runtime | ✓ (présumé local + Azure) | ≥ 20 (Azure SWA managed) | — |
| `npm` | Installer `@azure/storage-blob` | ✓ | ≥ 8 | — |
| `@azure/storage-blob` | Function `/api/recipients` | ✗ (à installer) | À installer 12.31.0 | — |
| Azure Storage Account | Backend prod | ✗ (à créer) | General Purpose v2, LRS, Hot | **Stub localStorage** pendant tout le dev (D-15) — fallback intégré au design |
| Azure SWA `STORAGE_CONNECTION_STRING` env var | Function en prod | ✗ (à configurer post-deploy) | — | Aucun ; étape obligatoire avant switch `LISTS_API_MODE = 'remote'` |
| `npx serve` | Dev local | ✓ (déjà dans `package.json` scripts) | — | — |
| jsdom (run-harness) | `npm run verify` | ✓ (déjà installé) | — | — |
| Azure Functions Core Tools | Tests Function en local | ✗ | — | **Pas requis** : la couverture localStorage stub couvre 95% ; le mode `'remote'` est vérifié via test E2E manuel post-deploy (cohérent Phase 3 D-08). |

**Missing dependencies with no fallback:**
- Azure Storage Account + connection string en prod → étape de provisioning obligatoire (documentée dans Pitfall 1 et Release checklist).

**Missing dependencies with fallback:**
- Tout le reste a un chemin clair. Le design "dev local first" résout par construction la dépendance Azure pendant le développement.

## Tests recommandés (couverture minimum)

> Le projet a `nyquist_validation: false` dans `.planning/config.json` → pas de section Validation Architecture formelle. Mais la règle CLAUDE.md C-6 exige des tests dans `tests/tests.html` pour toute nouvelle feature.

### Suite "Listes de distribution - localStorage stub" (mode dev)

Le harness Node+JSDOM force `LISTS_API_MODE = 'localStorage'` (cf. `run-harness.cjs:46-48` qui stub déjà `getJwt`). Tests :

| # | Test | Cible LST-* |
|---|------|-------------|
| T1 | round-trip create : `listsCreate("Cargolux", "ops@cargolux.fr")` → `listsGetAll()` retourne 1 entrée avec id, name, recipients corrects | LST-01 |
| T2 | round-trip update : créer puis `listsUpdate(id, "Cargolux Paris", "ops@cargolux.fr, manager@cargolux.fr")` → `listsGetAll()` reflète l'update | LST-03 |
| T3 | round-trip delete : créer 2, delete 1, `listsGetAll()` retourne 1 | LST-04 |
| T4 | validation OK : `listValidateEmails("a@b.com, c@d.com")` retourne `["a@b.com", "c@d.com"]` | LST-10 |
| T5 | validation échec : `listInvalidEmails("a@b.com, INVALID")` retourne `["INVALID"]` | LST-10 |
| T6 | XSS name : créer une liste avec name `<script>alert(1)</script>'<img src=x>` ; `renderListsTable()` injecte le résultat dans le DOM ; vérifier `_xss === 0` (pattern existant) | LST-11 |
| T7 | XSS recipients : créer une liste avec recipients `</textarea><script>x</script>` ; vérifier que le textarea du modal d'édition contient la chaîne brute (pas exécutée) | LST-11 |
| T8 | Tri alphabétique français : injecter `["Étoile", "Cargolux", "Élite"]` ; `listsSorted()` retourne `["Cargolux", "Élite", "Étoile"]` | LST-02 (tri) |
| T9 | Sélection remplace `#recipients` : DOM avec `<input id="recipients" value="old@x.com">` ; appeler la fonction d'application d'une liste avec `recipients = "new@y.com"` ; vérifier `document.getElementById('recipients').value === "new@y.com"` | LST-06 |
| T10 | Confirmation suppression : stub `confirm()` retourne `false` ; appeler `listsConfirmDelete(id)` ; vérifier que la liste existe encore | LST-04 |
| T11 | UUID generation : `listUuid()` retourne une chaîne unique non vide ; 1000 appels → 1000 UUIDs distincts | LST-01 (id) |
| T12 | Premier GET sur localStorage vide : `listsGetAll()` retourne `[]` (pas null/undefined) | LST-12 |
| T13 | Persistence localStorage clé correcte : créer une liste ; vérifier `localStorage.getItem('recipients-lists-dev')` parse en array de 1 entrée | LST-07 |
| T14 | Mobile : non couvert par harness Node+JSDOM (pas de viewport simulation) — vérifier en E2E manuel via DevTools responsive mode 375px | LST-13 |

### Suite "Listes de distribution - E2E lifecycle" (D-27)

| # | Test | Cible |
|---|------|-------|
| E1 | Créer manifeste avec 1 ULD complet ; ouvrir modal listes ; créer "Test Recipients" avec `test@example.com` ; fermer modal ; sélectionner "Test Recipients" dans dropdown ; vérifier `#recipients.value === "test@example.com"` ; appeler `sendEmail()` (stub fetch retourne 200) ; vérifier `_alertLog` contient "Email envoye avec succes !" | LST-15 |

### Tests **non couverts** par le harness

- **Mode `'remote'`** : non testé en automatisé (le mode dev = localStorage suffit). Vérification manuelle E2E post-deploy en prod.
- **Function backend `/api/recipients`** : non testée en isolation (pas de framework Mocha pour `api/`). Validation par scénario E2E manuel post-deploy.

## Risques identifiés + mitigations

| # | Risque | Sévérité | Mitigation |
|---|--------|----------|------------|
| R1 | `STORAGE_CONNECTION_STRING` non configurée en prod → 500 au premier appel | High | Item explicite dans Release checklist Phase 4 ; code Function vérifie présence et message d'erreur clair. |
| R2 | Switch `LISTS_API_MODE` oublié au push prod | High | Item explicite Release checklist + commentaire bloquant en haut de `lists.js` + test E2E post-deploy "agent A crée, agent B voit". |
| R3 | XSS via `name` dans `onclick` | Medium-High | Pattern `_listIds[idx]` array module-scoped (cf. `_savedIds`) ; test T6 dédié. |
| R4 | 404 BlobNotFound non géré → 500 silencieux | Medium | `try/catch` ciblé `statusCode === 404` ; documenté Pitfall 2. |
| R5 | Last-write-wins → perte de listes en édition concurrente | Low (à 10x/jour, ~1 agent simultané) | Refresh à l'ouverture du modal ; documenter comme évolution future. |
| R6 | Cold start Function ralenti par bundle SDK | Low (10 req/jour acceptable) | Mesure post-deploy ; BYOF si critique (hors scope). |
| R7 | UTF-8 multi-bytes tronqués au upload | Medium | `Buffer.byteLength(body, 'utf-8')` partout ; test E2E manuel avec liste nommée "Élite". |
| R8 | Régression sur `sendEmail()` existant | High (core value du projet) | Ne PAS modifier `app.js sendEmail()` ; juste lire `#recipients.value` après application de la liste. Tests existants Phase 1/2/3 doivent rester verts. |
| R9 | CSP bloque `/api/recipients` | Low | `connect-src 'self'` couvre déjà ; vérifier dans Release checklist (étape 4 scénario E2E). |
| R10 | Storage Account non créé → l'agent ne peut rien faire en prod | High | Provisioning manuel documenté dans la VERIFICATION.md ; PRE-PROD: créer Storage Account avant push. |

## Sources

### Primary (HIGH confidence)
- [Azure Storage Blob client library for JavaScript — Microsoft Learn](https://learn.microsoft.com/en-us/javascript/api/overview/azure/storage-blob-readme?view=azure-node-latest) — pattern complet `BlobServiceClient.fromConnectionString()`, `getBlockBlobClient()`, `upload()`, `download()`. Mise à jour 2026-02-11. Tag SDK : `@azure/storage-blob_12.31.0`.
- [BlockBlobClient class | Microsoft Learn](https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob/blockblobclient?view=azure-node-latest) — signature `upload(body, contentLength, options)`, `downloadToBuffer()`.
- [Azure Static Web Apps Frequently Asked Questions](https://learn.microsoft.com/en-us/azure/static-web-apps/faq) — confirme que managed Functions supportent HTTP triggers (cas du projet).
- [Configure application settings for Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/application-settings) — pattern Settings → Environment variables pour `STORAGE_CONNECTION_STRING`.
- [Explore Free Azure Services](https://azure.microsoft.com/en-us/pricing/free-services) — confirme 5 GB LRS hot blob always-free + 20 000 reads + 10 000 writes/mois.
- [Bring your own functions to Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/functions-bring-your-own) — confirme que managed functions sont OK pour HTTP-only (cas du projet) ; BYOF nécessaire seulement si triggers non-HTTP.
- Code source projet : `api/send-email/index.js`, `api/login/index.js`, `static/js/app.js`, `index.html`, `staticwebapp.config.json`, `tests/run-harness.cjs`.
- `npm view @azure/storage-blob version` (vérifié 2026-04-28) → 12.31.0, published 2026-03-19.

### Secondary (MEDIUM confidence)
- [GitHub issue azure-storage-js #77 — Gracefully handle 404 of reading from blob](https://github.com/Azure/azure-storage-js/issues/77) — pattern `try/catch` avec `err.statusCode === 404` / `err.details.errorCode === 'BlobNotFound'`. Discussion communautaire confirmée par documentation officielle.
- [Storage Blob error codes (REST API)](https://learn.microsoft.com/en-us/rest/api/storageservices/blob-service-error-codes) — référence canonique `BlobNotFound`.
- [npm @azure/storage-blob](https://www.npmjs.com/package/@azure/storage-blob) — version 12.31.0 publiée 2026-03-19, deps confirmées.

### Tertiary (LOW confidence — for context only)
- WebSearch results sur Azure Free Tier 2025-26 : confirment 5 GB always-free mais pages tierces — verified contre Microsoft Learn officiel.
- [Stackademic — A Guide to Storing JSON Object Data in Azure Blob Storage](https://stackademic.com/blog/a-guide-to-storing-json-object-data-in-azure-blob-storage) — pattern blog confirmant l'approche `JSON.stringify` + `upload()` ; non-canonical mais cohérent avec docs officielles.

## Metadata

**Confidence breakdown:**
- Standard stack (`@azure/storage-blob` 12.31.0) : **HIGH** — version vérifiée via `npm view`, doc officielle 2026-02-11, pattern code direct du README Microsoft Learn.
- Architecture Storage Account : **HIGH** — coût et capacité always-free confirmés via Azure pricing officiel, pattern SWA env vars confirmé via Microsoft Learn.
- Pattern code Function GET/PUT : **HIGH** — copie directe du pattern existant `api/send-email/index.js` + extraits du README Azure SDK officiel.
- Pattern code frontend mode-switchable : **HIGH** — copie directe du pattern fetch JWT existant `app.js sendEmail()`.
- Pitfalls : **HIGH** — basés sur sources canoniques (Microsoft Learn, GitHub issues officiels Azure SDK).
- REQ-IDs LST-* : **MEDIUM** — proposition par cette recherche, à valider par planner.
- Découpage modules (lists.js séparé) : **MEDIUM** — recommandation justifiée mais discrétionnaire.

**Research date:** 2026-04-28
**Valid until:** 2026-07-28 (90 jours pour `@azure/storage-blob`, SDK stable, peu de churn ; les decisions du projet (D-01..D-29) restent valides indépendamment de la durée de la recherche).
