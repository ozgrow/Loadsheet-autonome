---
phase: 06-materiel-global-refactor-saisie-unique
plan: 01
subsystem: ui
tags: [material, inline-section, vanilla-js, css-grid, responsive, handlers, reset]

# Dependency graph
requires: []
provides:
  - "<section id=\"material-section\"> inline statique (index.html) — 9 inputs numériques + checkbox noBilling + textarea commentaire (D-01)"
  - "Styles .material-section + .material-section-grid (style.css) — 2 cols desktop / 1 col mobile ≤768px (D-04, RECAP-03)"
  - "Handlers JS toggleMaterialSectionForfait + toggleMaterialSectionNoBilling + resetMaterialSection (app.js — D-08)"
  - "newManifest() étendu pour reset section matériel aux defaults (D-37)"
affects:
  - "06-03-PLAN.md (collectData/loadManifest/addUld) — la section UI est la cible d'écriture/lecture"
  - "06-04-PLAN.md (rendu PDF + email HTML) — data.material proviendra des inputs #mat-global-*"
  - "06-05-PLAN.md (validation MAT-13 globalisée) — basée sur manifestHasMaterial() lisant la section"
  - "06-06-PLAN.md (tests UI + E2E) — handlers à valider"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Section UI inline statique (pas modal) — visible en permanence, source de saisie unique"
    - "Clone fidèle des patterns Phase 1 toggleForfait + toggleNoBilling avec scope #material-section (vs .material-modal)"
    - "Reset helper isolé (resetMaterialSection) — réutilisable par newManifest() et futur loadManifest() (Plan 03)"
    - "CSS grid responsive 2→1 col via media query 768px (parallèle à .material-modal-grid existant)"
    - "IDs prefixés mat-global-* pour distinguer du modal par-ULD legacy (mat-*)"

key-files:
  created:
    - .planning/phases/06-materiel-global-refactor-saisie-unique/06-01-SUMMARY.md
  modified:
    - index.html (+45 lignes — section #material-section entre #liveRecap et .actions)
    - static/css/style.css (+67 lignes — .material-section + .material-section-grid + media query 768px)
    - static/js/app.js (+59 lignes — 3 handlers + 1 ligne dans newManifest)

key-decisions:
  - "Phase 06 P01: UI inline statique entre #liveRecap et .actions (D-01) — section toujours visible, pas de modal pour saisie unique manifeste"
  - "Phase 06 P01: clone fidèle des patterns Phase 1 (toggleForfait/toggleNoBilling) avec scope #material-section — D-06 exclusivité forfait/count préservée, D-08 toggle noBilling étendu"
  - "Phase 06 P01: handlers Task 3 commités dans la même atomic commit que Task 1 du Plan 06-02 (ff6f585) — déviation Rule 1 documentée (squash accidental + non-canonical commit message)"
  - "Phase 06 P01: Task 4 checkpoint approuvé par user en single-ULD only (multi-ULD bloqué par garde MAT-13 par-ULD Phase 1 résiduelle, suppression scheduled Plan 06-03/06-05 — D-34, D-35, D-36)"

patterns-established:
  - "Section inline statique <section id='material-section'> : prototype pour futures sections manifest-level (vs modal par-élément)"
  - "Handler scope par id de section parent (document.getElementById('material-section')) : isolation des handlers locaux au lieu de querySelector global"
  - "Reset helper séparé : resetMaterialSection() externe à newManifest, réutilisable par loadManifest Plan 03"

requirements-completed: [MAT-01, MAT-02, MAT-03, MAT-04, MAT-05, MAT-06, MAT-07, MAT-08, MAT-09, MAT-11, MAT-12, RECAP-01, RECAP-03]

# Metrics
duration: 35min
completed: 2026-05-20
---

# Phase 06 Plan 01: UI section matériel inline + handlers + reset — Summary

**Section "Matériel" inline statique entre #liveRecap et le bouton "Generer Loadsheet" : 9 inputs numériques (sangles, planchers EU/Std avec forfaits, bois calage, bâches, intercalaires, nids d'abeille), checkbox "Rien à facturer", textarea commentaire libre — grid 2 cols desktop / 1 col mobile, handlers toggleMaterialSectionForfait + toggleMaterialSectionNoBilling clonés depuis Phase 1, reset aux defaults dans newManifest().**

## Performance

- **Duration:** ~35 min (Task 1-3 enchainés ~5min code, checkpoint humain Task 4 sur 2 sessions)
- **Started:** 2026-05-19T20:52:09Z (Task 1 commit timestamp)
- **Completed:** 2026-05-20 (user approval visual verify)
- **Tasks:** 4 (3 code + 1 human-verify checkpoint)
- **Files modified:** 3 (index.html, static/css/style.css, static/js/app.js)

## Accomplishments

- **UI inline statique** : nouvelle `<section id="material-section">` insérée entre `#liveRecap` (ligne 106) et `<!-- Actions -->` (ligne 108) dans `index.html` — 9 inputs numériques + checkbox noBilling + textarea commentaire pleine largeur
- **CSS responsive** : règles `.material-section` + `.material-section-grid` clonées du pattern `.material-modal-grid` Phase 1 — fond blanc, bord arrondi, grid 2 cols desktop avec `mat-comment-label { grid-column: 1 / -1 }`, passage à 1 col + padding compact via media query `@media (max-width: 768px)`
- **Handlers JS** : 3 fonctions ajoutées dans `app.js` après `closeMaterialModal()` (ligne 141)
  - `toggleMaterialSectionForfait(checkbox, inputId)` — exclusivité forfait/count (input disabled + value=0 quand forfait coché, D-08/D-16)
  - `toggleMaterialSectionNoBilling(checkbox)` — désactivation cascade des 8 autres champs + textarea quand "Rien à facturer" coché, réactivation conditionnelle pour planchers EU/Std si forfait reste coché (D-08 + préservation D-06)
  - `resetMaterialSection()` — remet tous les inputs à 0, décoche checkboxes, vide commentaire, ré-active tous les éléments (D-37)
- **newManifest() étendu** : ajout de `resetMaterialSection();` ligne 504 (avant `uldCount = 0;`) — chaque création de nouveau manifeste remet la section globale aux defaults
- **Vérification visuelle utilisateur** : single-ULD validé sur desktop + DevTools responsive 375px — position, layout, exclusivité forfait, toggle noBilling, reset newManifest, console propre (aucune erreur JS)
- **Préservation Phase 1 intacte** : `openMaterialModal`, `toggleForfait`, `toggleNoBilling`, `closeMaterialModal`, `applyMaterialToUld` restent en place — orphelinage scheduled Plans 06-03/06-05/06-06 (CONTEXT Claude's Discretion)

## Task Commits

Each task was committed atomically :

1. **Task 1: Insérer la section UI matériel inline dans index.html** — `7818385` (feat)
2. **Task 2: Ajouter les règles CSS .material-section-* dans style.css** — `30f7640` (feat)
3. **Task 3: Handlers JS toggleMaterialSectionForfait + toggleMaterialSectionNoBilling + resetMaterialSection + extension newManifest()** — `ff6f585` (feat — voir déviation : commit message annonce "06-02" car squashé accidentellement avec Task 1 du Plan 06-02, contenu Task 3 06-01 vérifié présent par diff git show)
4. **Task 4: Vérification visuelle UX section matériel inline (desktop + mobile)** — N/A (human-verify checkpoint, approuvé user 2026-05-20, no commit)

**Plan metadata commit:** à venir après self-check (docs: complete 06-01 plan)

## Files Created/Modified

- `index.html` — Section `<section id="material-section" class="material-section">` insérée entre `#liveRecap` et `<!-- Actions -->`. Contient `h3 Matériel`, checkbox `#mat-global-no-billing`, grid `.material-section-grid` avec 9 inputs ID-préfixés `mat-global-*`, textarea `#mat-global-comment` pleine largeur. Handlers `onchange` câblés (toggleMaterialSectionForfait, toggleMaterialSectionNoBilling).
- `static/css/style.css` — Bloc `/* MATÉRIEL GLOBAL — Phase 6 (D-04) */` après les règles `.material-modal-actions` (ligne 204) et AVANT `LISTES DE DISTRIBUTION` (ligne 206). Règles : `.material-section` (fond blanc, padding, bord, shadow), `.material-section h3` (titre stylé), `.material-section-grid` (grid 2 cols 12px/20px gap), styles inputs/textarea/disabled, `.mat-comment-label { grid-column: 1 / -1 }`. Mobile media query 768px : `.material-section-grid { grid-template-columns: 1fr; gap: 10px; }` + `.material-section { padding: 12px 14px; }`. Règles `.material-modal-*` Phase 1 INTACTES (D-03 Claude's Discretion).
- `static/js/app.js` — 3 functions ajoutées après `closeMaterialModal` ligne 141 : `toggleMaterialSectionForfait` (lignes 149-157), `toggleMaterialSectionNoBilling` (lignes 161-181), `resetMaterialSection` (lignes 185-200). Appel `resetMaterialSection();` ajouté ligne 504 dans `newManifest()` avant `uldCount = 0;`. Fonctions Phase 1 (`openMaterialModal`, `toggleForfait`, `toggleNoBilling`, `closeMaterialModal`, `applyMaterialToUld`) inchangées.

## Decisions Made

1. **UI inline statique (D-01)** : section toujours visible entre `#liveRecap` et `.actions`, pas un modal — la saisie matériel passe d'1 jeu de champs par-ULD (Phase 1) à 1 jeu unique pour tout le manifeste. Pattern différent du Phase 1 modal mais cohérent avec la nature "global manifest-level" de la donnée.
2. **Clone fidèle des handlers Phase 1 avec scope changé** : `toggleMaterialSectionForfait/NoBilling` ont la même logique que `toggleForfait/toggleNoBilling` mais opèrent sur `document.getElementById('material-section')` au lieu de `document.querySelector('.material-modal')`. Évite duplication conceptuelle, facilite maintenance.
3. **IDs préfixés `mat-global-*`** (D-07 nomenclature) : distinction nette avec les data-attributes `mat-*` du modal par-ULD legacy. Permet co-existence pendant les 5 plans de transition avant suppression du modal Phase 1.
4. **Reset helper isolé** : `resetMaterialSection()` extracted comme fonction séparée (vs inline dans newManifest) — sera réutilisée par `loadManifest()` Plan 03 avant écriture des valeurs depuis `migrateLegacyMaterial(data)`. Pattern "reset then write" préserve l'idempotence.
5. **Pas de validation MAT-13 globalisée à ce stade** : la garde Phase 1 par-ULD (`addUld()` check `uldHasMaterial`) reste en place — sera supprimée Plan 06-05 quand `manifestHasMaterial()` est introduit (D-34, D-35, D-36). Comportement résiduel (alert "matériel non saisi" sur ajout 2e ULD) ATTENDU.
6. **Phase 1 CSS/JS legacy préservé** : `.material-modal-*` + `openMaterialModal` + `toggleForfait` etc. restent en place — orphelinage progressif via plans 03/04/05/06. Pas de delete destructif tant que toutes les surfaces (PDF/email/recap) ne sont pas migrées.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker, post-commit] Task 3 commit squashed accidentellement avec Task 1 du Plan 06-02**
- **Found during:** Continuation finalization (cette session) — audit `git log --all -- static/js/app.js`
- **Issue:** Le commit `ff6f585` est libellé `feat(06-02): add migrateLegacyMaterial helper (D-12..D-18, D-45)` mais son diff inclut AUSSI le contenu de la Task 3 de 06-01 (handlers `toggleMaterialSectionForfait`, `toggleMaterialSectionNoBilling`, `resetMaterialSection` lignes 143-200 + `resetMaterialSection();` ajouté dans `newManifest` ligne 504). L'exécuteur précédent a vraisemblablement enchaîné Task 3 de 06-01 et Task 1 de 06-02 dans un seul `git add . && git commit` avec un seul message — Plan 06-02 a été listé `ff6f585` Task 1 et Plan 06-01 a hérité du même hash pour sa Task 3.
- **Fix:** Documenté ici (déviation post-hoc). Pas de re-commit destructif (le contenu fonctionnel est correct et déjà mergé). Future référence : tracer cette confusion dans la timeline atomic-commit du projet.
- **Files modified:** Aucun fichier modifié par ce fix — purement documentaire.
- **Verification:** `git show ff6f585 -- static/js/app.js` confirme la présence des 3 handlers Task 3 06-01 + de `migrateLegacyMaterial` Task 1 06-02 dans le même diff. Les acceptance criteria Task 3 06-01 (`grep -q "function toggleMaterialSectionForfait/NoBilling/resetMaterialSection"` + `grep -c "resetMaterialSection();"`) passent tous.
- **Committed in:** `ff6f585` (contenu mergé), documenté dans ce SUMMARY (méta).

**2. [Rule 1 - Bug clarification] Garde MAT-13 par-ULD résiduelle bloque l'ajout d'une 2e ULD**
- **Found during:** Task 4 (vérification visuelle utilisateur, ajout d'une 2e ULD)
- **Issue:** L'utilisateur a constaté qu'après remplissage d'une 1ère ULD sans matériel saisi (la section globale est désormais la source de saisie), `addUld()` déclenche encore le message "matériel non saisi" Phase 1 (garde `uldHasMaterial` per-ULD).
- **Fix:** AUCUN fix dans ce plan — comportement ATTENDU. Le refactor `addUld()` est planifié Plan 06-03 (suppression du couplage matériel↔ULD) ; la globalisation de MAT-13 (`manifestHasMaterial()` + check unique dans `generatePdf/sendEmail`) est planifiée Plan 06-05 (D-34/D-35/D-36). L'utilisateur a confirmé l'acceptabilité et approuvé la finalisation de 06-01 sur la base d'une vérification single-ULD + suppression scheduled.
- **Files modified:** Aucun (out-of-scope pour 06-01 — scope strict UI + handlers + reset).
- **Verification:** Vérification single-ULD intégrale passée (position, grid 2/1 col, exclusivité forfait, toggle noBilling, reset newManifest, console propre).
- **Committed in:** N/A (pas de code change). Documenté dans 06-01-PLAN.md (status="APPROVED 2026-05-20" + commentaire HTML sur la task 4).

---

**Total deviations:** 2 (1 post-commit doc deviation, 1 deferred-to-next-plan known-residual)
**Impact on plan:** Aucun scope creep. Déviation #1 purement documentaire (contenu fonctionnel correct, juste hash partagé avec commit 06-02). Déviation #2 explicitement scope-out (sera traitée Plans 06-03 + 06-05 selon CONTEXT D-34/D-35/D-36).

## Issues Encountered

- **Granularité atomic commits** : la combinaison Task 3 06-01 + Task 1 06-02 dans un même commit a brouillé la traçabilité par-plan. Pour Plans 06-03..06-06, l'exécuteur doit strictement séparer `git add file1 && git commit` pour chaque task avant de passer à la suivante (cf. `task_commit_protocol` du workflow execute-plan).
- **Checkpoint résiduel multi-ULD** : la garde MAT-13 Phase 1 fait remonter false-positive "matériel non saisi" au scénario multi-ULD pendant la transition Phase 6. Acceptable car explicitement scoped pour Plans 06-03/06-05.

## User Setup Required

None — pas de configuration externe nécessaire. Plan purement frontend (HTML/CSS/JS vanilla, IDs préfixés, no backend, no env vars).

## Next Phase Readiness

- **Plan 06-02 (helper migration)** : DONE — commit `ff6f585` (helper) + `3481c6a` (34 tests) + `663d55e` (docs). `migrateLegacyMaterial(data)` pure et testée, prête pour câblage Plan 06-03.
- **Plan 06-03 (collectData/loadManifest/addUld)** : ready to start. La section UI `#material-section` est en place pour servir de surface de lecture (collectData) et d'écriture (loadManifest). `resetMaterialSection()` est extracted pour réutilisation par loadManifest. Le couplage addUld↔modal matériel sera à supprimer (suppression du auto-open + de la garde par-ULD).
- **Plans 06-04..06-06** : dépendent de 06-03 (data.material top-level disponible).
- **Aucun blocker technique** restant pour 06-03. La garde MAT-13 par-ULD résiduelle est attendue et documentée.

## Self-Check: PASSED

- File `.planning/phases/06-materiel-global-refactor-saisie-unique/06-01-SUMMARY.md` exists — VERIFIED (`test -f` returns 0)
- File `index.html` contains `id="material-section"` — VERIFIED (grep found 1 file)
- File `static/css/style.css` contains `.material-section-grid` 8 occurrences (2 minimum required : 1 desktop + 1 mobile media query) — VERIFIED
- File `static/js/app.js` contains `function toggleMaterialSectionForfait` line 149 — VERIFIED
- File `static/js/app.js` contains `function toggleMaterialSectionNoBilling` line 161 — VERIFIED
- File `static/js/app.js` contains `function resetMaterialSection` line 185 — VERIFIED
- File `static/js/app.js` contains `resetMaterialSection();` call line 504 (inside newManifest) — VERIFIED
- Commit `7818385` (Task 1: index.html section UI) — VERIFIED in `git log --oneline --all`
- Commit `30f7640` (Task 2: CSS rules) — VERIFIED in `git log --oneline --all`
- Commit `ff6f585` (Task 3: handlers + newManifest reset, squashed with Plan 06-02 Task 1 — diff verified) — VERIFIED in `git log --oneline --all`
- PLAN.md Task 4 marked `status="APPROVED 2026-05-20"` with explanatory HTML comment — VERIFIED (edited this session)

---
*Phase: 06-materiel-global-refactor-saisie-unique*
*Completed: 2026-05-20*
