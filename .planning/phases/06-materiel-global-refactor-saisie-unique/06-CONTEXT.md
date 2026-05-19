# Phase 6: Matériel global (refactor saisie unique) - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 refactorise la **saisie matériel** pour passer de "1 jeu de champs par ULD" (Phase 1) à **"1 jeu unique pour tout le manifeste"**. La section matériel est positionnée entre le récap live (`#liveRecap`) et la section de génération (`#generateSection`), au-dessus du bouton "Générer Loadsheet".

**Champs matériel concernés (inchangés en nature, déplacés au niveau manifeste) :**
sangles, planchers bois EU (count + forfait), planchers bois Standard (count + forfait), bois de calage, bâches, intercalaires, nids d'abeille, commentaire libre, flag "Rien à facturer".

**Inclus :**
- Suppression du modal `.material-modal-*` par-ULD et du bouton "Matériel" sur chaque `.uld-header`.
- Suppression du recap inline `formatCondensedMaterial` par-ULD et du wrapper `.material-badge-wrapper`.
- Nouvelle section UI **inline statique** dans `index.html`, positionnée entre `#liveRecap` et `#generateSection`. Grid 2 cols desktop / 1 col mobile (clone des règles `.material-modal-grid` actuelles).
- Nouveau niveau `data.material = { ... }` (top-level) dans le modèle JSON manifeste persisté en localStorage chiffré.
- Migration automatique au `loadManifest` : si `data.material` absent et au moins une ULD a un ancien champ matériel, fusion runtime des champs par-ULD en total global (lecture défensive — pas de réécriture destructive).
- Rétro-compat lecture : anciens manifestes (Phase 1+2) chargent sans erreur, le matériel par-ULD est fusionné en global à la lecture. À la prochaine sauvegarde, le manifeste acquiert `data.material` (one-shot par manifeste, après reload utilisateur volontaire).
- Validation MAT-13 transformée en validation globale : bloque `generatePdf` et `sendEmail` si aucun champ matériel rempli ET `noMaterialToBill` non coché.
- MAT-14 (auto-open modal au add ULD) supprimé — remplacé par auto-scroll vers la section matériel si vide au clic "Générer".
- Rendu PDF : page 1 conserve la section "Matériel" (renommée depuis "Totaux matériel") qui affiche les valeurs saisies globalement. Pages détail ULD perdent leur section "Matériel".
- Rendu email HTML : symétrique au PDF (1 section unique en page récap, rien dans le bloc détail par ULD).
- Tests : adaptation de la suite MAT-01..14 / RECAP-01..03 + nouvelle suite "Matériel global - Migration" (≥ 5 scénarios rétro-compat).

**Hors scope (explicitement) :**
- Ajout/suppression/renommage de champs matériel — modèle inchangé en nature, seul le niveau hiérarchique change.
- Format PDF/email majeur : on garde les libellés actuels (sauf renommage "Totaux matériel" → "Matériel").
- Suppression définitive du module CSS `.material-modal-*` si le planner détecte qu'il est encore utilisable (pure CSS dépréciée OK — pas de chasse aux selectors dans cette phase).
- Migration forcée des anciens manifestes en localStorage (ré-écriture batch) — la migration se fait au load à la demande, pas en bulk.
- Modification du type ULD VRAC ou de la sémantique "dont Palettes / dont Vrac" du récap.
- Modification de la structure backend `/api/recipients`, `/api/clients`, `/api/send-email`.
- Modification de la structure des `rows` LTA (champs par ligne LTA inchangés).
- Modèle riche pour le commentaire matériel (un seul textarea libre, équivalent du `uldComment` d'aujourd'hui mais au niveau manifeste).

</domain>

<decisions>
## Implementation Decisions

### Forme UI saisie globale

- **D-01 :** Section **inline statique** (toujours visible) injectée dans `index.html` entre `<div id="liveRecap">` ([index.html:106](../../index.html#L106)) et `<div class="actions">` qui contient "Générer Loadsheet" ([index.html:109-113](../../index.html#L109-L113)). Position rationnelle : l'agent saisit ses ULD, voit le récap, saisit le matériel global, puis lance la génération.
- **D-02 :** **Bouton "Matériel" par-ULD supprimé** de `.uld-header` (lignes [app.js:507](../../static/js/app.js#L507) et [app.js:796](../../static/js/app.js#L796)). Le DOM `.uld-block` ne porte plus aucune action matériel.
- **D-03 :** **Pas de modal** pour la nouvelle section — saisie directe inline. Le modal `.material-modal-*` actuel devient mort en runtime (les CSS rules peuvent rester en place, pas de chasse aux selectors dans cette phase — `Claude's Discretion`).
- **D-04 :** Layout : **grid 2 colonnes desktop / 1 colonne mobile** via la même media query 768px (CLAUDE.md). Clone direct des règles `.material-modal-grid` ([style.css](../../static/css/style.css)). Préfixe CSS recommandé : `.material-section-*` (planner libre de choisir un autre nommage).
- **D-05 :** Structure interne de la section :
  - Titre `<h3>` "Matériel"
  - Ligne "Rien à facturer" (checkbox + label) AU-DESSUS du grid — clone du pattern Phase 1 D-06/D-07 (toggleNoBilling)
  - Grid : Sangles | Planchers EU (count + forfait) | Planchers Std (count + forfait) | Bois calage | Bâches | Intercalaires | Nids d'abeille
  - Commentaire libre (textarea) sous le grid, full-width

### Source de vérité données

- **D-06 :** **Live DOM = source de vérité** — cohérent avec le pattern existant (Phase 1 D-08 "DOM source of truth via data-attributes" + Phase 2 D-06 "Live DOM source of truth"). Les inputs de la section matériel sont lus directement par `collectData()` au moment de la sérialisation.
- **D-07 :** Les inputs portent des IDs uniques (`#mat-global-straps`, `#mat-global-flooring-eu`, etc. — `Claude's Discretion` sur la nomenclature exacte). Pas de data-attributes redondants — la valeur est dans `input.value` directement.
- **D-08 :** Les checkboxes forfait conservent l'exclusivité D-07 Phase 1 : cocher forfait → input count `disabled` + value forcée à `0`. Même logique pour "Rien à facturer" qui désactive tous les autres inputs (D-06/D-07 Phase 1, toggleNoBilling globalisé).

### Modèle JSON manifeste

- **D-09 :** Nouveau niveau top-level `data.material` ajouté au dictionnaire retourné par `collectData()` :
  ```json
  {
    "material": {
      "strapsCount": 0,
      "flooringEuCount": 0,
      "flooringEuForfait": false,
      "flooringStdCount": 0,
      "flooringStdForfait": false,
      "blocksCount": 0,
      "tarpsCount": 0,
      "dividersCount": 0,
      "honeycombCount": 0,
      "manifestComment": "",
      "noMaterialToBill": false
    }
  }
  ```
- **D-10 :** Les anciens champs `strapsCount`/`flooringEuCount`/.../`uldComment`/`noMaterialToBill` au niveau ULD (`data.ulds[i]`) ne sont **plus écrits** par `collectData()`. Les anciens manifestes les conservent jusqu'à la prochaine `saveManifest()` (cohérent Phase 1 D-11 "ré-écriture acceptable et attendue").
- **D-11 :** `data-uld-type` reste sur `.uld-block` (Phase 2 D-06). Les autres data-attributes matériel (`data-straps`, `data-flooring-*`, `data-blocks`, `data-tarps`, `data-dividers`, `data-honeycomb`, `data-uld-comment`, `data-no-billing`) ne sont **plus écrits** ni lus.

### Migration loadManifest — Politique de fusion

- **D-12 :** Au `loadManifest`, si `data.material` est **absent** ET au moins une ULD a au moins un champ matériel non-zéro/non-vide/forfait/noBilling → **migration runtime** des champs par-ULD en total global.
- **D-13 :** **Numeric counts** (`strapsCount`, `blocksCount`, `tarpsCount`, `dividersCount`, `honeycombCount`) → **SOMME** sur toutes les ULD.
- **D-14 :** **Planchers EU/Std counts** → **SOMME en excluant les ULD VRAC** (cohérent Phase 2 D-20 "planchers exclus pour VRAC").
- **D-15 :** **Forfait EU/Std** → **OR logique** sur toutes les ULD **non-VRAC** : `true` si au moins une ULD non-VRAC avait `flooringEuForfait === true`. Idem pour Std.
- **D-16 :** **Exclusivité forfait/count préservée** (D-07 Phase 1 strict) : si après fusion `flooringEuForfait === true` ET `flooringEuCount > 0`, alors `flooringEuCount` est forcé à `0` à la migration. Idem Std.
- **D-17 :** **`uldComment` → `manifestComment` : concaténation** des commentaires non-vides. Format : `"ULD N°1 : <comment>\nULD N°2 : <comment>"` (séparateur newline, préfixe `"ULD N°i : "` indexé 1-based). Si une seule ULD a un commentaire, le préfixe est conservé pour la lisibilité (l'agent comprend l'origine). Cohérent avec l'objectif "ne pas perdre de donnée à la migration".
- **D-18 :** **`noMaterialToBill` → AND logique** : `true` si **toutes les ULD** avaient `noMaterialToBill === true`. Sinon `false` (sémantique sûre : si au moins une ULD avait du matériel à facturer, le manifeste global doit être facturé).
- **D-19 :** La migration est **runtime only** (en mémoire). Aucune écriture automatique en localStorage au `loadManifest`. À la prochaine `saveManifest()` déclenchée par l'utilisateur (clic "Sauvegarder" ou auto via "Générer PDF"), le manifeste acquiert `data.material` et perd les anciens champs ULD. Cohérent Phase 1 D-11.

### Rendu PDF

- **D-20 :** **Page 1** : la section actuelle "Totaux matériel" ([app.js:1144-1171](../../static/js/app.js#L1144-L1171)) est renommée en **"Matériel"** (libellé) — l'appellation "totaux" perd son sens (plus une agrégation calculée mais des valeurs saisies). Position conservée : sous la table récap (et sous "Détail par catégorie" si VRAC).
- **D-21 :** La section "Matériel" page 1 affiche les valeurs lues depuis `data.material` directement. **Pas de fallback `buildMaterialSummary(data.ulds)`** — le helper devient inutilisé (peut être supprimé OU gardé comme dead code, `Claude's Discretion`).
- **D-22 :** **Commentaire matériel global** (`manifestComment`) ajouté en bas du bloc "Matériel" page 1, en ligne `'Commentaire'` du tableau autotable. Pas de troncature (le commentaire matériel global est volontaire et destiné au destinataire — pas l'usage par-ULD compact).
- **D-23 :** **Cas "Rien à facturer"** : si `data.material.noMaterialToBill === true`, la section "Matériel" page 1 affiche **une seule ligne** `"Rien à facturer"` (clone du pattern `buildUldMaterialRows` actuel ligne 913).
- **D-24 :** **Pages détail ULD** : la section "Matériel" actuelle ([app.js:1235-1254](../../static/js/app.js#L1235-L1254)) est **supprimée**. Les pages détail ne montrent plus que LTAs + Type + Poids + tableau LTA détail.
- **D-25 :** Format "forfait" littéral conservé (Phase 1 D-16) — affichage `"forfait"` plutôt qu'un nombre quand `flooringEuForfait === true`.

### Rendu email HTML

- **D-26 :** **Symétrique au PDF** : la section "Totaux matériel" actuelle ([app.js:1365](../../static/js/app.js#L1365)) renommée "Matériel" et alimentée par `data.material` (plus par `buildMaterialSummaryHtml(data.ulds)`).
- **D-27 :** Section "Matériel" par-ULD ([app.js:1385](../../static/js/app.js#L1385) appel à `buildUldMaterialHtml(u)`) **supprimée** de la boucle ULD.
- **D-28 :** Anti-XSS conservé : `esc()` obligatoire sur `manifestComment` (équivalent global de Phase 1 D-19 sur `uldComment`).

### Récap écran (#liveRecap)

- **D-29 :** **`formatCondensedMaterial`** ([app.js:201-244](../../static/js/app.js#L201-L244)) **supprimé** — plus de recap inline par-ULD (plus de matériel par-ULD).
- **D-30 :** **Wrapper `.material-badge-wrapper`** + `#material-badge-XX` retirés du HTML `addUld()` ([app.js:510](../../static/js/app.js#L510)) et `loadManifest()` ([app.js:798](../../static/js/app.js#L798)).
- **D-31 :** Le `#liveRecap` lui-même n'est **pas modifié** — il reste sur "ULD : N (dont Vrac…) | Colis | Poids | LTA | DGR". L'agent voit le matériel directement dans la section dédiée juste en dessous.

### Validation MAT-13 / MAT-14 (refonte)

- **D-32 :** **MAT-13 globalisé** : helper équivalent `manifestHasMaterial()` qui retourne `true` si au moins un champ de `data.material` est non-zéro / forfait / noBilling / manifestComment non-vide.
- **D-33 :** Blocage `generatePdf()` et `sendEmail()` si `!manifestHasMaterial()` → alert + auto-scroll vers la section matériel + focus sur le premier input. Plus de "ULD N°X non saisi".
- **D-34 :** **Blocage `addUld()` MAT-13 supprimé** ([app.js:463-472](../../static/js/app.js#L463-L472)) — plus de couplage matériel↔ULD.
- **D-35 :** **Blocage `showGenerateSection()` MAT-13 supprimé** ([app.js:604-612](../../static/js/app.js#L604-L612)) — la section générer s'affiche librement ; le blocage est uniquement à la génération PDF/envoi email.
- **D-36 :** **MAT-14 auto-open modal supprimé** — `addUld()` perd son paramètre `autoOpen` (signature simplifiée à `addUld(skipValidation)` ou même `addUld()` sans args). L'UX est remplacée par : au clic "Générer" sur un manifeste sans matériel, alert + auto-scroll vers la section matériel.
- **D-37 :** **`newManifest()`** doit reset les champs de la section matériel globale aux defaults (counts à 0, forfaits false, comment vide, noBilling false).

### VRAC — Simplification

- **D-38 :** **Plus de logique conditionnelle VRAC en saisie globale** — l'agent saisit librement les planchers EU/Std au niveau manifeste. La sémantique Phase 2 D-18 (masquage planchers dans le modal pour ULD VRAC) est **caduque** dans le nouveau modèle, car les planchers ne sont plus rattachés à une ULD.
- **D-39 :** La nuance VRAC ne survit qu'à la **migration loadManifest** (D-14 et D-15 : exclusion ULD VRAC dans la fusion des planchers count + forfait OR). Cohérent avec D-20 Phase 2.
- **D-40 :** `formatCondensedMaterial` étant supprimé (D-29), la branche VRAC qu'il contenait ([app.js:215-225](../../static/js/app.js#L215-L225)) disparaît avec.
- **D-41 :** `buildMaterialSummary(ulds)` (qui excluait planchers VRAC à l'agrégation, [app.js:870-895](../../static/js/app.js#L870-L895)) devient inutilisé — `Claude's Discretion` sur le nettoyage.

### Anti-XSS (héritage MAT-11 / D-19 Phase 1)

- **D-42 :** `manifestComment` (texte libre user-supplied) doit être échappé via `esc()` partout où il est injecté en innerHTML :
  - Page 1 PDF : `doc.text()` n'est pas vulnérable XSS mais doit rester propre — le contenu est passé verbatim, OK.
  - Email HTML : `esc(data.material.manifestComment)` obligatoire dans la table récap matériel.
  - Section UI : assigné via `.value` (textarea, pattern Phase 1 D-19 → anti-XSS par construction).
- **D-43 :** Tous les autres champs matériel sont des nombres ou booléens — forcés au bon type via `parseInt` / `=== 'true'` à la lecture. Pas de vecteur XSS (Phase 1 D-20).

### Tests anti-régression

- **D-44 :** **Adaptation de la suite existante** dans `tests/tests.html` (≥ 141 références matériel/MAT-* aujourd'hui) :
  - Suite "Matériel ULD - MAT-01..08" → renommée "Matériel manifeste - Saisie globale", pointe sur la nouvelle section UI globale.
  - Suite "MAT-12 Rien à facturer" → adaptée pour la checkbox globale.
  - Suite "MAT-13 validation obligatoire" → adaptée pour la nouvelle politique (blocage uniquement generatePdf/sendEmail).
  - Suite "MAT-14 auto-open" → **SUPPRIMÉE** (comportement disparu).
  - Suite "RECAP-01..03" → adaptée pour vérifier section globale + suppression badges par-ULD.
- **D-45 :** **Nouvelle suite "Matériel global - Migration loadManifest"** avec ≥ 5 scénarios :
  - (a) Manifeste sans matériel (3 ULD vides) → `data.material` initialisé aux defaults.
  - (b) Manifeste avec 1 ULD ayant `strapsCount: 5` → fusion `data.material.strapsCount === 5`.
  - (c) Manifeste avec 2 ULD (1 PMC + 1 VRAC) ayant des planchers → fusion exclut les planchers de la VRAC.
  - (d) Manifeste avec 1 ULD ayant `flooringEuForfait: true` + 1 ULD avec count → OR + count forcé à 0.
  - (e) Manifeste avec 3 ULD ayant chacun `uldComment` non-vide → concaténation avec préfixe "ULD N°X : " + newlines.
  - (f) Manifeste avec toutes ULD à `noMaterialToBill: true` → `data.material.noMaterialToBill === true`.
  - (g) Manifeste avec 2 ULD : 1 noBilling true + 1 noBilling false → AND donne `false`.
- **D-46 :** **Suite E2E lifecycle Phase 3** (`tests/tests.html` 26 asserts) **adaptée** : saisie matériel se fait 1 fois au lieu de N fois ; vérifications PDF/email pointent sur la section globale unique.
- **D-47 :** **Test rétro-compat localStorage** : créer un manifeste avec l'ancien format (champs matériel par-ULD), `saveManifest()` puis `loadManifest()` doit produire un objet en mémoire avec `data.material` peuplé via migration, sans perte de donnée.
- **D-48 :** **Test E2E "saisie unique"** : créer manifeste neuf → saisir matériel global → ajouter 2 ULD → générer PDF/email → vérifier que la section "Matériel" apparaît 1 fois en page 1 et n'apparaît PAS sur les pages détail ULD ni dans le bloc détail ULD de l'email HTML.

### Claude's Discretion

- Nomenclature exacte des IDs/classes CSS de la nouvelle section (`.material-section-*` recommandé, le planner peut choisir autrement).
- Décision de **garder ou supprimer** les helpers devenus inutilisés (`buildMaterialSummary`, `buildUldMaterialRows`, `buildMaterialSummaryHtml`, `buildUldMaterialHtml`, `formatCondensedMaterial`, `openMaterialModal`, `closeMaterialModal`, `applyMaterialToUld`, `toggleForfait`, `toggleNoBilling`, `uldHasMaterial`, `findIncompleteUlds`, `refreshMaterialBadge`) → recommandation : **supprimer les helpers morts** pour limiter la dette technique, garder uniquement ce qui sert la nouvelle architecture.
- Décision de **garder ou supprimer** le CSS `.material-modal-*` (le modal disparaît à l'usage — CSS dépréciée peut être laissée en place sans risque).
- Format précis du tableau "Matériel" page 1 PDF (réutilisation `autoTable` recommandée, layout 2 colonnes Label/Valeur cohérent avec aujourd'hui).
- Choix entre `<input type="number">` ou `<input type="text" inputmode="numeric">` pour les compteurs (recommandation : conserver `type="number"` cohérent Phase 1 D-06).
- Position exacte du textarea `manifestComment` dans le grid (recommandation : full-width sous le grid).
- Helper `migrateLegacyMaterial(data)` (extraction de la logique D-12..D-18 dans une fonction pure testable) — recommandé pour testabilité D-45.

### Folded Todos

Aucun — `gsd-tools todo match-phase 6` retourne `todo_count: 0`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Vision, core value (manifeste → PDF → email sans perte), constraint stack JS vanilla, rétro-compat localStorage obligatoire
- `.planning/REQUIREMENTS.md` §Matériel ULD (MAT-01..14) §Récapitulatif (RECAP-01..03) — Requirements qui restent valides mais sont **réinterprétés** au niveau manifeste
- `.planning/ROADMAP.md` §Phase 6 — Goal et description (matériel global, refactor saisie unique)
- `.planning/STATE.md` §Roadmap Evolution Phase 6 — Justification ajout 2026-05-19 (matériel déplacé d'une saisie par ULD à une saisie unique totale)

### Project conventions
- `CLAUDE.md` §Conventions — JS vanilla, CSS desktop-first + media query 768px, pas de framework
- `CLAUDE.md` §Sécurité — `esc()` obligatoire pour innerHTML user-supplied, AES-256-GCM localStorage chiffré, CSP
- `CLAUDE.md` §Tests — toute nouvelle feature doit être couverte par `tests/tests.html`, harness Node+JSDOM via `npm run verify`
- `CLAUDE.md` §Release checklist — 7 étapes obligatoires avant push master (`npm run verify`, scenario E2E manuel, validation rétro-compat manifeste ancien)

### Phase 1 — Origine du matériel par-ULD (à refactoriser)
- `.planning/phases/01-mat-riel-uld-r-tro-compat/01-CONTEXT.md` — Décisions D-01..D-20 (modèle data, modal pattern, rétro-compat, anti-XSS uldComment, format PDF/email)
- `.planning/phases/01-mat-riel-uld-r-tro-compat/01-01-PLAN.md` — Plan modal UI + data model (référence pour le code à démanteler)
- `.planning/phases/01-mat-riel-uld-r-tro-compat/01-02-PLAN.md` — Plan rendu PDF + email HTML (références pour les sections à supprimer/renommer)

### Phase 2 — Logique VRAC (à simplifier)
- `.planning/phases/02-type-uld-vrac/02-CONTEXT.md` — Décisions D-18 (masquage planchers modal VRAC, devient caduc en saisie globale) et D-20 (exclusion planchers VRAC au calcul totaux, **survit** à la migration loadManifest D-14)

### Phase 3 — Suite E2E à adapter
- `.planning/phases/03-validation-locale-release-gate/03-CONTEXT.md` — Suite E2E lifecycle 26 asserts (référence pour adaptation D-46)
- `.planning/phases/03-validation-locale-release-gate/03-01-PLAN.md` — Plan release gate, `npm run verify`, run-harness Node+JSDOM

### Code source à modifier (lecture obligatoire avant planning)
- `static/js/app.js` (1416 lignes) — Cible principale du refactor :
  - [app.js:33-141](../../static/js/app.js#L33-L141) — `openMaterialModal`, `toggleForfait`, `toggleNoBilling`, `closeMaterialModal` (à supprimer ou repurposer pour la section inline)
  - [app.js:145-190](../../static/js/app.js#L145-L190) — `applyMaterialToUld` (à supprimer)
  - [app.js:201-244](../../static/js/app.js#L201-L244) — `formatCondensedMaterial` (à supprimer D-29)
  - [app.js:255-295](../../static/js/app.js#L255-L295) — `uldHasMaterial` / `findIncompleteUlds` / `refreshMaterialBadge` (à supprimer D-32/D-34/D-35)
  - [app.js:456-523](../../static/js/app.js#L456-L523) — `addUld` (suppression bouton Matériel D-02, suppression data-attributes matériel D-11, suppression MAT-14 D-36)
  - [app.js:604-616](../../static/js/app.js#L604-L616) — `showGenerateSection` (suppression blocage MAT-13 D-35)
  - [app.js:628-676](../../static/js/app.js#L628-L676) — `collectData` (suppression lecture data-attributes matériel D-10, ajout lecture section globale D-09)
  - [app.js:728-810](../../static/js/app.js#L728-L810) — `loadManifest` (suppression écriture data-attributes matériel D-11, ajout migration runtime D-12..D-18)
  - [app.js:870-934](../../static/js/app.js#L870-L934) — `buildMaterialSummary` / `formatFlooringDisplay` / `buildUldMaterialRows` (devenus inutilisés D-21/D-41)
  - [app.js:939-981](../../static/js/app.js#L939-L981) — `buildMaterialSummaryHtml` / `buildUldMaterialHtml` (idem)
  - [app.js:1144-1171](../../static/js/app.js#L1144-L1171) — Section "Totaux matériel" page 1 PDF (renommage + bascule sur `data.material` D-20/D-21)
  - [app.js:1235-1254](../../static/js/app.js#L1235-L1254) — Section "Matériel" page détail ULD PDF (à supprimer D-24)
  - [app.js:1262-1285](../../static/js/app.js#L1262-L1285) — `generatePdf` (refonte blocage MAT-13 global D-33)
  - [app.js:1290-1416](../../static/js/app.js#L1290-L1416) — `sendEmail` (refonte blocage MAT-13 global D-33, refonte sections matériel D-26/D-27)
- `index.html` (143 lignes) — Insertion de la nouvelle section entre [index.html:106](../../index.html#L106) (`#liveRecap`) et [index.html:109-113](../../index.html#L109-L113) (`<div class="actions">`)
- `static/css/style.css` — Nouvelles règles `.material-section-*` (clone de `.material-modal-grid` et `.material-modal-*`), media query 768px
- `tests/tests.html` — Adaptation de ~141 références matériel (D-44) + nouvelle suite migration D-45

### Notes
- Pas d'ADR ni spec externe au projet — toutes les décisions sont dans les CONTEXT.md des phases
- Pas de bundler, pas de TypeScript, pas de module ESM — script `app.js` chargé en globals
- L'app est en **production active** (agents ATH usage quotidien) — toute régression a impact opérationnel direct. Test local obligatoire avant push master (CLAUDE.md release checklist).
- Le `manifestId` et l'auth ne sont pas affectés par cette phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`esc(str)` ([app.js:22-25](../../static/js/app.js#L22-L25))** — fonction anti-XSS, obligatoire pour `manifestComment` dans email HTML (D-28/D-42).
- **Pattern grid `.material-modal-grid` ([style.css](../../static/css/style.css))** — clone direct des règles 2 cols desktop / 1 col mobile pour la nouvelle section.
- **Pattern `toggleNoBilling` ([app.js:114-135](../../static/js/app.js#L114-L135))** — clone du comportement "Rien à facturer désactive tout sauf forfaits" pour la section globale (D-08).
- **Pattern `toggleForfait` ([app.js:102-109](../../static/js/app.js#L102-L109))** — clone exclusivité forfait/count (D-08).
- **Helper `autoTable` jspdf-autotable (CDN, [index.html:30](../../index.html#L30))** — déjà utilisé pour "Totaux matériel" page 1, structure réutilisable pour "Matériel" (D-20).
- **Pattern `oninput="updateRecap()"` ([app.js:506](../../static/js/app.js#L506))** — pas applicable directement matériel (pas dans le récap live D-31), mais le pattern d'event handler inline est conservable si besoin futur.
- **Pattern `<select id="clientName">` legacy retrocompat ([app.js:735-749](../../static/js/app.js#L735-L749))** — référence pour la logique de migration "présent vs absent dans le nouveau modèle" (Phase 5 D-14 / CLI-08).

### Established Patterns
- **DOM source-of-truth** (Phase 1 D-08, Phase 2 D-06) — la section globale lit directement les `.value` des inputs au moment de `collectData()`. Pas de cache JS, pas de state local séparé. Cohérent avec le reste du code (uld-block lit la valeur des inputs LTA directement).
- **Lecture défensive au load** (Phase 1 D-10, MAT-10) — `loadManifest` traite les champs absents comme valeurs par défaut. La migration D-12..D-18 suit ce principe : `parseInt(uldData.strapsCount) || 0` pour les anciens manifestes.
- **Anti-XSS textarea via `.value`** (Phase 1 D-19) — `manifestComment` assigné via `.value` après création de la textarea, jamais via innerHTML. Cohérent avec le pattern existant `openMaterialModal` ligne 97.
- **HTML inline `innerHTML` dans `.js`** — pattern `addUld`, `loadManifest`, `openMaterialModal`. À reproduire pour la section globale (innerHTML littéral + esc() sur user input).
- **Tests harness Node+JSDOM** (`tests/tests.html` + `run-harness.cjs`) — pattern existant `suite('Foo', function() { test('bar', function() { ... }); });`. Mocking de localStorage et DOM via JSDOM. Tests doivent fonctionner browser ET Node (npm run verify).
- **Forfait littéral "forfait"** (Phase 1 D-16, [app.js:921-925](../../static/js/app.js#L921-L925)) — affichage `"forfait"` plutôt qu'un nombre dans PDF/email. Conservé D-25.
- **ASCII-safe labels PDF** (Phase 1 D-PDF, [app.js:1239-1243](../../static/js/app.js#L1239-L1243)) — `'Bâches'` → `'Baches'` à cause du glyph default jsPDF. Conservé pour la nouvelle section PDF.

### Integration Points
- **`index.html:106-113`** — Insertion de la nouvelle section entre `<div id="liveRecap">` et `<div class="actions">`. Structure recommandée :
  ```html
  <section id="material-section" class="material-section">
    <h3>Matériel</h3>
    <label class="mat-no-billing-label"><input type="checkbox" id="mat-global-no-billing">Rien à facturer pour ce manifeste</label>
    <div class="material-section-grid">
      <!-- inputs sangles, planchers EU/Std + forfaits, blocks, tarps, dividers, honeycomb -->
    </div>
    <label class="mat-comment-label">Commentaire matériel<textarea id="mat-global-comment" rows="3"></textarea></label>
  </section>
  ```
- **`static/js/app.js` — `collectData`** ([app.js:628-676](../../static/js/app.js#L628-L676)) — ajout d'un nouveau bloc qui lit la section globale via `document.getElementById('mat-global-straps').value` etc. et construit `data.material`. Suppression du bloc qui lit `block.dataset.straps` etc. dans la boucle ULD.
- **`static/js/app.js` — `loadManifest`** ([app.js:728-810](../../static/js/app.js#L728-L810)) — :
  - Suppression des `div.setAttribute('data-straps', ...)` etc. dans la boucle ULD.
  - Ajout d'un bloc après la boucle ULD qui : (a) lit `data.material` si présent et l'écrit dans les inputs globaux, OU (b) déclenche `migrateLegacyMaterial(data)` qui fusionne les anciens champs par-ULD et l'écrit dans les inputs globaux.
  - Suppression du bouton "Matériel" et du `material-badge-wrapper` dans `div.innerHTML`.
- **`static/js/app.js` — `addUld`** ([app.js:456-523](../../static/js/app.js#L456-L523)) — :
  - Suppression du paramètre `autoOpen` (MAT-14 disparaît D-36).
  - Suppression du bloc `findIncompleteUlds` (D-34).
  - Suppression du bouton "Matériel" et du `material-badge-wrapper` dans `div.innerHTML`.
  - Suppression des `data-straps`, `data-flooring-*`, etc. dans les `setAttribute`.
- **`static/js/app.js` — `newManifest`** (existe au-dessus de `addUld`, à localiser et étendre D-37) — reset des inputs globaux matériel aux defaults.
- **`static/js/app.js` — `generatePdf` / `sendEmail`** ([app.js:1262-1416](../../static/js/app.js#L1262-L1416)) — refonte du bloc validation MAT-13 (D-33), refonte sections matériel (D-20..D-28).
- **`static/css/style.css`** — Nouvelle section `.material-section` + `.material-section-grid` (clone des règles `.material-modal-grid`) + media query 768px (1 col mobile).
- **`tests/tests.html`** — Adaptation de ~141 références (D-44) + ajout nouvelle suite migration (D-45) + adaptation E2E lifecycle (D-46).
- **Helper recommandé `migrateLegacyMaterial(data)`** (`Claude's Discretion`) — extraction de la logique D-12..D-18 dans une fonction pure pour testabilité. Signature : `function migrateLegacyMaterial(data) { ... return data.material; }`. Testable directement dans `tests.html` suite Migration.

</code_context>

<specifics>
## Specific Ideas

- **"Saisie unique pour tout le manifeste"** : la décision projet (PROJECT.md §Active "saisie unique pour tout le manifeste au lieu d'un jeu par ULD") est explicite — l'agent ne saisit qu'une fois ses sangles/planchers/etc. quel que soit le nombre d'ULD. Pas de duplication, pas d'agrégation au PDF (lecture directe).
- **Position entre liste ULD et bouton Générer** : (STATE.md §Roadmap Evolution Phase 6) "positionnée entre la liste des ULD et le bouton Générer". Décision UI ancrée — section inline statique au-dessus de `#generateSection`.
- **Migration auto au loadManifest** : (STATE.md) "fusion ancien matériel par-ULD en total global". Décision : fusion **runtime au load** (pas batch destructive), conservation de l'esprit Phase 1 D-11 "ré-écriture acceptable et attendue à la prochaine sauvegarde".
- **Plus de modal** : décision opportuniste — le modal Phase 1 D-01 était justifié par la complexité de saisie par-ULD (1 popup par ULD). En global, la saisie inline est plus naturelle (1 section visible en permanence).
- **VRAC "logique caduque en saisie"** : la décision Phase 2 D-18 (masquage planchers modal pour VRAC) était attachée au modal par-ULD. En global, plus de rattachement ULD↔planchers en saisie. La logique VRAC ne survit qu'à la migration (fusion intelligente exclut VRAC pour planchers).
- **Politique de fusion conservative pour rétro-compat** : on additionne plutôt qu'on ne supprime, on prefixe les commentaires par "ULD N°i :" pour préserver la trace de l'origine, on choisit AND pour noBilling (sémantique sûre côté facturation).
- **Tests adaptés plutôt que supprimés** : la suite MAT-01..14 / RECAP-01..03 a une valeur historique (anti-régression sur la saisie matériel). On l'adapte au nouveau modèle plutôt que de tout réécrire — limite la surface de risque.
- **Pas de chasse aux dead code obligatoire** : `Claude's Discretion` sur la suppression des helpers devenus inutilisés (`buildMaterialSummary`, `formatCondensedMaterial`, etc.). Recommandation : supprimer pour limiter la dette, mais ce n'est pas un critère de succès Phase 6 — un PR de cleanup peut suivre.

</specifics>

<deferred>
## Deferred Ideas

- **Modèle riche par-ULD optionnel** (sangles globales + commentaire libre par-ULD) — non demandé. La décision est "tout au niveau manifeste", pas "global + local". Si plus tard les agents veulent annoter une ULD spécifique, c'est une nouvelle phase.
- **Saisie matériel par catégorie ULD** (ex: planchers globaux pour palettes seulement) — refusé en discussion (D-38, D-39). Pourrait revenir si les agents le réclament (nouvelle phase).
- **Migration batch destructive** (ré-écriture de tous les manifestes localStorage au premier load Phase 6) — non voulu. Migration au load à la demande suffit, cohérent avec Phase 1 D-11.
- **Validation forte du commentaire matériel** (longueur max, regex) — pas demandé, le textarea libre suffit (Phase 1 D-08 / `manifestComment` reste libre).
- **Bouton "Reset matériel"** dans la section globale — pas voulu, l'agent peut effacer les valeurs manuellement. `newManifest()` reset déjà au new.
- **Indicateur visuel "matériel saisi"** près du bouton Générer — pas voulu, la section globale est visible en permanence donc l'agent sait directement.
- **Migration unique vs auto-rebuild à chaque load** — décision D-19 : migration runtime au load systématiquement (pas de flag persistant), cohérent avec "lecture défensive" Phase 1.
- **Suppression du CSS `.material-modal-*`** — `Claude's Discretion`. Le CSS dépréciée peut rester en place sans risque (pas de selectors qui restent actifs). Cleanup possible dans phase future si besoin.
- **Cleanup des helpers devenus dead code** (`buildMaterialSummary`, `formatCondensedMaterial`, `buildUldMaterialRows`, `buildUldMaterialHtml`, `uldHasMaterial`, `findIncompleteUlds`, `refreshMaterialBadge`, `openMaterialModal`, `applyMaterialToUld`, `toggleForfait`, `toggleNoBilling`, `closeMaterialModal`) — recommandé en bonus dans Phase 6 mais pas blocker. Si rien n'appelle ces fonctions, elles peuvent être supprimées sans risque.
- **Refactor du flow de saisie LTA en parallèle** — hors scope, ce cycle se limite au matériel.
- **Indicateur "modifié" sur la section matériel** (signal de dirty state) — pas voulu, l'app utilise déjà un statut global "Brouillon/Généré".

### Reviewed Todos (not folded)

Aucun — `gsd-tools todo match-phase 6` retourne `todo_count: 0` ; pas de todo en attente lié à cette phase.

</deferred>

---

*Phase: 06-materiel-global-refactor-saisie-unique*
*Context gathered: 2026-05-19*
