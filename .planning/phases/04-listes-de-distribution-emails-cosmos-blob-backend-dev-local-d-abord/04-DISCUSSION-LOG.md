# Phase 4: Listes de distribution emails - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord
**Areas discussed:** Data model, UI lieu, Selection UX, Dev local, Validation, Delete UX, JSON schema, Tri/recherche

---

## Pre-discussion (sourced from earlier conversation before /gsd:discuss-phase)

| Décision | Source |
|----------|--------|
| Backend = JSON Blob Azure Storage (vs Cosmos DB ou Table Storage) | User request "le prix du table azure storage semble trés faible et plus simple ? ou le json ?" + Claude tradeoff analysis |
| Volume = ~10x/jour | User: "uniquement avec une utilisation de 10x par jour seulement" |
| Listes partagées entre tous les agents (centralisées) | User: "entre tous les agents" |
| Last-write-wins acceptable (pas d'ETag) | Claude proposal accepted by user via JSON Blob choice |
| Petit formulaire CRUD | User: "petit formulaire pour pouvoir ajouter ou modifier des listes" |
| Dev local first | User: "(reste en local pour la phase dev)" |

---

## Data model (D-01..D-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Nom + liste plate d'emails (Recommended) | Une liste = un nom + une string de destinataires (même format que #recipients existant). Au moment de l'appliquer, le contenu remplit le champ #recipients ; le champ CC reste manuel. | ✓ |
| Nom + To + CC séparés | Une liste = un nom + 2 strings (To et CC). Au moment de l'appliquer, les deux champs sont pré-remplis. Plus complet mais double la saisie pour chaque liste. | |
| Nom + tableau structuré d'objets {email, role} | Plus puissant mais surdimensionné pour 10x/jour. | |

**User's choice:** Nom + liste plate d'emails (Recommended)
**Notes:** Cohérent avec le format actuel du champ `#recipients`. Champ `#cc` reste manuel.

---

## UI lieu (D-04..D-07)

| Option | Description | Selected |
|--------|-------------|----------|
| Modal accessible depuis la section envoi (Recommended) | Bouton "Gérer mes listes" dans la section "Envoi de la Loadsheet" → ouvre un modal avec table des listes + boutons CRUD. Pattern cohérent avec le modal matériel ULD existant. | ✓ |
| Page dédiée via lien dans la topbar | Lien "Mes listes" dans la topbar à côté de "Nouveau manifeste" / "Déconnexion". | |
| Inline dropdown avec bouton "Gérer" | Le dropdown a un bouton "Gérer" qui déplie une zone d'édition inline. | |

**User's choice:** Modal accessible depuis la section envoi (Recommended)
**Notes:** Réutilise le pattern modal matériel ULD (Phase 1). Modal full-screen mobile.

---

## Selection UX (D-08..D-11)

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown qui REMPLACE le contenu de #recipients (Recommended) | Sélection d'une liste → #recipients est complètement remplacé. Si l'agent veut combiner, il choisit une liste puis ajoute manuellement. Simple et prévisible. | ✓ |
| Dropdown qui AJOUTE à #recipients | Sélection → emails de la liste sont appendés au champ existant. Permet de combiner plusieurs listes mais risque de doublons. | |
| Multi-sélection (checkbox dans dropdown) | L'agent coche plusieurs listes, valide, et le champ est rempli avec l'union. Plus puissant mais plus de clics. | |

**User's choice:** Dropdown qui REMPLACE le contenu de #recipients (Recommended)
**Notes:** Comportement le plus prévisible. Les combinaisons rares se font manuellement.

---

## Dev local (D-15..D-19)

| Option | Description | Selected |
|--------|-------------|----------|
| Stub localStorage pendant dev (Recommended) | Pendant le dev, l'API /api/recipients lit/écrit dans localStorage clé 'dev-recipients-lists'. Switch vers Blob Storage en fin de phase via une env var ou un flag. Aucune infra requise pour développer. | ✓ |
| Azure Functions Core Tools + Azurite | Lancer `func start` + Azurite (émulateur Storage) en local. Test exact du flow prod, mais ajoute 2 dépendances NPM lourdes et complexifie le `npm run dev`. | |
| Fichier JSON local servi par npx serve | API stub lit/écrit `dev-data/recipients.json` via Functions locales. Nécessite Functions Core Tools. | |

**User's choice:** Stub localStorage pendant dev (Recommended)
**Notes:** Switch dev↔prod via constante en haut du module JS. Pas de bundler, pas de variable d'env runtime.

---

## Validation des emails (D-12..D-14)

| Option | Description | Selected |
|--------|-------------|----------|
| Au moment de sauvegarder la liste (Recommended) | Quand l'agent clique "Enregistrer la liste", on vérifie que toutes les adresses passent le regex (la même que api/send-email validateEmails). Si invalides : alert + focus. Pas de validation pendant la frappe. | ✓ |
| Pendant la frappe (live, par adresse) | Chaque virgule déclenche une vérif et affiche un badge rouge sur les adresses invalides. UX plus riche mais ~30 lignes JS supp. | |
| Pas de validation client | Le serveur rejettera. Risque : listes 'cassées' silencieusement. | |

**User's choice:** Au moment de sauvegarder la liste (Recommended)
**Notes:** Réutilise le regex de api/send-email/validateEmails (extraire en module partagé OU dupliquer minimalement — décision laissée au planner).

---

## Delete UX (D-20..D-21)

| Option | Description | Selected |
|--------|-------------|----------|
| confirm() natif du browser (Recommended) | Click sur l'icône corbeille → `confirm('Supprimer la liste "X" ?')` natif. Cohérent avec deleteSavedManifest existant. | ✓ |
| Modal de confirmation custom | Modal HTML avec 'Annuler' / 'Supprimer'. Plus joli mais duplique le pattern modal. | |
| Suppression directe avec undo (toast) | Plus moderne mais nouveau pattern à introduire. | |

**User's choice:** confirm() natif du browser (Recommended)
**Notes:** Pattern déjà présent dans deleteSavedManifest.

---

## JSON schema (D-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Array d'objets {id, name, recipients} (Recommended) | Format simple, facile à lire/écrire. id = uuid généré côté client. Tri par nom au rendu, pas dans le fichier. | ✓ |
| Object keyed par id { 'uuid1': {name, recipients}, ... } | Accès par clé plus rapide en mémoire. Plus complexe à itérer. Avantage minimal pour <100 listes. | |
| Object racine avec metadata + array | { version: 1, updated: 'iso-date', lists: [...] } — permet une migration future. Surdimensionné. | |

**User's choice:** Array d'objets {id, name, recipients} (Recommended)
**Notes:** Cohérent avec usage simple. Si versioning/migration nécessaire un jour, wrapper sera ajouté avec rétro-compat.

---

## Tri/recherche (D-08, D-09 partiel)

| Option | Description | Selected |
|--------|-------------|----------|
| Tri alphabétique simple, pas de recherche (Recommended) | Le `<select>` natif affiche les listes triées par nom. Le navigateur permet déjà de taper la 1ère lettre pour sauter à une option. Suffisant pour <50 listes. | ✓ |
| Champ recherche au-dessus du dropdown | Input texte qui filtre la liste affichée en temps réel. Utile si plus de 50 listes. | |
| Groupé par catégorie (optgroup) | Les listes peuvent avoir une catégorie. Nécessite un champ 'catégorie' en plus dans la data model. | |

**User's choice:** Tri alphabétique simple, pas de recherche (Recommended)
**Notes:** Tri via Array.sort + localeCompare pour les accents français.

---

## Claude's Discretion

- Style exact du bouton "≡ Listes" (icône, label, position)
- HTML/CSS exact du modal CRUD (overlay, animation, focus trap)
- Nom de la fonction principale
- Format exact de l'aperçu destinataires dans le tableau (~30 chars + "…" recommandé)
- Helper UUID (`crypto.randomUUID()` natif si supporté, fallback simple)
- Choix d'extraction `validateEmails` en module partagé OU duplication minimale
- Storage Account / Container Azure Blob (à investiguer en research)
- Nom exact de la constante de mode (`LISTS_API_MODE` proposé)

## Deferred Ideas

- Modèle riche (To/CC séparés, catégories, rôles)
- Multi-sélection de listes pour combiner
- Recherche / filtre dans le dropdown
- Validation live pendant la frappe
- Modal de confirmation custom pour suppression
- Toast undo après suppression
- Migration / seed initial des listes depuis les manifestes existants
- ETag / lock optimiste sur le Blob
- Listes par-utilisateur (privées) + listes globales
- Interface admin de purge / reset
- Refactor `validateEmails` en module partagé (à décider en planning)
