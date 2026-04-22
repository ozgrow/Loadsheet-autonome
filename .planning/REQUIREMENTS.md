# Requirements: Loadsheet-autonome

**Defined:** 2026-04-22
**Core Value:** La saisie d'un manifeste doit aboutir à un PDF correct envoyé aux bons destinataires, sans perte de données.

## v1 Requirements

### Matériel ULD

- [ ] **MAT-01**: L'utilisateur peut saisir le nombre de sangles dans le modal d'édition ULD
- [ ] **MAT-02**: L'utilisateur peut saisir le nombre de planchers bois europe (ou cocher "forfait négocié" en alternative)
- [ ] **MAT-03**: L'utilisateur peut saisir le nombre de planchers bois standard (ou cocher "forfait négocié" en alternative)
- [ ] **MAT-04**: L'utilisateur peut saisir le nombre de bois de calage
- [ ] **MAT-05**: L'utilisateur peut saisir le nombre de bâches
- [ ] **MAT-06**: L'utilisateur peut saisir le nombre d'intercalaires
- [ ] **MAT-07**: L'utilisateur peut saisir le nombre de nids d'abeille
- [ ] **MAT-08**: L'utilisateur peut saisir un commentaire libre sur l'ULD
- [ ] **MAT-09**: Les champs matériel sont disponibles sur tous les types d'ULD (palettes + conteneurs)
- [ ] **MAT-10**: Les manifestes sauvegardés avant cette évolution se chargent sans erreur (rétro-compat localStorage chiffré)
- [ ] **MAT-11**: Le commentaire libre est échappé via `esc()` partout où il est affiché (anti-XSS)

### VRAC

- [ ] **VRAC-01**: "VRAC" apparaît comme type ULD officiel dans le sélecteur de type
- [ ] **VRAC-02**: Les ULD de type VRAC sont exclues du compteur de palettes du récapitulatif
- [ ] **VRAC-03**: Le récapitulatif affiche une ligne séparée "Vrac" (poids + nombre de colis) quand au moins une ULD VRAC est présente

### Récapitulatif

- [ ] **RECAP-01**: Le récapitulatif écran affiche les infos matériel de chaque ULD (forme condensée)
- [ ] **RECAP-02**: Le PDF généré inclut les infos matériel de chaque ULD
- [ ] **RECAP-03**: Les champs matériel restent utilisables et lisibles sur mobile (≤ 768px)

### Tests & validation

- [ ] **TEST-01**: Les nouvelles fonctionnalités sont couvertes par des tests dans `tests/tests.html`
- [ ] **TEST-02**: Des tests de rétro-compatibilité vérifient que les anciens manifestes (sans champs matériel) se chargent correctement
- [ ] **TEST-03**: L'application entière est testée en local via `npx serve .` avant tout push sur `master`

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
| MAT-01 | Phase 1 | Pending |
| MAT-02 | Phase 1 | Pending |
| MAT-03 | Phase 1 | Pending |
| MAT-04 | Phase 1 | Pending |
| MAT-05 | Phase 1 | Pending |
| MAT-06 | Phase 1 | Pending |
| MAT-07 | Phase 1 | Pending |
| MAT-08 | Phase 1 | Pending |
| MAT-09 | Phase 1 | Pending |
| MAT-10 | Phase 1 | Pending |
| MAT-11 | Phase 1 | Pending |
| VRAC-01 | Phase 2 | Pending |
| VRAC-02 | Phase 2 | Pending |
| VRAC-03 | Phase 2 | Pending |
| RECAP-01 | Phase 1 | Pending |
| RECAP-02 | Phase 1 | Pending |
| RECAP-03 | Phase 1 | Pending |
| TEST-01 | Phase 3 | Pending |
| TEST-02 | Phase 1 | Pending |
| TEST-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20 ✓
- Unmapped: 0

**Distribution:**
- Phase 1 (Matériel ULD & rétro-compat): 15 requirements (MAT-01..11, RECAP-01..03, TEST-02)
- Phase 2 (Type ULD VRAC): 3 requirements (VRAC-01..03)
- Phase 3 (Validation locale & release gate): 2 requirements (TEST-01, TEST-03)

---
*Requirements defined: 2026-04-22*
*Last updated: 2026-04-22 after roadmap creation — traceability filled*
