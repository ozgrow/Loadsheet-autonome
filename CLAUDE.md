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
- Donnees manifestes en localStorage (max 50, FIFO)
- PMC renomme en ULD partout
- Le logo ATH est en base64 dans logo.js (pas de fichier image servi)
- Azure SWA n'accepte qu'un seul `*` dans les exclude paths (pas de `**`)
- Azure SWA managed functions ne recoivent pas le header `Authorization` — utiliser `x-auth-token` + `_token` dans le body

## URL
- Production : https://nice-smoke-0ca8eb110.6.azurestaticapps.net
- Repo : https://github.com/ozgrow/Loadsheet-autonome
