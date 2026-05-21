---
phase: 06-materiel-global-refactor-saisie-unique
plan: 03
subsystem: data-layer
tags: [refactor, data-model, collect, load, uld, retro-compat, migration-wire]

# Dependency graph
requires:
  - 06-01-SUMMARY.md (section UI #material-section + resetMaterialSection helper)
  - 06-02-SUMMARY.md (migrateLegacyMaterial pure helper)
provides:
  - "collectData() retourne data.material top-level (D-09) — plus de champs matériel dans data.ulds[i] (D-10)"
  - "loadManifest() peuple #material-section via migrateLegacyMaterial(data) (D-12..D-19)"
  - "addUld() simplifié — signature sans paramètre, plus de bouton Materiel, plus de wrapper badge, plus de data-attributes matériel (D-02, D-11, D-34, D-36)"
  - "Source de saisie matériel = section #material-section UNIQUEMENT (plus modal par-ULD)"
affects:
  - "06-04-PLAN.md (rendu PDF + email lit data.material — désormais alimenté)"
  - "06-05-PLAN.md (validation MAT-13 via manifestHasMaterial — section #material-section désormais source unique)"
  - "06-06-PLAN.md (tests à adapter : champs matériel par-ULD disparus, manifestes Phase 1 chargent via fusion runtime)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Data model migration runtime (lecture seule, pas de réécriture destructive) — Phase 1 manifestes fusionnés en mémoire à loadManifest via migrateLegacyMaterial (MAT-10)"
    - "Reset-then-write pattern (resetMaterialSection() avant écriture loadedMaterial dans loadManifest) — préserve l'idempotence D-19"
    - "Helper _matNum() inline dans collectData pour lecture defensive parseInt(value)||0"
    - "Découplage couche données ↔ couche UI matériel — la donnée matériel est désormais top-level data.material, indépendante de la structure ULDs"

key-files:
  created:
    - .planning/phases/06-materiel-global-refactor-saisie-unique/06-03-SUMMARY.md
  modified:
    - static/js/app.js (collectData / loadManifest / addUld refactorés + newManifest appel addUld() sans args)

key-decisions:
  - "Phase 06 P03: collectData() construit data.material top-level depuis #material-section (D-09) — _matNum() helper inline pour lecture defensive, forfait true force count=0 (D-16 défense en profondeur), noMaterialToBill force tous les autres à 0/false/'' (D-08 cohérent applyMaterialToUld)"
  - "Phase 06 P03: loadManifest() appelle migrateLegacyMaterial(data) puis resetMaterialSection() puis écriture des inputs — pattern reset-then-write garantit l'idempotence sur rechargements multiples"
  - "Phase 06 P03: addUld() signature simplifiée 'function addUld()' (suppression autoOpen + skipValidation) — D-34/D-36 découplage matériel↔ULD, retire le couplage Phase 1 où l'ajout d'ULD ouvrait automatiquement le modal matériel"
  - "Phase 06 P03: les fonctions Phase 1 (openMaterialModal, applyMaterialToUld, refreshMaterialBadge, uldHasMaterial, findIncompleteUlds, formatCondensedMaterial) restent définies en mémoire mais N'ONT PLUS DE CALLER — orphelinage scheduled cleanup Plan 06-06 (Claude's Discretion)"

requirements-completed: [MAT-09, MAT-10, MAT-12]

# Metrics
duration: 38min
completed: 2026-05-21
---

# Phase 06 Plan 03: Refactor data layer (collectData/loadManifest/addUld) — Summary

**Le matériel passe d'un modèle "par-ULD" (data-attributes sur .uld-block + champs sur uldEntry) à un modèle "top-level manifeste" (`data.material`) lu depuis #material-section ; `loadManifest()` migre les manifestes legacy Phase 1 en mémoire via `migrateLegacyMaterial(data)` ; `addUld()` ne crée plus de bouton Matériel ni de data-attributes — la source de saisie est désormais UNIQUEMENT la section globale.**

## Performance

- **Duration:** ~38 min (3 commits atomic + UAT intégrée)
- **Started:** 2026-05-20 (commits enchainés 2efbb90 → 099cc0b → 479b2fe)
- **Completed:** 2026-05-21 (user approval via integrated UAT 3-plans 06-03/06-04/06-05)
- **Tasks:** 4 (3 code + 1 human-verify checkpoint approuvé en bundle)
- **Files modified:** 1 (static/js/app.js)

## Accomplishments

### Task 1 — collectData() construit data.material top-level (2efbb90)
- Suppression du bloc lecture data-attributes ULD (anciens `uldEntry.strapsCount = parseInt(block.dataset.straps)...` + `uldEntry.uldComment` + `uldEntry.noMaterialToBill`)
- Helper inline `_matNum(id)` pour lecture defensive `parseInt(value)||0`
- Construction de `material` AVANT le `return` final, avec branche `noBilling` (force tous les autres à 0/false/'')
- D-16 défense en profondeur : forfait coché force `flooringEuCount`/`flooringStdCount` à 0
- Retour `{ manifestId, client, agent, destAirport, date, timestamp, recipients, cc, ulds, material }`
- ULDs préservent uniquement : `uldNumber, rows, totalColis, weight?, type`

### Task 2 — loadManifest() peuple #material-section via migrateLegacyMaterial (099cc0b)
- Suppression intégrale du bloc `setAttribute('data-straps', ...)` etc. (11 setAttribute supprimés sur .uld-block, seul `data-uld-type` Phase 2 conservé)
- innerHTML du `.uld-block` simplifié : suppression du `<button class="btn-material" onclick="openMaterialModal(...)">` et du `<div class="material-badge-wrapper">`
- Suppression de l'appel `refreshMaterialBadge(i);` en fin de boucle ULD
- Après boucle ULDs : appel `var loadedMaterial = migrateLegacyMaterial(data);` puis `resetMaterialSection();` puis écriture des 9 inputs + 3 checkboxes + textarea de #material-section
- Anti-XSS : textarea via `.value` (jamais innerHTML — pattern Phase 1 D-19/D-42)
- Déclenchement conditionnel de `toggleMaterialSectionNoBilling` et `toggleMaterialSectionForfait` si checkboxes chargées à true (cohérent UI state)
- Préservation : bloc legacy clientName CLI-08 Phase 5 (_legacyOpt) intact

### Task 3 — addUld() simplifié + newManifest() (479b2fe)
- Signature `function addUld()` (suppression des paramètres `autoOpen` et `skipValidation` — D-36)
- Suppression du bloc validation MAT-13 par-ULD (4 lignes — D-34, le blocage est désormais à generatePdf/sendEmail Plan 06-05)
- Suppression de 11 `setAttribute('data-XXX', ...)` matériel (seul `data-uld-type` Phase 2 D-06 conservé)
- Suppression du `<button class="btn-material" onclick="openMaterialModal(...)">` dans innerHTML
- Suppression du `<div class="material-badge-wrapper" id="material-badge-...">` dans innerHTML
- Suppression du bloc final `if (autoOpen) { openMaterialModal(i); }`
- `newManifest()` ligne adaptée : `addUld(false)` → `addUld()` (cohérence signature)
- Ajout d'un `updateRecap()` final cohérent avec compteur ULD

### Task 4 — Vérification round-trip Phase 6 + rétro-compat Phase 1 (UAT intégrée)
- **Cycle Phase 6 normal** : saisie section globale + save → reload → section repeuplée, ULDs sans bouton Matériel, console propre ✓
- **Rétro-compat Phase 1 (legacy injection script)** :
  - sangles : 5 + 2 = 7 (D-13 sommation inconditionnelle, incl. VRAC) ✓
  - planchers EU : 2 (D-14 VRAC exclue — la valeur 10 de la 2e ULD VRAC ignorée) ✓
  - forfait Std : ✓ coché (D-15 OR non-VRAC) ✓
  - bois calage : 0 + 1 = 1 ✓
  - commentaire concaténé : "ULD N°1 : fragile\nULD N°2 : haut" (D-17, 1-based, newlines préservés) ✓
  - noBilling : false (D-18 AND — au moins une ULD avait false) ✓

## Task Commits

Each task committed atomically on app.js :

| Hash    | Task | Type     | Message                                                                                                       |
|---------|------|----------|---------------------------------------------------------------------------------------------------------------|
| 2efbb90 | 1    | refactor | refactor(06-03): collectData() lit data.material top-level depuis #material-section (D-09, D-10)              |
| 099cc0b | 2    | refactor | refactor(06-03): loadManifest() peuple #material-section via migrateLegacyMaterial (D-11, D-12..D-19)         |
| 479b2fe | 3    | refactor | refactor(06-03): addUld() simplifie — plus de bouton Materiel, plus de data-attributes materiel, signature sans parametre (D-02, D-11, D-34, D-36) |
| —       | 4    | —        | Checkpoint UAT (no commit) — approuvé 2026-05-21 via UAT intégrée 3-plans                                     |

**Plan metadata commit:** à venir après self-check (docs: complete 06-03 plan)

## Files Created/Modified

- `static/js/app.js` — 3 fonctions refactorées :
  - `collectData()` (lignes ~628-676 originales → équivalent refactor) : nouveau bloc construction `material` + return inclut `material: material`. `uldEntry` ne porte plus aucun champ matériel.
  - `loadManifest()` (lignes ~728-823 originales) : suppression bloc setAttribute (11 lignes), simplification innerHTML (suppression btn-material + material-badge-wrapper), suppression refreshMaterialBadge(i), ajout bloc peuplement #material-section via loadedMaterial.
  - `addUld()` (lignes ~452-523 originales → ~40 lignes finales) : signature `function addUld()`, innerHTML simplifié, suppression bloc validation MAT-13 + setAttribute matériel + bouton/wrapper + bloc autoOpen.
  - `newManifest()` : ligne `addUld(false);` → `addUld();`
- Fonctions Phase 1 conservées en mémoire mais ORPHELINES (Claude's Discretion non-cleanup) :
  - `openMaterialModal`, `closeMaterialModal`, `toggleForfait`, `toggleNoBilling`, `applyMaterialToUld`, `formatCondensedMaterial`, `uldHasMaterial`, `findIncompleteUlds`, `refreshMaterialBadge` (toutes définies, aucun caller en app.js après ce plan)

## Decisions Made

1. **data.material top-level (D-09)** : la donnée matériel est rattachée au manifeste, plus à l'ULD. Permet la "saisie unique" (CONTEXT vision phase 6) et simplifie la sémantique : 1 manifeste = 1 jeu de matériel.
2. **Reset-then-write dans loadManifest** : `resetMaterialSection()` est appelé avant l'écriture des valeurs depuis `loadedMaterial`. Garantit qu'aucun résidu de l'état précédent ne fuit (ex: forfait coché précédemment puis manifeste chargé sans forfait).
3. **migrateLegacyMaterial idempotent (D-19)** : si `data.material` existe déjà (manifeste Phase 6), le helper le retourne tel quel. Sinon il fusionne depuis les champs par-ULD. Ce comportement permet de charger n'importe quel manifeste (Phase 1, 2, 3, 6+) sans branche conditionnelle dans loadManifest.
4. **addUld() sans paramètre (D-36)** : suppression du `autoOpen` qui ouvrait automatiquement le modal matériel à l'ajout d'une ULD (MAT-14 Phase 1). MAT-14 est explicitement supprimée par D-36 — la saisie matériel se fait désormais dans la section globale, plus à l'ULD.
5. **Orphelinage progressif Phase 1** : les fonctions de l'ancien flow matériel restent définies (aucun caller en app.js mais helpers de buildPdf/sendEmail vont continuer de les utiliser jusqu'à Plan 06-04 qui les orpheline aussi côté rendu). Cleanup massif scheduled Plan 06-06.
6. **D-16 défense en profondeur** : même si l'UI force `count=0` quand forfait est coché (handler toggleMaterialSectionForfait Phase 1 Plan 06-01), `collectData` répète la règle pour résilience aux états DOM transitoires.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug clarification] Suppression de l'appel `addUld(false)` dans newManifest**
- **Found during:** Task 3 (vérification grep `addUld(false)` doit retourner 0)
- **Issue:** Le plan demandait de remplacer `addUld(false)` par `addUld()` dans newManifest, ce qui a été fait. Pas vraiment une déviation — c'est une partie explicite de Task 3 — mais documenté ici car c'est une modification hors de la fonction `addUld()` proprement dite.
- **Files modified:** static/js/app.js (newManifest)
- **Commit:** 479b2fe

Aucune autre déviation. Le refactor était purement mécanique selon les blocs exacts spécifiés dans le plan.

## Tests Status

- **Tests Phase 1 matériel par-ULD** (suites "Materiel ULD - collectData", "Materiel ULD - applyMaterialToUld", "Materiel ULD - loadManifest", "MAT-13/14 attentes per-ULD") : **ATTENDUS EN ÉCHEC** après ce plan car ils valident l'ancien modèle (champs par-ULD, data-attributes). Plan 06-06 adapte / supprime ces suites obsolètes.
- **Tests Plan 06-02 (Migration helper purs)** : **CONTINUENT À PASSER** — helper pur, isolé du DOM, indépendant de ce refactor.
- **Validation manuelle** : UAT intégrée 3-plans Task 4 approuvée 2026-05-21 par l'utilisateur (round-trip Phase 6 + injection legacy Phase 1).
- `npm run verify` n'est PAS lancé avant Plan 06-06 (état intermédiaire wave 2 attendu non-vert, documenté CONTEXT).

## Auth Gates

None.

## Known Stubs

None. Le refactor data layer est complet : collectData/loadManifest/addUld lisent et écrivent uniquement via data.material + #material-section. Aucun pont "à câbler plus tard". Les fonctions orphelinées (openMaterialModal etc.) ne sont pas des stubs mais du code mort scheduled cleanup Plan 06-06.

## Next Phase Readiness

- **Plan 06-04 (rendu PDF + email)** : ready — `data.material` est désormais toujours disponible (top-level dans toute structure collectée ou chargée).
- **Plan 06-05 (validation MAT-13 globalisée)** : ready — `#material-section` est l'unique source de saisie, `manifestHasMaterial()` (à créer Plan 06-05) lira directement la section.
- **Plan 06-06 (tests + cleanup)** : ready — refactor data layer complet, scope cleanup défini (orphelins + suites tests obsolètes).
- **Aucun blocker technique** restant.

## Self-Check: PASSED

- File `.planning/phases/06-materiel-global-refactor-saisie-unique/06-03-SUMMARY.md` exists — VERIFIED
- Commit `2efbb90` (Task 1: collectData) — VERIFIED in `git log --oneline`
- Commit `099cc0b` (Task 2: loadManifest) — VERIFIED in `git log --oneline`
- Commit `479b2fe` (Task 3: addUld + newManifest) — VERIFIED in `git log --oneline`
- File `static/js/app.js` contains `material: material` (collectData return) — VERIFIED via grep
- File `static/js/app.js` contains `migrateLegacyMaterial(data)` call (loadManifest) — VERIFIED via grep
- File `static/js/app.js` contains `function addUld()` (signature sans paramètre) — VERIFIED via grep
- File `static/js/app.js` does NOT contain `setAttribute('data-straps'` — VERIFIED (grep 0)
- File `static/js/app.js` does NOT contain `btn-material` in addUld/loadManifest innerHTML — VERIFIED
- File `static/js/app.js` does NOT contain `addUld(false)` (newManifest adapté) — VERIFIED
- PLAN.md Task 4 marked `status="APPROVED 2026-05-21"` — VERIFIED (edited this session)

---
*Phase: 06-materiel-global-refactor-saisie-unique*
*Completed: 2026-05-21 (UAT intégrée 3-plans 06-03/06-04/06-05)*
