# Phase 6: Matériel global (refactor saisie unique) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 06-materiel-global-refactor-saisie-unique
**Mode:** `--auto` (utilisateur a sélectionné "autonomous" via texte libre — toutes zones discutées, options recommandées retenues sans dialogue interactif)
**Areas discussed:** Forme UI saisie globale, Migration loadManifest + rendu PDF/email, VRAC + validation MAT-13/14, Sort des data-attributes ULD + tests

---

## Forme UI saisie globale

| Option | Description | Selected |
|--------|-------------|----------|
| Modal global déclenché par bouton | Réutilise le modal `.material-modal-*` existant, déclenché par un bouton "Matériel" placé entre `#liveRecap` et `#generateSection`. Préserve l'usage du modal. | |
| Section inline statique | Section visible en permanence injectée dans `index.html` entre `#liveRecap` et `<div class="actions">`. Saisie directe, pas de popup. Plus naturel pour un champ unique au manifeste. | ✓ |
| Section pliable (collapsible) | Section avec header pliable "+ Matériel global", collapsée par défaut. Compromis entre visible permanent et caché derrière action. | |

**Choix retenu :** Section inline statique (D-01).
**Notes :** Bouton "Matériel" par-ULD supprimé (D-02). Pas de modal pour la nouvelle section (D-03). Layout grid 2 cols desktop / 1 col mobile, clone des règles `.material-modal-grid` (D-04). Préfixe CSS recommandé `.material-section-*`. Checkbox "Rien à facturer" globale au-dessus du grid, textarea commentaire en full-width sous le grid (D-05).

---

## Migration loadManifest — Politique de fusion

| Option | Description | Selected |
|--------|-------------|----------|
| SOMME stricte tous champs | Additionner tous les counts y compris planchers VRAC. Forfait → OR sur toutes les ULD. uldComment → concaténation simple. noBilling → OR. | |
| Fusion VRAC-aware avec sémantique conservative | Counts → SOMME. Planchers → SOMME hors VRAC (cohérent Phase 2 D-20). Forfait → OR hors VRAC. uldComment → concat préfixé "ULD N°i :". noBilling → AND. | ✓ |
| Migration manuelle (prompt agent au load) | Au load d'un manifeste ancien, alerter l'agent et demander quelle politique appliquer. Plus fidèle mais friction UX. | |

**Choix retenu :** Fusion VRAC-aware avec sémantique conservative (D-12..D-19).
**Notes :** Migration runtime only (en mémoire), pas de réécriture batch destructive (D-19). À la prochaine `saveManifest()` volontaire, le manifeste acquiert `data.material` et perd les anciens champs ULD. Préservation D-20 Phase 2 sur exclusion planchers VRAC. Forfait + count exclusivité préservée (D-16, cohérent D-07 Phase 1 strict). `uldComment` → `manifestComment` avec préfixe "ULD N°i :" + newline (D-17) pour préserver la trace de l'origine. `noMaterialToBill` → AND (D-18) sémantique sûre côté facturation.

---

## Rendu PDF/email

| Option | Description | Selected |
|--------|-------------|----------|
| Garder structure actuelle (totaux page 1 + section par ULD) | Page 1 renommée "Matériel" alimentée par `data.material`. Pages détail ULD gardent une section "Matériel" répétée (même valeur partout, redondance assumée). | |
| Section unique page 1 + suppression sections par-ULD | Page 1 affiche "Matériel" (valeurs `data.material`). Pages détail ULD perdent leur section "Matériel". Email symétrique. Cohérent avec "saisie unique → 1 affichage unique". | ✓ |
| Page dédiée "Matériel manifeste" | Nouvelle page entre récap et détails ULD, avec uniquement le matériel global. Plus visible mais ajoute une page. | |

**Choix retenu :** Section unique page 1 + suppression sections par-ULD (D-20..D-27).
**Notes :** Section page 1 renommée "Matériel" (D-20). `manifestComment` ajouté en ligne du tableau autotable page 1 (D-22). Cas "Rien à facturer" : 1 seule ligne `"Rien à facturer"` (D-23). Email symétrique : section unique en page récap, rien dans le bloc détail par ULD (D-26/D-27). Format `forfait` littéral conservé (D-25).

---

## Récap écran (#liveRecap)

| Option | Description | Selected |
|--------|-------------|----------|
| Garder les badges inline par-ULD | `formatCondensedMaterial` adapté pour montrer "vide" ou "global". Préserve la familiarité visuelle. | |
| Supprimer les badges inline + #liveRecap inchangé | Plus de matériel par-ULD donc plus de badge. `#liveRecap` reste sur "ULD/Colis/Poids/LTA/DGR". L'agent voit le matériel dans la section dédiée juste en dessous. | ✓ |
| Ajouter un mini-récap matériel au #liveRecap | Étendre `#liveRecap` avec "Mat: 5 sangles, 2 planchers EU…". Plus de surface mais redondant avec la section visible. | |

**Choix retenu :** Supprimer les badges inline + `#liveRecap` inchangé (D-29..D-31).
**Notes :** `formatCondensedMaterial` supprimé (D-29). Wrapper `.material-badge-wrapper` retiré du HTML `addUld()` et `loadManifest()` (D-30).

---

## Validation MAT-13 / MAT-14 refonte

| Option | Description | Selected |
|--------|-------------|----------|
| MAT-13 maintenu par-ULD + nouveau MAT-13-global | Garder l'ancienne validation par-ULD ET ajouter une validation globale. Double sécurité mais friction UX. | |
| MAT-13 globalisé + MAT-14 supprimé | MAT-13 devient "bloque generatePdf/sendEmail si aucun champ global". MAT-14 (auto-open modal) disparaît, remplacé par auto-scroll vers section matériel si vide au clic "Générer". Plus de blocage `addUld` ni `showGenerateSection`. | ✓ |
| MAT-13 supprimé entièrement | Aucune validation matériel obligatoire. Plus simple mais perd la garantie facturation. | |

**Choix retenu :** MAT-13 globalisé + MAT-14 supprimé (D-32..D-37).
**Notes :** Helper `manifestHasMaterial()` global (D-32). Blocage uniquement `generatePdf` et `sendEmail` (D-33). MAT-13 retiré de `addUld` (D-34) et `showGenerateSection` (D-35). MAT-14 auto-open remplacé par auto-scroll vers section matériel + focus premier input (D-36). `newManifest` reset section matériel aux defaults (D-37).

---

## VRAC simplification

| Option | Description | Selected |
|--------|-------------|----------|
| Garder masquage planchers conditionnel | Si toutes les ULD sont VRAC, masquer les inputs planchers dans la section globale. Logique conditionnelle UI. | |
| Plus de logique conditionnelle en saisie | Saisie libre des planchers au niveau manifeste. La sémantique VRAC ne survit qu'à la migration (exclusion ULD VRAC dans le calcul). | ✓ |
| Supprimer la sémantique VRAC entièrement | Plus d'exclusion planchers VRAC même à la migration. Plus simple mais perd la cohérence Phase 2. | |

**Choix retenu :** Plus de logique conditionnelle en saisie (D-38..D-41).
**Notes :** La logique Phase 2 D-18 (masquage planchers modal pour VRAC) devient caduque (D-38). La nuance VRAC survit uniquement à la migration loadManifest (D-39, fusion D-14/D-15 exclut ULD VRAC pour planchers count + forfait OR). `formatCondensedMaterial` étant supprimé, la branche VRAC qu'il contenait disparaît avec (D-40). `buildMaterialSummary` devient inutilisé — `Claude's Discretion` sur le cleanup (D-41).

---

## Sort des data-attributes ULD + nouveau modèle JSON

| Option | Description | Selected |
|--------|-------------|----------|
| Garder data-attributes ULD en lecture seule | Préserve les anciens data-* sur `.uld-block` pour faciliter d'éventuels rollback. Plus de dette technique. | |
| Supprimer les data-attributes matériel ULD, nouveau top-level data.material | Plus de data-straps, data-flooring-*, data-blocks, etc. sur `.uld-block` (sauf data-uld-type qui reste). Nouveau `data.material = {...}` au niveau manifeste. Modèle propre. | ✓ |
| Migration immédiate batch tous les manifestes localStorage | Au premier load Phase 6, ré-écrire tous les manifestes existants en local au nouveau format. Plus risqué (modification destructive). | |

**Choix retenu :** Supprimer les data-attributes matériel ULD, nouveau top-level `data.material` (D-09..D-11).
**Notes :** Nouveau schéma JSON top-level `data.material = { strapsCount, flooringEuCount, flooringEuForfait, flooringStdCount, flooringStdForfait, blocksCount, tarpsCount, dividersCount, honeycombCount, manifestComment, noMaterialToBill }` (D-09). Les anciens champs au niveau ULD ne sont plus écrits (D-10). `data-uld-type` reste sur `.uld-block` (Phase 2 D-06 préservée). Migration runtime au load, écriture définitive à la prochaine `saveManifest` (D-11/D-19, cohérent Phase 1 D-11).

---

## Tests anti-régression

| Option | Description | Selected |
|--------|-------------|----------|
| Tout réécrire en suite "Matériel global" | Supprimer la suite MAT-01..14 / RECAP-01..03 et écrire une suite neuve. Plus simple à maintenir mais perd l'historique anti-régression. | |
| Adapter la suite existante + nouvelle suite Migration | Repointer les tests existants sur la nouvelle section globale. Ajouter une nouvelle suite "Matériel global - Migration loadManifest" avec ≥ 5 scénarios. Adapter la suite E2E lifecycle Phase 3. Préserve la valeur historique. | ✓ |
| Garder l'ancienne suite + ajouter la nouvelle | Tests par-ULD restent dans tests.html (mais les fonctions testées ont disparu — tests morts). Anti-pattern. | |

**Choix retenu :** Adapter la suite existante + nouvelle suite Migration (D-44..D-48).
**Notes :** Suite MAT-01..14 adaptée pour pointer sur la section globale (D-44). Suite MAT-14 auto-open supprimée (comportement disparu, D-44). Nouvelle suite "Matériel global - Migration loadManifest" avec 7 scénarios précis a→g (D-45). Suite E2E lifecycle Phase 3 adaptée pour saisie unique (D-46). Test rétro-compat localStorage (D-47). Test E2E "saisie unique" (D-48).

---

## Claude's Discretion

- Nomenclature exacte des IDs/classes CSS de la nouvelle section (recommandation : `.material-section-*`)
- Décision de supprimer ou garder les helpers devenus inutilisés (recommandation : supprimer pour limiter la dette technique)
- Décision de supprimer ou garder le CSS `.material-modal-*` (recommandation : laisser en place sans risque)
- Format précis du tableau "Matériel" page 1 PDF (recommandation : autoTable 2 colonnes Label/Valeur)
- Choix `<input type="number">` vs `<input type="text" inputmode="numeric">` (recommandation : `type="number"` cohérent Phase 1 D-06)
- Position exacte du textarea `manifestComment` dans le grid (recommandation : full-width sous le grid)
- Extraction `migrateLegacyMaterial(data)` en fonction pure pour testabilité (recommandation : oui pour D-45)

## Deferred Ideas

- Modèle riche par-ULD optionnel (global + local)
- Saisie matériel par catégorie ULD (planchers globaux pour palettes seulement)
- Migration batch destructive ré-écriture tous manifestes
- Validation forte du commentaire matériel (longueur, regex)
- Bouton "Reset matériel" explicite
- Indicateur visuel "matériel saisi" près du bouton Générer
- Suppression CSS `.material-modal-*`
- Cleanup helpers dead code (bonus, pas blocker)
- Refactor flow LTA en parallèle (hors scope)
- Indicateur "dirty state" section matériel
