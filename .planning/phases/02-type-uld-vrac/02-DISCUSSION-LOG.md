# Phase 2 : Type ULD VRAC — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 02-type-uld-vrac
**Areas discussed:** Forme du sélecteur de type ULD, Récap écran (#liveRecap), Affichage PDF + email HTML, Rétro-compat + default nouveau ULD

---

## Sélection initiale des axes

| Option | Description | Selected |
|--------|-------------|----------|
| Forme du sélecteur de type ULD | Select multi-types, checkbox binaire VRAC, ou select simple Palette/VRAC | ✓ |
| Récap écran (#liveRecap) | Relabel ULD → Palettes, annotation dont Vrac, ou calcul différentiel | ✓ |
| Affichage PDF + email HTML | Titre, colonne Type, section dédiée, totaux scindés | ✓ |
| Rétro-compat + default nouveau ULD | Default PMC, placeholder choisir, ou inférence par préfixe | ✓ |

**Notes :** Les 4 axes sélectionnés — user veut une discussion complète.

---

## Forme du sélecteur de type ULD

### Q1. Quelle forme doit prendre le sélecteur de type sur chaque ULD ?

| Option | Description | Selected |
|--------|-------------|----------|
| Select binaire Palette / VRAC | 2 valeurs, minimal, colle au ROADMAP | |
| Checkbox 'VRAC' | Juste case cochable, absence = palette implicite | |
| Select extensible (PMC, AKE, AKN, VRAC...) | Plusieurs types officiels, plus riche, risque scope creep | ✓ |

**User's choice:** Select extensible.
**Notes :** Choix d'aller au-delà du minimum ROADMAP pour poser une taxonomie officielle réutilisable.

### Q2. Liste officielle des types ?

| Option | Description | Selected |
|--------|-------------|----------|
| PMC, AKE, VRAC | 3 types courants | |
| PMC, AKE, AKN, PAG, VRAC | 4 conteneurs/palettes + VRAC | ✓ |
| Je dicte la liste en texte libre | — | |

**User's choice:** PMC, AKE, AKN, PAG, VRAC.

### Q3. Lesquels comptent comme "palettes" dans le récap ?

| Option | Description | Selected |
|--------|-------------|----------|
| Tout sauf VRAC = palette | Simple, match critère #2 littéral | ✓ |
| PMC/PAG = palette, AKE/AKN = conteneur (3 lignes) | Plus granulaire mais dépasse ROADMAP | |
| Je décide à l'implémentation | Claude's discretion | |

**User's choice:** Tout sauf VRAC = palette.

### Q4. Type par défaut pour nouveau ULD ?

| Option | Description | Selected |
|--------|-------------|----------|
| PMC | Type le plus courant ATH | ✓ |
| Pas de type (-- Choisir --) | Force sélection explicite | |
| Dernier type choisi (mémo session) | Mémorise le dernier choix | |

**User's choice:** PMC.

### Q5. Placement du sélecteur dans `.uld-header` ?

| Option | Description | Selected |
|--------|-------------|----------|
| Après N° ULD, avant Poids | Ordre identifier → typer → mesurer | |
| Avant N° ULD | Type comme catégorie principale | ✓ |
| 2ème ligne du header | Séparé, plus lisible, plus de place | |

**User's choice:** Avant N° ULD.

---

## Récap écran (#liveRecap)

### Q1. Comment intégrer VRAC dans `#liveRecap` ?

| Option | Description | Selected |
|--------|-------------|----------|
| Remplacer 'ULD : N' par 'Palettes : N' + ajouter 'Vrac : N' | Match littéral critère #2 | |
| Garder 'ULD : N' total + annotation 'dont Vrac : N' | Compteur inchangé, nuance ajoutée | ✓ |
| Ajouter ligne 'Vrac : N' sans toucher au compteur | Préserve l'existant, ne respecte pas critère #2 littéral | |

**User's choice:** Garder 'ULD : N' + 'dont Vrac : N'.
**Notes :** Tension avec lecture littérale du critère #2 du ROADMAP ("compteur de palettes ... exclut VRAC"). Choix produit : le compteur "ULD" est conceptuellement équivalent et plus rétro-compatible visuellement. Décision documentée explicitement dans CONTEXT.md D-09 pour éviter une lacune type RECAP-01 de Phase 1.

### Q2. La ligne Vrac affiche quoi exactement ?

| Option | Description | Selected |
|--------|-------------|----------|
| Compteur + colis + poids VRAC séparés | `Vrac : 1 (12 colis, 240 kg)` | ✓ |
| Seulement le compteur 'Vrac : N' | Plus compact | |
| Scinder aussi Colis et Poids en palettes/vrac | Très détaillé, risque surcharge | |

**User's choice:** Compteur + colis + poids VRAC séparés.

---

## Affichage PDF + email HTML

### Q1. Comment afficher le type d'ULD (notamment VRAC) dans le PDF et l'email HTML ?

| Option | Description | Selected |
|--------|-------------|----------|
| Type dans le titre de la page ULD | `ULD : PMC ABC123` préfixe | |
| Colonne 'Type' séparée dans l'entête | `Type: VRAC \| ULD N°: ABC123 \| Poids: ...` | ✓ |
| Section VRAC dédiée en fin de PDF | VRAC listé séparément | |

**User's choice:** Colonne 'Type' séparée dans l'entête.

### Q2. Page 1 du PDF (totaux généraux) — scinder palettes/vrac ?

| Option | Description | Selected |
|--------|-------------|----------|
| Ligne 'Palettes' + ligne 'Vrac' conditionnelle | Miroir du #liveRecap | ✓ |
| Conserver format ancien + mention 'dont Vrac' | Plus compact | |
| Aucune mention de VRAC page 1 | Distinction seulement sur page ULD | |

**User's choice:** Ligne Palettes + ligne Vrac conditionnelle.

---

## Rétro-compat + default nouveau ULD

### Q1. Ancien manifeste (sans champ type) — type par défaut au chargement ?

| Option | Description | Selected |
|--------|-------------|----------|
| PMC par défaut | Cohérent avec default nouveau ULD | ✓ |
| Pas de type (-- Choisir --) | Force sélection avant génération | |
| Inférer depuis le préfixe du numéro ULD | Parser, risque faux positifs | |

**User's choice:** PMC par défaut.

### Q2. Le type ULD doit-il influencer les champs matériel du modal ?

| Option | Description | Selected |
|--------|-------------|----------|
| Non — matériel uniforme pour tous types (Prior D-09) | Conserve décision Phase 1 | |
| Oui — VRAC n'a pas les champs planchers bois EU/Std | Logique métier (VRAC = non-palletté) | ✓ |
| Oui — VRAC affiche uniquement bâches/commentaire/intercalaires | Réduction plus drastique | |

**User's choice:** VRAC masque planchers bois EU/Std.
**Notes :** Override explicite de D-09 de Phase 1. Documenté dans CONTEXT.md D-18 (planchers masqués dans modal) + D-19 (données persistées si rebascule) + D-20 (exclusion PDF/email).

---

## Claude's Discretion

- CSS du `<select>` type (largeur, police, couleur distinctive VRAC éventuelle)
- Wording exact des labels PDF ("dont Palettes" vs autres variantes)
- Pattern de masquage planchers modal (display:none vs class vs DOM)
- Responsive mobile ≤ 768px du select
- Détail des tests au-delà de la couverture minimale listée dans CONTEXT.md `<specifics>`

## Deferred Ideas

- Inférence type depuis préfixe du numéro ULD (rejeté comme fragile)
- Couleur distinctive de l'option VRAC dans le select
- Types additionnels (LD-6, AMA, AMF...)
- Distinction palette / conteneur (3 lignes récap)
- Validation backend du type (hors scope, frontend contraint suffit)
- Refactor DRY addUld/loadManifest (reporté depuis Phase 1, toujours reporté)
