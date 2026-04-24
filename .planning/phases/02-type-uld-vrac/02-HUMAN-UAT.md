---
status: passed
phase: 02-type-uld-vrac
source: [02-VERIFICATION.md]
started: 2026-04-24T10:30:00Z
updated: 2026-04-24T11:00:00Z
---

## Current Test

[all passed]

## Tests

### 1. Visual check of `<select>` ordering and default in a real browser
expected: Chaque nouveau bloc ULD affiche un `<select>` AVANT le champ "N° ULD" contenant exactement 5 options dans l'ordre PMC, AKE, AKN, PAG, VRAC, avec PMC présélectionné. Test sur Chrome + Firefox (prioritaire).
result: passed (validated on `npx serve . -l 4000`, 2026-04-24)

### 2. Mobile layout ≤ 768px
expected: DevTools en mode mobile (iPhone, Pixel) ou device réel. Le `<select class="uld-type">` prend 100% de largeur dans un layout en colonne, reste touchable avec padding suffisant. Le header `.uld-header` reste lisible.
result: passed (validated on `npx serve . -l 4000`, 2026-04-24)

### 3. Real jsPDF rendering — page ULD infoBox + page 1 "Detail par categorie"
expected: Créer 2 ULDs (1 PMC + 1 VRAC), générer le PDF. Vérifier : (a) page ULD VRAC — infoBox 3 lignes : "LTA concernés : ...", "Type : VRAC", "Poids : N kg" ; (b) page 1 sous la table récap, une section "Detail par categorie" avec 2 lignes : "dont Palettes : 1 (X colis, Y kg)" et "dont Vrac : 1 (12 colis, 240 kg)" ; (c) backward-compat : si aucun VRAC, la section "Detail par categorie" doit être absente.
result: passed (validated on `npx serve . -l 4000`, 2026-04-24)

### 4. Real email client rendering of HTML body
expected: Envoyer un email réel (via bouton "Envoyer par email") avec au moins 1 VRAC. Ouvrir dans Outlook / Gmail / Apple Mail. Vérifier : (a) la table "Detail par categorie" s'affiche correctement avec les styles inline (couleur #1a3a5c, padding) ; (b) les suffixes `[VRAC]` et `[PMC]` sont visibles dans les titres de blocs ULD ; (c) pas de problème de rendu CSS sur Outlook en particulier.
result: passed (validated by user, 2026-04-24)

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

None — all human verification items confirmed by user.
