---
phase: 01-mat-riel-uld-r-tro-compat
plan: 03
subsystem: Material gap closure (recap inline + Rien à facturer + validation obligatoire + auto-open modal)
tags: [feat, material-uld, recap-inline, no-billing, validation, auto-open, retro-compat, gap-closure]
dependency_graph:
  requires:
    - "Plan 01-01 (data model + modal initial + recap badge inline historical)"
    - "Plan 01-02 (PDF/email material rendering + buildUldMaterialRows/Html helpers)"
  provides:
    - "Récap inline condensé étendu : court-circuit 'Rien à facturer' (precedence noBilling > VRAC > champs)"
    - "Checkbox 'Rien à facturer' dans le modal matériel (raccourci facturation explicite)"
    - "Flag noMaterialToBill propagé : data-attribute + JSON manifest + collectData + loadManifest + PDF + email"
    - "Helpers MAT-13 : uldHasMaterial(block), findIncompleteUlds() (1-based)"
    - "Validation matériel obligatoire bloquante sur 3 surfaces : addUld, generatePdf, sendEmail"
    - "Signature étendue addUld(autoOpen, skipValidation) : auto-open par défaut, bypass interne pour tests"
    - "Classe CSS .mat-recap-no-billing émise par refreshMaterialBadge pour signal visuel"
  affects:
    - "static/js/app.js : openMaterialModal, applyMaterialToUld, formatCondensedMaterial, refreshMaterialBadge, addUld, loadManifest, collectData, buildUldMaterialRows, generatePdf, sendEmail (10 fonctions étendues + 3 nouvelles)"
    - "static/css/style.css : 6 nouvelles règles desktop + 2 mobile"
    - "tests/tests.html : 28 nouvelles suites + 8 sites pré-existants migrés + 2 sites pré-existants avec patches MAT-13 minimaux"
tech-stack:
  added: []
  patterns:
    - "Branch ordering : noBilling check AVANT VRAC check AVANT champs détaillés (formatCondensedMaterial, buildUldMaterialRows)"
    - "Validation MAT-13 placée EN TOUT DÉBUT des fonctions async (avant validateRequired et tout await) pour éviter pollution _alertLog en test"
    - "Signature double-paramètre addUld(autoOpen, skipValidation) : usage utilisateur via boutons HTML (sans args), usage tests internes via addUld(false, true)"
    - "esc() utilisé sur uldComment dans HTML email (défense en profondeur — court-circuit retire user-input du flux)"
    - "Index 1-based dans findIncompleteUlds() (i.e. 'ULD N°1') pour cohérence avec ce que voit l'utilisateur (block.id = 'uld-N')"
key-files:
  created: []
  modified:
    - path: "static/js/app.js"
      change: "+toggleNoBilling handler ; +uldHasMaterial helper ; +findIncompleteUlds helper ; openMaterialModal étendu (zone .mat-no-billing-row + checkbox #mat-no-billing + disabledAttrIfNoBilling sur 10 inputs/checkboxes/textarea) ; applyMaterialToUld étendu (lecture noBilling + neutralisation forced à 0/false/'') ; formatCondensedMaterial étendu (court-circuit 'Rien à facturer') ; refreshMaterialBadge étendu (classe .mat-recap-no-billing) ; addUld signature (autoOpen, skipValidation) + validation MAT-13 + auto-open en fin ; loadManifest +data-no-billing défensif ; collectData +noMaterialToBill ; buildUldMaterialRows court-circuit ; generatePdf + sendEmail validation MAT-13 EN TOUT DÉBUT"
    - path: "static/css/style.css"
      change: "+.mat-no-billing-row (zone amber au-dessus du grid) ; +.mat-no-billing-label (flex layout, cursor pointer) ; +.material-modal-grid textarea/checkbox:disabled (extension visuelle disabled) ; +.mat-forfait-label input:disabled + * (label grisé) ; +.material-recap.mat-recap-no-billing (variante visuelle ambre) ; mobile compact .mat-no-billing-row"
    - path: "tests/tests.html"
      change: "+28 nouvelles suites (12 MAT-12 + 10 MAT-13 + 6 MAT-14) ; +8 sites pré-existants migrés vers addUld(false, true) (removeUld L191-192, Type ULD collectData L1000-1001, updateRecap dont Vrac L1156-1157, updateRecap pas annotation L1176, updateRecap totaux globaux L1189, updateRecap plusieurs VRAC L1209, sendEmail integration L2023-2024, updateRecap multi ULD L2129-2130) ; +2 sites pré-existants patchés pour MAT-13 (addUld/addRow L138/155 → addUld(false, true) ; sendEmail integration L2495 → data-no-billing='true' sur les 2 ULDs)"
decisions:
  - summary: "Précédence noBilling > VRAC > champs détaillés dans formatCondensedMaterial"
    rationale: "Une ULD VRAC marquée 'Rien à facturer' doit afficher 'Rien à facturer' (et NON la liste filtrée hors planchers, comme le ferait la branche VRAC). Le court-circuit en tête de fonction garantit cette précédence."
  - summary: "applyMaterialToUld neutralise les checkbox forfait à 'false' quand no-billing coché"
    rationale: "Comportement W-6 + W-8 : si l'agent avait coché forfait EU avant de cocher no-billing, le data-attribute data-flooring-eu-forfait passe à 'false' à la sauvegarde (pas de dépendance circulaire entre les checkbox dans le state final)"
  - summary: "Signature double addUld(autoOpen=true, skipValidation=false) avec usage interne tests uniquement"
    rationale: "BLOCKER #1 du plan : 8 sites pré-existants dans tests.html enchaînaient addUld(); addUld(); pour tester d'autres fonctions (removeUld, updateRecap, collectData, sendEmail integration). Sans bypass, ces tests casseraient sous MAT-13. Le param skipValidation préserve les tests existants tout en imposant la validation à l'usage utilisateur réel."
  - summary: "Validation MAT-13 placée EN TOUT DÉBUT de generatePdf/sendEmail (avant validateRequired ET avant saveManifest)"
    rationale: "BLOCKER #4 du plan : éviter la pollution _alertLog en test. saveManifest produit un alert 'Manifeste sauvegarde'. Sans cet ordre, les tests filtrant _alertLog par .pop() captureraient le mauvais message. Solution : MAT-13 alert est le PREMIER (et souvent le seul) alert produit, simplifiant les tests + filtrage par substring."
  - summary: "Index 1-based dans findIncompleteUlds() (alert 'ULD N°1' pas 'ULD N°0')"
    rationale: "block.id = 'uld-1' pour la 1ère ULD (uldCount commence à 0 puis incrémente à 1). L'index visible utilisateur est 1-based, donc l'alert reflète la même numérotation que l'UI."
  - summary: "Tests utilisent addUld(false, true) pour setup multi-ULD vide ; addUld() (sans args) UNIQUEMENT pour tester explicitement MAT-13/MAT-14"
    rationale: "Lisibilité des tests : on voit immédiatement qu'un test bypasses la validation pour setup uniquement, vs un test qui DÉCLENCHE la validation pour la valider."
  - summary: "Pré-existant 'Type ULD - sendEmail integration' (L2495) reçoit data-no-billing='true' sur les 2 ULDs"
    rationale: "Rule 3 du deviation guide : MAT-13 (Task 2) bloquait ce test pré-existant qui vérifie l'intégration sendEmail HTML, pas la validation MAT-13. Patche minimal (un setAttribute par ULD) au lieu de réécrire le test."
metrics:
  duration_seconds: ~4500
  duration_human: "~75 min (5 tasks séquentielles avec verify entre chaque)"
  completed: "2026-04-28"
  tasks_completed: 5
  tests_added: 28 nouveaux + 71 nouvelles assertions
  tests_total_after: 591 (was 520 avant Plan 01-03 EXTENDED, +71)
  files_modified: 3
---

# Phase 1 Plan 03 EXTENDED: Gap closure final (récap inline + 'Rien à facturer' + validation obligatoire + auto-open modal) Summary

Le plan 01-03 a été **réécrit** avant cette exécution pour étendre le périmètre. À l'origine il fermait juste le gap RECAP-01 (récap inline condensé) identifié par 01-VERIFICATION.md. Lors du re-planning du 2026-04-28, l'utilisateur a ajouté 3 nouveaux requirements (MAT-12 case "Rien à facturer", MAT-13 saisie matériel obligatoire, MAT-14 auto-ouverture du modal) à fermer avant la mise en prod. Ce plan unifie ces 4 features (A récap inline + B "Rien à facturer" + C validation obligatoire + D auto-ouverture) sur 6 requirements (RECAP-01, MAT-11, MAT-12, MAT-13, MAT-14, TEST-02), exécutées en 5 tasks séquentielles avec validation `npm run verify` à chaque étape.

## Tasks executed

| # | Task | Files | Commits |
|---|------|-------|---------|
| 1 | Feature B — Case "Rien à facturer" + intégration récap/PDF/email + classe CSS .mat-recap-no-billing | static/js/app.js, tests/tests.html | 178697f |
| 4 | CSS — zone .mat-no-billing-row + .mat-recap-no-billing + mobile (CSS-ONLY) | static/css/style.css | af0c1cf |
| 3 | Feature D — Auto-ouverture modal sur création ULD via addUld(autoOpen, skipValidation) | static/js/app.js, tests/tests.html | 3099d23 |
| 5 | Adaptation in-place des 8 sites pré-existants `addUld(); addUld();` → `addUld(false, true);` | tests/tests.html | c081fd2 |
| 2 | Feature C — Validation matériel obligatoire (MAT-13) + helpers uldHasMaterial/findIncompleteUlds | static/js/app.js, tests/tests.html | 744ec3d |

**Order rationale** (cohérent avec les blockers identifiés dans le plan) :
- Task 1 d'abord (data + UI baseline pour MAT-12)
- Task 4 (CSS-only) en parallèle visuel — pas de dépendance JS
- Task 3 (signature étendue addUld) AVANT Task 5 (qui utilise les nouveaux paramètres)
- Task 5 (migration des sites pré-existants) AVANT Task 2 (qui activerait MAT-13 et casserait les sites non migrés)
- Task 2 en dernier — l'activation de MAT-13 + les nouveaux tests qui en dépendent

## Public API

### Nouvelles fonctions

- `toggleNoBilling(checkbox)` — handler onchange de la checkbox `#mat-no-billing` du modal. Désactive/réactive les autres champs en préservant l'état D-06 des forfaits planchers.
- `uldHasMaterial(block)` — retourne true si l'ULD a au moins une indication de saisie matériel (noMaterialToBill OU compteur > 0 OU forfait coché OU uldComment non-vide).
- `findIncompleteUlds()` — retourne la liste des indices 1-based des ULD sans matériel saisi (pour l'alert FR de MAT-13).

### Fonctions étendues

- `openMaterialModal(uldIndex)` — +zone `.mat-no-billing-row` au-dessus du grid + checkbox `#mat-no-billing` + suffixe `disabledAttrIfNoBilling` propagé sur 10 inputs/checkboxes/textarea.
- `applyMaterialToUld(uldIndex)` — lecture du flag noBilling, neutralisation forced de tous les autres champs à 0/false/'' si coché (incluant les checkbox forfait neutralisées à 'false'), écriture explicite du `data-no-billing` attribute.
- `formatCondensedMaterial(block)` — court-circuit `return 'Rien à facturer'` AVANT la lecture des autres champs (précédence noBilling > VRAC > champs détaillés).
- `refreshMaterialBadge(uldIndex)` — émission de la classe `.mat-recap-no-billing` sur le span `.material-recap` quand `block.dataset.noBilling === 'true'`.
- `addUld(autoOpen=true, skipValidation=false)` — signature étendue : validation MAT-13 EN TÊTE encadrée par `if (!skipValidation)`, openMaterialModal(i) en FIN si autoOpen.
- `loadManifest(id)` — lecture défensive du nouveau champ `uldData.noMaterialToBill === true` (rétro-compat MAT-10 préservée : absence ⇒ false).
- `collectData()` — écriture du flag `uldEntry.noMaterialToBill = block.dataset.noBilling === 'true'`.
- `buildUldMaterialRows(u)` — court-circuit `return [['', 'Rien à facturer']]` si `u.noMaterialToBill === true`. (Affecte automatiquement `buildUldMaterialHtml` qui le réutilise.)
- `generatePdf()` — validation MAT-13 EN TOUT DÉBUT (avant `validateRequired` et `await saveManifest`). Return early avec alert FR si une ULD n'a pas de matériel.
- `sendEmail()` — validation MAT-13 EN TOUT DÉBUT (avant `validateRequired` et tout `await`). Return early avec alert FR.

### Nouveaux data-attributes

- `data-no-billing` (`'true'` | `'false'`) sur `.uld-block` — flag MAT-12 raccourci facturation.

### Nouvelle clé JSON manifeste

- `noMaterialToBill: boolean` — propagée via `collectData` (écriture) et `loadManifest` (lecture défensive).

### Nouvelles classes CSS

- `.mat-no-billing-row` — zone ambrée au-dessus du grid du modal.
- `.mat-no-billing-label` — label flex avec checkbox.
- `.material-recap.mat-recap-no-billing` — variante visuelle ambrée du récap quand "Rien à facturer".

## Acceptance criteria — verification

| Critère | Outil | Résultat |
|---------|-------|----------|
| Tests E2E `npm run verify` | `node tests/run-harness.cjs` | **591/591 passing** (was 520 avant exécution, +71 nouveaux asserts) |
| `function toggleNoBilling` count | grep | 1 ✓ |
| `function uldHasMaterial` count | grep | 1 ✓ |
| `function findIncompleteUlds` count | grep | 1 ✓ |
| `findIncompleteUlds()` calls | grep | 4 ≥ 3 ✓ (helper + addUld + generatePdf + sendEmail) |
| `mat-no-billing` count | grep | 4 ≥ 3 ✓ |
| `noMaterialToBill` count | grep | 6 ≥ 3 ✓ |
| `Rien à facturer` count | grep | 3 ≥ 3 ✓ (formatCondensedMaterial + buildUldMaterialRows + label modal) |
| `mat-recap-no-billing` count (JS) | grep | 1 ≥ 1 ✓ |
| `data-no-billing` literal count | grep | 3 (addUld + loadManifest + applyMaterialToUld) — voir note plus bas |
| `matériel non saisi` (alert addUld) count | grep | 1 ≥ 1 ✓ |
| `Matériel non saisi pour` (alert PDF/email) count | grep | 2 ≥ 2 ✓ |
| `function addUld(autoOpen, skipValidation)` count | grep | 1 ✓ |
| `if (autoOpen === undefined) autoOpen = true` count | grep | 1 ✓ |
| `if (!skipValidation)` count | grep | 1 ✓ |
| `if (autoOpen)` count | grep | 1 ≥ 1 ✓ |
| `addUld(false, true)` count | grep | 17 ≥ 8 ✓ |
| `addUld(); addUld();` consecutif count | grep | 0 ✓ |
| `addUld(); addUld(); addUld();` consecutif count | grep | 0 ✓ |
| Suites tests `Materiel ULD - rien a facturer*` | grep | 12 ≥ 6 ✓ |
| Suites tests `Materiel ULD - uldHasMaterial*` + `addUld bloque*` + `generatePdf bloque*` + `sendEmail bloque*` | grep | 5 ≥ 5 ✓ |
| Suites tests `Materiel ULD - addUld autoOpen*` etc. (MAT-14) | grep | 4 ≥ 4 ✓ |
| `.mat-no-billing-row` (CSS) | grep | 2 ≥ 2 (desktop + mobile) ✓ |
| `.mat-no-billing-label` (CSS) | grep | 3 ≥ 2 (desktop avec selector child + mobile) ✓ |
| `.mat-recap-no-billing` (CSS) | grep | 2 ≥ 1 ✓ |
| Task 4 CSS-only (aucun .js modifié dans Task 4) | git diff --stat | ✓ confirmé (commit af0c1cf : 1 file changed style.css uniquement) |

**Note `data-no-billing` literal count = 3 vs plan ≥ 4** : Le plan suggérait 4 occurrences en comptant `dataset.noBilling` (camelCase). Avec un grep strict du literal kebab-case `data-no-billing`, on a 3 setAttribute calls (addUld, loadManifest, applyMaterialToUld). Les lectures via `block.dataset.noBilling` (formatCondensedMaterial, refreshMaterialBadge, collectData, uldHasMaterial, openMaterialModal) sont en camelCase et ne matchent pas le grep. **Fonctionnellement complet** : 3 écritures + 5 lectures = la lifecycle complète. Le plan avait une intention permissive ici (cf. note "addUld setAttribute, loadManifest setAttribute, applyMaterialToUld setAttribute, formatCondensedMaterial dataset.noBilling").

## UAT manuel — checklist (Release Step 4 CLAUDE.md)

À faire post-merge avant push prod :

1. ✅ `npm run verify` (591/591) — fait pendant exécution
2. ⬜ `npm run dev` (npx serve . -l 4000) — l'app démarre sur http://localhost:4000
3. ⬜ Login + créer un manifeste avec 1 ULD :
   - [ ] Le modal matériel s'ouvre automatiquement (MAT-14)
   - [ ] La checkbox "Rien à facturer pour cette ULD" est visible AU-DESSUS du grid (zone ambre, MAT-12)
   - [ ] Cocher la checkbox → tous les autres champs deviennent grisés (visuellement disabled)
   - [ ] Décocher → réactivation (sauf input plancher EU si forfait coché — D-06 préservé)
   - [ ] Valider avec "Rien à facturer" coché → récap inline = `Rien à facturer` (style pill ambre)
4. ⬜ Tenter d'ajouter une 2ᵉ ULD avec ULD #1 vide → alert FR + modal #1 réouvert (MAT-13)
5. ⬜ Cocher "Rien à facturer" sur ULD #1, valider → "+ Ajouter une ULD" fonctionne, modal #2 s'ouvre auto
6. ⬜ Avec ULD #2 vide → cliquer "Generer le PDF" → alert FR `Matériel non saisi pour : ULD N°2.` PDF non généré
7. ⬜ Idem pour "Envoyer par email" → alert AVANT le check destinataires/JWT, fetch /api/send-email NON déclenché
8. ⬜ Sauvegarder un manifeste avec 2 ULD : #1 noMaterialToBill=true, #2 strapsCount=5 → recharger depuis la liste → flags restaurés correctement
9. ⬜ Au rechargement d'un manifeste, le modal NE s'ouvre PAS automatiquement (MAT-14 spec : action utilisateur uniquement)
10. ⬜ Ouvrir tests/tests.html dans le navigateur → mêmes résultats que `npm run verify` (591/591)
11. ⬜ Mobile (DevTools ≤ 768px) : zone "Rien à facturer" lisible, récap `Rien à facturer` ne déborde pas

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] Pre-existing test 'addUld / addRow' broken by MAT-13 activation**
- **Found during:** Task 2 (after activation MAT-13)
- **Issue:** Test calls `addUld(); addUld();` to verify 2nd addUld creates a 2nd block. With MAT-13 active, 2nd call blocked by validation since 1st ULD is empty. Result: `assertEqual('2e addUld => 2 blocs', blocks.length, 2)` failed (got 1).
- **Fix:** Migrated both calls to `addUld(false, true)` (skip validation, no auto-open) — the test wasn't about MAT-13 itself, just about DOM structure verification.
- **Files modified:** `tests/tests.html` (lines 138, 155)
- **Commit:** 744ec3d (Task 2)

**2. [Rule 3 - Blocking] Pre-existing test 'Type ULD - sendEmail integration' broken by MAT-13 activation**
- **Found during:** Task 2 (after activation MAT-13)
- **Issue:** Test creates 2 ULDs without material then calls `sendEmail()`. With MAT-13 active, sendEmail returns early with alert. Result: `assert('fetch appele', capturedBody !== null)` failed (capturedBody === null because fetch never called).
- **Fix:** Added `data-no-billing='true'` on both ULDs to satisfy MAT-13. The test was about HTML structure of the email body (htmlBody contains "dont Palettes", "dont Vrac", "[PMC]", "[VRAC]"), not about MAT-13 validation itself.
- **Files modified:** `tests/tests.html` (lines 2516-2517 added)
- **Commit:** 744ec3d (Task 2)

### Authentication gates

None encountered.

### Architectural changes

None — all changes were within the scope of plan extensions.

## Known Stubs

None. All features are fully wired :
- MAT-12 checkbox writes data-attribute → propagates through collectData → loadManifest → recap inline → PDF → email
- MAT-13 validation active on the 3 user-facing surfaces (addUld button, Generate PDF button, Send email button)
- MAT-14 auto-open consistent with newManifest + addUld (loadManifest correctly bypasses by construction)

## Self-Check

**Files claimed to be modified:**
- `c:/Users/valer/OneDrive/Documents/GIT/Loadsheet-autonome/static/js/app.js` ✓ FOUND (modified in commits 178697f, 3099d23, 744ec3d)
- `c:/Users/valer/OneDrive/Documents/GIT/Loadsheet-autonome/static/css/style.css` ✓ FOUND (modified in commit af0c1cf)
- `c:/Users/valer/OneDrive/Documents/GIT/Loadsheet-autonome/tests/tests.html` ✓ FOUND (modified in commits 178697f, 3099d23, c081fd2, 744ec3d)
- `c:/Users/valer/OneDrive/Documents/GIT/Loadsheet-autonome/.planning/phases/01-mat-riel-uld-r-tro-compat/01-03-SUMMARY.md` ✓ FOUND (this file)

**Commits claimed:**
- 178697f (feat 01-03 MAT-12 checkbox + recap propagation) ✓ FOUND
- af0c1cf (feat 01-03 CSS for Rien à facturer modal zone) ✓ FOUND
- 3099d23 (feat 01-03 auto-open material modal MAT-14) ✓ FOUND
- c081fd2 (test 01-03 migrate 8 pre-existing addUld sites) ✓ FOUND
- 744ec3d (feat 01-03 mandatory material entry validation MAT-13) ✓ FOUND

## Self-Check: PASSED

All claimed files exist and all claimed commits are reachable in git log.
