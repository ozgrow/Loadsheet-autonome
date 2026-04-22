# Loadsheet-autonome

## Projet
Outil web de creation de loadsheets (feuilles de chargement) pour **ATH - Air Terminal Handling** a Paris Roissy CDG.
Permet aux agents de creer des manifestes avec des ULD, generer des PDF et envoyer par email.

## Stack technique
- **Frontend** : HTML/CSS/JS pur (pas de framework)
- **PDF** : jsPDF + jspdf-autotable (CDN)
- **Backend** : Azure Functions (Node.js) dans le dossier `api/`
- **Email** : SMTP via nodemailer (Azure Communication Services)
- **Deploiement** : Azure Static Web App (GitHub Actions auto-deploy sur push master)
- **Auth** : provisoire, mot de passe partage cote client (SHA-256) + JWT backend pour les API

## Structure
```
index.html                      # Page unique (SPA)
static/css/style.css            # Styles + media query mobile
static/js/app.js                # Logique app, ULD, PDF, email
static/js/auth.js               # Auth, rate limiting, JWT
static/js/logo.js               # Logo ATH en base64 (pour le PDF)
staticwebapp.config.json        # Config Azure SWA
api/
  login/index.js                # Azure Function - auth JWT
  send-email/index.js           # Azure Function - envoi SMTP
  generate-hash.js              # Utilitaire pour generer hash bcrypt
  package.json
.github/workflows/              # GitHub Actions (auto-generated par Azure)
```

## Variables d'environnement (Azure SWA > Configuration)
- `SMTP_HOST` — serveur SMTP (smtp.azurecomm.net)
- `SMTP_PORT` — port (587)
- `SMTP_USER` — identifiant SMTP
- `SMTP_PASS` — mot de passe SMTP
- `SMTP_FROM` — adresse d'envoi
- `SMTP_CC_DEFAULT` — CC par defaut ajoute a chaque email
- `JWT_SECRET` — secret pour signer les tokens JWT
- `AUTH_USERNAME` — identifiant pour l'API login
- `AUTH_PASSWORD_HASH` — hash bcrypt du mot de passe

## Commandes utiles
```bash
# Generer un hash bcrypt pour le mot de passe
cd api && node generate-hash.js "MonMotDePasse"

# Dev local
npx serve .

# Le deploiement est automatique sur push master
```

## Conventions
- Pas de framework frontend, JS vanilla uniquement
- CSS : desktop par defaut, mobile via `@media (max-width: 768px)`
- Version affichee : variable `APP_VERSION` dans app.js, visible sur login + app + PDF
- Donnees manifestes chiffrees en localStorage (AES-256-GCM + PBKDF2, max 50, FIFO)
- PMC renomme en ULD partout
- Le logo ATH est en base64 dans logo.js (pas de fichier image servi)
- Azure SWA n'accepte qu'un seul `*` dans les exclude paths (pas de `**`)
- Azure SWA managed functions ne recoivent pas le header `Authorization` — utiliser `x-auth-token` (header uniquement, pas de token dans le body)
- Toutes les donnees utilisateur injectees dans innerHTML doivent etre echappees via `esc()` (anti-XSS)
- Les fonctions de storage (getSavedManifests, saveManifest, loadManifest, deleteSavedManifest, refreshSavedList) sont async

## Securite
- **XSS** : fonction `esc()` dans app.js, obligatoire pour tout innerHTML avec donnees utilisateur
- **Chiffrement localStorage** : AES-256-GCM, cle derivee du mot de passe via PBKDF2 (100k iterations), salt en localStorage, cle en sessionStorage
- **Migration** : les anciennes donnees non-chiffrees (JSON array) sont auto-migrees au premier login
- **CSP** : Content-Security-Policy dans staticwebapp.config.json
- **Email** : validation regex des adresses + strip CRLF du sujet cote serveur
- **Auth** : ne JAMAIS mettre le mot de passe en clair dans les commentaires du code

## Tests
- Fichier : `tests/tests.html` — tests unitaires anti-regression executables dans le navigateur
- Protege par la meme auth session que l'app principale
- Lien discret en bas de page (index.html)
- **Regle** : toute nouvelle fonctionnalite ou modification doit etre accompagnee de tests correspondants dans tests.html
- Couvre : fonctions metier (ULD, colis, LTA, poids, save/load, FIFO), securite (XSS, donnees corrompues, chiffrement, session), et retro-compatibilite
- Les tests utilisant les fonctions storage doivent etre `await (async function() { ... })()`

## URL
- Production : https://nice-smoke-0ca8eb110.6.azurestaticapps.net
- Tests : https://nice-smoke-0ca8eb110.6.azurestaticapps.net/tests/tests.html
- Repo : https://github.com/ozgrow/Loadsheet-autonome

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Loadsheet-autonome**

Outil web de création de loadsheets (feuilles de chargement) pour ATH — Air Terminal Handling à Paris Roissy CDG. Les agents saisissent des manifestes avec ULD (palettes PMC et conteneurs), génèrent un PDF et l'envoient par email aux destinataires. Actuellement en production, utilisé quotidiennement par les agents ATH.

**Core Value:** **La saisie d'un manifeste doit aboutir à un PDF correct envoyé aux bons destinataires, sans perte de données.** Si tout le reste échoue, ce flux doit continuer à fonctionner — c'est l'outil opérationnel d'agents sur le terrain.

### Constraints

- **Tech stack** : JS vanilla uniquement — pas d'ajout de framework frontend. Respect des conventions CLAUDE.md.
- **Compatibility** : Les nouveaux champs ULD doivent être rétro-compatibles avec les manifestes déjà sauvegardés en localStorage chiffré (anciens objets ULD sans ces champs ne doivent pas casser `loadManifest`).
- **Security** : Toute nouvelle donnée utilisateur injectée en innerHTML doit passer par `esc()` — le nouveau "commentaire libre" est un vecteur XSS potentiel à traiter avec soin.
- **Déploiement** : Push `master` = prod. Tout test doit être en local (`npx serve .`) avant merge.
- **Tests** : Toute nouvelle fonctionnalité doit être couverte par des tests dans `tests/tests.html` (règle CLAUDE.md).
- **Mobile** : Les nouveaux champs dans le modal d'édition ULD doivent rester utilisables sur écran ≤ 768px.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
