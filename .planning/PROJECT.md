# Loadsheet-autonome

## What This Is

Outil web de création de loadsheets (feuilles de chargement) pour ATH — Air Terminal Handling à Paris Roissy CDG. Les agents saisissent des manifestes avec ULD (palettes PMC et conteneurs), génèrent un PDF et l'envoient par email aux destinataires. Actuellement en production, utilisé quotidiennement par les agents ATH.

## Core Value

**La saisie d'un manifeste doit aboutir à un PDF correct envoyé aux bons destinataires, sans perte de données.** Si tout le reste échoue, ce flux doit continuer à fonctionner — c'est l'outil opérationnel d'agents sur le terrain.

## Requirements

### Validated

<!-- Shipped and confirmed valuable — dérivé de l'app actuellement en prod. -->

- ✓ Saisie d'un manifeste avec infos LTA (numéro, origine, destination, poids, colis) — existing
- ✓ Ajout / édition / suppression d'ULD (palettes PMC + conteneurs) dans un manifeste — existing
- ✓ Génération PDF du manifeste avec logo ATH (jsPDF + jspdf-autotable) — existing
- ✓ Envoi du PDF par email via SMTP Azure Communication Services — existing
- ✓ Validation regex des adresses email (support séparateur `;` et format `<email>`) — existing (v1.7.4)
- ✓ Sauvegarde locale des manifestes (chiffré AES-256-GCM + PBKDF2, max 50 FIFO) — existing
- ✓ Auth session par mot de passe partagé (SHA-256 client + bcrypt/JWT backend) — existing
- ✓ Anti-XSS par `esc()` sur tout innerHTML utilisateur — existing
- ✓ CSP configurée côté Azure SWA — existing
- ✓ Responsive mobile (media query 768px) — existing
- ✓ Tests anti-régression navigateur (`tests/tests.html`) — existing
- ✓ Saisie d'infos matériel sur chaque ULD (sangles, planchers bois EU/standard, bois de calage, bâches, intercalaires, nid d'abeille, commentaire libre) via modal d'édition ULD — Validated in Phase 1 (v1.8.x)
- ✓ Affichage des infos matériel ULD dans le récap écran (condensé inline), PDF, et email HTML — Validated in Phase 1 (v1.8.x)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Ajouter un type ULD officiel "VRAC" dans le sélecteur de type
- [ ] Exclure les ULD de type "VRAC" du compteur palette dans le récapitulatif
- [ ] Afficher le VRAC sur une ligne séparée dans le récapitulatif (colis + poids, sans compter comme palette)
- [ ] Tester l'ensemble en local (`npx serve`) avant tout déploiement production

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Migration vers un framework frontend (React/Vue) — JS vanilla est un choix assumé, changer casserait la stack Azure SWA simple
- Authentification multi-utilisateur / RBAC — mot de passe partagé couvre le besoin actuel des agents ATH
- Stockage cloud des manifestes — localStorage chiffré suffit ; un backend de persistance ajouterait coût et complexité non justifiés
- Suivi du filet sur les ULD — toujours présent, pas besoin de tracker
- Tests end-to-end en local des Azure Functions (`api/`) — ce cycle teste uniquement le frontend ; les features ajoutées ne touchent pas les API

## Context

**Environnement technique :**
- Frontend HTML/CSS/JS vanilla (pas de framework), livré par Azure Static Web App
- PDF via jsPDF + jspdf-autotable (CDN)
- Backend Azure Functions Node.js dans `api/` (login, send-email)
- Déploiement auto sur push `master` via GitHub Actions

**Utilisateurs :**
- Agents ATH à Roissy CDG, souvent en mobilité (d'où le responsive mobile)
- Usage quotidien en production — toute régression a un impact opérationnel direct

**Historique récent :**
- v1.7.4 : fix validation email (séparateur `;` + format angle brackets)
- v1.7.3 : fix tests XSS et échappement `</script>` dans les chaînes JS
- v1.7.x : durcissement sécurité (chiffrement localStorage, CSP, anti-XSS)

**Préoccupation majeure pour ce cycle :**
L'app est en prod. Les deux features (infos matériel + fix VRAC) touchent à la saisie ULD et au récapitulatif — zones utilisées intensivement. Test local obligatoire avant push master.

## Constraints

- **Tech stack** : JS vanilla uniquement — pas d'ajout de framework frontend. Respect des conventions CLAUDE.md.
- **Compatibility** : Les nouveaux champs ULD doivent être rétro-compatibles avec les manifestes déjà sauvegardés en localStorage chiffré (anciens objets ULD sans ces champs ne doivent pas casser `loadManifest`).
- **Security** : Toute nouvelle donnée utilisateur injectée en innerHTML doit passer par `esc()` — le nouveau "commentaire libre" est un vecteur XSS potentiel à traiter avec soin.
- **Déploiement** : Push `master` = prod. Tout test doit être en local (`npx serve .`) avant merge.
- **Tests** : Toute nouvelle fonctionnalité doit être couverte par des tests dans `tests/tests.html` (règle CLAUDE.md).
- **Mobile** : Les nouveaux champs dans le modal d'édition ULD doivent rester utilisables sur écran ≤ 768px.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Infos matériel appliquées à **tous types d'ULD** (palettes + conteneurs) | Simplicité de modèle : pas de logique conditionnelle par type. L'utilisateur laisse les champs vides si non pertinent. | — Pending |
| VRAC = **type ULD officiel** (ajout au sélecteur) | Détection fiable sans faux positifs vs convention de nommage `"VRAC"` dans le nom. Plus robuste. | — Pending |
| Saisie via **modal d'édition ULD existant** | Réutilise l'UX existante, pas de nouveau flux à apprendre pour les agents. | — Pending |
| VRAC apparaît en **ligne séparée "Vrac"** dans le récapitulatif | Visibilité du fret vrac (poids, colis) sans fausser le compteur palette. | — Pending |
| Tests en local via `npx serve` **sans Azure Functions Core Tools** | Les features touchent uniquement au frontend (UI, PDF, récapitulatif). Pas besoin de tester les API locales pour ce cycle. | — Pending |
| Planchers bois : **nombre OU "forfait négocié"** | Deux modes de facturation réels côté ATH — la saisie doit refléter les deux cas. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-23 after Phase 1 completion (Matériel ULD & rétro-compat)*
