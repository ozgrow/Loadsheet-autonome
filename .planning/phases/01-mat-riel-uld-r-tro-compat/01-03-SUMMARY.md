---
phase: 01-mat-riel-uld-r-tro-compat
plan: 03
subsystem: ui-recap
tags: [recap, ui, retro-compat, xss, tests, gap-closure]
gap_closure: true
requires:
  - 01-01-SUMMARY (refreshMaterialBadge, data-attributes, .uld-block, material-badge-wrapper)
  - 01-02-SUMMARY (buildUldMaterialRows labels FR reference)
provides:
  - formatCondensedMaterial(block) — helper string (DOM → condensed recap text)
  - refreshMaterialBadge(uldIndex) — rewritten, same signature, new output HTML
  - .material-recap CSS class (desktop + mobile)
  - tests/tests.html: 7 new "Materiel ULD - recap *" suites + 1 loadManifest recap suite
affects:
  - static/js/app.js (refreshMaterialBadge behavior)
  - static/css/style.css (.material-recap new, .material-badge kept)
  - tests/tests.html (2 legacy suites rewritten, XSS suite reinforced)
tech-stack:
  added: []
  patterns:
    - "Inline condensed recap via single innerHTML injection; escaping localized to user-supplied uldComment only"
    - "30-char truncation + U+2026 ellipsis for mobile layout safety"
key-files:
  created: []
  modified:
    - static/js/app.js
    - static/css/style.css
    - tests/tests.html
    - .planning/phases/01-mat-riel-uld-r-tro-compat/01-03-SUMMARY.md
decisions:
  - D-14 OVERRIDDEN (user-approved per 01-VERIFICATION.md Option A): neutral badge replaced by inline condensed recap
  - Labels FR short for mobile ("Planchers EU" not "Planchers bois EU", "Com" not "Commentaire")
  - Ordre canonique: Sangles, Planchers EU, Planchers Std, Bois calage, Bâches, Intercalaires, Nids d'abeille, Com
  - Separator: " | " (3 chars exact)
  - uldComment truncated to 30 chars + U+2026 (single-char ellipsis, not three dots)
  - refreshMaterialBadge name preserved (2 existing callers kept untouched per plan constraint)
  - esc() applied to truncated uldComment only (labels/numbers are safe literals — no double-escape)
  - .material-badge CSS class kept for retro-compat (no current emitter after this plan)
metrics:
  duration_seconds: 262
  tasks: 2
  files_modified: 3
  tests_before: 355
  tests_after: 383
  tests_new: 28 (assertions across 7 new + 1 loadManifest + reinforced XSS)
  completed: 2026-04-23
requirements:
  - RECAP-01 (moves from PARTIAL → SATISFIED)
  - MAT-11 (reinforced on new XSS surface)
  - TEST-02 (loadManifest recap round-trip added)
---

# Phase 01 Plan 03: Matériel récap inline condensé — gap closure (RECAP-01) Summary

Remplace le badge neutre « Matériel saisi » par un récap inline condensé (`Sangles: 3 | Planchers EU: forfait | Com: Fragile`) sous le header de chaque ULD, fermant le gap RECAP-01 identifié par 01-VERIFICATION.md.

## Gap fermé

**Gap #1 — RECAP-01 partiel** (01-VERIFICATION.md, status `gaps_found`) :
> Le récapitulatif écran affiche les infos matériel de chaque ULD sous forme condensée — **PARTIAL** : l'implémentation ne montrait qu'un badge binaire "Matériel saisi". L'agent devait rouvrir le modal pour voir ses saisies.

**Résolution :** Option A de 01-VERIFICATION.md retenue (alignement strict avec la lecture littérale du critère #3 du ROADMAP). Décision **D-14** du CONTEXT.md (badge neutre suffisant) **ANNULÉE** par cette décision utilisateur prise en phase de planning. Le récap inline condensé est désormais visible directement sous le header ULD, sans nécessiter d'ouvrir le modal.

**Statut RECAP-01 après ce plan : PARTIAL → SATISFIED**

## Fonction publique ajoutée

**`formatCondensedMaterial(block)`** — static/js/app.js:140
- **Entrée :** référence DOM `.uld-block` (lit `block.dataset.*`)
- **Sortie :** string HTML prêt pour innerHTML (uldComment déjà échappé via `esc()`)
- **Contrat :** string vide si aucun champ matériel non-nul/non-false/non-vide → aucun span fantôme rendu

## Fonction publique réécrite

**`refreshMaterialBadge(uldIndex)`** — static/js/app.js:179
- **Signature inchangée** (pour préserver les 2 callers existants sans modification : `applyMaterialToUld` app.js:127, `loadManifest` app.js:533)
- **Comportement nouveau :** injecte `<span class="material-recap">…</span>` avec la chaîne condensée au lieu de `<span class="material-badge">Matériel saisi</span>`
- **Noop préservé :** si le bloc ou wrapper n'existe pas, retourne silencieusement

## Format final du récap

```
Sangles: N | Planchers EU: forfait | Planchers Std: N | Bois calage: N | Bâches: N | Intercalaires: N | Nids d'abeille: N | Com: <texte tronqué à 30 chars>…
```

**Règles de composition :**
- **Séparateur :** ` | ` (exactement 3 caractères : espace + pipe + espace)
- **Ordre canonique** : Sangles → Planchers EU → Planchers Std → Bois calage → Bâches → Intercalaires → Nids d'abeille → Com (toujours en dernier car potentiellement long)
- **Omission** : champs à 0 (et forfait=false, commentaire vide) sont omis pour éviter les pipes orphelins
- **Forfait** : affiché littéralement `forfait` (cohérent avec D-16 PDF/email)
- **Troncature commentaire** : 30 caractères max + `…` (U+2026, 1 seul caractère Unicode, pas trois points `...`)
- **Anti-XSS** : `esc()` appliqué uniquement sur `uldComment` tronqué (le seul vecteur user) ; les libellés FR sont des littéraux, les nombres passent par `parseInt() || 0`

## Libellés FR exacts retenus

| Data-attribute | Libellé FR court | Note |
|---|---|---|
| `data-straps` | `Sangles` | — |
| `data-flooring-eu` | `Planchers EU` | Court vs PDF `Planchers bois EU` (mobile) |
| `data-flooring-std` | `Planchers Std` | Court vs PDF `Planchers bois Standard` |
| `data-blocks` | `Bois calage` | — |
| `data-tarps` | `Bâches` | UTF-8 (écran, pas le PDF où `Baches` ASCII) |
| `data-dividers` | `Intercalaires` | — |
| `data-honeycomb` | `Nids d'abeille` | Apostrophe typographique dans la source littérale |
| `data-uld-comment` | `Com` | Abrégé (moins d'espace mobile + troncature 30 chars) |

## Classes CSS ajoutées

```css
/* Desktop (static/css/style.css:167) */
.material-recap {
    display: inline-block;
    font-size: 0.78em;
    color: #4a5568;
    background: #edf2f7;
    padding: 3px 10px;
    border-radius: 4px;
    line-height: 1.5;
    word-break: break-word;   /* wrap naturel au pipe quand long */
    max-width: 100%;
}

/* Mobile <= 768px (static/css/style.css:241, dans le bloc media existant) */
.material-recap {
    font-size: 0.72em;        /* compense la verbosité multi-entrée */
    padding: 4px 8px;
    display: block;           /* occupe toute la largeur du .uld-block */
    width: 100%;
}
```

**Rétro-compat visuelle** : `.material-badge` (ancienne classe) conservée dans le CSS. Aucun élément `.material-badge` ne sera plus émis par le code après ce plan, mais la règle reste en place pour compatibilité future (ex: contenus externes, emails archivés).

## Suites de tests ajoutées (7 nouvelles + 1 loadManifest)

1. `Materiel ULD - recap inline condense (RECAP-01)` — valeurs présentes dans le DOM (sangles + bois calage)
2. `Materiel ULD - recap forfait litteral (RECAP-01 / D-16)` — `Planchers EU: forfait` littéral, pas `0` ni `true`
3. `Materiel ULD - recap omet zeros (RECAP-01)` — zéros omis, pas de pipes orphelins
4. `Materiel ULD - recap XSS uldComment (RECAP-01 / MAT-11)` — payload `<img onerror>` échappé, `window._xss === 0`
5. `Materiel ULD - recap uldComment tronque (RECAP-01)` — troncature 30 chars + U+2026 (slice réel = "Lorem ipsum dolor sit amet con…")
6. `Materiel ULD - recap vide = pas de span (RECAP-01)` — `innerHTML === ''` strict, pas de span fantôme
7. `Materiel ULD - loadManifest restaure recap (RECAP-01 / TEST-02)` — round-trip chiffré : rechargement restaure `Sangles: 7 | Com: Fragile`

## Suites adaptées (pré-existantes Plan 01-01)

| Ancienne suite (Plan 01-01) | Nouvelle suite (Plan 01-03) | Changement |
|---|---|---|
| `Materiel ULD - badge Materiel saisi` (tests.html:727) | `Materiel ULD - recap inline remplace badge neutre (RECAP-01)` | Assertions basculent de `.material-badge` / `Matériel saisi` vers `.material-recap` / `Sangles: 3` |
| `Materiel ULD - pas de badge si tout vide` (tests.html:742) | `Materiel ULD - pas de recap si tout vide` | Nom aligné, logique identique (`innerHTML === ''`) |
| `Materiel ULD - XSS uldComment (MAT-11)` (tests.html:754) | **Renforcée** (même nom) | Ajoute 3 assertions sur `.material-recap` wrapper (pas seulement modal) |

## Déviations de plan

**Une déviation auto-corrigée (Rule 1 - Bug) :**

**1. [Rule 1 - Bug] Test truncation assertion fixée**
- **Trouvée pendant :** Task 1 (run harness)
- **Problème :** L'assertion du plan pour le test de troncature cherchait la sous-chaîne `Com: Lorem ipsum dolor sit amet…` (26 chars + ellipsis), mais `slice(0, 30)` de la chaîne de test produit en réalité `Lorem ipsum dolor sit amet con` (30 chars = incluant ` con`). L'implémentation est correcte (30 chars + `…` par plan) ; l'assertion du plan était mal calibrée.
- **Fix :** Assertion mise à jour pour chercher `Com: Lorem ipsum dolor sit amet con…` (le vrai résultat de la troncature) + assertions supplémentaires : présence de U+2026 + longueur exacte `30 + 1` de la portion commentaire.
- **Fichier :** tests/tests.html (suite `Materiel ULD - recap uldComment tronque (RECAP-01)`)
- **Commit :** inclus dans 1b944a1 (Task 1)

Rien d'autre. Aucune modification architecturale. Aucune authentification requise. Aucun ajout de dépendance. `#liveRecap` strictement inchangé (D-13 préservé).

## Contraintes respectées

- [x] JS vanilla uniquement (pas de framework ajouté)
- [x] `esc()` appliqué sur `uldComment` avant innerHTML (CLAUDE.md Sécurité, MAT-11)
- [x] Rétro-compat : `loadManifest` + `refreshMaterialBadge` existant déclenche le nouveau rendu sans toucher aux data-attributes
- [x] Mobile ≤ 768px : règle dans `@media (max-width: 768px)` existant, `word-break: break-word` + `display: block` pour wrap naturel
- [x] Tests : 7 nouvelles suites + 1 loadManifest + suite XSS renforcée = 28 nouvelles assertions (TEST-02 respecté)
- [x] `#liveRecap` inchangé (D-13 préservé)
- [x] Aucune modification de PDF (`buildPdf`), email HTML (`sendEmail`), modal (`openMaterialModal`), `applyMaterialToUld`, `collectData`, `addUld`, `loadManifest`, `buildUldMaterialRows`, `formatFlooringDisplay`

## Traçabilité

- **Gap source :** `.planning/phases/01-mat-riel-uld-r-tro-compat/01-VERIFICATION.md` §Gap Summary
- **Option retenue :** Option A (alignement strict, ~30-60 min)
- **Override D-14 documenté :** frontmatter de `01-03-PLAN.md` (commentaire explicite)
- **Success criterion #3 du ROADMAP :** désormais satisfait littéralement (le récap écran affiche les infos matériel de chaque ULD sous forme condensée)

## Tests — baseline vs après

| Moment | Passed | Failed | Note |
|---|---|---|---|
| Avant Plan 01-03 | 355 | 1 | `Session sans expiry => invalide` pré-existant (deferred à Phase 3) |
| Après Plan 01-03 | 383 | 1 | +28 assertions (7 new suites + 1 loadManifest recap + 3 XSS renforcée) ; même unique échec pré-existant |

## Human Verification Required

Tous les comportements sont couverts par les tests JSDOM. La vérification manuelle suivante est recommandée en local avant push (CLAUDE.md règle `npx serve .`) :

1. **Visuel desktop** : créer ULD avec sangles=3, forfait EU coché, commentaire "Fragile" → `Sangles: 3 | Planchers EU: forfait | Com: Fragile` visible sous header ULD sans ouvrir le modal
2. **Visuel mobile** (≤ 768px via DevTools) : ULD avec plusieurs champs matériel → récap wrap naturellement sur plusieurs lignes, pas de scroll horizontal du `.uld-block`
3. **Troncature** : commentaire 60 chars → récap affiche 30 chars + `…`, pas d'overflow
4. **XSS manuel** : commentaire `<img src=x onerror=alert(1)>` → pas d'alerte, `&lt;img` visible littéralement dans le récap
5. **Rétro-compat loadManifest** : sauvegarder un manifeste, recharger depuis la liste → récap restauré pour chaque ULD
6. **Pas de régression PDF/email** : générer PDF + inspecter email htmlBody dans Network → sections matériel toujours présentes et correctes

## Self-Check

## Self-Check: PASSED

- [x] `static/js/app.js` contains `function formatCondensedMaterial` (line 140)
- [x] `static/js/app.js` contains rewritten `function refreshMaterialBadge` (line 179)
- [x] `static/js/app.js` contains `esc(truncated)` and `material-recap`
- [x] `static/js/app.js` does NOT contain `Matériel saisi` (old badge text removed)
- [x] `static/css/style.css` contains `.material-recap` (desktop line 167 + mobile line 241)
- [x] `static/css/style.css` still contains `.material-badge` (retro-compat preserved)
- [x] `tests/tests.html` contains 7 new `suite('Materiel ULD - recap *')` suites
- [x] `tests/tests.html` no longer contains `suite('Materiel ULD - badge Materiel saisi'` or `suite('Materiel ULD - pas de badge si tout vide'`
- [x] Commit `1b944a1` exists (Task 1: JS + tests)
- [x] Commit `a8714b6` exists (Task 2: CSS)
- [x] Tests pass: 383 / 384 (1 pre-existing failure, same as before)
