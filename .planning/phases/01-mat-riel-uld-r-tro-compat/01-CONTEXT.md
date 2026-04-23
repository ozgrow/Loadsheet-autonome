# Phase 1: Matériel ULD & rétro-compat - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 livre la saisie d'infos matériel par ULD (sangles, planchers bois EU, planchers bois standard, bois de calage, bâches, intercalaires, nid d'abeille, commentaire libre niveau ULD), leur persistance dans le localStorage chiffré avec rétro-compatibilité totale des manifestes existants, et leur affichage dans le récapitulatif écran, le PDF généré et l'email HTML.

Le type ULD "VRAC" et son exclusion du compteur palette sont **hors scope** — ils appartiennent à Phase 2. L'écriture des tests anti-régression complets et la validation locale end-to-end sont **hors scope** — elles appartiennent à Phase 3. Seul TEST-02 (tests de rétro-compatibilité localStorage) est inclus ici.

</domain>

<decisions>
## Implementation Decisions

### UI de saisie des champs matériel
- **D-01:** Bouton "Matériel" sur chaque bloc ULD (dans `.uld-header`) → ouvre un **modal dialog** contenant les 8 champs matériel + commentaire ULD. Un modal dialog n'existe pas aujourd'hui dans le projet, il doit être construit (JS vanilla, CSS pur, sans librairie).
- **D-02:** Le bloc ULD reste compact (header inchangé visuellement) avec un **indicateur "renseigné"** discret (badge texte court, ex: `• matériel renseigné` ou compteur `5 champs`) sous le header quand au moins un champ matériel a une valeur non vide. Design exact à la discrétion du planner/implémenteur.
- **D-03:** Le commentaire libre MAT-08 est **au niveau ULD** (stocké avec les champs matériel), distinct et complémentaire du `.comment-input` existant au niveau ligne LTA. Les deux coexistent et ne se remplacent pas.
- **D-04:** Modal **full-screen ≤ 768px** (prend tout l'écran mobile, bouton "Fermer" en haut). Desktop (≥ 769px) : modal centré avec overlay, largeur fixe (à déterminer par planner/implémenteur, ~500-600px recommandé).
- **D-05:** Layout des champs dans le modal : **grille 2 colonnes sur desktop, 1 colonne sur mobile** (via CSS grid ou flexbox avec media query 768px).

### UX "Forfait négocié" pour les planchers bois
- **D-06:** Pour chaque plancher (EU et Standard) : un champ `input[type="number"]` + une checkbox "Forfait négocié". Quand la case est cochée, le champ nombre est désactivé (`disabled`) et son affichage grisé. Quand décochée, le champ est actif et l'utilisateur saisit un nombre.
- **D-07:** Comportement mutuellement exclusif : cocher "Forfait" efface/ignore le nombre à la sauvegarde ; saisir un nombre force la case à se décocher (ou : sauvegarde conserve les deux mais la logique d'affichage privilégie `forfait=true`). Précision exacte à la charge du planner.

### Structure de données JSON
- **D-08:** Pour chaque ULD dans `ulds[i]`, ajouter les champs matériel au même niveau que `uldNumber`, `weight`, `rows`, `totalColis` :
  ```
  {
    strapsCount: number | 0,           // MAT-01 sangles
    flooringEuCount: number | 0,       // MAT-02 nombre planchers EU
    flooringEuForfait: boolean | false,// MAT-02 forfait EU
    flooringStdCount: number | 0,      // MAT-03 nombre planchers Standard
    flooringStdForfait: boolean | false,// MAT-03 forfait Standard
    blocksCount: number | 0,           // MAT-04 bois de calage
    tarpsCount: number | 0,            // MAT-05 bâches
    dividersCount: number | 0,         // MAT-06 intercalaires
    honeycombCount: number | 0,        // MAT-07 nid d'abeille
    uldComment: string | ''            // MAT-08 commentaire niveau ULD
  }
  ```
  Noms de champs à affiner par le planner (anglais ou français — conserver le style du code existant, qui est mixte). Ce qui compte : 10 clés primitives, pas d'objet imbriqué.
- **D-09:** **Aucun champ `version` ajouté**. La forme ancienne (sans champs matériel) et la forme nouvelle coexistent dans le localStorage chiffré. La différenciation se fait à la lecture par présence/absence des clés.

### Rétro-compatibilité (MAT-10, TEST-02)
- **D-10:** **Lecture défensive seule** : la fonction `loadManifest()` (app.js:316-372) et toute nouvelle fonction de rendu doivent traiter l'absence d'un champ matériel comme valeur par défaut (0 pour les nombres, `false` pour forfait, `''` pour commentaire). Aucune réécriture automatique en localStorage au chargement.
- **D-11:** Les anciens manifestes conservent leur format tant qu'ils ne sont pas ré-enregistrés (via `saveManifest()`). Dès qu'un ancien manifeste est rouvert puis sauvegardé, il acquiert les nouveaux champs (avec valeurs par défaut) — ceci est acceptable et attendu.
- **D-12:** TEST-02 doit inclure au minimum : (a) un test chargeant un objet manifeste ancien format (sans champs matériel) et vérifiant l'absence d'erreur + defaults appliqués, (b) un test de save→load d'un manifeste ancien puis nouveau sans perte de données.

### Affichage récap écran (liveRecap)
- **D-13:** La barre `#liveRecap` reste **inchangée** : ULD / Colis / Poids / LTA (+ DGR). **Aucun détail matériel dans la barre**. Le détail matériel se consulte uniquement en ouvrant le modal de l'ULD concernée.
- **D-14:** Cohérence du récap écran : si le bloc ULD montre déjà un indicateur "matériel renseigné" (D-02), c'est suffisant.

### Affichage PDF
- **D-15:** Deux niveaux d'affichage matériel dans le PDF :
  1. **Page détail de chaque ULD** (existe déjà, une page par ULD dans `buildPdf` app.js:522-567) : ajouter une nouvelle section "Matériel" sous le tableau LTA existant. Format : tableau compact ou paragraphe listant les champs non-nuls (sangles: X, planchers EU: Y ou "forfait", etc.). Champs à zéro peuvent être omis ou montrés à 0 — à la discrétion du planner (préférence : omettre les zéros pour alléger).
  2. **Page 1 récap** (existe déjà, table summary via `autoTable`) : ajouter une **ligne "Totaux matériel"** en bas (ou sous la ligne TOTAL existante), avec les totaux agrégés par type (total sangles toutes ULD confondues, total planchers EU, etc.). Ou alternative : un petit bloc info sous la table. Exacte forme à la charge du planner.
- **D-16:** Pour les planchers bois avec forfait : dans le PDF, afficher littéralement **"forfait"** (au lieu d'un nombre). Les totaux PDF ignorent les "forfait" dans l'agrégation numérique (ou les comptent en ligne séparée : "planchers EU : 12 unités + 2 forfaits").

### Affichage email HTML
- **D-17:** **Miroir du PDF** : même logique que D-15 appliquée au HTML email généré par `sendEmail()` (app.js:590-682). Section matériel par ULD dans le détail HTML, et ligne/bloc totaux matériel dans le récap en haut.
- **D-18:** Toutes les valeurs insérées dans le HTML email doivent passer par `esc()` (anti-XSS, cf. CLAUDE.md). Particulièrement critique pour `uldComment` qui est du texte libre.

### Anti-XSS (MAT-11)
- **D-19:** Le `uldComment` (commentaire libre niveau ULD) doit être échappé via `esc()` partout où il est injecté en `innerHTML` :
  - Dans le modal (si utilisé en `innerHTML` plutôt que `.value` / `.textContent`)
  - Dans le rendu récap PDF (texte injecté via jsPDF `doc.text()` n'est pas vulnérable XSS mais doit rester propre)
  - Dans le HTML email (injection dans `html += ...` existant)
  - Dans l'indicateur "renseigné" s'il montre un extrait du commentaire
- **D-20:** Aucun autre champ matériel n'est un vecteur XSS : tous les autres sont des nombres ou booléens, forcés au bon type à la saisie.

### Claude's Discretion
- Design exact de l'indicateur "renseigné" sur le bloc ULD (couleur, texte, position, icône éventuelle)
- Structure HTML/CSS du modal dialog (overlay, animation d'ouverture, focus trap, gestion Esc)
- Noms exacts des clés JSON (anglais comme proposé en D-08, ou français cohérent avec le reste — le code mixe actuellement les deux)
- Format précis de la section matériel dans le PDF (tableau autotable vs paragraphe texte)
- Gestion du focus clavier dans le modal (accessibilité basique)
- Libellés français exacts des champs dans le modal (ex: "Sangles (nombre)" vs "Nombre de sangles")
- Ordre d'affichage des champs dans le modal

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Vision produit, core value (manifeste → PDF → email sans perte), contraintes prod, décisions projet
- `.planning/REQUIREMENTS.md` — Liste complète des 20 requirements v1 avec traçabilité phase
- `.planning/ROADMAP.md` §Phase 1 — Objectif et critères de succès de cette phase

### Projet-level conventions
- `CLAUDE.md` §Conventions — JS vanilla, CSS desktop-first + media query 768px, PMC renommé ULD partout, Azure SWA single `*` rule
- `CLAUDE.md` §Sécurité — fonction `esc()` obligatoire anti-XSS, AES-256-GCM + PBKDF2 localStorage, CSP
- `CLAUDE.md` §Tests — règle : toute nouvelle feature doit être accompagnée de tests dans `tests/tests.html`

### Code source principal (à lire avant implémentation)
- `static/js/app.js` — Logique complète (app.js:1-682) : esc, encryption, manifest ID, addUld, addRow, updateRecap, collectData, save/load, buildPdf, sendEmail
- `static/css/style.css` — Styles desktop + media query mobile (style.css:119-164)
- `index.html` — Structure SPA, chargement scripts, inline CSS login
- `tests/tests.html` — Fichier tests navigateur, pattern à suivre pour TEST-02

### Notes de contexte
- Pas d'ADR ni spec externe au projet — toutes les décisions sont dans PROJECT.md, REQUIREMENTS.md, ROADMAP.md et ce CONTEXT.md.
- Le projet n'a pas de librairie modal ; le modal dialog sera construit en JS/CSS vanilla.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`esc(str)` (app.js:16-19)** : fonction anti-XSS, déjà utilisée partout. À réutiliser obligatoirement pour `uldComment`.
- **`.uld-block` / `.uld-header` (CSS style.css:53-61)** : bloc ULD existant avec border-left bleu, padding, shadow. Le bouton "Matériel" s'insère dans `.uld-header`.
- **`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm` (CSS style.css:72-82)** : classes boutons réutilisables pour le nouveau bouton "Matériel".
- **Pattern responsive (CSS style.css:119-164)** : media query `@media (max-width: 768px)` comme seul breakpoint ; à réutiliser pour le modal full-screen mobile.
- **`autoTable` (PDF)** : plugin jspdf-autotable déjà chargé via CDN (index.html:30), utilisable pour la section matériel PDF.
- **Pattern save/load (app.js:279-372)** : `getSavedManifests` async, `writeSavedManifests` async, `loadManifest` async. À étendre (lecture défensive des nouveaux champs).

### Established Patterns
- **UI dupliquée entre `addUld()` (app.js:137-159) et `loadManifest()` (app.js:340-364)** : le HTML du bloc ULD est écrit 2 fois (création et rechargement). Les deux doivent être modifiés pour le bouton "Matériel" et l'indicateur "renseigné". Pas de refactor imposé mais c'est un piège à gérer.
- **`collectData()` (app.js:233-264)** est la 3ᵉ source de vérité pour la structure ULD — à étendre pour lire les valeurs du modal stocké.
- **Recherche de valeurs dans les ULD** : via `document.querySelectorAll('.uld-block')` puis `.querySelector('.xxx')`. Pattern à conserver.
- **Communication async avec localStorage chiffré** : `await getSavedManifests()` / `await writeSavedManifests(...)`. Le commentaire libre passe naturellement par ce flux existant sans modification crypto.
- **Stockage du matériel dans le DOM** : décision à prendre par planner — data-attributes (`data-straps="5"`) sur `.uld-block` ou state en mémoire JS ? Le code actuel utilise exclusivement le DOM comme source de vérité.

### Integration Points
- **`index.html`** : aucun changement structurel nécessaire (le modal peut être créé en JS `document.createElement` ou injecté à la fin du `<body>`).
- **CSP actuelle** (`staticwebapp.config.json`) : `script-src 'self' 'unsafe-inline'` → autorise inline handlers et styles. Pas d'ajustement CSP nécessaire.
- **`static/js/app.js:137-159 addUld()`** : ajouter bouton "Matériel" dans `.uld-header`, ajouter ligne indicateur sous le header.
- **`static/js/app.js:233-264 collectData()`** : étendre pour inclure les 10 champs matériel dans chaque objet ULD.
- **`static/js/app.js:316-372 loadManifest()`** : lecture défensive des 10 nouveaux champs + reconstitution du state matériel lisible par le modal.
- **`static/js/app.js:426-570 buildPdf()`** : ajouter section matériel sur chaque page ULD (après ligne 560-565) et ligne totaux matériel dans la table page 1 (après ligne 500-506).
- **`static/js/app.js:590-682 sendEmail()`** : mirroir HTML du PDF, ajouter bloc matériel dans les sections existantes.
- **`tests/tests.html`** : ajouter au minimum TEST-02 (rétro-compat ancien format) dans cette phase.

</code_context>

<specifics>
## Specific Ideas

- **Aucune librairie UI ajoutée** : modal dialog construit from scratch en JS vanilla + CSS pur. Cohérent avec la philosophie projet ("Pas de framework frontend, JS vanilla uniquement" — CLAUDE.md).
- **Indicateur "renseigné"** : préférence pour un élément texte court sous le header ULD, pas une icône isolée (accessibilité). Exemple envisagé : `<span class="uld-material-badge">Matériel saisi</span>` avec style discret (gris + italique).
- **Planchers bois affichés littéralement "forfait"** dans le PDF quand la case est cochée (pas "F" ni chiffre 0) — lisibilité pour le destinataire du manifeste.
- **Valeur 0 = champ non saisi** en écriture. En affichage PDF/email : à la discrétion du planner de montrer 0 ou d'omettre la ligne. Préférence : omettre 0 pour alléger.
- **Full-screen mobile modal** : recouvrement complet de l'écran ≤ 768px avec scroll interne du contenu ; pattern standard, pas de raffinement exotique.

</specifics>

<deferred>
## Deferred Ideas

- **Refactor DRY de la construction du bloc ULD** (`addUld` / `loadManifest` dupliquent le HTML) — tentant mais hors scope Phase 1 : garde les deux et modifie les deux. Capturer comme amélioration future.
- **Présentation d'une page "Bilan matériel" dédiée** dans le PDF (une page avec totaux par type toutes ULD confondues) — discuté puis écarté au profit des totaux en ligne sur la page récap + détail par ULD. À revoir si retour utilisateur ATH.
- **Extraction du commentaire ULD dans l'indicateur "renseigné"** (montrer les 20 premiers caractères) — non retenu, risque UX et anti-XSS déjà complexe. Garder indicateur neutre.
- **Accessibilité avancée du modal** (ARIA, focus trap) — à la discrétion du planner mais pas un blocker Phase 1 puisque usage interne par agents ATH formés.

</deferred>

---

*Phase: 01-mat-riel-uld-r-tro-compat*
*Context gathered: 2026-04-23*
