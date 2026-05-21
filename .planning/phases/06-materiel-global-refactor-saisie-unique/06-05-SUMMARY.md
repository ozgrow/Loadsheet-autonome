---
phase: 06-materiel-global-refactor-saisie-unique
plan: 05
subsystem: validation
tags: [mat-13, validation, global, helper, scroll-focus, anti-popup]

# Dependency graph
requires:
  - 06-03-SUMMARY.md (section #material-section est la source unique de saisie matériel)
provides:
  - "Helper manifestHasMaterial() lisant #material-section (D-32)"
  - "Validation MAT-13 globalisée dans generatePdf() et sendEmail() (D-33)"
  - "Blocage MAT-13 supprimé de showGenerateSection() (D-35)"
  - "Suppression du re-open openMaterialModal() lors d'un blocage (anti-popup vestige Phase 1)"
  - "Alert + scroll vers #material-section + focus #mat-global-straps comme remplacement UX"
affects:
  - "06-06-PLAN.md (tests MAT-13 à réécrire sur la base de manifestHasMaterial — anciens tests findIncompleteUlds obsolètes)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Validation manifest-level via helper boolean dédié (manifestHasMaterial) — séparation 'validation' / 'collection' (vs collectData qui lit la valeur, manifestHasMaterial vérifie la présence)"
    - "UX guidance par scroll + focus au lieu de popup auto-open (Phase 1 MAT-14 anti-pattern supprimé)"
    - "Defensive read (parseInt(value)||0) pour chaque input number — robust à des états DOM transitoires"

key-files:
  created:
    - .planning/phases/06-materiel-global-refactor-saisie-unique/06-05-SUMMARY.md
  modified:
    - static/js/app.js (manifestHasMaterial helper + generatePdf/sendEmail validation + showGenerateSection cleanup)

key-decisions:
  - "Phase 06 P05: manifestHasMaterial() lit DOM directement (cohérent avec uldHasMaterial existant) — pas d'arg data.material, helper utilisable sans collectData préalable"
  - "Phase 06 P05: alert message générique 'Saisie matériel obligatoire' (vs Phase 1 'Matériel non saisi pour ULD N°X') — cohérent avec sémantique globale, plus de référence ULD-spécifique"
  - "Phase 06 P05: scroll smooth vers #material-section + focus #mat-global-straps — remplace le re-open auto modal Phase 1 (MAT-14 supprimé D-36)"
  - "Phase 06 P05: blocage MAT-13 supprimé de showGenerateSection (D-35) — la section 'Envoi' s'affiche librement, le blocage est uniquement à generatePdf/sendEmail (commitée dans c710ee0 par squash collision Wave 3, documentée Rule 3)"
  - "Phase 06 P05: findIncompleteUlds() N'EST PLUS APPELÉE — orpheline en mémoire (Claude's Discretion non-cleanup, scheduled Plan 06-06)"

requirements-completed: [MAT-13]

# Metrics
duration: 22min
completed: 2026-05-21
---

# Phase 06 Plan 05: Validation MAT-13 globalisée + helper manifestHasMaterial — Summary

**Le blocage "matériel obligatoire" passe d'une logique par-ULD (Phase 1 `findIncompleteUlds()` parcourant `.uld-block` data-attributes) à une logique manifest-level via le nouveau helper `manifestHasMaterial()` qui lit `#material-section`. Le blocage est appliqué UNIQUEMENT à `generatePdf()` et `sendEmail()` (les 2 points de sortie de la donnée vers l'extérieur). `showGenerateSection()` n'a plus de blocage (D-35). MAT-14 (auto-open modal) est totalement supprimée — remplacée par scroll smooth + focus sur premier input. Alert générique 'Saisie matériel obligatoire'.**

## Performance

- **Duration:** ~22 min (2 commits atomic + UAT intégrée 3-plans)
- **Started:** 2026-05-20 (commits 2c2cd92 → a26e446)
- **Completed:** 2026-05-21 (user approval via integrated UAT 3-plans 06-03/06-04/06-05)
- **Tasks:** 4 (3 code + 1 human-verify checkpoint approuvé en bundle)
- **Files modified:** 1 (static/js/app.js)

## Accomplishments

### Task 1 — Helper manifestHasMaterial() (2c2cd92)
- Fonction insérée juste après `findIncompleteUlds()` (ligne ~356 finale)
- Lit directement le DOM `document.getElementById('material-section')` — pas d'argument
- Retourne `true` si :
  - `#mat-global-no-billing` cochée (saisie explicite "Rien à facturer")
  - OU au moins un input number > 0 (sangles, planchers EU/Std, blocks, tarps, dividers, honeycomb) — boucle sur 7 IDs
  - OU au moins une checkbox forfait (EU ou Std) cochée
  - OU textarea `#mat-global-comment` non-vide après `trim()`
- Retourne `false` sinon (et défensive : `false` si la section n'existe pas — cas test/init edge)
- 33 lignes insérées net (pas de modification d'autres fonctions)

### Task 2 — Validation generatePdf() + sendEmail() (a26e446)
- **generatePdf()** en-tête : suppression du bloc `var incompletePdf = findIncompleteUlds(); if (incompletePdf.length > 0) { ... openMaterialModal(...) }` (Phase 1)
- Nouveau bloc : `if (!manifestHasMaterial()) { alert('Saisie matériel obligatoire : ...'); scrollIntoView; focus mat-global-straps; return; }`
- **sendEmail()** en-tête : suppression du bloc équivalent + remplacement par le même check
- Message alert générique : "Saisie matériel obligatoire : veuillez remplir au moins un champ de la section Matériel, ou cocher 'Rien à facturer pour ce manifeste'."
- Scroll smooth `section.scrollIntoView({ behavior: 'smooth' })` + focus premier input `firstInput.focus()`
- **Suppression du re-open openMaterialModal()** : Phase 1 ré-ouvrait le modal par-ULD sur la 1ère ULD incomplète, ce qui réécrirait des data-attributes sur l'ULD → CONTRADICTOIRE avec le modèle Phase 6. La suppression est explicite dans le message de commit (a26e446).

### Task 3 — Cleanup showGenerateSection() D-35 (squash collision dans c710ee0)
- Suppression du bloc `var incompleteGen = findIncompleteUlds(); ... openMaterialModal(parseInt(incompleteGen[0]) || 1)` (~7 lignes)
- Fonction réduite à : `if (!validateRequired()) return; generateSection.style.display = 'block'; scrollIntoView;`
- Commentaire D-35 ajouté en tête de fonction expliquant le déplacement de la garde vers generatePdf/sendEmail uniquement
- **Note squash collision** : cette modification a été commitée dans `c710ee0` (libellé 06-04 sendEmail refactor) au lieu d'un commit dédié 06-05 — voir section Deviations.

### Task 4 — Vérification validation MAT-13 globalisée (UAT intégrée 3-plans, 7 scénarios)
- **Scénario 1 (blocage PDF section vide)** : alert "Saisie matériel obligatoire", page scroll vers section, focus sur champ Sangles ✓
- **Scénario 2 (blocage email section vide)** : même alert + scroll + focus ✓
- **Scénario 3 (passage avec sangles=2)** : PDF généré sans alert, chaîne complète OK ✓
- **Scénario 4 (passage avec noBilling seul)** : PDF généré ✓ (manifestHasMaterial retourne true via noBilling)
- **Scénario 5 (passage avec commentaire seul)** : PDF généré ✓
- **Scénario 6 (absence blocage addUld)** : ajout 2e ULD sans matériel — pas d'alert (D-34, héritage Plan 06-03) ✓
- **Scénario 7 (showGenerateSection libre)** : cliquer "Generer Loadsheet" sans matériel → section "Envoi" s'affiche sans alert (D-35) ✓

## Task Commits

| Hash    | Task | Type | Message                                                                                                                       |
|---------|------|------|-------------------------------------------------------------------------------------------------------------------------------|
| 2c2cd92 | 1    | feat | feat(06-05): add manifestHasMaterial() helper (D-32, D-33)                                                                    |
| a26e446 | 2    | feat | feat(06-05): globalize MAT-13 in generatePdf and sendEmail (D-32, D-33)                                                       |
| c710ee0 | 3    | refactor | refactor(06-04): sendEmail section Materiel HTML depuis data.material + suppression bloc par-ULD (D-26, D-27, D-28, D-42) — **inclut aussi D-35 cleanup showGenerateSection (squash collision Wave 3)** |
| —       | 4    | —    | Checkpoint UAT (no commit) — approuvé 2026-05-21 via UAT intégrée 3-plans                                                     |

**Plan metadata commit:** à venir après self-check (docs: complete 06-05 plan)

## Files Created/Modified

- `static/js/app.js` :
  - Helper `manifestHasMaterial()` ajouté ligne 356 (juste après `findIncompleteUlds()`)
  - `generatePdf()` ligne ~1457 : remplacement du bloc de validation MAT-13 (5 lignes Phase 1 → 7 lignes Phase 6)
  - `sendEmail()` ligne ~1485 : remplacement du bloc de validation MAT-13 (5 lignes Phase 1 → 7 lignes Phase 6)
  - `showGenerateSection()` ligne ~662 : suppression du bloc findIncompleteUlds (~7 lignes), commentaire D-35 ajouté
- Helper `findIncompleteUlds()` reste défini ligne 333 mais N'EST PLUS APPELÉ NULLE PART (orphelin, cleanup scheduled Plan 06-06).

## Decisions Made

1. **manifestHasMaterial() sans argument (lit DOM)** : cohérent avec le pattern existant `uldHasMaterial(block)` qui lit aussi le DOM. Permet d'appeler le helper SANS avoir collecté `data.material` au préalable (économie : pas besoin de construire l'objet pour vérifier la présence).
2. **Alert message générique 'Saisie matériel obligatoire'** : abandon de la référence ULD-spécifique de Phase 1 ('Matériel non saisi pour : ULD N°1, ULD N°2'). Sémantique alignée : le matériel est global, le message doit l'être aussi.
3. **Scroll smooth + focus au lieu de re-open modal (anti-popup D-36)** : la Phase 1 ré-ouvrait automatiquement le modal matériel sur la 1ère ULD incomplète. Cela était :
   (a) UX intrusive (modal qui s'ouvre sur clic Generate)
   (b) sémantiquement contradictoire avec Phase 6 (re-ouvrir un modal par-ULD alors que la saisie est globale)
   (c) source de re-écriture orpheline de data-attributes ULD
   Remplacement : scroll smooth (l'agent voit où aller) + focus (curseur prêt à taper).
4. **Blocage uniquement à generatePdf/sendEmail (D-35)** : `showGenerateSection()` ne bloque plus. La section "Envoi" peut s'afficher librement — l'agent voit les boutons "Generer PDF" / "Envoyer email" mais ne pourra pas les utiliser tant que `manifestHasMaterial()` reste false. Évite la double validation (Phase 1 bloquait montrer + bloquait générer).
5. **findIncompleteUlds() orpheline (Claude's Discretion)** : la fonction reste définie en mémoire mais sans caller. Cleanup massif scheduled Plan 06-06 (cohérent avec orphelinage des autres helpers Phase 1 : openMaterialModal, applyMaterialToUld, etc.).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker, post-hoc] Wave 3 parallel-execution squash collision — D-35 cleanup landed in 06-04 commit instead of dedicated 06-05 commit**
- **Found during:** Continuation finalization (cette session) — audit `git show c710ee0 -- static/js/app.js`
- **Issue:** Les plans 06-04 (rendu PDF/email) et 06-05 (validation MAT-13) étaient parallélisables après 06-03 (wave 3 du graphe de dépendances). L'exécuteur a chaîné les modifications sur app.js sans sync-point explicite entre les 2 plans, et la suppression du blocage MAT-13 dans `showGenerateSection()` (D-35, Task 3 scope explicite du Plan 06-05) s'est retrouvée incluse dans le commit `c710ee0` (libellé 06-04 sendEmail refactor) au lieu d'un commit dédié 06-05.
- **Impact:**
  - **Fonctionnel** : aucun — le file end-state contient bien la suppression D-35 + showGenerateSection minimal (`if (!validateRequired()) return; ...`)
  - **Traçabilité** : un seul Plan 06-05 a 2 commits (`2c2cd92` + `a26e446`) au lieu de 3 ; la 3e modification (D-35) est noyée dans un commit 06-04.
- **Fix:** AUCUN re-commit destructif. Le contenu fonctionnel est correct (vérifié par UAT scénario 7 — "section Envoi s'affiche librement") + grep `incompleteGen` retourne 0 dans app.js + showGenerateSection contient le commentaire D-35. Déviation purement post-hoc / documentaire.
- **Files modified:** Aucun fichier modifié par ce fix — purement documentaire.
- **Verification:** `git show c710ee0 -- static/js/app.js | grep -E "showGenerateSection|incompleteGen|D-35"` confirme la présence des modifications 06-05 D-35 dans c710ee0. Acceptance criteria Task 3 06-05 (`grep -q "function showGenerateSection"` + absence `var incompleteGen = findIncompleteUlds()` + absence `openMaterialModal(parseInt(incompleteGen[0])` + présence `D-35` commentaire) tous PASS.
- **Committed in:** `c710ee0` (mixed scope 06-04 + 06-05 D-35). Documenté symétriquement dans 06-04-SUMMARY.md.

**Future référence (process amélioré pour Wave parallel-execution) :**
- Forcer un sync-point explicit entre les exécuteurs parallèles avant le checkpoint humain
- OU annoter les commits avec le scope additionnel quand un fix transversal est appliqué (ex: `refactor(06-04, +06-05-D35): ...`)
- Pour Plan 06-06 (wave 4, mono-plan), le risque est éliminé naturellement.

**2. [Rule 1 - Bug clarification] Suppression du re-open openMaterialModal() lors d'un blocage**
- **Found during:** Task 2 (implementation)
- **Issue:** Le plan demandait explicitement de remplacer le bloc Phase 1 par un check `manifestHasMaterial()` + alert + scroll + focus. La Phase 1 contenait après l'alert : `openMaterialModal(parseInt(incompletePdf[0]) || 1)` qui ré-ouvrait le modal matériel par-ULD — incohérent avec Phase 6 (le modal écrirait des data-attributes orphelins sur l'ULD). Le plan ne mentionnait pas explicitement la suppression mais elle est implicite (le bloc remplaçant n'inclut pas cet appel).
- **Fix:** L'appel `openMaterialModal(...)` après l'alert est supprimé en même temps que le reste du bloc. Documenté explicitement dans le message de commit `a26e446` ("Remove openMaterialModal() re-opening (was reopening orphan modal that wrote per-ULD data-attributes, contradicting global Phase 6 model)").
- **Files modified:** static/js/app.js (déjà comptabilisé dans le diff de a26e446)
- **Verification:** `grep -n "openMaterialModal" static/js/app.js` retourne uniquement la ligne 33 (définition de la fonction orpheline) — aucun caller restant dans app.js.
- **Committed in:** `a26e446`

---

**Total deviations:** 2 (1 squash collision Wave 3 post-hoc doc, 1 clarification suppression openMaterialModal call)
**Impact on plan:** Aucun — file end-state correct, comportement vérifié UAT (7 scénarios).

## Tests Status

- **Tests Phase 1 MAT-13/MAT-14** (suites "MAT-13 validation par-ULD", "MAT-14 auto-open modal") : **DEVIENNENT OBSOLÈTES** après ce plan. Plan 06-06 remplace par "Matériel global - Validation MAT-13" (≥6 tests : manifestHasMaterial vrai/faux selon chaque type de saisie, blocage generatePdf, blocage sendEmail, passage showGenerateSection sans matériel).
- **Tests Plan 06-02 (Migration helper purs)** : **CONTINUENT À PASSER** (indépendants).
- **Validation manuelle** : UAT intégrée 3-plans Task 4 approuvée 2026-05-21 par l'utilisateur (7 scénarios : blocage PDF/email vide, passage sangles/noBilling/commentaire, addUld sans blocage, showGenerateSection libre).
- `npm run verify` n'est PAS lancé avant Plan 06-06 (état intermédiaire wave 3 attendu non-vert).

## Auth Gates

None.

## Known Stubs

None. La validation MAT-13 est entièrement câblée sur manifestHasMaterial() à generatePdf/sendEmail. Le helper `findIncompleteUlds()` reste défini mais sans caller — code mort scheduled cleanup Plan 06-06, PAS un stub.

## Verification — Orphan helpers cleanup status

| Function                  | Status après Plan 06-05                                  |
|---------------------------|-----------------------------------------------------------|
| openMaterialModal         | Définie ligne 33 — 0 caller dans app.js (orpheline)       |
| closeMaterialModal        | Définie ligne 138 — 0 caller dans app.js (orpheline)      |
| toggleForfait             | Définie ligne 102 — 0 caller dans app.js (orpheline)      |
| toggleNoBilling           | Définie ligne 114 — 0 caller dans app.js (orpheline)      |
| applyMaterialToUld        | Définie ligne 203 — 0 caller dans app.js (orpheline)      |
| formatCondensedMaterial   | Définie ligne 259 — 0 caller dans app.js (orpheline)      |
| uldHasMaterial            | Définie ligne 313 — appelée par findIncompleteUlds uniquement (orphelinage transitif) |
| findIncompleteUlds        | Définie ligne 333 — 0 caller dans app.js (orpheline)      |
| refreshMaterialBadge      | Définie ligne 384 — 0 caller dans app.js (orpheline)      |
| buildMaterialSummary      | Définie ligne 969 — 0 caller dans app.js (orpheline)      |
| formatFlooringDisplay     | Définie ligne 998 — 0 caller dans app.js (orpheline)      |
| buildUldMaterialRows      | Définie ligne 1009 — 0 caller dans app.js (orpheline)     |
| buildMaterialSummaryHtml  | Définie ligne 1038 — 0 caller dans app.js (orpheline)     |
| buildUldMaterialHtml      | Définie ligne 1068 — 0 caller dans app.js (orpheline)     |

**Total : 14 fonctions Phase 1 orphelines** prêtes pour cleanup massif Plan 06-06 (Claude's Discretion non-bloquante — le code mort ne casse rien, juste poids mémoire et confusion lecteur).

## Next Phase Readiness

- **Plan 06-06 (tests + cleanup)** : ready — scope cleanup défini (14 fonctions listées ci-dessus), tests MAT-13 globalisés à écrire (helper manifestHasMaterial), tests Phase 1 obsolètes à supprimer.
- **Aucun blocker technique** restant.

## Self-Check: PASSED

- File `.planning/phases/06-materiel-global-refactor-saisie-unique/06-05-SUMMARY.md` exists — VERIFIED
- Commit `2c2cd92` (Task 1: manifestHasMaterial) — VERIFIED in `git log --oneline`
- Commit `a26e446` (Task 2: generatePdf + sendEmail validation) — VERIFIED in `git log --oneline`
- Commit `c710ee0` (Task 3 D-35 squash collision documentée) — VERIFIED in `git log --oneline`
- File `static/js/app.js` contains `function manifestHasMaterial()` line 356 — VERIFIED via grep
- File `static/js/app.js` contains `Saisie matériel obligatoire` (alert message) — VERIFIED via grep
- File `static/js/app.js` does NOT contain `var incompletePdf = findIncompleteUlds` — VERIFIED (grep 0)
- File `static/js/app.js` does NOT contain `var incompleteEmail = findIncompleteUlds` — VERIFIED (grep 0)
- File `static/js/app.js` does NOT contain `var incompleteGen = findIncompleteUlds` — VERIFIED (grep 0)
- File `static/js/app.js` does NOT contain caller of `openMaterialModal()` (only definition line 33) — VERIFIED via grep
- PLAN.md Task 4 marked `status="APPROVED 2026-05-21"` — VERIFIED (edited this session)

---
*Phase: 06-materiel-global-refactor-saisie-unique*
*Completed: 2026-05-21 (UAT intégrée 3-plans 06-03/06-04/06-05)*
