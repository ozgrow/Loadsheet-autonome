---
status: partial
phase: 04-listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord
source: [04-VERIFICATION.md]
started: 2026-04-29T00:00:00Z
updated: 2026-04-29T00:00:00Z
---

## Current Test

[awaiting human testing — Release Checklist Phase 4 avant push prod]

## Tests

### 1. UAT local — UI dev local (LISTS_API_MODE = 'localStorage')
expected: `npm run dev` → login → cliquer "≡ Listes" → modal CRUD s'ouvre, créer une liste "Cargolux Paris" avec emails, sauvegarder, dropdown affiche la liste, sélectionner → #recipients pré-rempli, modifier la liste, supprimer (confirm() natif), tester sur écran ≤ 768px.
result: [pending]

### 2. Provision Storage Account + container Azure
expected: Azure Portal → créer Storage Account `loadsheetautonome` (GP v2, LRS, Hot tier, région France/West Europe) → créer container privé `loadsheet-data`. Récupérer la connection string.
result: [pending]

### 3. Configurer STORAGE_CONNECTION_STRING dans Azure SWA
expected: Azure Portal → SWA "nice-smoke-0ca8eb110" → Settings → Environment variables → ajouter `STORAGE_CONNECTION_STRING` avec la connection string du step 2.
result: [pending]

### 4. Switch LISTS_API_MODE = 'remote' avant push prod
expected: Modifier `static/js/lists.js` ligne ~11 : `var LISTS_API_MODE = 'remote';` (au lieu de `'localStorage'`). `npm run verify` → 0 FAIL avant push.
result: [pending]

### 5. Test E2E multi-postes post-deploy (LST-08)
expected: Push master → wait Azure SWA build → ouvrir prod sur PC #1, créer une liste "Test Multi", logout. Ouvrir prod sur PC #2, login, vérifier que la liste "Test Multi" est visible dans le dropdown.
result: [pending]

### 6. Test E2E envoi email avec liste (SMTP réel)
expected: Sur prod, créer un manifeste minimal, sélectionner une liste de distribution dans le dropdown, vérifier #recipients pré-rempli, cliquer "Envoyer par email" → email reçu avec les bons destinataires.
result: [pending]

### 7. Test visual mobile ≤ 768px sur smartphone réel
expected: Ouvrir prod sur smartphone, login, ouvrir le modal "Listes", vérifier full-screen + table lisible + boutons accessibles + dropdown utilisable.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
