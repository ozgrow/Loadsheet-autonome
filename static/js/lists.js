// ============================================
// LISTES DE DISTRIBUTION (LST-01..15) — Phase 4
// ============================================
// Mode auto-detecte par hostname :
//   localhost / 127.0.0.1 -> 'localStorage' (dev sans Azure Functions, harness Node JSDOM)
//   autre hostname        -> 'remote' (prod Azure SWA, fetch /api/recipients + JWT)
// Necessite STORAGE_CONNECTION_STRING configuree dans Azure SWA Settings (mode remote).
// ============================================

// --- Mode switch (D-17, LST-07) ---
var LISTS_API_MODE = (typeof window !== 'undefined' && window.location
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'localStorage'
  : 'remote';
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

// ============================================
// UI HANDLERS — Phase 4 plan 04-02 (LST-05, LST-06, LST-11, LST-13)
// ============================================
// esc() est defini dans static/js/app.js (charge apres lists.js).
// Defensive fallback inline si lists.js execute avant app.js (ex: tests harness order).
function _listsEsc(str) {
  if (typeof esc === 'function') return esc(str);
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function closeListsModal() {
  var ov = document.querySelector('.lists-modal-overlay');
  if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
}

async function openListsModal() {
  closeListsModal();
  var overlay = document.createElement('div');
  overlay.className = 'lists-modal-overlay';
  overlay.innerHTML =
    '<div class="lists-modal">' +
      '<div class="lists-modal-header">' +
        '<h3>Listes de distribution</h3>' +
        '<button type="button" class="btn btn-secondary btn-sm" onclick="closeListsModal()">✕</button>' +
      '</div>' +
      '<div id="lists-modal-body"></div>' +
      '<div class="lists-modal-actions">' +
        '<button type="button" class="btn btn-primary" onclick="listsOpenCreate()">+ Nouvelle liste</button>' +
      '</div>' +
      '<div id="lists-modal-form-zone"></div>' +
    '</div>';
  document.body.appendChild(overlay);
  try {
    var all = await listsGetAll();
    renderListsTable(all);
  } catch (e) {
    var body = document.getElementById('lists-modal-body');
    if (body) body.innerHTML = '<div class="lists-modal-empty">Erreur chargement: ' + _listsEsc(e.message) + '</div>';
  }
}

function renderListsTable(lists) {
  var sorted = listsSorted(lists);
  _listIds = sorted.map(function(l) { return l.id; });
  var body = document.getElementById('lists-modal-body');
  if (!body) return;
  if (sorted.length === 0) {
    body.innerHTML = '<div class="lists-modal-empty">Aucune liste de distribution.</div>';
    return;
  }
  var rowsHtml = sorted.map(function(l, idx) {
    var preview = l.recipients.length > 30 ? l.recipients.slice(0, 30) + '…' : l.recipients;
    return '<tr>' +
      '<td>' + _listsEsc(l.name) + '</td>' +
      '<td>' + _listsEsc(preview) + '</td>' +
      '<td style="text-align:right;white-space:nowrap;">' +
        '<button type="button" onclick="listsOpenEdit(_listIds[' + idx + '])">✎</button>' +
        '<button type="button" onclick="listsConfirmDelete(_listIds[' + idx + '])">🗑</button>' +
      '</td></tr>';
  }).join('');
  body.innerHTML =
    '<table class="lists-modal-table">' +
      '<thead><tr><th>Nom</th><th>Aperçu destinataires</th><th></th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
    '</table>';
}

function _renderListsForm(liste) {
  var zone = document.getElementById('lists-modal-form-zone');
  if (!zone) return;
  var titre = liste ? 'Modifier la liste' : 'Nouvelle liste';
  zone.innerHTML =
    '<div class="lists-modal-form">' +
      '<input type="hidden" id="lists-form-id">' +
      '<h4 style="margin:0;color:#1a3a5c;">' + _listsEsc(titre) + '</h4>' +
      '<label>Nom :<input type="text" id="lists-form-name" maxlength="60"></label>' +
      '<label>Destinataires (emails séparés par virgules) :' +
        '<textarea id="lists-form-recipients" rows="4"></textarea>' +
      '</label>' +
      '<div class="lists-modal-actions">' +
        '<button type="button" class="btn btn-secondary" onclick="_listsCloseForm()">Annuler</button>' +
        '<button type="button" class="btn btn-success" onclick="listsSubmitForm()">Enregistrer</button>' +
      '</div>' +
    '</div>';
  // Anti-XSS pattern : .value = data, JAMAIS innerHTML pour les valeurs utilisateur
  document.getElementById('lists-form-id').value = liste ? liste.id : '';
  document.getElementById('lists-form-name').value = liste ? liste.name : '';
  document.getElementById('lists-form-recipients').value = liste ? liste.recipients : '';
}

function _listsCloseForm() {
  var zone = document.getElementById('lists-modal-form-zone');
  if (zone) zone.innerHTML = '';
}

function listsOpenCreate() {
  _renderListsForm(null);
}

async function listsOpenEdit(id) {
  try {
    var all = await listsGetAll();
    var liste = all.find(function(l) { return l && l.id === id; });
    if (!liste) { alert('Liste introuvable.'); return; }
    _renderListsForm(liste);
  } catch (e) { alert('Erreur: ' + e.message); }
}

async function listsSubmitForm() {
  var idEl = document.getElementById('lists-form-id');
  var nameEl = document.getElementById('lists-form-name');
  var rcptsEl = document.getElementById('lists-form-recipients');
  if (!nameEl || !rcptsEl) return;
  var id = idEl ? idEl.value : '';
  var name = nameEl.value;
  var recipients = rcptsEl.value;
  try {
    if (id) await listsUpdate(id, name, recipients);
    else await listsCreate(name, recipients);
    _listsCloseForm();
    await refreshListsDropdown();
    var all = await listsGetAll();
    renderListsTable(all);
  } catch (e) {
    alert(e.message);
    if (rcptsEl && rcptsEl.focus) rcptsEl.focus();
  }
}

async function listsConfirmDelete(id) {
  try {
    var all = await listsGetAll();
    var liste = all.find(function(l) { return l && l.id === id; });
    if (!liste) { alert('Liste introuvable.'); return; }
    if (!confirm('Supprimer la liste "' + liste.name + '" ?')) return;
    await listsDelete(id);
    await refreshListsDropdown();
    var fresh = await listsGetAll();
    renderListsTable(fresh);
  } catch (e) { alert('Erreur: ' + e.message); }
}

async function applyListToRecipients(id) {
  if (!id) return; // option default
  try {
    var all = await listsGetAll();
    var liste = all.find(function(l) { return l && l.id === id; });
    if (!liste) return;
    var input = document.getElementById('recipients');
    if (input) input.value = liste.recipients;
    // Reset dropdown to default option
    var dd = document.getElementById('lists-dropdown');
    if (dd) dd.value = '';
  } catch (e) { alert('Erreur: ' + e.message); }
}

async function refreshListsDropdown() {
  var dd = document.getElementById('lists-dropdown');
  if (!dd) return; // pas de dropdown sur cette page (ex: tests unit)
  try {
    var all = await listsGetAll();
    var sorted = listsSorted(all);
    while (dd.firstChild) dd.removeChild(dd.firstChild);
    var opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = '— Choisir une liste —';
    dd.appendChild(opt0);
    // Une option par liste — textContent gere l'esc nativement (anti-XSS)
    sorted.forEach(function(l) {
      var opt = document.createElement('option');
      opt.value = l.id;
      opt.textContent = l.name;
      dd.appendChild(opt);
    });
  } catch (e) {
    // En mode dev avec localStorage vide, pas d'erreur attendue.
    // En mode remote, log silencieux pour ne pas bloquer la page (W-3 race condition getJwt acceptable).
    if (typeof console !== 'undefined') console.warn('refreshListsDropdown:', e.message);
  }
}

// Init au chargement (LST-05) — auto-refresh dropdown si present
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('DOMContentLoaded', function() {
    // Delai minimal pour permettre a app.js de s'initialiser et getJwt d'etre dispo
    setTimeout(function() { refreshListsDropdown(); }, 0);
  });
}
