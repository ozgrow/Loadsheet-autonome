# Milestones

## v1.0 MVP Loadsheet ATH (Shipped: 2026-05-22)

**Delivered:** Outil web de création de loadsheets opérationnel en production pour les agents ATH à Roissy CDG — saisie manifeste avec ULD/matériel, génération PDF, envoi email, listes de distribution partagées, codes client centralisés, et architecture matériel globale (saisie unique manifeste).

**Stats:** 6 phases · 16 plans · 37 tasks · 38 commits feat/fix · 48 jours (2026-04-03 → 2026-05-21) · 94 fichiers · ~28.8k LOC

**Key accomplishments:**

- **Phase 1 — Matériel ULD & rétro-compat** : 9 champs matériel par ULD (sangles, planchers EU/Std + forfaits, bois calage, bâches, intercalaires, nids d'abeille, commentaire), MAT-13 validation, MAT-14 auto-open modal, anti-XSS `esc()` sur tous les innerHTML utilisateur, rétro-compat localStorage chiffré AES-256-GCM
- **Phase 2 — Type ULD VRAC** : type officiel VRAC dans le sélecteur (PMC/AKE/AKN/PAG/VRAC), exclusion compteur palettes, ligne "Vrac" dédiée dans récap/PDF/email avec poids+colis, override modal D-18 (planchers masqués pour VRAC), 21 nouvelles suites de tests
- **Phase 3 — Release gate** : suite E2E smoke test 26 asserts (manifest lifecycle + XSS + PDF + VRAC), `npm run verify` harness Node+JSDOM (494/494 tests OK), checklist 7 étapes dans CLAUDE.md
- **Phase 4 — Listes de distribution emails** : Azure Function `/api/recipients` (GET+PUT JWT) + Blob Storage `recipients-lists.json` + modal CRUD vanilla JS + dropdown `<select>` dans `#generateSection` + mode-switchable dev/prod (62 nouveaux tests)
- **Phase 5 — Codes client dropdown** : remplacement de `<input id="clientName">` par `<select>` + modal CRUD + Azure Function `/api/clients` + Blob `clients.json` partagé + rétro-compat option `data-legacy` éphémère + seed 1DAC-CDW + 2SET-CDG
- **Phase 6 — Matériel global (refactor saisie unique)** : section UI inline `#material-section` entre `#liveRecap` et le bouton Générer, modèle `data.material` top-level (vs per-ULD Phase 1), helper pur `migrateLegacyMaterial` (rétro-compat MAT-10 via fusion D-13..D-18), MAT-13 globalisé via `manifestHasMaterial()`, MAT-14 supprimé par D-36, suppression du couplage matériel↔ULD, 559 tests OK

**Test coverage:** 559 tests OK, 99 suites, 0 FAIL au release gate de v1.0.

**Production URL:** https://nice-smoke-0ca8eb110.6.azurestaticapps.net

---
