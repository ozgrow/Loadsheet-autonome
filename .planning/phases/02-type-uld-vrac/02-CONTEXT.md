# Phase 2 : Type ULD VRAC — Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 introduit un **sélecteur de type officiel** sur chaque ULD (liste fixe : PMC, AKE, AKN, PAG, VRAC). Le type VRAC est exclu du compteur palettes du récap, apparaît dans une annotation dédiée ("dont Vrac : N") + ligne détaillée colis/poids, et est rendu dans le PDF et l'email HTML via une colonne "Type" dans l'entête de chaque ULD. La page 1 du PDF scinde Palettes / Vrac dans le récap des totaux (conditionnel : affiché seulement si au moins une ULD VRAC présente).

**Hors scope :**
- Inférence automatique du type depuis le numéro ULD (décision retenue : rien d'auto, défaut explicite PMC)
- Types additionnels au-delà de la liste fixe PMC/AKE/AKN/PAG/VRAC (peut être étendu plus tard sans refactor majeur)
- Modification du modèle de données matériel au-delà du conditional display VRAC
- Migration automatique des manifestes existants (rétro-compat par lecture défensive, pas de re-save destructif)

</domain>

<decisions>
## Implementation Decisions

### Sélecteur de type ULD
- **D-01:** Ajouter un `<select>` officiel avec 5 valeurs : `PMC`, `AKE`, `AKN`, `PAG`, `VRAC`. Pas de checkbox binaire, pas de types dynamiques. Liste figée dans le code.
- **D-02:** Libellés dans le select : identiques aux codes (`PMC`, `AKE`, `AKN`, `PAG`, `VRAC`) — pas de labels français explicatifs, les agents ATH connaissent les codes. Exact DOM structure (class, option values) à la discrétion du planner.
- **D-03:** Valeur par défaut pour tout nouvel ULD créé via "Ajouter ULD" : `PMC` (type le plus courant chez ATH). Sélectionné dans le select au moment du `addUld()`.
- **D-04:** Placement dans `.uld-header` : le select apparaît **AVANT** le champ N° ULD. Ordre visuel : `[Type ▼] [N° ULD ____] [Poids __] [Matériel] [Supprimer]`. Typographie du header à la discrétion du planner (taille, espacement).

### Modèle de données ULD
- **D-05:** Ajouter une clé `type` (string) dans chaque objet `ulds[i]` de `collectData()` et dans le manifeste sauvegardé. Valeurs acceptées : `'PMC' | 'AKE' | 'AKN' | 'PAG' | 'VRAC'`. Pas d'enum TypeScript (projet JS vanilla).
- **D-06:** Le type est stocké via data-attribute `data-uld-type="..."` sur `.uld-block` (cohérent avec le pattern Phase 1 des attributs matériel), ET lu depuis le `<select>` à la volée par `collectData()` — prefer la valeur du select comme source de vérité live (comme `uld-number` et `uld-weight` déjà lus directement des inputs).

### Récap écran (#liveRecap)
- **D-07:** Le compteur global `ULD : N` est **conservé** (pas de relabel en `Palettes`). On ajoute une annotation `dont Vrac : M (X colis, Y kg)` **conditionnelle** : affichée seulement si au moins une ULD VRAC est présente dans le manifeste.
- **D-08:** Format exact du `#liveRecap` avec VRAC présent : `ULD : 4 dont Vrac : 1 (12 colis, 240 kg) | Colis : 50 | Poids : 800 kg | LTA : ... | DGR`. Sans VRAC : format actuel inchangé (backward compatible visuellement).
- **D-09:** **Nuance par rapport au critère #2 littéral du ROADMAP** : le ROADMAP mentionne "le compteur de palettes du récapitulatif les exclut (seules les palettes réelles sont comptées)". Décision produit prise ici : on garde "ULD" total (pas de renommage en "Palettes") + annotation "dont Vrac". Sémantiquement équivalent : l'agent peut déduire le nombre de palettes réelles (`ULD - Vrac = palettes`). Cette décision doit être **documentée dans la VERIFICATION.md future** pour éviter une lacune comme RECAP-01 de Phase 1.
- **D-10:** Les totaux `Colis : N` et `Poids : N kg` du `#liveRecap` **incluent toujours les ULD VRAC** (totaux globaux inchangés). Le détail VRAC est isolé dans l'annotation "dont Vrac : ...".

### Affichage PDF
- **D-11:** Chaque page ULD du PDF affiche une **colonne "Type" séparée dans l'entête** de la page. Format : `Type: VRAC | ULD N°: ABC123 | Poids: 200 kg` (ou équivalent autoTable). Pas de préfixe inline dans le titre. Applique à tous les types (PMC et VRAC s'affichent de la même manière, juste avec valeur différente).
- **D-12:** Page 1 du PDF (récap totaux) : **scinder palettes / vrac** quand au moins une ULD VRAC est présente. Format :
  ```
  Récapitulatif
  ULD             : 4
  dont Palettes   : 3 (38 colis, 560 kg)
  dont Vrac       : 1 (12 colis, 240 kg)
  Total colis     : 50
  Poids total     : 800 kg
  ```
  Sans VRAC : format actuel inchangé. L'ordre et la typographie exacte (autoTable vs paragraphe) à la discrétion du planner.
- **D-13:** Le type "PMC" / "AKE" / etc. est affiché **littéralement** (pas traduit). Les agents lisent et comprennent les codes.

### Affichage email HTML
- **D-14:** **Miroir exact du PDF** : même colonne "Type" dans l'entête de chaque bloc ULD, même scission palettes/vrac dans le récap en haut de l'email. `esc()` appliqué par sécurité même si le type est contraint (défense en profondeur).

### Rétro-compatibilité
- **D-15:** **Lecture défensive** : si un manifeste ancien (sans clé `type`) est chargé via `loadManifest()`, chaque ULD prend `type = 'PMC'` par défaut. Même pattern que D-10 de Phase 1 pour les champs matériel.
- **D-16:** Aucune migration automatique : un ancien manifeste conserve son format jusqu'à re-save. Après re-save, il acquiert la clé `type = 'PMC'` (sauf si l'agent l'a changé entre-temps).
- **D-17:** Pas d'inférence depuis le préfixe du numéro ULD (rejetée comme fragile). PMC pur par défaut.

### Interaction type ↔ champs matériel (override partiel D-09 de Phase 1)
- **D-18:** **Override de D-09 de Phase 1** : le matériel n'est plus strictement uniforme pour tous les types. Quand le type est `VRAC`, les champs **Planchers bois EU** et **Planchers bois Standard** (ainsi que leurs checkbox "forfait négocié") sont **masqués** dans le modal d'édition ULD. Les autres champs (sangles, bois de calage, bâches, intercalaires, nids d'abeille, commentaire libre) restent visibles et saisissables pour VRAC.
- **D-19:** **Persistance des données planchers quand VRAC** : les `data-flooring-eu`, `data-flooring-eu-forfait`, `data-flooring-std`, `data-flooring-std-forfait` des `.uld-block` sont **conservés tels quels** quand le type bascule vers VRAC (pas d'effacement destructif). Si l'agent rebascule VRAC → PMC, les valeurs planchers réapparaissent intactes. Pareil pour `collectData()` : les champs sont toujours collectés, simplement pas affichés dans le modal quand VRAC.
- **D-20:** **Rendu PDF et email HTML pour VRAC** : les planchers bois ne sont **PAS rendus** dans la section matériel d'une ULD VRAC (ni page ULD du PDF, ni email), même si `flooringEuCount > 0`. Les totaux page 1 du PDF (buildMaterialSummary) **excluent aussi** les planchers des ULD VRAC pour éviter les incohérences.
- **D-21:** Le changement dynamique de type dans le `<select>` (event onchange) doit déclencher : (a) un re-render du modal si ouvert pour cette ULD (peu probable mais robuste), (b) un `updateRecap()` pour rafraîchir le compteur VRAC, (c) un `refreshMaterialBadge()` pour actualiser le récap inline (les planchers disparaissent de la chaîne condensée si type devient VRAC).

### Claude's Discretion
- CSS du `<select>` : largeur, police, couleur d'option VRAC (ex: couleur distincte pour VRAC pour repérage rapide). À la charge du planner.
- Exact wording des labels textuels dans PDF/email ("dont Palettes" vs "Palettes uniquement" vs "Dont palettes") — cohérent avec les conventions existantes du PDF.
- Gestion responsive du `<select>` sur mobile ≤ 768px (largeur, touchabilité).
- Pattern exact pour masquer les champs planchers dans le modal (display:none conditional vs `.hidden` class vs suppression DOM) — à la charge du planner, mais préserver les dataset per D-19.
- Tests à ajouter dans `tests/tests.html` : couverture minimale suggérée ci-dessous dans `<specifics>`, mais détail à la charge du planner.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Core value (manifeste → PDF → email sans perte), v1 requirements, contraintes prod
- `.planning/REQUIREMENTS.md` — VRAC-01, VRAC-02, VRAC-03 (3 requirements de cette phase)
- `.planning/ROADMAP.md` §Phase 2 — Objectif et 4 critères de succès

### Décisions héritées des phases précédentes
- `.planning/phases/01-mat-riel-uld-r-tro-compat/01-CONTEXT.md` — D-09 (matériel uniforme), D-13 (#liveRecap minimaliste), D-15 (PDF section matériel par ULD), D-17 (email HTML miroir PDF), D-18 (esc() sur email HTML). **D-09 est overridé partiellement ici par D-18 de cette phase.**
- `.planning/phases/01-mat-riel-uld-r-tro-compat/01-VERIFICATION.md` — Leçon : les critères du ROADMAP doivent être lus littéralement ; documenter explicitement les nuances d'interprétation (cf. D-09 de cette phase).

### Conventions projet
- `CLAUDE.md` §Conventions — JS vanilla, CSS desktop-first + media query 768px, pas de librairie, Azure SWA single `*` rule
- `CLAUDE.md` §Sécurité — `esc()` obligatoire anti-XSS même pour données contraintes (défense en profondeur)
- `CLAUDE.md` §Tests — toute nouvelle feature doit avoir des tests dans `tests/tests.html`

### Code source principal (à lire avant implémentation)
- `static/js/app.js:290-338` — `addUld()` construction DOM d'un bloc ULD (à modifier)
- `static/js/app.js:373-395` — `updateRecap()` rendu `#liveRecap` (à modifier, D-07/D-08)
- `static/js/app.js:410-460` — `collectData()` collecte du manifeste (à étendre avec `type`)
- `static/js/app.js:460-575` — `loadManifest()` chargement + reconstitution DOM (lecture défensive `type`, D-15)
- `static/js/app.js:27-78` — `openMaterialModal()` modal (à adapter pour masquer planchers si VRAC, D-18)
- `static/js/app.js:133+` — `refreshMaterialBadge()` + `formatCondensedMaterial()` (D-21 déclenchement)
- `static/js/app.js` — `buildPdf()` (section PDF, à étendre avec D-11, D-12)
- `static/js/app.js` — `sendEmail()` + `buildMaterialSummaryHtml()` + `buildUldMaterialHtml()` (D-14 miroir PDF)
- `static/css/style.css` — `.uld-header`, `.uld-block`, `.material-recap`, média query ≤ 768px
- `tests/tests.html` — pattern des suites `Materiel ULD` et `Retro-compatibilite` (Phase 1) à suivre

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`esc(str)` (app.js:16-19)** — anti-XSS déjà en place pour innerHTML. Applicable au `type` par défense en profondeur.
- **Pattern data-attributes sur `.uld-block`** (établi Phase 1) — à étendre avec `data-uld-type`, cohérent.
- **Pattern lecture défensive `loadManifest()`** (app.js:497-507) — `parseInt(x) || 0`, `String(x || '')` — à appliquer : `uldData.type || 'PMC'`.
- **Pattern conditionnel d'affichage dans `buildPdf()`** (ex: `if (hasAnyMat)`, `if (uldMatRows.length > 0)`) — à réutiliser pour `if (hasAnyVrac)` → scission palettes/vrac en page 1.
- **Pattern `buildMaterialSummary()`** — agrégation cross-ULD avec filtre — à étendre pour séparer totaux palettes vs totaux vrac, et pour exclure planchers des VRAC (D-20).
- **Pattern `refreshMaterialBadge()` et `formatCondensedMaterial()`** (Phase 1) — à adapter pour refléter le conditional flooring quand VRAC (exclure planchers de la chaîne condensée si type=VRAC).

### Established Patterns
- **DOM source de vérité** : `collectData()` lit directement le DOM à la volée (inputs, selects, data-attributes). Pas de state JS mémoire séparé. Étendre ce pattern pour `type` en lisant le `<select>`.
- **Duplication DOM entre `addUld()` (~line 321) et `loadManifest()` (~line 547)** : les deux construisent le même HTML d'un bloc ULD. **Les deux doivent être modifiés** pour ajouter le `<select>` de type. Identique à Phase 1 — ne pas refactorer maintenant.
- **Pattern event inline** : `onchange="updateRecap()"` sur les inputs. Le nouveau `<select>` de type aura `onchange="changeUldType(this, i)"` (ou nom similaire) déclenchant updateRecap + refreshMaterialBadge + toggle affichage planchers dans modal.
- **Mobile ≤ 768px** : seul breakpoint. Le `<select>` doit rester utilisable au doigt (height et font suffisants).

### Integration Points
- **`addUld()` (app.js:~290-338)** : insérer `<select class="uld-type">` AVANT `<input class="uld-number">` dans `.uld-header`. Pré-sélectionner `PMC`.
- **`loadManifest()` (app.js:~519-555)** : même insertion HTML + pré-sélectionner `uldData.type || 'PMC'` dans le select.
- **`collectData()` (app.js:~410-460)** : ajouter `type: block.querySelector('.uld-type').value` dans l'objet ULD construit.
- **`updateRecap()` (app.js:~373-395)** : parser les `.uld-type` de chaque bloc, compter les VRAC, aggréger poids+colis VRAC, construire la chaîne `dont Vrac : N (X colis, Y kg)` conditionnelle.
- **`openMaterialModal(uldIndex)`** : lire le type de l'ULD, si VRAC → masquer les `<label>Planchers EU</label>` et `<label>Planchers Std</label>` (display:none ou class `.hidden`). Pattern à établir par le planner.
- **`buildPdf()`** : ajouter colonne Type dans l'entête de chaque page ULD (D-11) + logic conditional dans le récap page 1 pour scission palettes/vrac (D-12). Adapter `buildMaterialSummary()` pour exclure flooring des VRAC (D-20).
- **`sendEmail()` / helpers HTML** : miroir exact du PDF (D-14).
- **`tests/tests.html`** : ajouter suite "Type ULD" couvrant : type par défaut à PMC, loadManifest rétro-compat type absent → PMC, changement de type → updateRecap + refreshMaterialBadge déclenchés, modal masque planchers si VRAC, PDF affiche colonne Type, email HTML miroir, totaux page 1 scindés quand VRAC présent.

</code_context>

<specifics>
## Specific Ideas

- **Liste des types figée** : `['PMC', 'AKE', 'AKN', 'PAG', 'VRAC']` — dans le code comme constante ou array const, pour faciliter l'ajout futur d'un 6ème type sans refactor massif.
- **`type === 'VRAC'`** est la seule condition utilisée pour : exclusion du compteur palette, ligne "dont Vrac", masquage planchers modal, exclusion planchers PDF/email. Les 4 autres types (PMC/AKE/AKN/PAG) ont un comportement strictement identique dans toute la logique. Ceci simplifie les tests (juste un couple de cas : VRAC vs non-VRAC, pas 5 cas).
- **`refreshMaterialBadge` doit être re-déclenché au changement de type** (D-21) : si PMC → VRAC, le récap inline matériel doit exclure les planchers. Cela nécessite que `formatCondensedMaterial(block)` lise aussi le `data-uld-type` (ou le `<select>`) pour décider d'inclure ou non les planchers dans la chaîne.
- **Suites de tests minimales dans tests.html** (planner peut ajouter plus) :
  1. `Type ULD - addUld cree select avec PMC par defaut`
  2. `Type ULD - loadManifest retro-compat (pas de type → PMC)`
  3. `Type ULD - collectData inclut type`
  4. `Type ULD - updateRecap compte VRAC separement`
  5. `Type ULD - Modal masque planchers si VRAC`
  6. `Type ULD - Modal affiche planchers si PMC/AKE/AKN/PAG`
  7. `Type ULD - buildPdf colonne Type presente`
  8. `Type ULD - buildPdf page 1 scinde palettes/vrac quand VRAC`
  9. `Type ULD - buildPdf/email exclut planchers de VRAC (D-20)`
  10. `Type ULD - XSS sur type (defense en profondeur, meme si contraint)`
- **Défense en profondeur XSS** : même si le type vient d'un `<select>` contraint, appliquer `esc()` dans toutes les injections innerHTML (PDF concat, email HTML concat). Leçon MAT-11 Phase 1 : anticiper les vecteurs même improbables.

</specifics>

<deferred>
## Deferred Ideas

- **Inférence automatique du type depuis le préfixe du numéro ULD** (`PMC12345` → PMC, `AKE98765` → AKE) — rejetée comme fragile (numéros libres en prod). À revisiter si retours terrain montrent que les numéros suivent une convention stable.
- **Couleur distinctive du `<option>` VRAC dans le select** pour repérage rapide — à la discrétion du planner, mentionné ici comme idée d'UX légère.
- **Types additionnels (LD-6, AMA, AMF, etc.)** — liste courte volontaire (PMC/AKE/AKN/PAG/VRAC). Extension ultérieure possible si ATH utilise d'autres types régulièrement.
- **Mode "conteneur" formel** (grouper PMC+PAG = palettes vs AKE+AKN = conteneurs) avec 3 lignes récap distinctes — volontairement écarté pour ne pas dépasser la demande ROADMAP. À revoir si l'agent ATH réclame explicitement cette granularité.
- **Validation backend/serveur du type** (Azure Functions) — hors scope, le frontend contraint via `<select>` suffit pour le cas d'usage interne.
- **Refactor DRY de la construction du bloc ULD** (`addUld` / `loadManifest` dupliquent HTML) — reporté depuis Phase 1, toujours reporté : la duplication reste contenue et la Phase 2 n'est pas le bon moment.

</deferred>

---

*Phase: 02-type-uld-vrac*
*Context gathered: 2026-04-23*
