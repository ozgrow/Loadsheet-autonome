---
status: partial
phase: 05-codes-client-en-dropdown-maintenable-backend-partage
source: [05-VERIFICATION.md]
started: 2026-05-19T17:30:00Z
updated: 2026-05-19T17:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Création client → PDF + email réel
expected: Le PDF affiche le code client sélectionné dans le dropdown ; l'email arrive au destinataire avec le bon code en corps + PDF attaché
result: [pending]

### 2. Rétro-compat manifeste legacy
expected: Charger un ancien manifeste avec `data.client` en texte libre inconnu (ex: 'AGENT-ATH-CDG-LEGACY'). Le `<select>` affiche l'option `data-legacy="true"` italique grisée sélectionnée par défaut ; le PDF généré contient encore la valeur legacy
result: [pending]

### 3. Partage cross-PC en prod
expected: Créer un client sur PC A après push master, ouvrir l'app sur PC B (autre navigateur). Le client créé sur PC A est visible immédiatement sur PC B après refresh
result: [pending]

### 4. Modal CRUD sur mobile (≤ 768px)
expected: Ouvrir le modal `≡ Clients` sur un iPhone/Android réel. Modal full-screen, formulaire utilisable, bouton 'Enregistrer' atteignable, le `<select>` dropdown s'ouvre nativement
result: [pending]

### 5. Race au DOMContentLoaded en prod (M-04 / W-3 hérité Phase 4)
expected: Ouvrir l'app fraîche en prod, observer si le seed initial 1DAC-CDW + 2SET-CDG apparaît immédiatement OU si l'agent doit ouvrir le modal pour déclencher le fetch. Soit le seed apparaît tout seul, soit `openClientsModal()` recharge l'état (comportement acceptable selon M-04)
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
