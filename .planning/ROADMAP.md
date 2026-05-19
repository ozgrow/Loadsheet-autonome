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
**Goal**: L'agent peut saisir des infos matériel sur chaque ULD (sangles, planchers bois europe, planchers bois standard, bois de calage, bâches, intercalaires, nid d'abeille, commentaire libre), les voir dans le récap écran + PDF, et les anciens manifestes continuent de se charger sans erreur.
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
- [x] 02-02-PLAN.md — Rendu PDF colonne Type + scission page 1 Palettes/Vrac + email HTML miroir + exclusion planchers VRAC (VRAC-03)
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
**Plans**: 1 plan
Plans:
- [x] 03-01-PLAN.md — Fix bug session + suite E2E lifecycle + package.json racine (verify/dev) + Release checklist CLAUDE.md (TEST-01, TEST-03)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Matériel ULD & rétro-compat | 0/2 | Not started | - |
| 2. Type ULD VRAC | 0/TBD | Not started | - |
| 3. Validation locale & release gate | 0/1 | Not started | - |

### Phase 4: Listes de distribution emails (JSON Blob backend) — dev local d'abord

**Goal:** L'agent ATH peut gérer (CRUD) des listes de distribution nommées d'adresses email partagées entre tous les agents, et appliquer une liste en un clic pour pré-remplir le champ #recipients lors de l'envoi de la loadsheet. Stockage centralisé Azure Blob Storage en production, stub localStorage pendant le développement.

**Requirements**: LST-01, LST-02, LST-03, LST-04, LST-05, LST-06, LST-07, LST-08, LST-09, LST-10, LST-11, LST-12, LST-13, LST-14, LST-15
**Depends on:** Phase 3
**Plans:** 2 plans
**Success Criteria** (what must be TRUE):
  1. L'agent ouvre le modal "Listes de distribution" depuis la section "Envoi de la Loadsheet" et peut créer / modifier / supprimer des listes nommées
  2. Un dropdown à côté du champ #recipients permet de sélectionner une liste qui remplace intégralement la valeur du champ
  3. Pendant le développement, les listes sont persistées en localStorage (clé `recipients-lists-dev`) ; en production via Azure Function `/api/recipients` (GET + PUT) qui lit/écrit `recipients-lists.json` dans Azure Blob Storage
  4. Les emails saisis sont validés (regex) au moment de la sauvegarde, côté client ET serveur ; les listes affichées sont triées alphabétiquement
  5. Les noms et adresses sont anti-XSS (`esc()`) partout en innerHTML ; le modal reste utilisable mobile ≤ 768px
  6. Le premier accès au Blob inexistant retourne `[]` sans erreur ; tests anti-régression couvrent CRUD, validation, XSS, tri, sélection, mobile, E2E lifecycle

**UI hint**: yes (modal CRUD + dropdown selection)

Plans:
- [x] 04-01-PLAN.md — Backend Function /api/recipients + frontend module lists.js mode-switchable + tests CRUD localStorage stub (LST-01..04, 07..12, 14)
- [x] 04-02-PLAN.md — UI integration: bouton + dropdown + modal CRUD + tests UI + E2E lifecycle (LST-02, 05, 06, 11, 13, 14, 15)

### Phase 5: Codes client en dropdown maintenable (backend partage)

**Goal:** Remplacer le champ libre `<input id="clientName">` par un dropdown `<select>` maintenable dont les valeurs sont gérées via un modal CRUD, persistées dans un JSON Blob Azure (`clients.json`) partagé entre tous les agents ATH, avec rétro-compatibilité des manifestes legacy (option éphémère pour anciennes valeurs texte libre) et seed initial de 2 codes (1DAC-CDW, 2SET-CDG). Calque structurel direct de Phase 4 (clone API + module + modal).

**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06, CLI-07, CLI-08, CLI-09, CLI-10, CLI-11, CLI-12
**Depends on:** Phase 4
**Plans:** 2 plans
**Success Criteria** (what must be TRUE):
  1. L'agent ouvre le modal "Clients" depuis la section manifeste (bouton "≡ Clients" à côté du dropdown) et peut créer / modifier / supprimer des codes client. Le dropdown trié alphabétiquement (français) se rafraîchit après chaque CRUD
  2. Au premier lancement (Blob vide ou localStorage stub vide), les 2 codes `1DAC-CDW` et `2SET-CDG` sont automatiquement disponibles dans le dropdown
  3. Le champ `<input id="clientName">` est remplacé par `<select id="clientName">` (id conservé, hooks app.js aux lignes 437/657/725 intacts). Première option : `<option value="">— Choisir un client —</option>`
  4. Un manifeste legacy sauvegardé (avec `data.client` en texte libre inconnu du Blob) se charge sans erreur et affiche la valeur legacy comme `<option data-legacy="true">` éphémère sélectionnée par défaut
  5. Pendant le développement, les clients sont persistés en localStorage (clé `clients-dev`) ; en production via Azure Function `/api/clients` (GET + PUT) qui lit/écrit `clients.json` dans le container Azure Blob `loadsheet-data` (réutilise STORAGE_CONNECTION_STRING Phase 4)
  6. Validation défense-en-profondeur : code non-vide après trim ET unicité case-sensitive (refus doublon), enforced frontend ET backend. Message : `'Code déjà existant : "X"'`
  7. Aucun XSS exécutable depuis le champ `code` (rendu littéral via `_clientsEsc()`/`textContent` dans modal, dropdown, PDF, email). Onclick utilisent `_clientIds[idx]` (jamais string utilisateur)
  8. Modal CRUD utilisable mobile ≤ 768px (full-screen via media query, classes `.clients-modal-*`)
  9. Tests anti-régression `tests/tests.html` suite `Clients - *` (≥ 8 tests couvrant D-28 a→h) + 1 test E2E lifecycle (D-29). `npm run verify` passe avec 0 FAIL

**UI hint**: yes (modal CRUD + dropdown selection)

Plans:
- [x] 05-01-PLAN.md — Backend Function /api/clients + frontend module clients.js mode-switchable (auto-détection hostname) + seed INITIAL_CLIENTS + tests CRUD localStorage stub (CLI-01, CLI-02, CLI-03, CLI-05, CLI-07, CLI-09, CLI-10 partiel)
- [x] 05-02-PLAN.md — UI integration: remplacement input→select dans index.html + bouton + modal CRUD + CSS clients-modal + hook loadManifest legacy + tests UI + E2E lifecycle (CLI-04, CLI-06, CLI-08, CLI-09, CLI-10 complet, CLI-11, CLI-12)

### Phase 6: Materiel global (refactor saisie unique)

**Goal:** Refactoriser la saisie matériel : passer du modèle "1 jeu de champs par ULD" (Phase 1) à un modèle "1 jeu unique pour tout le manifeste" via une nouvelle section UI inline statique entre #liveRecap et le bouton Generer. Migration runtime auto au loadManifest des anciens manifestes (fusion par-ULD → total global selon règles D-13..D-18). Rendu PDF + email HTML symétriques (section "Matériel" unique page 1, plus de section par-ULD). Validation MAT-13 globalisée. MAT-14 (auto-open modal) supprimé. Suppression du couplage matériel↔ULD.

**Requirements**: MAT-01, MAT-02, MAT-03, MAT-04, MAT-05, MAT-06, MAT-07, MAT-08, MAT-09, MAT-10, MAT-11, MAT-12, MAT-13, RECAP-01, RECAP-02, RECAP-03 (réinterprétés au niveau manifeste — MAT-14 explicitement supprimé par D-36)
**Depends on:** Phase 5
**Plans:** 6 plans

**Success Criteria** (what must be TRUE):
  1. La section "Matériel" inline statique est visible en permanence entre #liveRecap et le bouton "Generer Loadsheet" ; l'agent y saisit UNE seule fois sangles, planchers EU/Std (count ou forfait), bois calage, bâches, intercalaires, nids d'abeille, commentaire libre, ainsi que la case "Rien à facturer"
  2. Sur mobile ≤ 768px, la grid passe de 2 colonnes à 1 colonne (RECAP-03 réinterprété)
  3. collectData() retourne data.material top-level ; les ULDs n'ont plus de champs matériel
  4. loadManifest() peuple la section globale via migrateLegacyMaterial(data) — un manifeste Phase 1 (champs par-ULD) charge sans erreur et le matériel est fusionné en mémoire selon D-13..D-18 (sommes counts, OR forfaits non-VRAC, AND noBilling, concat commentaires "ULD N°i : ..." newlines) ; pas de réécriture destructive (MAT-10)
  5. PDF page 1 contient une section "Materiel" alimentée par data.material (incluant manifestComment et cas "Rien à facturer") ; les pages détail ULD n'ont plus de section "Materiel"
  6. Email HTML contient une section "Matériel" unique alimentée par data.material avec esc(manifestComment) anti-XSS ; les blocs détail ULD n'ont plus de section "Matériel" (MAT-11 réinterprété sur manifestComment)
  7. La validation MAT-13 est appliquée UNIQUEMENT à generatePdf/sendEmail via manifestHasMaterial() — addUld et showGenerateSection ne bloquent plus (D-34, D-35). MAT-14 (auto-open modal) est supprimé (D-36)
  8. npm run verify passe avec 0 FAIL après adaptation des suites existantes + ajout de la suite "Matériel global - Migration helper purs" (≥ 7 tests D-45) + suite "Matériel global - Validation MAT-13" (≥ 6 tests) + test rétro-compat localStorage explicit (D-47)
  9. Release Checklist CLAUDE.md 7 étapes passe : verify OK, dev OK, login OK, E2E manuel OK (manifeste mixte PMC+VRAC + matériel global + save/load + PDF/email symétriques), rétro-compat ancien manifeste OK, push master prêt

**UI hint**: yes (nouvelle section inline statique, pas de modal)

Plans:
- [ ] 06-01-PLAN.md — UI section matériel inline (index.html + style.css + handlers JS + reset newManifest) — MAT-01..09, MAT-11, MAT-12, RECAP-01, RECAP-03
- [ ] 06-02-PLAN.md — Helper pur migrateLegacyMaterial(data) + suite tests Migration (D-45 a-g + idempotence + defensive ≥ 18 tests) — MAT-10
- [ ] 06-03-PLAN.md — collectData / loadManifest / addUld refactor data.material top-level + suppression data-attributes ULD + suppression bouton/badge matériel — MAT-09, MAT-10, MAT-12
- [ ] 06-04-PLAN.md — Rendu PDF page 1 + email HTML symétriques depuis data.material + esc(manifestComment) + suppression sections par-ULD — MAT-11, RECAP-02
- [ ] 06-05-PLAN.md — Helper manifestHasMaterial + validation MAT-13 globalisée (generatePdf/sendEmail) + suppression blocages MAT-13/MAT-14 dans addUld/showGenerateSection — MAT-13
- [ ] 06-06-PLAN.md — Adaptation tests (suppression suites obsolètes ~40, nouvelles suites Validation MAT-13 + UI handlers + E2E lifecycle adapté + rétro-compat D-47) + Release Checklist — MAT-01..13, RECAP-01..03
