# Requirements: Loadsheet-autonome

**Defined:** 2026-04-22
**Core Value:** La saisie d'un manifeste doit aboutir à un PDF correct envoyé aux bons destinataires, sans perte de données.

## v1 Requirements

### Matériel ULD

- [x] **MAT-01**: L'utilisateur peut saisir le nombre de sangles dans le modal d'édition ULD
- [x] **MAT-02**: L'utilisateur peut saisir le nombre de planchers bois europe (ou cocher "forfait négocié" en alternative)
- [x] **MAT-03**: L'utilisateur peut saisir le nombre de planchers bois standard (ou cocher "forfait négocié" en alternative)
- [x] **MAT-04**: L'utilisateur peut saisir le nombre de bois de calage
- [x] **MAT-05**: L'utilisateur peut saisir le nombre de bâches
- [x] **MAT-06**: L'utilisateur peut saisir le nombre d'intercalaires
- [x] **MAT-07**: L'utilisateur peut saisir le nombre de nids d'abeille
- [x] **MAT-08**: L'utilisateur peut saisir un commentaire libre sur l'ULD
- [x] **MAT-09**: Les champs matériel sont disponibles sur tous les types d'ULD (palettes + conteneurs)
- [x] **MAT-10**: Les manifestes sauvegardés avant cette évolution se chargent sans erreur (rétro-compat localStorage chiffré)
- [x] **MAT-11**: Le commentaire libre est échappé via `esc()` partout où il est affiché (anti-XSS)
- [x] **MAT-12**: Une case à cocher "Rien à facturer" est disponible dans le modal matériel (alternative explicite à la saisie de champs)
- [x] **MAT-13**: La saisie matériel est obligatoire pour chaque ULD avant ajout d'une nouvelle ULD ET avant génération PDF/email — au moins un champ matériel rempli OU la case "Rien à facturer" cochée
- [x] **MAT-14**: Le modal matériel s'ouvre automatiquement à chaque création d'une nouvelle ULD (sauf au rechargement d'un manifeste sauvegardé)

### VRAC

- [x] **VRAC-01**: "VRAC" apparaît comme type ULD officiel dans le sélecteur de type
- [x] **VRAC-02**: Les ULD de type VRAC sont exclues du compteur de palettes du récapitulatif
- [x] **VRAC-03**: Le récapitulatif affiche une ligne séparée "Vrac" (poids + nombre de colis) quand au moins une ULD VRAC est présente

### Récapitulatif

- [x] **RECAP-01**: Le récapitulatif écran affiche les infos matériel de chaque ULD (forme condensée)
- [x] **RECAP-02**: Le PDF généré inclut les infos matériel de chaque ULD
- [x] **RECAP-03**: Les champs matériel restent utilisables et lisibles sur mobile (≤ 768px)

### Tests & validation

- [x] **TEST-01**: Les nouvelles fonctionnalités sont couvertes par des tests dans `tests/tests.html`
- [x] **TEST-02**: Des tests de rétro-compatibilité vérifient que les anciens manifestes (sans champs matériel) se chargent correctement
- [x] **TEST-03**: L'application entière est testée en local via `npx serve .` avant tout push sur `master`

## v2 Requirements

*(Aucun pour ce cycle — scope volontairement resserré sur les 2 features.)*

## Out of Scope

| Feature | Raison |
|---------|--------|
| Champs matériel conditionnels selon le type ULD | Décision projet : uniformes pour tous types, simplicité de modèle |
| Tracking du filet sur les ULD | Toujours présent, pas besoin de le compter |
| Convention de nom "VRAC" dans le nom/ID de l'ULD | Remplacé par un type officiel, plus fiable (pas de faux positifs) |
| Azure Functions Core Tools pour tests locaux | Les features touchent uniquement le frontend — API non modifiée |
| Migration forcée des anciens manifestes vers nouveau format | Rétro-compatibilité suffit, pas besoin d'upgrade destructif |
| Multi-tenant, RBAC, stockage cloud | Hors scope projet (cf. PROJECT.md) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MAT-01 | Phase 1 | Complete |
| MAT-02 | Phase 1 | Complete |
| MAT-03 | Phase 1 | Complete |
| MAT-04 | Phase 1 | Complete |
| MAT-05 | Phase 1 | Complete |
| MAT-06 | Phase 1 | Complete |
| MAT-07 | Phase 1 | Complete |
| MAT-08 | Phase 1 | Complete |
| MAT-09 | Phase 1 | Complete |
| MAT-10 | Phase 1 | Complete |
| MAT-11 | Phase 1 | Complete |
| MAT-12 | Phase 1 | Pending (gap closure 01-03) |
| MAT-13 | Phase 1 | Pending (gap closure 01-03) |
| MAT-14 | Phase 1 | Pending (gap closure 01-03) |
| VRAC-01 | Phase 2 | Complete |
| VRAC-02 | Phase 2 | Complete |
| VRAC-03 | Phase 2 | Complete |
| RECAP-01 | Phase 1 | Complete |
| RECAP-02 | Phase 1 | Complete |
| RECAP-03 | Phase 1 | Complete |
| TEST-01 | Phase 3 | Complete |
| TEST-02 | Phase 1 | Complete |
| TEST-03 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 23 total (20 initial + 3 ajoutés en gap closure Phase 1 — MAT-12/13/14)
- Mapped to phases: 23 ✓
- Unmapped: 0

**Distribution:**
- Phase 1 (Matériel ULD & rétro-compat): 18 requirements (MAT-01..14, RECAP-01..03, TEST-02)
- Phase 2 (Type ULD VRAC): 3 requirements (VRAC-01..03)
- Phase 3 (Validation locale & release gate): 2 requirements (TEST-01, TEST-03)

---
*Requirements defined: 2026-04-22*
*Last updated: 2026-04-28 — added MAT-12/13/14 (gap closure Phase 1, validation matériel obligatoire avant prod)*
