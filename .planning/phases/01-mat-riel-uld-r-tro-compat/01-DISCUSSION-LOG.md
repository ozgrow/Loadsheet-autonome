# Phase 1: Matériel ULD & rétro-compat - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 01-mat-riel-uld-r-tro-compat
**Areas discussed:** UI placement, Affichage récap/PDF/email, UX Forfait + données JSON, Mobile

---

## Zone 1 — Placement UI des champs matériel

### Q1 : Où afficher les 8 champs matériel (sangles, planchers, etc.) ?

| Option | Description | Selected |
|--------|-------------|----------|
| Section dépliable dans le bloc ULD (Recommandé) | Bouton "Détails matériel ▼" sous header ULD qui déplie section | |
| Modal dialog popup | Bouton "Matériel" ouvre un dialog modal | ✓ |
| Toujours visible (inline) | Champs toujours affichés sous le header ULD | |
| Deuxième tableau dans le bloc ULD | Second tableau "Matériel" avec ligne unique | |

**User's choice:** Modal dialog popup
**Notes:** Choix contre la recommandation. Décision acceptée — un modal construit from scratch en JS vanilla (pas de librairie ajoutée).

### Q2 : Le 'commentaire libre' (MAT-08), niveau quoi ?

| Option | Description | Selected |
|--------|-------------|----------|
| Niveau ULD (Recommandé) | Un commentaire par ULD dans section matériel | ✓ |
| Étendre le commentaire par ligne LTA existant | Réutiliser le commentaire existant sur chaque ligne | |
| Niveau ULD + garder celui par ligne (2 niveaux) | Les deux existent | |

**User's choice:** Niveau ULD
**Notes:** Commentaire ULD séparé et complémentaire du `.comment-input` existant au niveau ligne LTA.

### Q3 : État initial du modal/section ?

| Option | Description | Selected |
|--------|-------------|----------|
| Pliée par défaut (Recommandé) | L'agent déplie seulement quand nécessaire + indicateur "renseigné" | ✓ |
| Dépliée pour nouvelle ULD, pliée au chargement | Flux continu à la saisie, compact au rechargement | |
| Toujours dépliée | Rien n'est jamais caché | |

**User's choice:** Pliée par défaut
**Notes:** Combiné avec la décision modal, ça se traduit par : le bloc ULD reste compact, le modal s'ouvre à la demande, un indicateur "renseigné" apparaît si données saisies.

---

## Zone 2 — Affichage dans récap/PDF/email

### Q1 : Où afficher les infos matériel dans le PDF ?

| Option | Description | Selected |
|--------|-------------|----------|
| Section "Matériel" sur la page détail de chaque ULD (Recommandé) | Sous le tableau LTA existant, petit tableau matériel | |
| Nouvelles colonnes dans la table récap page 1 | 8 colonnes ajoutées à la table synthétique | |
| Page dédiée "Bilan matériel" après les pages ULD | Page récapitulative totaux par type | |
| Les deux : section par ULD + totaux page 1 | Détail sur chaque page ULD + ligne totaux sur récap page 1 | ✓ |

**User's choice:** Les deux : section par ULD + totaux page 1
**Notes:** Option la plus riche. Impact planner : deux modifications distinctes dans `buildPdf()`.

### Q2 : Même affichage dans l'email ?

| Option | Description | Selected |
|--------|-------------|----------|
| Miroir du PDF (Recommandé) | Section matériel dans chaque bloc détail ULD de l'email HTML | ✓ |
| Juste les totaux dans l'email | L'email reste synthétique, détail seulement dans PDF | |
| Rien dans l'email | Email garde sa forme actuelle | |

**User's choice:** Miroir du PDF
**Notes:** Cohérence totale entre PDF et email.

### Q3 : Récap écran (barre bleue) ?

| Option | Description | Selected |
|--------|-------------|----------|
| Rien sur la barre, détail dans le modal (Recommandé) | Barre inchangée, détail en ouvrant modal | ✓ |
| Badge compact par ULD | Ligne courte sous header ULD | |
| Totaux dans la barre récap | Ex: Sangles total: 42 dans barre bleue | |

**User's choice:** Rien sur la barre, détail dans le modal
**Notes:** La barre `#liveRecap` reste ULD/Colis/Poids/LTA/DGR.

---

## Zone 3 — UX "Forfait négocié" + données JSON + rétro-compat

### Q1 : Comment basculer entre nombre et forfait pour planchers bois ?

| Option | Description | Selected |
|--------|-------------|----------|
| Checkbox 'Forfait négocié' (Recommandé) | Case à cocher qui désactive le champ nombre | ✓ |
| Radio 'Nombre' / 'Forfait' | Deux radios explicites | |
| Dropdown 'Type' | Menu Nombre / Forfait / Non applicable | |

**User's choice:** Checkbox 'Forfait négocié'

### Q2 : Structure JSON pour chaque plancher bois ?

| Option | Description | Selected |
|--------|-------------|----------|
| Deux champs : count + forfait (Recommandé) | ex: flooringEuCount + flooringEuForfait | ✓ |
| Valeur union number OR 'forfait' | ex: flooringEu: 5 ou 'forfait' | |
| Objet imbriqué { type, value } | ex: flooringEu: { type, value } | |

**User's choice:** Deux champs : count + forfait
**Notes:** Lisible, facile à parser, extensible.

### Q3 : Rétro-compatibilité anciens manifestes ?

| Option | Description | Selected |
|--------|-------------|----------|
| Lecture défensive seule (Recommandé) | Default 0/false/'' si champ absent, pas de migration | ✓ |
| Migration au chargement | Réécriture avec defaults en localStorage | |
| Flag de version | Ajout version: 2 sur nouveaux manifestes | |

**User's choice:** Lecture défensive seule
**Notes:** Pas de migration destructive, les anciens manifestes gardent leur forme jusqu'à ré-enregistrement.

---

## Zone 4 — Mobile (≤ 768px)

### Q1 : Modal sur mobile ?

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen sur mobile (Recommandé) | Modal prend tout l'écran ≤ 768px avec bouton Fermer | ✓ |
| Modal centré avec scroll | Modal card avec scroll interne | |
| Plein-écran sur tous les écrans | Même comportement desktop et mobile | |

**User's choice:** Full-screen sur mobile

### Q2 : Layout des 8 champs dans le modal ?

| Option | Description | Selected |
|--------|-------------|----------|
| Grille 2 colonnes desktop, 1 colonne mobile (Recommandé) | CSS grid/flex responsive | ✓ |
| Stack vertical partout | Un champ par ligne toujours | |
| Groupés par catégorie | 'Sangles & fixation', 'Bois', 'Protection', 'Notes' | |

**User's choice:** Grille 2 colonnes desktop, 1 colonne mobile

---

## Claude's Discretion

Liste des zones où le planner / l'implémenteur a latitude :
- Design visuel exact de l'indicateur "renseigné" (couleur, texte, icône)
- Structure HTML/CSS du modal (overlay, animation, focus, accessibilité)
- Libellés français exacts des champs dans le modal
- Ordre d'affichage des champs
- Nommage exact des clés JSON (cohérence avec style mixte existant)
- Format précis de la section matériel PDF (tableau autotable vs paragraphe)
- Stratégie de stockage du state matériel côté DOM vs mémoire JS

---

## Deferred Ideas

- Refactor DRY du bloc ULD dupliqué entre `addUld()` et `loadManifest()` — noté, hors scope Phase 1
- Page "Bilan matériel" dédiée dans le PDF — discutée, écartée au profit des totaux page 1
- Extraction du commentaire ULD dans l'indicateur "renseigné" — écarté (UX + XSS)
- Accessibilité avancée modal (ARIA focus trap) — à la discrétion du planner

---

*Generated 2026-04-23 from /gsd:discuss-phase 1 transcript.*
