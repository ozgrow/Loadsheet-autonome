---
phase: quick-260703-n0k
plan: 01
subsystem: auth / session
tags: [session, 401, auth, jwt, data-loss-prevention, xss-safe]
requires:
  - static/js/auth.js (setSession, getJwt, logout, showLogin)
  - static/js/app.js (collectData, getSavedManifests, writeSavedManifests, initApp)
provides:
  - apiFetch (interceptor 401 centralise)
  - handleSessionExpired, saveManifestSilently
  - computeWarningDelay, scheduleExpiryWarning, clearExpiryWarning, showExpiryWarning
  - resetSessionGuard
  - getSessionExpiry (auth.js)
  - logout(message) / showLogin(message) message-aware
affects:
  - static/js/lists.js (_remoteGet / _remotePut routes via apiFetch)
  - static/js/clients.js (_clientsRemoteGet / _clientsRemotePut routes via apiFetch)
  - static/js/app.js (sendEmail route via apiFetch)
tech-stack:
  added: none (JS vanilla, fetch natif — aucune dependance)
  patterns:
    - interceptor fetch centralise via wrapper typeof-guarded (non-regression harness)
    - garde idempotent contre double-trigger 401
    - messages statiques via textContent (anti-XSS natif)
key-files:
  created: []
  modified:
    - static/js/auth.js
    - static/js/app.js
    - static/js/lists.js
    - static/js/clients.js
    - index.html
    - package.json
    - tests/tests.html
decisions:
  - Logique testable (apiFetch, handlers, timer) dans app.js (charge par le harness), auth.js recoit uniquement des ajouts minimes references par typeof guards
  - apiFetch appelle le fetch global (non capture) pour que les stubs window.fetch des tests interceptent
  - Messages login/banniere poses via textContent (jamais innerHTML) — anti-XSS par construction
metrics:
  duration: ~15min
  completed: 2026-07-03
---

# Phase quick-260703-n0k Plan 01: Session expiry 401 redirect Summary

Gestion propre de l'expiration de session JWT (401) sans perte de donnees : intercepteur `apiFetch` centralise qui sauvegarde le manifeste en cours (storage chiffre) PUIS redirige vers le login avec le message clair "Session expiree, reconnectez-vous.", plus une banniere non-bloquante armee ~10 min avant l'expiration.

## What was built

- **auth.js** : `showLogin(message)` et `logout(message)` message-aware (acces DOM guardes par null-checks pour robustesse JSDOM), accesseur defensif `getSessionExpiry()`, `setSession` appelle `resetSessionGuard()` (reconnexion), `logout` nettoie `clearExpiryWarning()`.
- **app.js** : bloc "Session expiry" — `apiFetch` (interceptor 401 idempotent, reset garde sur 2xx), `handleSessionExpired` (await `saveManifestSilently` PUIS `logout(message)`), `saveManifestSilently` (miroir de saveManifest sans alert, sauvegarde si >=1 ULD, FIFO MAX_SAVED), `computeWarningDelay`, `scheduleExpiryWarning`, `clearExpiryWarning`, `showExpiryWarning`. Timer cable a la fin de `initApp()`. Envoi email route via `apiFetch`. Bump `APP_VERSION` 1.9.0 -> 1.10.0.
- **lists.js / clients.js** : `_remoteGet`/`_remotePut` et `_clientsRemoteGet`/`_clientsRemotePut` routent via `(typeof apiFetch === 'function' ? apiFetch : fetch)(...)` — fallback safe si apiFetch pas charge.
- **index.html** : banniere non-bloquante `#sessionWarningBanner` (contenu pose via textContent en JS, aucune injection user).
- **package.json** : version 1.9.0 -> 1.10.0 (miroir APP_VERSION).
- **tests/tests.html** : 4 nouvelles suites (apiFetch 401 -> save+logout+idempotence, computeWarningDelay nominal+invalides, clearExpiryWarning/non-doublon, non-regression getJwt).

## Tasks completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | auth.js messages login + accesseur expiry | 169418a | static/js/auth.js |
| 2 | interceptor 401 + auto-save + timer + wiring + version | 16c654f | static/js/app.js, lists.js, clients.js, index.html, package.json |
| 3 | tests interceptor + delai + non-regression | 44279e6 | tests/tests.html |

## Verification

- `npm run verify` : **570 OK, 0 FAIL** (567/567 tests, incl. 12+ nouveaux asserts SESSION-401).
- Grep : `apiFetch` present dans app.js, lists.js, clients.js ; send-email route via `apiFetch`.
- Aucun `innerHTML` sur les messages login/banniere (textContent uniquement — verifie par le regex de la verify Task 1).
- `APP_VERSION` = "1.10.0" et `package.json` version = "1.10.0".

## Deviations from Plan

None - plan execute exactement comme ecrit. Les 4 rules d'auto-fix n'ont pas ete declenchees ; aucune fonctionnalite critique manquante ; aucun blocage.

## Threat model compliance

- **T-n0k-01 (XSS)** : messages statiques poses via `textContent` (login + banniere), jamais innerHTML — mitige.
- **T-n0k-03 (perte de donnees)** : `await saveManifestSilently()` OBLIGATOIREMENT avant `logout`, garde idempotent `_sessionExpiredHandled` contre double-trigger — mitige et couvert par test.
- Aucune nouvelle dependance npm (T-n0k-SC).

## Manual verification pending (release checklist CLAUDE.md)

Non bloquant pour ce plan, a faire avant push master :
- Simuler un 401 (DevTools : forcer fetch 401) -> verifier que le manifeste en cours est retrouvable dans la liste sauvegardee apres reconnexion et que le login affiche "Session expiree, reconnectez-vous.".

## Self-Check: PASSED

- Fichiers modifies : tous presents (auth.js, app.js, lists.js, clients.js, index.html, package.json, tests.html).
- Commits : 169418a, 16c654f, 44279e6 tous presents dans git log.
