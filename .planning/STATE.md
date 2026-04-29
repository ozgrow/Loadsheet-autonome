---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 04-01-PLAN.md
last_updated: "2026-04-29T07:05:32.084Z"
last_activity: 2026-04-29
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 8
  completed_plans: 7
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-22)

**Core value:** La saisie d'un manifeste doit aboutir à un PDF correct envoyé aux bons destinataires, sans perte de données.
**Current focus:** Phase 04 — listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord

## Current Position

Phase: 04 (listes-de-distribution-emails-cosmos-blob-backend-dev-local-d-abord) — EXECUTING
Plan: 2 of 2
Status: Ready to execute
Last activity: 2026-04-29

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01 P01 | 822 | 2 tasks | 3 files |
| Phase 01 P02 | 792 | 2 tasks | 3 files |
| Phase 01 P03 | 262 | 2 tasks | 3 files |
| Phase 02 P01 | 546 | 2 tasks | 3 files |
| Phase 02 P02 | 430 | 2 tasks | 2 files |
| Phase 03 P01 | 508 | 4 tasks | 5 files |
| Phase 01 P03 | 4500 | 5 tasks | 3 files |
| Phase 04 P01 | 289 | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Infos matériel appliquées à tous types d'ULD (pas de logique conditionnelle par type)
- VRAC = type ULD officiel (pas convention de nommage)
- Saisie via modal d'édition ULD existant (réutilisation UX)
- Planchers bois : nombre OU "forfait négocié" (deux modes de facturation réels)
- Tests en local via `npx serve` sans Azure Functions Core Tools (features frontend uniquement)
- [Phase 01]: DOM source of truth via data-attributes on .uld-block (not in-memory state)
- [Phase 01]: Modal materiel built from scratch in JS/CSS vanilla, no library
- [Phase 01]: uldComment injected via textarea.value (never innerHTML) — anti-XSS by construction
- [Phase 01]: Neutral 'Matériel saisi' badge text (no user data in badge)
- [Phase 01]: Forfait coché force count=0 à applyMaterialToUld (D-07 strict exclusivité)
- [Phase 01]: Shared [label, value] rows between PDF and HTML (buildUldMaterialRows used by both)
- [Phase 01]: Material sections are conditional (empty string when no material) - no stray headers in retro-compat output
- [Phase 01]: PDF labels mapped to ASCII-safe at render (Bâches -> Baches) due to jsPDF font glyph support; email HTML keeps full UTF-8
- [Phase 01]: esc() applied to both label and value in HTML helpers (D-18 defense in depth)
- [Phase 01]: D-14 OVERRIDDEN (user-approved per 01-VERIFICATION.md Option A): neutral 'Matériel saisi' badge replaced by inline condensed recap under each ULD header
- [Phase 01]: Material recap format: 'Libellé: valeur' joined by ' | ', labels short for mobile, uldComment truncated to 30 chars + U+2026 ellipsis, esc() on user-supplied comment only
- [Phase 02]: D-18 override Phase 1: planchers hidden modal + excluded recap for VRAC (preserves data-attributes via CSS-only masking)
- [Phase 02]: D-09 Phase 2 nuance: ULD total kept (no relabel to Palettes), conditional annotation 'dont Vrac : N (X colis, Y kg)' added — agent infers palettes = ULD - Vrac (must be documented in VERIFICATION.md)
- [Phase 02]: D-15 3-point defensive validation vs ULD_TYPES (default-on-create, read-from-load, read-from-collect): XSS-safe retro-compat against tampered localStorage
- [Phase 02]: D-06 Live DOM source of truth: <select>.value authoritative in collectData, data-uld-type attribute mirrors for helpers that can't reach the select
- [Phase 02]: D-19 CSS-only conditional masking (.mat-flooring-hidden display:none): preserves DOM + data-attributes across type toggles, no destructive reset
- [Phase 02]: [Phase 02]: Canonical VRAC format 'dont Palettes : N (X colis, Y kg)' / 'dont Vrac : N (X colis, Y kg)' shared across 3 surfaces (#liveRecap, PDF page 1, email HTML) — W-1 revision alignment
- [Phase 02]: [Phase 02]: buildPalettesVracSplit(ulds) dedicated partition helper — returns { hasVrac, palettes, vrac } aggregates, single source for PDF page 1 scission + email HTML mirror (D-12/D-14)
- [Phase 02]: [Phase 02]: D-20 strict applied — only planchers EU/Std excluded for VRAC in totals + per-ULD rows; sangles/bois/baches/intercalaires/nids restent comptes meme sur VRAC (coherent D-18 modal hiding only planchers)
- [Phase 03]: Phase 03: Fix session bug (isLoggedIn strict boolean + test wrap) + 3 durcissement tests (NaN/string/negatif)
- [Phase 03]: Phase 03: Suite E2E smoke test 'manifest complet lifecycle' (26 asserts, happy path complet Phase 1+2)
- [Phase 03]: Phase 03: Release gate process-driven — package.json verify/dev + CLAUDE.md Release checklist 7 etapes, pas de hook git ni CI (D-08, D-11)
- [Phase 03]: Phase 03: Deviation Rule 3 — un-gitignore package.json + tests/run-harness.cjs (release gate artifacts doivent etre committes pour clone frais)
- [Phase 01]: MAT-12 case 'Rien à facturer': checkbox modal + flag noMaterialToBill propagated DOM/JSON/recap/PDF/email + classe CSS .mat-recap-no-billing
- [Phase 01]: MAT-13 saisie matériel obligatoire: helpers uldHasMaterial + findIncompleteUlds (1-based), validation EN TOUT DÉBUT de generatePdf/sendEmail (avant validateRequired/saveManifest pour éviter pollution _alertLog en test)
- [Phase 01]: MAT-14 auto-open modal: addUld(autoOpen=true, skipValidation=false) — autoOpen=true par défaut (UX), skipValidation pour bypass interne tests; loadManifest n'utilise pas addUld donc le modal ne s'ouvre pas au rechargement (par construction)
- [Phase 01]: 8 sites pré-existants tests.html migrés addUld(); addUld(); → addUld(false, true); pour préserver les tests existants tout en activant MAT-13 (BLOCKER #1 du plan)
- [Phase 04]: Phase 04 P01: regex emails dupliquee KISS frontend/backend (D-12) — pas de bundler, pas de module shared
- [Phase 04]: Phase 04 P01: validateLists defense in depth backend (D-14) — rejette PUT si raw.length !== valid.length
- [Phase 04]: Phase 04 P01: LISTS_API_MODE constante source-controlled (D-17) — switch en remote = etape Release Phase 4
- [Phase 04]: Phase 04 P01: 404 BlobNotFound traite explicitement (D-19/LST-12) — premiere lecture jamais en erreur, retourne []
- [Phase 04]: Phase 04 P01: Buffer.byteLength UTF-8 au upload (Pitfall 5) — evite troncature noms accentues Élite/Étoile
- [Phase 04]: Phase 04 P01: _listIds module-scoped expose (anti-XSS) — contract pour plan 04-02 onclick=_listIds[idx]

### Roadmap Evolution

- Phase 4 added (2026-04-28): Listes de distribution emails — backend JSON Blob (Azure Blob Storage), dev local d'abord. Cosmos DB free tier disponible mais JSON Blob retenu pour simplicité (10x/jour, ~25 lignes Function vs 60).

### Pending Todos

None yet.

### Blockers/Concerns

- App en production : toute régression a un impact opérationnel immédiat sur les agents ATH. Validation locale obligatoire (TEST-03) avant tout push master.
- Rétro-compat localStorage chiffré (MAT-10) : les anciens objets ULD sans champs matériel ne doivent pas casser `loadManifest`.
- XSS commentaire libre (MAT-11) : nouveau vecteur, doit passer par `esc()` partout.

## Session Continuity

Last session: 2026-04-29T07:05:19.228Z
Stopped at: Completed 04-01-PLAN.md
Resume file: None
