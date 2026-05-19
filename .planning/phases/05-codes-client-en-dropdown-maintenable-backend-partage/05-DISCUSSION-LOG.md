# Phase 5: Codes client en dropdown maintenable (backend partagé) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 05-codes-client-en-dropdown-maintenable-backend-partage
**Areas discussed:** Modèle + affichage

---

## Sélection des gray areas

| Option | Description | Selected |
|--------|-------------|----------|
| Modèle + affichage | Code seul (1DAC-CDW) vs code + libellé (1DAC-CDW — DAC Cargo CDG) ; impact modal, dropdown, PDF, email, récap | ✓ |
| Stratégie remplacement UI | `<select>` pur, hybride input+dropdown (façon Phase 4), ou HTML5 `<datalist>` autocomplete | |
| Rétro-compat manifestes legacy | Comportement quand saved.client est un texte libre legacy ("Foo Bar Inc") qui ne matche aucun code dropdown | |
| Validation + seed initial | Regex stricte ou libre, unicité du code, comment 1DAC-CDW/2SET-CDG arrivent dans le Blob | |

**User's choice:** Modèle + affichage
**Notes:** Les 3 autres gray areas non sélectionnées ont été traitées en `Claude's Discretion` dans CONTEXT.md avec des défauts raisonnables hérités du précédent Phase 4 (`<select>` pur en D-08, option éphémère legacy en D-14, hardcode frontend seed en D-15).

---

## Modèle + affichage

### Question 1 : Structure de données client

| Option | Description | Selected |
|--------|-------------|----------|
| Code seul | `{ id, code: '1DAC-CDW' }`. Simple, modal 1 champ. Inconvénient : pas de libellé lisible pour les agents qui ne reconnaissent pas le code. | ✓ |
| Code + libellé (recommandé) | `{ id, code: '1DAC-CDW', name: 'DAC Cargo CDG' }`. Modal 2 champs. Permet affichage 'code — libellé' dans dropdown/PDF. | |
| Code + libellé + notes | `{ id, code, name, notes }`. Champ notes libre (mémo agent). Plus riche mais 3 champs modal. | |

**User's choice:** Code seul
**Notes:** Schéma minimaliste préféré. Le format des codes existants (1DAC-CDW, 2SET-CDG) est suffisamment évocateur — les agents ATH connaissent leurs clients par code. Le besoin d'un libellé secondaire pourra émerger d'une future phase si l'usage le justifie.

### Question 2 : Validation du code au save

| Option | Description | Selected |
|--------|-------------|----------|
| Libre + unique (recommandé) | Tout string non-vide accepté (lettres/chiffres/tirets). Unicité enforced (refus si code déjà existant). Souple si futur format change. | ✓ |
| Regex stricte + unique | Format imposé ex: `^[0-9A-Z\-]+$` (majuscules, chiffres, tirets seulement) + unicité. Plus propre, mais bloque si futur format différent. | |
| Libre sans unicité | Aucune contrainte, doublons permis. Plus simple, risque doublons accidentels. | |

**User's choice:** Libre + unique
**Notes:** Souplesse privilégiée sur la rigidité. L'unicité enforced (frontend + backend défense-en-profondeur) évite les doublons accidentels sans imposer un format spécifique. Validation case-sensitive (1DAC-CDW ≠ 1dac-cdw — voir question 3).

### Question 3 : Affichage du code

| Option | Description | Selected |
|--------|-------------|----------|
| Code brut partout (recommandé) | '1DAC-CDW' affiché tel quel dans le dropdown, le champ #clientName visible, le PDF, l'email et le récap. Cohérent avec modèle code seul. | ✓ |
| Code en MAJUSCULES forcées | Normaliser '1dac-cdw' → '1DAC-CDW' au save (toUpperCase) et à l'affichage. Plus propre visuellement, garantit unicité case-insensitive. | |

**User's choice:** Code brut partout
**Notes:** Pas de transformation automatique. Le code est stocké et affiché tel que saisi. Si un agent veut saisir en minuscules, c'est respecté. Cohérent avec la philosophie "libre + unique" — pas de magie cachée.

---

## Claude's Discretion

Les 3 gray areas non sélectionnées initialement par l'utilisateur ont été tranchées comme suit en `Claude's Discretion` (décisions documentées dans CONTEXT.md, le planner peut affiner) :

- **Stratégie remplacement UI (D-08)** : `<input type="text">` actuel remplacé par `<select id="clientName">` pur (l'`id` est conservé pour préserver les hooks `app.js`). Première option `<option value="">— Choisir un client —</option>`. Justification : "controlled, maintainable backend" — pas de saisie libre voulue.
- **Rétro-compat manifestes legacy (D-14)** : Quand `loadManifest` trouve un `client` qui ne matche aucune option du dropdown, le frontend injecte une `<option data-legacy="true">{value}</option>` éphémère, sélectionnée par défaut. Aucune modification destructive de l'ancien manifeste.
- **Seed initial 1DAC-CDW / 2SET-CDG (D-15)** : Hardcode frontend dans `clients.js` (constante `INITIAL_CLIENTS`) — si `clientsGetAll()` retourne `[]` au premier accès, le frontend amorce le Blob via un `clientsSaveAll(INITIAL_CLIENTS)`. Plus testable, pas de couplage backend. Alternative auto-seed backend laissée au planner si justifié.

## Deferred Ideas

Tous les déférés listés dans CONTEXT.md `<deferred>`. Notamment :
- Modèle riche `{ code, name, notes, address, contact }`
- Normalisation case (toUpperCase)
- Regex stricte de format
- Migration automatique des manifestes legacy
- Catégories / groupes de clients
- Recherche / filtre dans le dropdown
- ETag / lock optimiste sur le Blob
- Factorisation `lists.js` + `clients.js` en module générique `crud-blob.js`
