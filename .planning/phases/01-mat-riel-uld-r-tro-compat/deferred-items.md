# Deferred Items - Phase 01

## Pre-existing test bugs (out of scope for Plan 01-01)

### 1. Test "Session sans expiry => invalide" returns undefined instead of false
- **File:** tests/tests.html (suite "SECU - Session auth")
- **Line:** ~912-914
- **Issue:** The test assertion computes `valid = session && session.expiry && session.expiry > Date.now();`. When `session.expiry` is `undefined`, the short-circuit evaluation yields `undefined`, not `false`. `assertEqual('...', valid, false)` then fails because `undefined !== false`.
- **Why deferred:** Pre-exists the material ULD work (confirmed in commit `0bd3b36`). Fix requires wrapping the expression with `Boolean(...)` or `!!`. Not caused by Plan 01-01 changes.
- **Fix suggestion:** `valid = !!(session && session.expiry && session.expiry > Date.now());`
- **Recommended home:** Phase 3 (TEST-01, test hardening)
