---
status: partial
phase: 01-mat-riel-uld-r-tro-compat
source: [01-VERIFICATION.md]
started: 2026-04-28T12:00:00Z
updated: 2026-04-28T12:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. MAT-14 visuel — auto-open du modal sur 1ère ULD
expected: Login + nouveau manifeste → le modal matériel s'ouvre automatiquement pour la 1ère ULD sans clic
result: [pending]

### 2. MAT-12 visuel — case "Rien à facturer" desktop + mobile
expected: Modal matériel : la zone ambrée contenant la checkbox "Rien à facturer pour cette ULD" est visible AU-DESSUS du grid des champs. Cocher → tous les autres champs grisés. Décocher → réactivés.
result: [pending]

### 3. MAT-13 visuel — alert FR sur addUld bloqué
expected: ULD #1 vide, cliquer "+ Ajouter une ULD" → alert browser `ULD N°1 : matériel non saisi. Cochez "Rien à facturer" ou remplissez au moins un champ avant d'ajouter une nouvelle ULD.` + réouverture du modal #1
result: [pending]

### 4. MAT-13 visuel — alert FR sur generatePdf et sendEmail bloqués
expected: ULD #1 strapsCount=2 + ULD #2 vide → "Générer le PDF" alert `Matériel non saisi pour : ULD N°2. ...` + PDF non généré. "Envoyer par email" même alert + fetch /api/send-email NON déclenché (Network tab).
result: [pending]

### 5. MAT-12 + MAT-10 visuel — round-trip noMaterialToBill
expected: Sauvegarder un manifeste avec ULD #1 noMaterialToBill=true + ULD #2 strapsCount=5. "Nouveau" puis recharger : récap inline ULD#1 = "Rien à facturer" (style ambre), ULD#2 = "Sangles: 5". Modal NE s'ouvre PAS lors du rechargement (MAT-14 par construction).
result: [pending]

### 6. RECAP-03 étendu — récap inline desktop + mobile
expected: Récap inline condensé sous chaque header ULD lisible desktop ET mobile (≤768px). Pas d'overflow horizontal du bloc ULD. Wrap naturel ou word-break au pipe.
result: [pending]

### 7. Pas de régression PDF — Phase 01-02 + Phase 02
expected: PDF généré contient toujours la section "Totaux matériel" page 1 + section "Materiel" par ULD avec valeurs condensées (D-15, D-16). VRAC reste exclu du compteur palette (Phase 2).
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
