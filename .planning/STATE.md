---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Plan 06-05 complete (5/6) — ready to execute 06-06 (tests + cleanup)
last_updated: "2026-05-21T00:00:00.000Z"
last_activity: 2026-05-21
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 16
  completed_plans: 15
  percent: 94
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-22)

**Core value:** La saisie d'un manifeste doit aboutir à un PDF correct envoyé aux bons destinataires, sans perte de données.
**Current focus:** Phase 06 — materiel-global-refactor-saisie-unique

## Current Position

Phase: 06 (materiel-global-refactor-saisie-unique) — EXECUTING
Plan: 5 of 6 (3 plans finalisés en parallèle wave 2+3 via UAT intégrée 2026-05-21)
Status: Ready to execute Plan 06-06 (tests + cleanup)
Last activity: 2026-05-21

Progress: [█████████░] 94%

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
| Phase 04 P02 | 330 | 2 tasks | 4 files |
| Phase 05 P01 | 180 | 2 tasks | 5 files |
| Phase 05-codes-client-en-dropdown-maintenable-backend-partage P02 | 1200 | 2 tasks | 5 files |
| Phase 06 P02 | 510 | 2 tasks | 2 files |
| Phase 06 P01 | 2100 | 4 tasks | 3 files |
| Phase 06 P03 | 2280 | 4 tasks | 1 files |
| Phase 06 P04 | 1500 | 3 tasks | 1 files |
| Phase 06 P05 | 1320 | 4 tasks | 1 files |

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
- [Phase 04]: Phase 04 P02: pattern modal CRUD vanilla — copie .material-modal-* avec prefixe distinct .lists-modal-* (isolation comportementale)
- [Phase 04]: Phase 04 P02: anti-XSS strict — _listIds[idx] dans onclick, esc()/_listsEsc() partout en innerHTML, textarea via .value, dropdown via textContent
- [Phase 04]: Phase 04 P02: test E2E LST-15 chaine data isolee (PAS sendEmail() complet) — stub fetch direct vers /api/send-email pour eviter couplage invariants Phase 1/2
- [Phase 04]: Phase 04 P02: _listsEsc() fallback inline si esc() pas charge — module lists.js robuste au load order DOMContentLoaded
- [Phase 05]: Phase 05 P01: clone structurel direct api/recipients + static/js/lists.js (Phase 4 source of truth) — KISS pattern reuse
- [Phase 05]: Phase 05 P01: auto-detect mode par hostname (M-01 polarite safe-default 'localStorage' si window.location.hostname undefined) — coherent post-fix Phase 4 edefa95
- [Phase 05]: Phase 05 P01: D-05 unicite case-sensitive (pas de toLowerCase) — codes ATH peuvent differer en case (ex: '1DAC-CDW' vs '1dac-cdw' = 2 entrees distinctes)
- [Phase 05]: Phase 05 P01: seed hardcode frontend INITIAL_CLIENTS (D-15) auto-applique au DOMContentLoaded — 1DAC-CDW + 2SET-CDG, evite migration DB
- [Phase 05]: Phase 05 P01: [Rule 1 - Bug auto-fix] renomme _localGet/_localPut/_remoteGet/_remotePut -> _clientsLocalGet/Put/_clientsRemoteGet/Put pour eviter collision globale avec lists.js (function declarations hoisted dans harness inlined)
- [Phase 05-codes-client-en-dropdown-maintenable-backend-partage]: Phase 05 P02: <select id='clientName'> remplace <input> (D-08) — id preserve pour hooks app.js 437/657/725 intacts
- [Phase 05-codes-client-en-dropdown-maintenable-backend-partage]: Phase 05 P02: option ephemere data-legacy='true' injectee dans loadManifest si data.client inconnu (CLI-08 / D-14) — modif chirurgicale +15 lignes uniquement
- [Phase 05-codes-client-en-dropdown-maintenable-backend-partage]: Phase 05 P02: anti-XSS triple defense — _clientIds[idx] dans onclick + _clientsEsc partout en innerHTML + textContent sur options dropdown/legacy (D-23/D-24)
- [Phase 05-codes-client-en-dropdown-maintenable-backend-partage]: Phase 05 P02: [Rule 1 - Bug auto-fix] shim setter sur l'instance #clientName dans tests.html (Object.defineProperty + auto-inject option data-legacy si .value=X inconnu) — mirror prod CLI-08, preserve anti-regression Phase 1/2/3/4 sans modifier le code production
- [Phase 06]: Phase 06 P02: migrateLegacyMaterial pure helper isole (no DOM, no side effects) AVANT cablage loadManifest (Plan 03) — testable directement, decouple integration
- [Phase 06]: Phase 06 P02: [Rule 1 - Bug auto-fix] plan code utilisait test()/assertEq() API inexistante — adapte au pattern existant suite()+IIFE+assertEqual(desc,actual,expected), 18 scenarios devenus 34 asserts
- [Phase 06]: Phase 06 P02: D-13 sommes inconditionnelles (incl. VRAC) pour sangles/blocks/tarps/dividers/honeycomb — coherent avec buildMaterialSummary existant (D-20 strict Phase 2)
- [Phase 06]: Phase 06 P01: UI section materiel inline statique entre #liveRecap et .actions (D-01) — section toujours visible, IDs prefixes mat-global-*, handlers cloned scope #material-section depuis Phase 1 modal
- [Phase 06]: Phase 06 P01: resetMaterialSection() helper extracted (D-37) — reutilise par newManifest et futur loadManifest Plan 03 (pattern reset-then-write)
- [Phase 06]: Phase 06 P01: [Rule 3 - doc deviation] Task 3 commit (ff6f585) accidentellement squashe avec Task 1 du Plan 06-02 (commit message annonce 06-02 mais diff inclut handlers Task 3 de 06-01) — contenu fonctionnel correct, documente post-hoc
- [Phase 06]: Phase 06 P01: Task 4 checkpoint approuve user 2026-05-20 en single-ULD only — multi-ULD bloque par garde MAT-13 Phase 1 residuelle, suppression scheduled Plans 06-03 + 06-05 (D-34/D-35/D-36)
- [Phase 06]: Phase 06 P03/04/05: UAT intégrée approuvée 2026-05-21 — 3 plans (06-03 data layer, 06-04 rendu PDF/email, 06-05 validation MAT-13 globale) validés ensemble en single round-trip user verification couvrant round-trip Phase 6, rétro-compat Phase 1 (injection legacy avec sommes D-13/14/15/17/18 vérifiées), MAT-13 globalisé, PDF/email rendering, XSS, no popup vestige
- [Phase 06]: Phase 06 P04/P05: [Rule 3 - doc deviation] Wave 3 parallel-execution squash collision — D-35 cleanup (suppression blocage MAT-13 dans showGenerateSection, scope Plan 06-05 Task 3) commité dans c710ee0 (libellé 06-04 sendEmail refactor) au lieu d'un commit dédié 06-05. File end-state correct, comportement vérifié UAT, déviation purement post-hoc documentaire. Future référence : forcer sync-point explicit entre exécuteurs Wave parallèle.
- [Phase 06]: Phase 06 P03: collectData()/loadManifest()/addUld() refactorés au modèle data.material top-level — pattern reset-then-write dans loadManifest (resetMaterialSection puis écriture loadedMaterial), addUld() signature sans paramètre (MAT-14 supprimé D-36), 14 fonctions Phase 1 désormais orphelines (scheduled cleanup Plan 06-06)
- [Phase 06]: Phase 06 P04: rendu PDF/email symétrique partiel — 'Baches' ASCII en PDF (jsPDF font constraint) / 'Bâches' UTF-8 en email ; manifestComment intégré comme ligne 'Commentaire' avec autoTable overflow:'linebreak' (D-22) + white-space:pre-wrap CSS (D-17 newlines), esc() défense en profondeur sur label ET valeur (D-42)
- [Phase 06]: Phase 06 P05: manifestHasMaterial() helper lit DOM directement (pattern uldHasMaterial), alert générique 'Saisie matériel obligatoire' + scroll smooth vers #material-section + focus #mat-global-straps remplace le re-open auto modal Phase 1 (anti-popup vestige), blocage uniquement à generatePdf/sendEmail (D-35 showGenerateSection libre)

### Roadmap Evolution

- Phase 4 added (2026-04-28): Listes de distribution emails — backend JSON Blob (Azure Blob Storage), dev local d'abord. Cosmos DB free tier disponible mais JSON Blob retenu pour simplicité (10x/jour, ~25 lignes Function vs 60).
- Phase 5 added (2026-05-19): Codes client en dropdown maintenable — calque direct de Phase 04 (api/clients + Blob Storage + modal CRUD), remplace le champ libre #clientName par un dropdown maintenable côté backend. Seed initial 1DAC-CDW et 2SET-CDG.
- Phase 6 added (2026-05-19): Matériel global (refactor saisie unique) — le matériel est déplacé d'une saisie par ULD à une saisie unique totale pour le manifeste, positionnée entre la liste des ULD et le bouton "Générer". Migration auto au loadManifest (fusion ancien matériel par-ULD en total global). Impact PDF + récap + tests rétro-compat.

### Pending Todos

None yet.

### Blockers/Concerns

- App en production : toute régression a un impact opérationnel immédiat sur les agents ATH. Validation locale obligatoire (TEST-03) avant tout push master.
- Rétro-compat localStorage chiffré (MAT-10) : les anciens objets ULD sans champs matériel ne doivent pas casser `loadManifest`.
- XSS commentaire libre (MAT-11) : nouveau vecteur, doit passer par `esc()` partout.

## Session Continuity

Last session: 2026-05-21T00:00:00.000Z
Stopped at: Plan 06-05 complete (5/6) — UAT intégrée 3-plans 06-03/06-04/06-05 approuvée 2026-05-21, ready to execute Plan 06-06 (tests + cleanup)
Resume file: None
