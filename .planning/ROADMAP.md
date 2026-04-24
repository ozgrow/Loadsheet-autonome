# Roadmap: Loadsheet-autonome

## Overview

Ce cycle livre deux évolutions sur l'app en production : (1) saisie d'infos matériel sur les ULD avec affichage écran/PDF, et (2) ajout d'un type ULD officiel "VRAC" exclu du compteur palette et isolé sur sa propre ligne dans le récapitulatif. L'app tourne en prod et dessert les agents ATH quotidiennement — chaque phase doit préserver la rétro-compatibilité des manifestes localStorage chiffrés existants, et rien ne part sur `master` sans validation locale via `npx serve .`.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Matériel ULD & rétro-compat** - Ajout des champs matériel dans le modal ULD, affichage écran + PDF, rétro-compat localStorage
- [ ] **Phase 2: Type ULD VRAC** - Nouveau type officiel VRAC, exclusion du compteur palette, ligne séparée dans le récap
- [ ] **Phase 3: Validation locale & release gate** - Couverture tests complète des deux features et validation locale end-to-end avant push master

## Phase Details

### Phase 1: Matériel ULD & rétro-compat
**Goal**: L'agent peut saisir des infos matériel sur chaque ULD (sangles, planchers bois EU/standard, bois de calage, bâches, intercalaires, nid d'abeille, commentaire libre), les voir dans le récap écran + PDF, et les anciens manifestes continuent de se charger sans erreur.
**Depends on**: Nothing (first phase)
**Requirements**: MAT-01, MAT-02, MAT-03, MAT-04, MAT-05, MAT-06, MAT-07, MAT-08, MAT-09, MAT-10, MAT-11, RECAP-01, RECAP-02, RECAP-03, TEST-02
**Success Criteria** (what must be TRUE):
  1. L'agent ouvre le modal d'édition d'une ULD (palette ou conteneur) et saisit nombre de sangles, planchers bois europe, planchers bois standard, bois de calage, bâches, intercalaires, nids d'abeille, et commentaire libre
  2. Les planchers bois europe et standard acceptent soit un nombre soit la case "forfait négocié" (pas les deux en même temps)
  3. Le récapitulatif écran affiche les infos matériel de chaque ULD sous forme condensée, et le PDF généré inclut ces mêmes infos
  4. Un manifeste sauvegardé avant cette évolution (sans les nouveaux champs) se charge sans erreur et sans perte de données
  5. Le commentaire libre affiche tout caractère HTML/JS littéralement (pas d'exécution) partout où il apparaît — récap écran, PDF, modal
  6. Les nouveaux champs du modal restent utilisables et lisibles sur un écran ≤ 768px
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Data model + modal UI + rétro-compat + tests TEST-02
- [x] 01-02-PLAN.md — Rendu PDF + email HTML (section matériel par ULD + totaux)
**UI hint**: yes

### Phase 2: Type ULD VRAC
**Goal**: L'agent peut marquer une ULD comme type "VRAC", qui n'est pas comptée comme palette dans le récapitulatif et apparaît sur une ligne "Vrac" séparée avec son poids et son nombre de colis.
**Depends on**: Phase 1
**Requirements**: VRAC-01, VRAC-02, VRAC-03
**Success Criteria** (what must be TRUE):
  1. "VRAC" apparaît dans le sélecteur de type ULD à côté des types existants (palette PMC, conteneurs)
  2. Quand au moins une ULD VRAC est dans le manifeste, le compteur de palettes du récapitulatif les exclut (seules les palettes réelles sont comptées)
  3. Quand au moins une ULD VRAC est présente, une ligne "Vrac" apparaît dans le récap avec le poids total VRAC et le nombre de colis total VRAC
  4. Les ULD non-VRAC continuent d'être comptées et affichées comme avant (pas de régression sur le flux existant)
**Plans**: 2 plans
Plans:
- [x] 02-01-PLAN.md — Selecteur type ULD + data model + retro-compat + updateRecap annotation "dont Vrac" + modal planchers conditionnel (VRAC-01, VRAC-02)
- [ ] 02-02-PLAN.md — Rendu PDF colonne Type + scission page 1 Palettes/Vrac + email HTML miroir + exclusion planchers VRAC (VRAC-03)
**UI hint**: yes

### Phase 3: Validation locale & release gate
**Goal**: Les deux features ont une couverture de tests complète dans `tests/tests.html`, et l'application entière (manifeste + récap + PDF + email + save/load + tests) passe en local avant tout push sur `master`.
**Depends on**: Phase 2
**Requirements**: TEST-01, TEST-03
**Success Criteria** (what must be TRUE):
  1. `tests/tests.html` contient des tests couvrant chaque fonctionnalité ajoutée en Phase 1 (matériel ULD, rétro-compat, XSS commentaire) et Phase 2 (type VRAC, exclusion compteur, ligne récap)
  2. Tous les tests de `tests/tests.html` passent en local via `npx serve .`
  3. Un scénario manuel end-to-end en local réussit : création d'un manifeste avec ULD matériel + ULD VRAC, sauvegarde, rechargement, génération PDF correcte, et récapitulatif affichant les deux sections (matériel + ligne Vrac)
  4. Les anciens manifestes sauvegardés se chargent toujours correctement dans l'app locale (vérification manuelle de la rétro-compat en conditions réelles)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Matériel ULD & rétro-compat | 0/2 | Not started | - |
| 2. Type ULD VRAC | 0/TBD | Not started | - |
| 3. Validation locale & release gate | 0/TBD | Not started | - |
