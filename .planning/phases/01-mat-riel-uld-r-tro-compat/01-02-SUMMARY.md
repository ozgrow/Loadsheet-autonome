---
phase: 01-mat-riel-uld-r-tro-compat
plan: 02
subsystem: Material rendering in PDF and email HTML (mirror output)
tags: [feat, material-uld, pdf, email, xss, retro-compat]
dependency_graph:
  requires:
    - "Plan 01-01 data model: 10 material fields per ULD in data.ulds[i] (strapsCount, flooringEuCount/Forfait, flooringStdCount/Forfait, blocksCount, tarpsCount, dividersCount, honeycombCount, uldComment)"
    - "Plan 01-01 retro-compat guarantee: old manifests without material fields read as zero/empty (D-10)"
  provides:
    - "PDF page 1: Totaux materiel aggregated autoTable (omit zeros)"
    - "PDF per-ULD detail page: Materiel section (omit zeros, 'forfait' literal for D-16)"
    - "Email HTML mirror: Totaux materiel block + per-ULD Materiel block, same rendering rules"
    - "Anti-XSS guarantee: uldComment passes through esc() in email HTML (MAT-11, D-18)"
    - "5 reusable helpers in app.js: buildMaterialSummary, formatFlooringDisplay, buildUldMaterialRows, buildMaterialSummaryHtml, buildUldMaterialHtml"
  affects:
    - "static/js/app.js buildPdf (2 insertion points: page 1 post-recap, per-ULD post-detail)"
    - "static/js/app.js sendEmail (2 insertion points: post-recap table, inside forEach ULD post-detail table)"
    - "tests/tests.html (12 new suites, ~51 new assertions)"
    - "tests/tests.html minimal DOM: added #sendEmailBtn (required by sendEmail code path)"
    - ".gitignore: added entries for local Node+JSDOM test harness"
tech-stack:
  added: []
  patterns:
    - "Helpers return shared [label, value] rows used by BOTH PDF autoTable AND HTML table (DRY)"
    - "Retro-compat via defensive reads (parseInt || 0, === true, String(x || ''))"
    - "Anti-XSS by construction: esc() on EVERY value injected into HTML strings (not just uldComment)"
    - "Conditional rendering: zero totals and empty sections produce empty output (no stray headers)"
    - "PDF labels de-accented at render time (map 'Bâches' -> 'Baches') because jsPDF default font handles ASCII reliably"
key-files:
  created: []
  modified:
    - path: "static/js/app.js"
      change: "+3 helpers before buildPdf (buildMaterialSummary, formatFlooringDisplay, buildUldMaterialRows); +2 helpers for email (buildMaterialSummaryHtml, buildUldMaterialHtml); +Totaux materiel autoTable in buildPdf page 1 (conditional on hasAnyMat); +Materiel autoTable in buildPdf per-ULD loop; +2 append calls in sendEmail (summary after recap, per-ULD after detail table)"
    - path: "tests/tests.html"
      change: "+jspdf + jspdf-autotable CDN script tags (needed for buildPdf tests); +#sendEmailBtn stub in test DOM; +12 new suites covering helpers, retro-compat, zero-omission, forfait literal, buildPdf smoke, HTML rendering, XSS escape, sendEmail fetch-spy wiring"
    - path: ".gitignore"
      change: "+tests/run-harness.cjs, tests/debug-buildpdf.cjs, package.json, package-lock.json (local Node+JSDOM test harness, dev-only)"
decisions:
  - summary: "Shared [label, value] rows between PDF and HTML (single buildUldMaterialRows used by both)"
    rationale: "DRY. Zero-omission and forfait rules stay identical across canals. Only the rendering (autoTable vs HTML table) differs."
  - summary: "Conditional section output (empty string when no material)"
    rationale: "Avoids stray empty 'Totaux materiel' / 'Materiel' headers in PDFs and emails for manifests without material data. Critical for retro-compat."
  - summary: "PDF labels mapped to ASCII-safe variants at render time (Bâches -> Baches)"
    rationale: "jsPDF default helvetica font has unreliable glyph support for some accented chars. Matches existing buildPdf style (Recapitulatif, ULD, etc. already ASCII-safe). HTML email retains full UTF-8."
  - summary: "Install jsPDF 2.5.1 + jspdf-autotable 3.8.2 CDN in tests.html (same versions as index.html)"
    rationale: "Required so buildPdf smoke tests can run without mock setup. Version-pinned to production to catch real integration issues. Rule 3 auto-fix."
  - summary: "Added #sendEmailBtn to minimal test DOM"
    rationale: "sendEmail code path reads document.getElementById('sendEmailBtn').disabled — needed for the fetch-spy test that proves htmlBody contains escaped uldComment. No production impact (real DOM already has it)."
  - summary: "esc() applied to BOTH r[0] (label) AND r[1] (value) in HTML helpers"
    rationale: "Defense in depth (D-18). r[0] is always a static label but the consistent pattern removes accidental-unescape risk during future refactors. r[1] CAN contain uldComment user input."
metrics:
  duration_seconds: 792
  duration_human: "~13 min"
  completed: "2026-04-23"
  tasks_completed: 2
  tests_added: 51
  files_modified: 3
---

# Phase 01 Plan 02: Material rendering in PDF and email HTML Summary

Rendu visuel des 10 champs matériel ULD (saisis en Plan 01-01) dans le PDF (page 1 récap "Totaux matériel" + section "Matériel" par page ULD, avec "forfait" affiché littéralement pour les planchers bois) et dans l'email HTML (miroir exact du PDF) via 5 helpers partagés, avec rétro-compatibilité totale des manifestes sans matériel et échappement XSS systématique du commentaire utilisateur (`uldComment`) via `esc()` — couvert par 12 suites de tests (~51 assertions), aucune régression sur les 296 tests pré-existants.

## What Shipped

### 1. Three PDF helpers (shared with email)

All placed before `function buildPdf(data)` in `static/js/app.js`.

#### `buildMaterialSummary(ulds)` — aggregate totals across ULDs

```js
function buildMaterialSummary(ulds) { /* ... */ return {
  straps: number,
  flooringEu: { count: number, forfaits: number },
  flooringStd: { count: number, forfaits: number },
  blocks: number, tarps: number, dividers: number, honeycomb: number
}; }
```

- Defensive: `(ulds || []).forEach` — handles null/undefined/empty
- Per-ULD defensive: skips null entries, each field `parseInt(x) || 0` / `x === true`
- Forfait counting: if `flooringEuForfait === true`, increments `forfaits`; otherwise adds count (MUTUALLY EXCLUSIVE — D-07 strict already enforced at save, this is defensive read)

#### `formatFlooringDisplay(entry)` — string render for flooring totals

| Input `{count, forfaits}` | Output |
|--|--|
| `{0, 0}` | `'—'` (em dash) |
| `{5, 0}` | `'5'` |
| `{0, 1}` | `'1 forfait'` |
| `{0, 3}` | `'3 forfaits'` |
| `{12, 2}` | `'12 + 2 forfaits'` |

#### `buildUldMaterialRows(u)` — per-ULD rows, shared by PDF + HTML

Returns `[[label, value], ...]` for a single ULD, omitting zeros (D-15 preference). Rules:
- `strapsCount > 0` → `['Sangles', '3']`
- `flooringEuForfait === true` → `['Planchers bois EU', 'forfait']` (D-16 literal)
- Else `flooringEuCount > 0` → `['Planchers bois EU', '5']`
- Same for `flooringStd`
- `blocksCount/tarpsCount/dividersCount/honeycombCount > 0` → labeled row
- `uldComment.length > 0` → `['Commentaire ULD', <text>]`
- Null/undefined ULD → `[]` (safe, retro-compat)

### 2. Two HTML helpers (email mirror)

Placed after `buildUldMaterialRows` in `app.js`.

#### `buildMaterialSummaryHtml(ulds)` — totals HTML
Returns `''` if no non-zero total. Otherwise emits `<h4>Totaux matériel</h4>` + 2-column `<table>` with label cells bold on light-blue background.

#### `buildUldMaterialHtml(u)` — per-ULD section HTML
Returns `''` if `buildUldMaterialRows(u)` is empty. Otherwise emits `<h4>Matériel</h4>` + 2-column `<table>`.

**Security (D-18):** Both helpers apply `esc()` to BOTH `r[0]` (label) AND `r[1]` (value). `r[1]` can contain user-supplied `uldComment`. Defense in depth: esc'ing the label is redundant today but removes accidental-unescape risk during future refactors.

### 3. buildPdf insertion points

**Page 1 — between recap autoTable and `drawFooter(1)`:**
```
[existing autoTable summary]
[NEW] if (hasAnyMat): bold "Totaux materiel" heading + autoTable (2 cols, label bold on #F0F4F8 cellWidth 60)
drawFooter(1);
```

**Per-ULD — between detail autoTable and `drawFooter(idx + 2)`:**
```
[existing detail autoTable]
[NEW] if (uldMatRows.length > 0): bold "Materiel" heading + autoTable (2 cols, label bold on #F0F4F8 cellWidth 50)
drawFooter(idx + 2);
```

**Font handling:** PDF labels mapped to ASCII-safe variants (`Bâches` → `Baches`, section title "Totaux materiel"/"Materiel" without accent) because jsPDF's default helvetica font has unreliable glyph support for accents. The existing buildPdf already used `'Recapitulatif Manifeste'`, `'LTA concernes'`, etc. — this change stays consistent with that convention. Email HTML retains full UTF-8 (`Totaux matériel`, `Matériel`).

### 4. sendEmail insertion points

Two single-line appends inserted into the existing `html += '...'` chain:

**After main recap table (`html += '</table>';` line):**
```js
html += buildMaterialSummaryHtml(data.ulds);
```

**Inside per-ULD forEach, after the detail table `html += '</table>';`:**
```js
html += buildUldMaterialHtml(u);
```

**Network flow untouched:** subject, validation regex, CRLF strip, fetch /api/send-email, JWT header, pdfBase64 — all identical. Only the `htmlBody` string gets two extra conditional appends.

### 5. Anti-XSS (MAT-11, D-18, D-19)

**Attack surface:** `uldComment` is the only user-writable free-text material field reaching the HTML email.

**Defense:**
- `buildUldMaterialHtml` passes `uldComment` (as `r[1]`) through `esc()` before injecting into `html +=`.
- `buildMaterialSummaryHtml` also esc's all values defensively (no user data expected in totals, but esc is free and consistent).
- PDF path does NOT need esc: jsPDF `doc.text()` and `autoTable` bodies render text as glyphs, not parsed HTML — safe by the library's design.

**Test coverage:**
- Payload `<script>window._xss++</script><img src=x onerror="window._xss++">` → produced HTML contains `&lt;script&gt;` and `&lt;img` (entities), no literal `<script>` or `<img src`.
- DOM injection: `testDiv.innerHTML = html; document.body.appendChild(testDiv); assertEqual(window._xss, before)` — proves no execution.
- End-to-end via fetch-spy: `sendEmail()` invoked with XSS payload in data-attr → captured fetch body `htmlBody` contains `&lt;script&gt;` not `<script>alert`.

### 6. Retro-compatibility

- Manifeste ancien format (no material fields) → `buildMaterialSummary` returns all zeros → `hasAnyMat === false` → no "Totaux matériel" in PDF, no HTML block in email.
- Per-ULD without material → `buildUldMaterialRows(u)` returns `[]` → no "Matériel" autoTable in PDF, no HTML section in email.
- `buildPdf(legacyData)` still produces 2 pages (1 recap + 1 ULD) — verified by test.
- All 60 tests from Plan 01-01 still pass.

## Public API Reference

```js
// New public helpers (Plan 01-02)
function buildMaterialSummary(ulds)          // Returns aggregate totals object
function formatFlooringDisplay(entry)         // Returns string like '12 + 2 forfaits' or '—'
function buildUldMaterialRows(u)              // Returns [[label, value], ...] — shared PDF/HTML
function buildMaterialSummaryHtml(ulds)       // Returns HTML string ('' if no material)
function buildUldMaterialHtml(u)              // Returns HTML string ('' if no material)

// Existing, extended
function buildPdf(data)                       // Now renders material sections (page 1 + per-ULD)
async function sendEmail()                    // Now appends buildMaterialSummaryHtml + buildUldMaterialHtml to htmlBody
```

## Tests Added (inventory)

All in `tests/tests.html`, placed after suite `Materiel ULD - closeMaterialModal` and before `Storage FIFO max 50`.

### PDF rendering (Task 1)

| Suite | Assertions | Covers |
|-------|-----------|--------|
| Materiel PDF - buildMaterialSummary | 9 | Totals aggregation, forfait counting |
| Materiel PDF - buildMaterialSummary retro-compat sans champs | 9 | Old format + empty + null arrays |
| Materiel PDF - buildUldMaterialRows omet zeros | 8 | Zero/absent fields produce no row |
| Materiel PDF - buildUldMaterialRows forfait litteral | 5 | "forfait" text vs numeric count |
| Materiel PDF - buildUldMaterialRows inclut commentaire | 3 | uldComment row present/absent |
| Materiel PDF - formatFlooringDisplay | 5 | All count/forfait combinations |
| Materiel PDF - buildPdf avec materiel | 3 | No crash, doc generated, 2 pages |
| Materiel PDF - buildPdf manifeste ancien format | 3 | Retro-compat smoke test |

### Email HTML rendering (Task 2)

| Suite | Assertions | Covers |
|-------|-----------|--------|
| Materiel email HTML - summary | 6 | Empty cases, rendering, null-safe |
| Materiel email HTML - ULD section | 7 | Empty, straps only, forfait, zeros omission, retro-compat |
| Materiel email HTML - SECU XSS uldComment | 6 | `<script>` + `<img onerror>` payload escaped + DOM injection proof |
| Materiel email HTML - sendEmail inclut sections materiel | 6 | End-to-end via fetch spy: captured htmlBody contains sections + XSS escape |

**Test harness update:** Added jsPDF 2.5.1 + jspdf-autotable 3.8.2 CDN scripts (same versions as `index.html`) to `tests/tests.html` — required so `buildPdf` tests run in-browser (and in the local Node+JSDOM harness). Also added `#sendEmailBtn` stub to the minimal test DOM (referenced by `sendEmail`).

**Local test execution:** Verified via an ad-hoc Node+JSDOM harness (`tests/run-harness.cjs`, gitignored) running the live `tests/tests.html` against the modified `app.js`. Result: **352/353 tests OK** (1 pre-existing failure `Session sans expiry => invalide` is documented in `.planning/phases/01-mat-riel-uld-r-tro-compat/deferred-items.md` — out of scope).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added jsPDF + autotable CDN to tests.html**
- **Found during:** Task 1, writing buildPdf tests per the plan `<behavior>` specification.
- **Issue:** The plan specified Test 5 calls `buildPdf(dataWith)` directly. Existing `tests/tests.html` does not load jsPDF, so `window.jspdf.jsPDF` is undefined → `buildPdf` crashes on first line (`var jsPDF = window.jspdf.jsPDF`).
- **Fix:** Added two `<script>` tags (same CDN URLs and versions as `index.html`) to `tests/tests.html` before the `app.js` script tag.
- **Files modified:** `tests/tests.html`
- **Commit:** `b5d72a6`

**2. [Rule 3 - Blocking] Added #sendEmailBtn to test DOM**
- **Found during:** Task 2, writing sendEmail fetch-spy test.
- **Issue:** `sendEmail()` reads `document.getElementById('sendEmailBtn').disabled = true`. Test DOM did not include this button → null pointer crash before fetch is even called.
- **Fix:** Added `<button id="sendEmailBtn">Envoyer par email</button>` inside `#testDOM` block in `tests/tests.html`.
- **Files modified:** `tests/tests.html`
- **Commit:** `0af3e33`

**3. [Rule 3 - Blocking] Relaxed test assertion about "onerror=" substring**
- **Found during:** Task 2 test run, after implementation.
- **Issue:** Initial test asserted `html.indexOf('onerror=') < 0` but `esc()` produces `onerror=&quot;..&quot;` — the substring `onerror=` remains. This is semantically safe (the surrounding `<img` is escaped to `&lt;img`, so `onerror=` can't attach to any tag) but the literal string is still present.
- **Fix:** Replaced with more precise assertions: `html.indexOf('<img src') < 0` (no literal img tag) AND `html.indexOf('onerror="') < 0` (quoted attribute form destroyed by esc). Added DOM injection test proves no execution (authoritative).
- **Files modified:** `tests/tests.html`
- **Commit:** `0af3e33`

**4. [Rule 2 - Cosmetic / glyph support] PDF labels mapped to ASCII-safe variants**
- **Found during:** Task 1 implementation review (following existing buildPdf style).
- **Issue:** jsPDF default helvetica font has unreliable support for some accented characters. Existing buildPdf already uses `'Recapitulatif Manifeste'`, `'LTA concernes'`, `'ULD : ...'` — no accents in PDF text.
- **Fix:** Section titles use ASCII: `'Totaux materiel'` (page 1), `'Materiel'` (per-ULD). Label rows mapped at render: `'Bâches'` → `'Baches'`. Other labels with only apostrophes (`Nids d'abeille`) kept as-is (apostrophe renders fine). HTML email retains full UTF-8 (`Totaux matériel`, `Matériel`) — no font constraint there.
- **Rationale:** Consistency with existing PDF style; avoids rendering artifacts ("?" boxes) on older jsPDF versions.
- **Files modified:** `static/js/app.js`
- **Commit:** `b5d72a6`

### None other

All other plan guidance was followed to the letter:
- Task 1: 3 helpers + buildPdf 2 insertion points + tests. Exact function signatures and return shapes match the plan's proposed contract.
- Task 2: 2 additional HTML helpers + sendEmail 2 insertion points + tests. `esc()` applied per D-18.
- TDD cycle: tests written first (RED verified), implementation added (GREEN verified), commits atomic per task.
- Rétro-compat: every new helper and every integration point handles missing fields via `parseInt(x) || 0`, `=== true`, `String(x || '')`.

## Deferred Issues (out of scope)

- Pre-existing test `Session sans expiry => invalide` (auth.js `&&` short-circuit returning `undefined`) — documented in Plan 01-01's SUMMARY and `deferred-items.md`. Fix deferred to Phase 3.
- Node+JSDOM test harness (`tests/run-harness.cjs`, `tests/debug-buildpdf.cjs`) — created ad-hoc for local test verification, gitignored. Could be formalized as a CI script in a future phase but not needed for current workflow (tests are run by opening `tests/tests.html` in a browser at `/tests/tests.html`).

## Manual verification steps

Run `npx serve .` locally, log in with test session, then:

1. **PDF with material** — create new manifest with 2 ULDs: ULD1 sangles=3, planchers EU forfait coché, commentaire "Fragile"; ULD2 sangles=2, planchers EU count=5. Generate PDF:
   - Page 1: "Totaux materiel" table shows "Sangles: 5", "Planchers bois EU: 5 + 1 forfait".
   - Page 2 (ULD1): "Materiel" table shows "Sangles: 3", "Planchers bois EU: forfait", "Commentaire ULD: Fragile".
   - Page 3 (ULD2): "Materiel" table shows "Sangles: 2", "Planchers bois EU: 5".

2. **PDF without material** — create new manifest, don't click "Matériel". Generate PDF:
   - Page 1: No "Totaux materiel" section (just the existing recap table + footer).
   - Per-ULD pages: No "Materiel" section.

3. **PDF ancien format** — load a manifest from before Plan 01-01 (if any in saved list). Generate PDF → no "Matériel" sections, no errors.

4. **Email HTML** — fill recipient + click "Envoyer par email". In Network tab inspect the POST `/api/send-email` body:
   - `htmlBody` contains `Totaux matériel` section mirroring page 1 PDF totals.
   - `htmlBody` contains per-ULD `Matériel` section mirroring PDF detail pages.

5. **Email XSS** — enter `uldComment = <img src=x onerror="window._xss++">` via Matériel modal → save → send email. In Network tab:
   - `htmlBody` contains `&lt;img src=x onerror=&quot;...&quot;&gt;` NOT `<img src=x onerror="...">`.
   - No XSS executes in the test envelope (server-side the HTML is sent as-is to nodemailer).

6. **Tests** — visit `/tests/tests.html`. Expected: **352 / 353 tests OK, 1 ECHEC** (the pre-existing `Session sans expiry => invalide` documented in `deferred-items.md`).

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 — PDF helpers + buildPdf extension + 8 PDF suites | `b5d72a6` | `static/js/app.js`, `tests/tests.html`, `.gitignore` |
| 2 — Email HTML helpers + sendEmail wiring + 4 email suites | `0af3e33` | `static/js/app.js`, `tests/tests.html` |

## Self-Check: PASSED

Verified 2026-04-23:
- FOUND: `static/js/app.js` (modified, 5 new helpers, 2 buildPdf insertions, 2 sendEmail insertions)
- FOUND: `tests/tests.html` (modified, 12 new suites, CDN scripts, #sendEmailBtn stub)
- FOUND: `.gitignore` (modified, harness entries)
- FOUND: `.planning/phases/01-mat-riel-uld-r-tro-compat/01-02-SUMMARY.md`
- FOUND: commit `b5d72a6` (Task 1)
- FOUND: commit `0af3e33` (Task 2)
- Verified via local Node+JSDOM harness: 352/353 tests pass (1 pre-existing failure documented in deferred-items.md)
- Verified automated plan checks:
  - `grep -c "function buildMaterialSummary" static/js/app.js` = 1 (ok, >=1)
  - `grep -c "function buildUldMaterialRows" static/js/app.js` = 1 (ok, >=1)
  - `grep -c "Totaux materiel" static/js/app.js` = 2 (ok, >=1)
  - `grep -cE "suite\('Materiel PDF" tests/tests.html` = 8 (ok, >=4)
  - `grep -c "function buildMaterialSummaryHtml" static/js/app.js` = 1 (ok)
  - `grep -c "function buildUldMaterialHtml" static/js/app.js` = 1 (ok)
  - `grep -nE "buildMaterialSummaryHtml\(data\.ulds\)|buildUldMaterialHtml\(u\)" static/js/app.js` = 2 matches (ok)
  - `grep -cE "esc\(r\[1\]\)" static/js/app.js` = 2 (ok, >=2)
  - `grep -cE "suite\('Materiel email HTML" tests/tests.html` = 4 (ok, >=3)
