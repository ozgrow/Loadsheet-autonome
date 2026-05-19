// ============================================
// CODES CLIENT EN DROPDOWN MAINTENABLE (CLI-01..12) — Phase 5
// ============================================
// Mode auto-detecte par hostname :
//   localhost / 127.0.0.1 -> 'localStorage' (dev sans Azure Functions, harness Node JSDOM)
//   autre hostname        -> 'remote' (prod Azure SWA, fetch /api/clients + JWT)
// Necessite STORAGE_CONNECTION_STRING configuree dans Azure SWA Settings (mode remote, deja Phase 4).
// Container 'loadsheet-data' deja provisionne Phase 4 — le Blob 'clients.json' est cree au premier PUT.
// ============================================

// --- Mode switch (D-18, CLI-03 — auto-detect hostname comme lists.js post-fix edefa95) ---
// M-01 polarite safe-default : hostname present ET != localhost/127.0.0.1 -> 'remote', SINON 'localStorage'
// (default safer si window.location temporairement undefined — pattern Phase 4 fonctionne en JSDOM via harness url 'http://localhost/tests/').
var CLIENTS_API_MODE = (typeof window !== 'undefined' && window.location
  && window.location.hostname
  && window.location.hostname !== 'localhost'
  && window.location.hostname !== '127.0.0.1')
  ? 'remote'
  : 'localStorage';
var CLIENTS_LOCAL_KEY = 'clients-dev';
var CLIENTS_API_URL = '/api/clients';

// --- IDs anti-XSS (pattern repris Phase 4 / _savedIds app.js:13 — D-24, CLI-09) ---
// Stocke les IDs de clients dans un array module-scoped pour eviter la concatenation
// d'un code utilisateur dans un onclick="..." (XSS). Le plan 05-02 consommera
// ce tableau via onclick="clientsOpenEdit(_clientIds[' + idx + '])".
var _clientIds = [];

// --- UUID helper (D-02, CLI-01) ---
function clientUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// --- Seed initial (D-15 — CLI-07 — hardcode frontend pour testabilite) ---
// Si clientsGetAll() retourne [] a l'init, le module appelle clientsSaveAll(INITIAL_CLIENTS) une seule fois.
var INITIAL_CLIENTS = [
  { id: clientUuid(), code: '1DAC-CDW' },
  { id: clientUuid(), code: '2SET-CDG' }
];

// --- Anti-XSS helper (fallback inline si esc() pas encore charge — pattern _listsEsc Phase 4) ---
function _clientsEsc(str) {
  if (typeof esc === 'function') return esc(str);
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// --- Backend: localStorage stub (D-16, CLI-03) ---
// Note: prefix _clients* to avoid global namespace collision with lists.js _localGet/_localPut
// (deviation Rule 1 — bug detecte via test harness : function declarations sont hoisted globalement
// dans le scope script tag inlined par run-harness.cjs, donc redeclarer _localGet ecraserait lists.js).
function _clientsLocalGet() {
  try {
    var raw = localStorage.getItem(CLIENTS_LOCAL_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}
function _clientsLocalPut(clients) {
  localStorage.setItem(CLIENTS_LOCAL_KEY, JSON.stringify(clients));
}

// --- Backend: remote (Azure Function /api/clients, D-17, CLI-02) ---
async function _clientsRemoteGet() {
  var jwt = typeof getJwt === 'function' ? getJwt() : null;
  if (!jwt) throw new Error('Session expiree.');
  var res = await fetch(CLIENTS_API_URL, {
    method: 'GET',
    headers: { 'x-auth-token': jwt }
  });
  if (!res.ok) {
    throw new Error('GET /api/clients ' + res.status);
  }
  return await res.json();
}
async function _clientsRemotePut(clients) {
  var jwt = typeof getJwt === 'function' ? getJwt() : null;
  if (!jwt) throw new Error('Session expiree.');
  var res = await fetch(CLIENTS_API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': jwt
    },
    body: JSON.stringify(clients)
  });
  if (!res.ok) {
    var err = await res.json().catch(function() { return {}; });
    throw new Error(err.error || ('PUT /api/clients ' + res.status));
  }
}

// --- Public API (mode-aware) ---
async function clientsGetAll() {
  return CLIENTS_API_MODE === 'remote' ? await _clientsRemoteGet() : _clientsLocalGet();
}
async function clientsSaveAll(clients) {
  if (CLIENTS_API_MODE === 'remote') {
    await _clientsRemotePut(clients);
  } else {
    _clientsLocalPut(clients);
  }
}

// --- CRUD operations (CLI-05 unicite case-sensitive D-04/D-05) ---
async function clientsCreate(code) {
  var trimmed = String(code || '').trim();
  if (!trimmed) throw new Error('Code requis.');
  var all = await clientsGetAll();
  for (var i = 0; i < all.length; i++) {
    if (all[i] && all[i].code === trimmed) {
      throw new Error('Code deja existant : "' + trimmed + '"');
    }
  }
  all.push({ id: clientUuid(), code: trimmed });
  await clientsSaveAll(all);
  return all;
}

async function clientsUpdate(id, code) {
  var trimmed = String(code || '').trim();
  if (!trimmed) throw new Error('Code requis.');
  var all = await clientsGetAll();
  var idx = -1;
  for (var i = 0; i < all.length; i++) {
    if (!all[i]) continue;
    if (all[i].id === id) {
      idx = i;
    } else if (all[i].code === trimmed) {
      // Collision avec un AUTRE id
      throw new Error('Code deja existant : "' + trimmed + '"');
    }
  }
  if (idx === -1) throw new Error('Client introuvable.');
  all[idx].code = trimmed;
  await clientsSaveAll(all);
  return all;
}

async function clientsDelete(id) {
  var all = await clientsGetAll();
  var next = all.filter(function(c) { return c && c.id !== id; });
  await clientsSaveAll(next);
  return next;
}

// --- Sort helper (D-11, CLI-04 tri francais avec accents) ---
function clientsSorted(all) {
  return (all || []).slice().sort(function(a, b) {
    return String(a && a.code || '').localeCompare(
      String(b && b.code || ''),
      'fr',
      { sensitivity: 'base' }
    );
  });
}

// --- Auto-seed (D-15 — CLI-07) ---
// Appele une seule fois au DOMContentLoaded. Si clientsGetAll() === [], persiste INITIAL_CLIENTS.
async function _clientsAutoSeed() {
  try {
    var all = await clientsGetAll();
    if (all.length === 0) {
      await clientsSaveAll(INITIAL_CLIENTS);
    }
  } catch (e) {
    // Mode remote au premier load : getJwt() peut etre absent -> log silencieux
    if (typeof console !== 'undefined') console.warn('_clientsAutoSeed:', e.message);
  }
}

// Init au chargement (CLI-07) — auto-seed si store vide
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('DOMContentLoaded', function() {
    // M-04 : Yield au microtask queue. Race possible avec getJwt() init en mode remote — recovery via openClientsModal (pattern Phase 4 W-3).
    setTimeout(function() { _clientsAutoSeed(); }, 0);
  });
}
