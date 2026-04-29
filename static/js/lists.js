// ============================================
// LISTES DE DISTRIBUTION (LST-01..15) — Phase 4
// ============================================
// !!! AVANT PUSH PROD : verifier LISTS_API_MODE === 'remote' (Release checklist Phase 4)
// !!! Necessite STORAGE_CONNECTION_STRING configuree dans Azure SWA Settings.
// ============================================

// --- Mode switch (D-17, LST-07) ---
// 'localStorage' = dev local sans Azure Functions (cle 'recipients-lists-dev')
// 'remote'       = appel /api/recipients via fetch + JWT (production)
var LISTS_API_MODE = 'localStorage'; // 'localStorage' | 'remote'
var LISTS_LOCAL_KEY = 'recipients-lists-dev';
var LISTS_API_URL = '/api/recipients';

// --- IDs anti-XSS (pattern _savedIds app.js:13) ---
// Stocke les IDs de listes dans un array module-scoped pour eviter la concatenation
// d'un name/id utilisateur dans un onclick="..." (XSS). Le plan 04-02 consommera
// ce tableau via onclick="listsOpenEdit(_listIds[' + idx + '])".
var _listIds = [];

// --- UUID helper (D-02, LST-01) ---
function listUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// --- Email validation (D-12, LST-10, mirror api/recipients/index.js validateEmails) ---
// Regex DUPLIQUEE intentionnellement avec le backend (KISS, D-12 Claude's Discretion).
// Si modification, mettre a jour aussi api/recipients/index.js et api/send-email/index.js.
var LIST_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var LIST_ANGLE_REGEX = /<([^>]+)>/;
function listValidateEmails(str) {
  return String(str || '').split(/[,;]/).map(function(e) { return e.trim(); })
    .filter(Boolean).map(function(e) {
      var m = LIST_ANGLE_REGEX.exec(e);
      return m ? m[1].trim() : e;
    }).filter(function(e) { return LIST_EMAIL_REGEX.test(e); });
}
function listInvalidEmails(str) {
  var raw = String(str || '').split(/[,;]/).map(function(e) { return e.trim(); }).filter(Boolean);
  var valid = listValidateEmails(str);
  return raw.filter(function(e) {
    var m = LIST_ANGLE_REGEX.exec(e);
    var addr = m ? m[1].trim() : e;
    return valid.indexOf(addr) === -1;
  });
}

// --- Backend: localStorage stub (D-15, LST-07) ---
function _localGet() {
  try {
    var raw = localStorage.getItem(LISTS_LOCAL_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}
function _localPut(lists) {
  localStorage.setItem(LISTS_LOCAL_KEY, JSON.stringify(lists));
}

// --- Backend: remote (Azure Function /api/recipients, D-16, LST-08, LST-09) ---
async function _remoteGet() {
  var jwt = typeof getJwt === 'function' ? getJwt() : null;
  if (!jwt) throw new Error('Session expiree.');
  var res = await fetch(LISTS_API_URL, {
    method: 'GET',
    headers: { 'x-auth-token': jwt }
  });
  if (!res.ok) {
    throw new Error('GET /api/recipients ' + res.status);
  }
  return await res.json();
}
async function _remotePut(lists) {
  var jwt = typeof getJwt === 'function' ? getJwt() : null;
  if (!jwt) throw new Error('Session expiree.');
  var res = await fetch(LISTS_API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': jwt
    },
    body: JSON.stringify(lists)
  });
  if (!res.ok) {
    var err = await res.json().catch(function() { return {}; });
    throw new Error(err.error || ('PUT /api/recipients ' + res.status));
  }
}

// --- Public API (mode-aware) ---
async function listsGetAll() {
  return LISTS_API_MODE === 'remote' ? await _remoteGet() : _localGet();
}
async function listsSaveAll(lists) {
  if (LISTS_API_MODE === 'remote') {
    await _remotePut(lists);
  } else {
    _localPut(lists);
  }
}

// --- CRUD operations (LST-01, LST-03, LST-04) ---
async function listsCreate(name, recipients) {
  var trimmedName = String(name || '').trim();
  var trimmedRcpts = String(recipients || '').trim();
  if (!trimmedName) throw new Error('Nom requis.');
  var invalid = listInvalidEmails(trimmedRcpts);
  if (invalid.length > 0) {
    throw new Error('Adresses invalides : ' + invalid.join(', '));
  }
  var all = await listsGetAll();
  all.push({ id: listUuid(), name: trimmedName, recipients: trimmedRcpts });
  await listsSaveAll(all);
  return all;
}

async function listsUpdate(id, name, recipients) {
  var trimmedName = String(name || '').trim();
  var trimmedRcpts = String(recipients || '').trim();
  if (!trimmedName) throw new Error('Nom requis.');
  var invalid = listInvalidEmails(trimmedRcpts);
  if (invalid.length > 0) {
    throw new Error('Adresses invalides : ' + invalid.join(', '));
  }
  var all = await listsGetAll();
  var idx = -1;
  for (var i = 0; i < all.length; i++) {
    if (all[i] && all[i].id === id) { idx = i; break; }
  }
  if (idx === -1) throw new Error('Liste introuvable.');
  all[idx].name = trimmedName;
  all[idx].recipients = trimmedRcpts;
  await listsSaveAll(all);
  return all;
}

async function listsDelete(id) {
  var all = await listsGetAll();
  var next = all.filter(function(l) { return l && l.id !== id; });
  await listsSaveAll(next);
  return next;
}

// --- Sort helper (D-08, LST-02, tri francais avec accents) ---
function listsSorted(all) {
  return (all || []).slice().sort(function(a, b) {
    return String(a && a.name || '').localeCompare(
      String(b && b.name || ''),
      'fr',
      { sensitivity: 'base' }
    );
  });
}
