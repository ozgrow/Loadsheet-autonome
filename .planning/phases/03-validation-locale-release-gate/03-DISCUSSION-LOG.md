# Phase 3 : Validation locale & release gate — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 03-validation-locale-release-gate
**Areas discussed:** Couverture tests + bug pré-existant, Release gate (process automatisé vs manuel), Azure Functions locales

---

## Sélection initiale des axes

| Option | Description | Selected |
|--------|-------------|----------|
| Couverture tests + bug pré-existant | Fix `Session sans expiry`, trous de couverture | ✓ |
| Scénario E2E manuel documenté | Étapes exactes, emplacement | ✗ (fusionné dans axe Release gate) |
| Release gate : automatisé vs manuel | Script npm, git hook, CI, simple checklist | ✓ |
| Azure Functions locales | Setup ou skip | ✓ |

---

## Couverture tests + bug pré-existant

### Q1. Fix bug `Session sans expiry => invalide` ?

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, fix inclus | 1 ligne `!!` wrap | ✓ |
| Non, report v2 | Bug non-impactant | |
| Fix + 2-3 tests hardening session | Durcissement NaN/string/null | |

**User's choice:** Fix inclus (recommended minimal). Pas de hardening supplémentaire.

### Q2. Couverture additionnelle ?

| Option | Description | Selected |
|--------|-------------|----------|
| Rien de spécifique | 112 suites suffisent | |
| Suite E2E lifecycle complète | Test intégré happy path | ✓ |
| Tests rétro-compat en masse (20+ manifestes) | Robustesse terrain | |

**User's choice:** Ajouter suite E2E lifecycle.

---

## Release gate (process automatisé vs manuel)

### Q1. Niveau d'automation ?

| Option | Description | Selected |
|--------|-------------|----------|
| Script `npm run verify` | Reproductible, pas de hook | ✓ |
| Git pre-push hook (husky) | Bloque push si tests fail | |
| GitHub Actions CI | Bloque merge PR | |
| Checklist manuel CLAUDE.md only | Zero automation | |

**User's choice:** `npm run verify` (pragmatique).

### Q2. E2E manuel scenario — emplacement ?

| Option | Description | Selected |
|--------|-------------|----------|
| Section "Release checklist" dans CLAUDE.md | Centralisé, vu par Claude Code | ✓ |
| Fichier dédié `docs/RELEASE-CHECKLIST.md` | Plus structuré | |
| Juste dans SUMMARY de Phase 3 | Minimal | |

**User's choice:** Section dans CLAUDE.md.

---

## Azure Functions locales (login + send-email)

### Q1. Test API local ?

| Option | Description | Selected |
|--------|-------------|----------|
| Test frontend uniquement, API testée en prod | Post-deploy email de test | ✓ |
| Documenter setup `azure-functions-core-tools` | Plus complet, plus de setup | |
| Créer stub backend `api/local-dev-server.js` | Divergence potentielle | |

**User's choice:** Frontend only, API en prod.

### Q2. Bypass session DevTools officiellement documenté ?

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, section "Dev local" dans CLAUDE.md | Officialiser le trick | |
| Non, outil dev interne | Éviter risque prod | ✓ |

**User's choice:** Non documenté (trick interne).

---

## Claude's Discretion

- Emplacement exact du fix dans auth.js (ligne précise à toucher)
- Nom helper/refactor éventuel de isSessionValid
- Ordre exact des asserts dans la suite E2E D-05
- Wording exact de la section "Release checklist" dans CLAUDE.md (tant que les 7 étapes y sont)
- Création vs extension de package.json racine

## Deferred Ideas

- Setup Azure Functions locales (overhead)
- Git pre-push hook (husky)
- GitHub Actions CI (nécessite workflow PR)
- Stub backend local (maintenance code supplémentaire)
- Documentation officielle bypass DevTools (risque prod)
- Tests rétro-compat en masse (20+ manifestes)
- Refactor DRY addUld/loadManifest (reporté depuis Phase 1)
