---
phase: 06-materiel-global-refactor-saisie-unique
plan: 04
subsystem: rendering
tags: [pdf, email, html, render, data-material, retro-compat-render, anti-xss]

# Dependency graph
requires:
  - 06-03-SUMMARY.md (data.material top-level disponible dans data collectées et chargées)
provides:
  - "buildPdf() section 'Materiel' page 1 alimentée par data.material (D-20..D-25)"
  - "PDF pages détail ULD SANS section Materiel (D-24)"
  - "sendEmail() section 'Matériel' HTML unique alimentée par data.material (D-26..D-28)"
  - "Email HTML détail ULD SANS bloc Matériel (D-27)"
  - "Symétrie partielle PDF↔email : libellé ASCII 'Baches' en PDF / UTF-8 'Bâches' en email (D-26)"
  - "manifestComment escapé via esc() en email + wrap newlines via autoTable overflow:'linebreak' en PDF (D-22, D-42)"
affects:
  - "06-05-PLAN.md (rien — validation est indépendante du rendu)"
  - "06-06-PLAN.md (tests rendu PDF/email à adapter sur le nouveau format global)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rendu lit la donnée directement (data.material) sans agrégation intermédiaire — plus de buildMaterialSummary/buildUldMaterialRows dans la chaîne render"
    - "Symétrie partielle PDF/email : structure identique + libellés ASCII-safe pour jsPDF default font, UTF-8 préservé en email (D-26)"
    - "autoTable overflow:'linebreak' sur la cellule valeur pour wrapper les '\\n' de manifestComment migré (D-17 + D-22)"
    - "white-space:pre-wrap CSS dans cellule HTML email pour préserver les newlines"

key-files:
  created:
    - .planning/phases/06-materiel-global-refactor-saisie-unique/06-04-SUMMARY.md
  modified:
    - static/js/app.js (buildPdf section page 1 refactor + suppression section page détail + sendEmail section unique + suppression bloc par-ULD)

key-decisions:
  - "Phase 06 P04: section PDF 'Materiel' renommée depuis 'Totaux materiel' (D-20) — n'est plus une agrégation calculée mais le reflet direct de la saisie globale par l'agent"
  - "Phase 06 P04: D-22 manifestComment intégré comme ligne 'Commentaire' de la table autoTable, avec columnStyles 1: { overflow: 'linebreak' } pour wrapper les '\\n' migrés (sans ça jspdf-autotable coupe le texte au lieu de wrapper)"
  - "Phase 06 P04: D-23 cas noMaterialToBill === true → 1 ligne unique '' / 'Rien à facturer' (PDF + email symétriques)"
  - "Phase 06 P04: D-26 symétrie partielle préservée — 'Baches' ASCII en PDF (jsPDF default font glyph constraint), 'Bâches' UTF-8 en email (rendu HTML libre des contraintes police PDF)"
  - "Phase 06 P04: D-42 esc() sur label ET valeur dans email + white-space:pre-wrap sur cellule valeur — défense en profondeur anti-XSS sur manifestComment user-supplied"
  - "Phase 06 P04: buildMaterialSummary, buildUldMaterialRows, buildMaterialSummaryHtml, buildUldMaterialHtml, formatFlooringDisplay restent définies mais ORPHELINES (Claude's Discretion, cleanup Plan 06-06)"

requirements-completed: [MAT-11, RECAP-02]

# Metrics
duration: 25min
completed: 2026-05-21
---

# Phase 06 Plan 04: Rendu PDF + email symétrique depuis data.material — Summary

**Le rendu PDF (page 1) et email HTML lisent désormais `data.material` directement au lieu d'agréger depuis `data.ulds[i]`. Une seule section "Materiel" (PDF) / "Matériel" (email UTF-8) en haut, avec `manifestComment` intégré comme ligne dédiée (newlines wrappées via autoTable `overflow:'linebreak'` et CSS `white-space:pre-wrap`). Les pages détail ULD du PDF et les blocs ULD de l'email N'AFFICHENT PLUS de section matériel. Symétrie partielle PDF/email préservée (ASCII 'Baches' en PDF, UTF-8 'Bâches' en email). esc() obligatoire sur label ET valeur dans email (anti-XSS MAT-11 sur manifestComment).**

## Performance

- **Duration:** ~25 min (2 commits atomic + UAT intégrée 3-plans)
- **Started:** 2026-05-20 (commits 5149445 → c710ee0)
- **Completed:** 2026-05-21 (user approval via integrated UAT 3-plans 06-03/06-04/06-05)
- **Tasks:** 3 (2 code + 1 human-verify checkpoint approuvé en bundle)
- **Files modified:** 1 (static/js/app.js)

## Accomplishments

### Task 1 — buildPdf() refactor page 1 + suppression page détail (5149445)
- Section page 1 renommée `'Totaux materiel'` → `'Materiel'` (D-20)
- Lecture directe `var mat = data.material || {}` — plus d'appel `buildMaterialSummary(data.ulds)`
- Détection `hasAnyMat` étendue : inclut `mat.noMaterialToBill === true` ET `manifestComment` non-vide (D-21)
- Construction matRows alignée sur les règles Phase 6 :
  - cas noBilling → 1 ligne `['', 'Rien à facturer']` (D-23)
  - sangles si > 0 (lue de mat.strapsCount)
  - planchers EU/Std : forfait → libellé 'forfait' littéral, sinon count si > 0 (D-25)
  - bois calage, bâches (ASCII 'Baches' D-26), intercalaires, nids d'abeille
  - **Commentaire si non-vide** (D-22 — manifestComment intégré comme ligne dédiée)
- `columnStyles: { 1: { cellWidth: 'auto', overflow: 'linebreak' } }` sur cellule valeur → autoTable wrappe correctement les `\n` du manifestComment migré (D-17 concaténation "ULD N°1 : x\nULD N°2 : y")
- **Suppression intégrale** du bloc "Section Materiel pour cette ULD" dans la boucle pages détail (anciennes lignes ~1235-1254) — D-24

### Task 2 — sendEmail() refactor section unique + suppression bloc par-ULD (c710ee0)
- Suppression de l'appel `html += buildMaterialSummaryHtml(data.ulds);` au-dessus de la boucle ULDs
- Bloc inline remplaçant : lit `data.material`, construit `emailMatRows[]` selon les mêmes règles que PDF Task 1
- Title `<h3 style="color:#1a3a5c;margin-top:16px;">Matériel</h3>` (UTF-8 préservé)
- Cellule valeur avec `style="padding:4px 10px;white-space:pre-wrap;"` → newlines `\n` rendus correctement dans le client mail
- **D-26 symétrie partielle** : `if (tarpsE > 0) emailMatRows.push(['Bâches', String(tarpsE)]);` (UTF-8 'Bâches' en email, distinct du PDF 'Baches' ASCII)
- **D-42 anti-XSS** : `esc(r[0])` ET `esc(r[1])` sur label ET valeur (défense en profondeur — le label est statique mais préfixé esc() pour cohérence, la valeur peut contenir manifestComment user-supplied)
- Suppression de `html += buildUldMaterialHtml(u);` dans la boucle ULDs (D-27)

### Task 3 — Vérification rendu PDF + email (UAT intégrée 3-plans, 4 scénarios)
- **Scénario A normal** : sangles=3, EU=2, forfait Std, bâches=1, commentaire multi-ligne →
  - PDF page 1 : "Materiel" présent, lignes correctes, "Baches : 1" ASCII, commentaire wrappé sur plusieurs lignes via autoTable linebreak ✓
  - PDF pages 2-3 ULD détail : AUCUNE section matériel ✓
- **Scénario B email** : email envoyé →
  - Section "Matériel" UTF-8 en haut (après récap principal, avant détail ULD) ✓
  - Label 'Bâches' UTF-8 affiché correctement (vs PDF 'Baches' ASCII) ✓
  - Commentaire newlines préservées via white-space:pre-wrap ✓
  - Blocs détail ULD : SANS section matériel ✓
- **Scénario C "Rien à facturer"** : checkbox cochée → PDF page 1 affiche 1 seule ligne "Rien à facturer" ✓
- **Scénario D XSS** : commentaire = `<script>alert('XSS')</script><b>HTML</b>` → email affiche le texte LITTÉRALEMENT (pas d'alerte JS, pas de gras) — esc() actif sur valeur ✓

## Task Commits

| Hash    | Task | Type     | Message                                                                                                              |
|---------|------|----------|----------------------------------------------------------------------------------------------------------------------|
| 5149445 | 1    | refactor | refactor(06-04): buildPdf section Materiel page 1 depuis data.material + suppression section par-ULD (D-20..D-25)    |
| c710ee0 | 2    | refactor | refactor(06-04): sendEmail section Materiel HTML depuis data.material + suppression bloc par-ULD (D-26, D-27, D-28, D-42) |
| —       | 3    | —        | Checkpoint UAT (no commit) — approuvé 2026-05-21 via UAT intégrée 3-plans                                            |

**Plan metadata commit:** à venir après self-check (docs: complete 06-04 plan)

## Files Created/Modified

- `static/js/app.js` :
  - `buildPdf()` : section "Materiel" page 1 reconstruite depuis `data.material`, intégration manifestComment avec autoTable overflow:'linebreak', cas noMaterialToBill, libellé ASCII 'Baches'. Suppression de la section "Materiel" dans les pages détail ULD (bloc ~20 lignes supprimé). `buildMaterialSummary(data.ulds)` et `buildUldMaterialRows(u)` ne sont plus appelés (fonctions toujours définies, orphelines).
  - `sendEmail()` : section "Matériel" HTML unique avant la boucle ULDs, lit `data.material`. `<h3>Matériel</h3>` UTF-8. Cellule valeur avec `white-space:pre-wrap`. esc() défense en profondeur sur label ET valeur. Label 'Bâches' UTF-8 préservé. `buildMaterialSummaryHtml(data.ulds)` et `buildUldMaterialHtml(u)` ne sont plus appelés (fonctions toujours définies, orphelines).

## Decisions Made

1. **Lecture directe data.material (D-21)** : plus de `buildMaterialSummary(ulds)` qui agrégeait depuis les ULDs — la valeur est désormais une donnée saisie par l'agent, plus une dérivation. Cohérence : la sémantique "matériel global manifeste" se reflète dans le code de rendu.
2. **manifestComment intégré au tableau (D-22)** : pas une section séparée, mais une ligne dans la table Matériel. Cohérence visuelle (le commentaire fait partie du contexte matériel) et économise de la verticale en page 1.
3. **autoTable overflow:'linebreak' (D-22 warning checker #2)** : critique pour le rendu PDF du manifestComment migré (format D-17 "ULD N°1 : x\nULD N°2 : y\n..."). Sans cette option, jspdf-autotable coupe le texte au bord de la cellule au lieu de wrapper sur les `\n`. Découvert lors de la définition du plan (warning checker préventif).
4. **Symétrie partielle PDF↔email (D-26)** : le rendu PDF utilise la police par défaut jsPDF qui ne supporte pas tous les accents UTF-8 → `'Bâches'` est mappé sur `'Baches'` ASCII en PDF UNIQUEMENT. L'email HTML est rendu dans le client mail (libre des contraintes police) → UTF-8 préservé. Documenté explicitement pour éviter une "correction" future qui aligne les deux à tort.
5. **esc() sur label ET valeur (D-42 défense en profondeur)** : même si les labels sont statiques (`'Sangles'`, `'Bâches'`, etc.), `esc()` est appliqué pour cohérence — empêche un futur refactor d'introduire un label user-supplied sans esc(). La valeur peut contenir manifestComment user-supplied → esc() OBLIGATOIRE (MAT-11).
6. **Fonctions buildMaterialSummary / buildUldMaterialRows / buildMaterialSummaryHtml / buildUldMaterialHtml / formatFlooringDisplay orphelinées** : conservées en mémoire mais sans caller. Permet aux tests Plan 02 (helper pur, indépendant) de continuer à passer. Cleanup massif scheduled Plan 06-06.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker, post-hoc] Wave 3 parallel-execution squash collision — D-35 cleanup landed in 06-04 commit instead of 06-05**
- **Found during:** Continuation finalization (cette session) — audit `git show c710ee0 -- static/js/app.js`
- **Issue:** Les plans 06-04 et 06-05 étaient en wave 3 (parallélisables après 06-03). L'exécuteur a chaîné les modifications dans un ordre serré et la suppression du bloc `findIncompleteUlds()` dans `showGenerateSection()` (D-35, scope explicite du Plan 06-05 Task 3) s'est retrouvée incluse dans le commit `c710ee0` (libellé 06-04 sendEmail refactor). Le diff de c710ee0 inclut donc :
  - le refactor sendEmail section Matériel (scope 06-04 attendu)
  - **plus** la suppression du blocage MAT-13 par-ULD dans showGenerateSection (scope 06-05 D-35 — squash collision)
- **Fix:** AUCUN re-commit destructif. Le file end-state est CORRECT (vérifié par inspection : showGenerateSection ne fait plus que `validateRequired() + style.display + scroll` ; aucun caller de openMaterialModal autre que la définition orpheline en haut du fichier). User UAT confirme le comportement attendu (Scénario "section Envoi affichée librement, blocage uniquement à generate/send"). Déviation purement post-hoc, documentaire — analogue à la déviation Plan 06-01 (ff6f585 squash Task 3 + Task 1 de 06-02).
- **Files modified:** Aucun fichier modifié par ce fix — purement documentaire.
- **Verification:** `git show c710ee0 -- static/js/app.js | grep -E "showGenerateSection|incompleteGen|D-35"` confirme la présence de la modification 06-05 D-35 dans c710ee0. Acceptance criteria Task 2 06-04 (`Matériel</h3>`, `matE.manifestComment`, `esc(r[1])`, `white-space:pre-wrap`, `'Bâches'`, absence de `buildMaterialSummaryHtml(data.ulds)`, absence de `buildUldMaterialHtml(u)`) tous PASS.
- **Committed in:** `c710ee0` (mixed scope 06-04 + 06-05 D-35). Documenté dans ce SUMMARY (méta) ET dans 06-05-SUMMARY.md (méta symétrique).

**Future référence :** Wave 3 parallel-execution doit forcer un sync-point explicit entre les exécuteurs parallèles pour éviter ces collisions. Pour Plan 06-06 (wave 4, mono-plan), le risque est éliminé naturellement.

---

**Total deviations:** 1 (post-hoc doc, squash collision Wave 3)
**Impact on plan:** Aucun — file end-state correct, comportement vérifié UAT.

## Tests Status

- **Tests Phase 1 matériel par-ULD rendu** (suites `buildMaterialSummary`, `buildUldMaterialRows`, `buildMaterialSummaryHtml`, `buildUldMaterialHtml`) : **DEVIENNENT OBSOLÈTES** après ce plan — testaient l'agrégation depuis data.ulds[i] qui n'est plus la source. Plan 06-06 adapte / supprime ces suites.
- **Tests Plan 06-02 (Migration helper purs)** : **CONTINUENT À PASSER** (helper indépendant du rendu).
- **Validation manuelle** : UAT intégrée 3-plans Task 3 approuvée 2026-05-21 par l'utilisateur (PDF + email + XSS + "Rien à facturer").
- `npm run verify` n'est PAS lancé avant Plan 06-06 (état intermédiaire wave 3 attendu non-vert, documenté CONTEXT).

## Auth Gates

None.

## Known Stubs

None. Le rendu PDF et email est entièrement câblé sur data.material. Les fonctions Phase 1 (`buildMaterialSummary`, `formatFlooringDisplay`, `buildUldMaterialRows`, `buildMaterialSummaryHtml`, `buildUldMaterialHtml`) restent définies mais sans caller — ce sont du code mort scheduled cleanup Plan 06-06, PAS des stubs (rien n'est "à câbler plus tard", la fonctionnalité est complète).

## Next Phase Readiness

- **Plan 06-05 (validation MAT-13 globalisée)** : COMPLETED en parallèle (wave 3) — voir 06-05-SUMMARY.md (note squash collision documentée).
- **Plan 06-06 (tests + cleanup)** : ready — rendu data.material complet + fonctions orphelines listées + tests Phase 1 rendu à adapter listés.
- **Aucun blocker technique** restant.

## Self-Check: PASSED

- File `.planning/phases/06-materiel-global-refactor-saisie-unique/06-04-SUMMARY.md` exists — VERIFIED
- Commit `5149445` (Task 1: buildPdf) — VERIFIED in `git log --oneline`
- Commit `c710ee0` (Task 2: sendEmail + D-35 squash collision documentée) — VERIFIED in `git log --oneline`
- File `static/js/app.js` contains `doc.text('Materiel'` (PDF section renommée) — VERIFIED via grep
- File `static/js/app.js` contains `Matériel</h3>` (email H3 UTF-8) — VERIFIED via grep
- File `static/js/app.js` contains `'Bâches'` (UTF-8 email label) — VERIFIED via grep
- File `static/js/app.js` contains `overflow: 'linebreak'` (autoTable D-22 wrap) — VERIFIED via grep
- File `static/js/app.js` does NOT contain `buildMaterialSummary(data.ulds)` (rendu PDF découplé) — VERIFIED (grep 0)
- File `static/js/app.js` does NOT contain `buildUldMaterialHtml(u)` (rendu email découplé) — VERIFIED (grep 0)
- PLAN.md Task 3 marked `status="APPROVED 2026-05-21"` — VERIFIED (edited this session)

---
*Phase: 06-materiel-global-refactor-saisie-unique*
*Completed: 2026-05-21 (UAT intégrée 3-plans 06-03/06-04/06-05)*
