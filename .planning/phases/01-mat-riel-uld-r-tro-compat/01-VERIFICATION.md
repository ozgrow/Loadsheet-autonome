---
phase: 01-mat-riel-uld-r-tro-compat
verified: 2026-04-23T00:00:00Z
status: gaps_found
score: 5/6 success criteria verified (RECAP-01 partial — badge-only, no condensed info)
gaps:
  - truth: "Le récapitulatif écran affiche les infos matériel de chaque ULD sous forme condensée"
    status: partial
    reason: "Implementation shows only a boolean badge 'Matériel saisi' under each ULD header (D-14 decision), not the actual condensed material info per ULD. The PDF and email correctly display condensed material per ULD, but the on-screen experience shows only a binary indicator — 'saisi / not saisi' — not the values. The criterion's literal wording ('affiche les infos matériel de chaque ULD sous forme condensée') is not satisfied by a label that hides the information. The user must click 'Matériel' to re-open the modal to see what was entered."
    artifacts:
      - path: "static/js/app.js"
        issue: "refreshMaterialBadge (line 133) always emits the fixed string 'Matériel saisi' regardless of content — sangles=5, forfait EU, commentaire 'Fragile' all yield the same badge."
      - path: "static/css/style.css"
        issue: ".material-badge style is a neutral pill — not designed to display condensed values."
    missing:
      - "Replace (or complement) the neutral 'Matériel saisi' badge with a condensed summary of entered material values (e.g. 'Sangles: 3 | Planchers EU: forfait | Commentaire: …') under each ULD header."
      - "Ensure uldComment is escaped via esc() if reintroduced into the badge text (MAT-11 — currently out of scope because badge is neutral)."
      - "Respect the decision D-13 (keep #liveRecap barre unchanged) while still surfacing the per-ULD condensed info inline, per RECAP-01 literal intent."
      - "Add a test in tests/tests.html asserting that the badge (or new recap element) contains the entered material values, not just a boolean presence indicator."
---

# Phase 01: Matériel ULD & rétro-compat — Verification Report

**Phase Goal:** L'agent peut saisir des infos matériel sur chaque ULD (sangles, planchers bois EU/standard, bois de calage, bâches, intercalaires, nid d'abeille, commentaire libre), les voir dans le récap écran + PDF, et les anciens manifestes continuent de se charger sans erreur.

**Verified:** 2026-04-23
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Success Criteria (from ROADMAP.md)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Modal d'édition ULD avec 8 champs matériel saisissables | VERIFIED | `openMaterialModal` (app.js:27-78) construit un modal avec les 10 inputs/checkbox/textarea exigés. Accessible via bouton "Matériel" dans `.uld-header` de chaque ULD (app.js:290 et app.js:513). Tests `Materiel ULD - modal ouverture` (tests.html:649) passent 12 assertions. |
| 2 | Forfait négocié exclusif du nombre (EU et Std) | VERIFIED | `toggleForfait` (app.js:82-89) désactive l'input et force la valeur à '0' au coché ; `applyMaterialToUld` (app.js:107-108) applique la règle stricte `forfait ? 0 : count`. Tests `Materiel ULD - forfait desactive input (D-06)` et `forfait efface le nombre (D-07)` passent. |
| 3 | Récap écran + PDF affichent les infos matériel de chaque ULD en forme condensée | PARTIAL | PDF: VERIFIED — `buildPdf` (app.js:797-825 récap page 1, app.js:875-894 par ULD) rend "Totaux materiel" + section "Materiel" par ULD avec valeurs condensées. **Récap écran: GAP** — seul un badge neutre "Matériel saisi" (app.js:148) s'affiche sous le header ULD ; il ne contient pas les infos saisies, seulement leur présence. L'agent doit rouvrir le modal pour voir les valeurs. La décision CONTEXT.md D-13/D-14 (badge-only) contredit la lecture littérale du critère de succès. |
| 4 | Manifeste ancien format se charge sans erreur, sans perte de données | VERIFIED | `loadManifest` (app.js:497-507) applique une lecture défensive (`parseInt(x) || 0`, `x === true`, `String(x || '')`) pour les 10 nouveaux champs matériel. La rétro-compat `pmcs`→`ulds` préexistante reste intacte (app.js:488). Tests `Materiel ULD - loadManifest retro-compat (TEST-02)` et `Retro-compatibilite ancien format (pmcs)` passent. |
| 5 | uldComment (HTML/JS) échappé littéralement partout où il apparaît | VERIFIED | Modal: `uldComment` injecté via `.value = ...` (app.js:77, pas `innerHTML`). Badge: neutre, aucune donnée user injectée. PDF: `doc.text()` ne parse pas HTML (jsPDF). Email HTML: `buildUldMaterialHtml` (app.js:682-683) applique `esc()` sur `r[0]` et `r[1]`. Tests `Materiel ULD - XSS uldComment (MAT-11)` et `Materiel email HTML - SECU XSS uldComment (MAT-11 D-18)` passent avec injection DOM authoritative `window._xss === 0`. |
| 6 | Champs du modal utilisables sur écran ≤ 768px | VERIFIED | style.css:219-225 (inside `@media (max-width: 768px)`) : modal full-screen + grid 1 colonne. Classes `.material-modal-overlay`, `.material-modal`, `.material-modal-grid` correctement ciblées. Vérifié aussi par `.btn-material` styling dans `.uld-header` (style.css:167-168). |

**Score:** 5/6 criteria fully verified. Criterion #3 is partial (PDF ok, écran gap).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `static/js/app.js` | Modal + data model + PDF + email helpers | VERIFIED (Plan 01-01 + 01-02) | Contient `openMaterialModal`, `closeMaterialModal`, `applyMaterialToUld`, `toggleForfait`, `refreshMaterialBadge`, `buildMaterialSummary`, `formatFlooringDisplay`, `buildUldMaterialRows`, `buildMaterialSummaryHtml`, `buildUldMaterialHtml` + extensions `addUld` / `collectData` / `loadManifest` / `buildPdf` / `sendEmail`. |
| `static/css/style.css` | Classes modal + badge + media query mobile | VERIFIED | Classes `.material-modal*`, `.material-badge`, `.btn-material`, `.mat-*` définies aux lignes 119-168. Mobile full-screen à 219-225 dans `@media (max-width: 768px)`. |
| `tests/tests.html` | Suites matériel + rétro-compat | VERIFIED | 25 suites `Materiel*` (13 Plan 01-01 + 12 Plan 01-02) + suite `Retro-compatibilite ancien format (pmcs)` préexistante. Test harness confirms 352/353 pass. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `bouton .btn-material` dans `.uld-header` | `openMaterialModal(uldIndex)` | onclick inline handler | WIRED | `grep` confirms 2 occurrences (app.js:290 addUld, app.js:513 loadManifest). |
| `openMaterialModal` | `.uld-block` dataset | lecture/écriture data-attributes | WIRED | app.js:32-41 lit `block.dataset.*` pour pré-remplir. app.js:116-125 (`applyMaterialToUld`) écrit via `setAttribute`. |
| `collectData()` | objet ULD dans `data.ulds[i]` | lecture data-attributes | WIRED | app.js:395-404 : les 10 champs matériel sont lus de `block.dataset` et assignés à `uldEntry`. |
| `loadManifest()` | `.uld-block` dataset | écriture défensive avec defaults | WIRED | app.js:498-507 : `parseInt(uldData.xxx) || 0`, `=== true`, `String(x \|\| '')`. |
| `badge .material-badge` | commentaire `uldComment` | innerHTML via esc() | **N/A — badge neutre** | Le badge n'injecte pas uldComment (décision D-19/D-20). Pas de vecteur XSS mais aussi pas d'info condensée → lié au gap du critère #3. |
| `buildPdf` page 1 | totaux matériel agrégés | `buildMaterialSummary` + `autoTable` | WIRED | app.js:799-825 conditionnel sur `hasAnyMat`. |
| `buildPdf` page ULD | champs matériel ULD | `buildUldMaterialRows` + `autoTable` | WIRED | app.js:876-894 conditionnel sur `uldMatRows.length > 0`. |
| `sendEmail` HTML | sections matériel | `buildMaterialSummaryHtml` + `buildUldMaterialHtml` | WIRED | app.js:970 (récap) + app.js:987 (par ULD). `esc()` appliqué systématiquement. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `refreshMaterialBadge` | `hasAny` (bool) | `block.dataset.*` (lu de DOM, écrit par applyMaterialToUld) | Yes (mais binaire seulement) | FLOWING — mais pas de valeurs réelles rendues, seulement un label "Matériel saisi" |
| `buildPdf` Totaux materiel | `matSummary` | `buildMaterialSummary(data.ulds)` ← `collectData()` ← DOM data-attributes | Yes | FLOWING |
| `buildPdf` section Materiel ULD | `uldMatRows` | `buildUldMaterialRows(u)` ← `data.ulds[i]` ← collectData | Yes | FLOWING |
| `sendEmail` htmlBody matériel | `html` (concat) | `buildMaterialSummaryHtml(data.ulds)` + `buildUldMaterialHtml(u)` | Yes | FLOWING |
| `openMaterialModal` | `straps, flEu, ...` | `block.dataset.*` | Yes (round-trip via DOM) | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All tests pass | `node tests/run-harness.cjs` | `Passed: 355, Failed: 1` (failure pre-existing, documented in deferred-items.md) | PASS (scope OK) |
| openMaterialModal exists | `grep -c "function openMaterialModal" static/js/app.js` | 1 | PASS |
| applyMaterialToUld exists | `grep -c "function applyMaterialToUld" static/js/app.js` | 1 | PASS |
| buildMaterialSummary exists | `grep -c "function buildMaterialSummary" static/js/app.js` | 1 | PASS |
| buildUldMaterialHtml exists | `grep -c "function buildUldMaterialHtml" static/js/app.js` | 1 | PASS |
| esc() applied to r[1] in HTML helpers | `grep -cE "esc\(r\[1\]\)" static/js/app.js` | 2 | PASS |
| Mobile modal CSS exists | `grep -nE "material-modal.*max-width: 100%" static/css/style.css` | 1 match inside `@media (max-width: 768px)` | PASS |
| 25 Materiel suites in tests | `grep -c "suite('Materiel" tests/tests.html` | 25 | PASS |

### Requirements Coverage

Plan 01-01 declares: MAT-01..11, RECAP-01, RECAP-03, TEST-02.
Plan 01-02 declares: RECAP-02, MAT-11.
Phase expected: MAT-01..11, RECAP-01..03, TEST-02 — **all IDs accounted for** (RECAP-02 in Plan 02, RECAP-01 and RECAP-03 in Plan 01, no orphaned IDs).

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MAT-01 | 01-01 | Saisie nombre de sangles | SATISFIED | `mat-straps` input dans modal, `strapsCount` dans schema + tests |
| MAT-02 | 01-01 | Planchers bois EU + forfait alternatif | SATISFIED | `mat-flooring-eu` + `mat-flooring-eu-forfait` checkbox, `toggleForfait` + D-07 applied |
| MAT-03 | 01-01 | Planchers bois Std + forfait alternatif | SATISFIED | Symétrique MAT-02 avec `.mat-flooring-std*` |
| MAT-04 | 01-01 | Bois de calage | SATISFIED | `mat-blocks`, `blocksCount` |
| MAT-05 | 01-01 | Bâches | SATISFIED | `mat-tarps`, `tarpsCount` |
| MAT-06 | 01-01 | Intercalaires | SATISFIED | `mat-dividers`, `dividersCount` |
| MAT-07 | 01-01 | Nids d'abeille | SATISFIED | `mat-honeycomb`, `honeycombCount` |
| MAT-08 | 01-01 | Commentaire libre | SATISFIED | `mat-uld-comment` textarea, `uldComment` |
| MAT-09 | 01-01 | Disponible sur tous types d'ULD | SATISFIED | addUld/loadManifest construisent les mêmes data-attrs et bouton Matériel pour TOUS les blocs `.uld-block` — pas de discrimination de type (ATT: le projet n'a pas encore de typage ULD, donc uniforme) |
| MAT-10 | 01-01 | Rétro-compat localStorage chiffré | SATISFIED | `loadManifest` lecture défensive, test `loadManifest retro-compat (TEST-02)` passes, round-trip save/load test passes |
| MAT-11 | 01-01 + 01-02 | uldComment échappé partout | SATISFIED | Modal: `.value` (pas innerHTML). Badge: neutre, aucun user data. Email HTML: `esc()` sur toutes les valeurs. Tests XSS confirment payloads `<script>` et `<img onerror>` produisent `&lt;` + `window._xss===0`. |
| RECAP-01 | 01-01 | Récap écran affiche infos matériel condensées | **BLOCKED (partial)** | Seul un badge neutre "Matériel saisi" s'affiche. Les valeurs saisies ne sont pas visibles à l'écran sans rouvrir le modal. La décision D-13/D-14 (documentée en CONTEXT.md) est en tension avec la lecture littérale de RECAP-01. |
| RECAP-02 | 01-02 | PDF inclut infos matériel | SATISFIED | `buildPdf` page 1 "Totaux materiel" + section "Materiel" par ULD avec affichage "forfait" littéral (D-16). Tests `buildPdf avec materiel` passent. |
| RECAP-03 | 01-01 | Mobile ≤ 768px lisible | SATISFIED | CSS mobile full-screen (style.css:219-225), grid 1 colonne. Pas testable programmatiquement sans browser réel (flagged for human verification). |
| TEST-02 | 01-01 | Tests rétro-compat | SATISFIED | Suite `Materiel ULD - loadManifest retro-compat (TEST-02)` + `Retro-compatibilite ancien format (pmcs)` passent |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `static/js/app.js` | 148 | `wrapper.innerHTML = hasAny ? '<span class="material-badge">Matériel saisi</span>' : ''` | Info | Badge neutre — conforme à la décision D-13/D-14 mais ne satisfait pas la lecture littérale de RECAP-01 (pas un stub technique, décision produit assumée) |
| `static/js/app.js` | 634 | `'Bâches'` (avec accent) dans `buildUldMaterialRows`, remappé en 'Baches' pour PDF ligne 881 | Info | Conscient : PDF font helvetica ne gère pas bien les accents. Remap localisé au rendu PDF uniquement. HTML/écran gardent UTF-8. |
| Tests pre-existing | - | `Session sans expiry => invalide` retourne `undefined` au lieu de `false` | Info | Bug pré-existant documenté dans `deferred-items.md`, reporté en Phase 3. Hors scope de Phase 01. |

Aucun TODO/FIXME/placeholder/stub technique trouvé dans les artifacts modifiés. Aucun `return []` ou `return {}` statique qui simulerait de la data fictive.

### Human Verification Required

Les 6 points suivants (tous documentés dans les SUMMARYs) nécessitent une validation humaine en local (`npx serve .`) avant release :

### 1. Visual mobile modal ≤ 768px

**Test:** Ouvrir l'app sur mobile réel ou DevTools device mode ≤ 768px, créer une ULD, cliquer "Matériel".
**Expected:** Le modal occupe tout l'écran, les 8 champs sont empilés sur 1 colonne, le bouton Fermer est accessible en haut, tous les inputs sont saisissables au doigt.
**Why human:** Layout mobile réel (font scaling, input focus, keyboard overlay) non testable en JSDOM.

### 2. PDF rendering with forfait literal

**Test:** Créer 2 ULDs : ULD1 (sangles=3, forfait EU coché, commentaire "Fragile"), ULD2 (sangles=2, flooringEuCount=5). Générer PDF et ouvrir.
**Expected:** Page 1 "Totaux materiel" : "Sangles 5", "Planchers bois EU 5 + 1 forfait". Page ULD1 : "Materiel — Sangles 3, Planchers bois EU forfait, Commentaire ULD Fragile". Page ULD2 : "Materiel — Sangles 2, Planchers bois EU 5".
**Why human:** jsPDF rendering (glyphes, alignement autoTable) non inspectable programmatiquement sans parser PDF complet.

### 3. Email HTML in Network tab

**Test:** Saisir destinataire valide, cliquer "Envoyer par email". Ouvrir DevTools Network, inspecter le POST `/api/send-email`, regarder le body `htmlBody`.
**Expected:** `htmlBody` contient `<h4>Totaux matériel</h4>` + `<h4>Matériel</h4>` par ULD avec les bonnes valeurs. XSS `<img src=x onerror=...>` apparaît en `&lt;img src=x onerror=&quot;...&quot;&gt;`.
**Why human:** Confirmation visuelle du payload email envoyé (les tests automatisés valident via fetch-spy mais une vérification finale dans Network tab est prudente avant release).

### 4. Retro-compat with a real pre-evolution localStorage manifest

**Test:** Si un manifeste créé AVANT Plan 01-01 existe dans localStorage chiffré d'un user en prod, le charger.
**Expected:** Manifeste se charge, aucune erreur console, champs matériel vides (defaults 0/false/''). Après re-save, acquisition des champs matériel (D-11 expected).
**Why human:** Nécessite un vrai dataset de prod pour une vérification réaliste. Les tests synthétiques (dans tests.html) couvrent le cas mais ne garantissent pas la compat avec un dataset terrain.

### 5. **RECAP-01 on-screen condensed display — GAP to confirm with product owner**

**Test:** Créer une ULD avec sangles=5, forfait EU, commentaire "Fragile". Fermer le modal. Observer l'écran sans rouvrir le modal.
**Expected (per RECAP-01 literal):** Les valeurs condensées ("Sangles: 5 | EU: forfait | Com: Fragile") devraient être visibles sous le header ULD.
**Actual:** Seul un badge neutre "Matériel saisi" est visible.
**Why human:** Déterminer si le badge neutre satisfait l'intention de RECAP-01 (décision D-14 "suffisant") ou si un vrai récap condensé inline est nécessaire. **Le critère de succès #3 du ROADMAP mentionne explicitement "récap écran" — produit ou technique : à trancher avec l'utilisateur avant release.**

### 6. Rerun tests/tests.html in real browser

**Test:** `npx serve .`, login, ouvrir `/tests/tests.html`.
**Expected:** `352 / 353 tests OK` (failure pré-existant `Session sans expiry => invalide` documenté).
**Why human:** Harness Node+JSDOM diffère légèrement du vrai browser (crypto.subtle exposure notamment). Une vérification finale dans le vrai browser est demandée par le success criterion TEST-03 (Phase 3).

### Gaps Summary

**Un seul gap (partial) identifié :**

**Gap #1 — RECAP-01 partiel : récap écran condensé manquant**
Le plan a délibérément interprété RECAP-01 comme "badge de présence" (décision D-14 CONTEXT.md) plutôt que "affichage inline des valeurs condensées" (lecture littérale du success criterion #3 du ROADMAP). Le produit fournit un indicateur "Matériel saisi" binaire ; il ne fournit pas les valeurs condensées à l'écran.

**Impact :**
- Les agents ATH ne voient pas leurs saisies matériel sans rouvrir le modal.
- Le PDF et l'email, en revanche, rendent correctement l'info condensée.
- La disjonction "PDF ok / écran minimal" peut être assumée ou non selon l'intention produit.

**Options pour fermer le gap :**
- **Option A (alignement strict)** : Remplacer le badge "Matériel saisi" par un récap condensé inline (ex: `Sangles: 3 | EU: forfait | Com: Fragile`). Impose `esc()` sur uldComment (XSS MAT-11). Plan additionnel ~30-60 min.
- **Option B (décision assumée)** : Documenter formellement dans REQUIREMENTS.md que RECAP-01 a été livré sous forme de badge binaire, et marquer le critère comme "accepté avec déviation" (nécessite validation utilisateur/product owner).
- **Option C (hybride)** : Conserver le badge mais ajouter un tooltip (hover) ou un petit extrait visible après le badge. Nécessite un test XSS supplémentaire.

**Recommandation :** Trancher avec l'utilisateur avant Phase 2 (VRAC). Si option A choisie, `/gsd:plan-phase --gaps` générera un plan focalisé sur `refreshMaterialBadge` + CSS + tests XSS.

---

*Verified: 2026-04-23*
*Verifier: Claude (gsd-verifier, Opus 4.7 1M)*
