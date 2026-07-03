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
  var res = await (typeof apiFetch === 'function' ? apiFetch : fetch)(CLIENTS_API_URL, {
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
  var res = await (typeof apiFetch === 'function' ? apiFetch : fetch)(CLIENTS_API_URL, {
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
    // CLI-04 / CLI-07 : populate dropdown au DOMContentLoaded apres seed
    if (typeof refreshClientsDropdown === 'function') {
      await refreshClientsDropdown();
    }
  } catch (e) {
    // Mode remote au premier load : getJwt() peut etre absent -> log silencieux
    if (typeof console !== 'undefined') console.warn('_clientsAutoSeed:', e.message);
  }
}

// ============================================
// UI HANDLERS — Phase 5 plan 05-02 (CLI-04, CLI-06, CLI-09, CLI-11)
// ============================================
// Pattern clone structurel de lists.js section UI HANDLERS Phase 4.
// esc() defini dans static/js/app.js (charge apres clients.js) — utilise _clientsEsc (defini Phase 5 plan 05-01).

function closeClientsModal() {
  var ov = document.querySelector('.clients-modal-overlay');
  if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
}

async function openClientsModal() {
  closeClientsModal();
  var overlay = document.createElement('div');
  overlay.className = 'clients-modal-overlay';
  overlay.innerHTML =
    '<div class="clients-modal">' +
      '<div class="clients-modal-header">' +
        '<h3>Clients</h3>' +
        '<button type="button" class="btn btn-secondary btn-sm" onclick="closeClientsModal()">✕</button>' +
      '</div>' +
      '<div id="clients-modal-body"></div>' +
      '<div class="clients-modal-actions">' +
        '<button type="button" class="btn btn-primary" onclick="clientsOpenCreate()">+ Nouveau client</button>' +
      '</div>' +
      '<div id="clients-modal-form-zone"></div>' +
    '</div>';
  document.body.appendChild(overlay);
  try {
    var all = await clientsGetAll();
    renderClientsTable(all);
  } catch (e) {
    var body = document.getElementById('clients-modal-body');
    // _clientsEsc applique sur message d'erreur affiche en innerHTML (defense-in-depth, CLI-09)
    if (body) body.innerHTML = '<div class="clients-modal-empty">Erreur chargement: ' + _clientsEsc(e.message) + '</div>';
  }
}

function renderClientsTable(clients) {
  var sorted = clientsSorted(clients);
  _clientIds = sorted.map(function(c) { return c.id; });
  var body = document.getElementById('clients-modal-body');
  if (!body) return;
  if (sorted.length === 0) {
    body.innerHTML = '<div class="clients-modal-empty">Aucun client enregistre.</div>';
    return;
  }
  var rowsHtml = sorted.map(function(c, idx) {
    // _clientsEsc sur code (anti-XSS, innerHTML — CLI-09, D-23) ; _clientIds[idx] dans onclick (D-24)
    return '<tr>' +
      '<td>' + _clientsEsc(c.code) + '</td>' +
      '<td style="text-align:right;white-space:nowrap;">' +
        '<button type="button" onclick="clientsOpenEdit(_clientIds[' + idx + '])">✎</button>' +
        '<button type="button" onclick="clientsConfirmDelete(_clientIds[' + idx + '])">🗑</button>' +
      '</td></tr>';
  }).join('');
  body.innerHTML =
    '<table class="clients-modal-table">' +
      '<thead><tr><th>Code</th><th></th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
    '</table>';
}

function _renderClientsForm(client) {
  var zone = document.getElementById('clients-modal-form-zone');
  if (!zone) return;
  var titre = client ? 'Modifier le client' : 'Nouveau client';
  // _clientsEsc applique sur titre dans innerHTML (defense-in-depth meme si string interne — CLI-09)
  zone.innerHTML =
    '<div class="clients-modal-form">' +
      '<input type="hidden" id="clients-form-id">' +
      '<h4 style="margin:0;color:#1a3a5c;">' + _clientsEsc(titre) + '</h4>' +
      '<label>Code :<input type="text" id="clients-form-code" maxlength="60"></label>' +
      '<div class="clients-modal-actions">' +
        '<button type="button" class="btn btn-secondary" onclick="_clientsCloseForm()">Annuler</button>' +
        '<button type="button" class="btn btn-success" onclick="clientsSubmitForm()">Enregistrer</button>' +
      '</div>' +
    '</div>';
  // Anti-XSS pattern : .value = data, JAMAIS innerHTML pour les valeurs utilisateur (pattern textarea Phase 1)
  document.getElementById('clients-form-id').value = client ? client.id : '';
  document.getElementById('clients-form-code').value = client ? client.code : '';
}

function _clientsCloseForm() {
  var zone = document.getElementById('clients-modal-form-zone');
  if (zone) zone.innerHTML = '';
}

function clientsOpenCreate() {
  _renderClientsForm(null);
}

async function clientsOpenEdit(id) {
  try {
    var all = await clientsGetAll();
    var client = all.find(function(c) { return c && c.id === id; });
    if (!client) { alert('Client introuvable.'); return; }
    _renderClientsForm(client);
  } catch (e) { alert('Erreur: ' + e.message); }
}

async function clientsSubmitForm() {
  var idEl = document.getElementById('clients-form-id');
  var codeEl = document.getElementById('clients-form-code');
  if (!codeEl) return;
  var id = idEl ? idEl.value : '';
  var code = codeEl.value;
  try {
    if (id) await clientsUpdate(id, code);
    else await clientsCreate(code);
    _clientsCloseForm();
    await refreshClientsDropdown();
    var all = await clientsGetAll();
    renderClientsTable(all);
  } catch (e) {
    alert(e.message);
    if (codeEl && codeEl.focus) codeEl.focus();
  }
}

async function clientsConfirmDelete(id) {
  try {
    var all = await clientsGetAll();
    var client = all.find(function(c) { return c && c.id === id; });
    if (!client) { alert('Client introuvable.'); return; }
    if (!confirm('Supprimer le client "' + client.code + '" ?')) return;
    await clientsDelete(id);
    await refreshClientsDropdown();
    var fresh = await clientsGetAll();
    renderClientsTable(fresh);
  } catch (e) { alert('Erreur: ' + e.message); }
}

async function refreshClientsDropdown() {
  var dd = document.getElementById('clientName');
  // Seulement si #clientName est un <select> (pas un <input> dans les pages legacy ou test setups partiels)
  if (!dd || !(dd.tagName === 'SELECT')) return;
  try {
    var all = await clientsGetAll();
    var sorted = clientsSorted(all);
    // Preserver la valeur actuelle si possible
    var currentValue = dd.value;
    // Capturer la PREMIERE option legacy actuellement presente (CLI-08 / D-14) pour la re-injecter apres rebuild
    var hadLegacy = false;
    var legacyValue = '';
    for (var i = 0; i < dd.options.length; i++) {
      if (dd.options[i].getAttribute('data-legacy') === 'true') {
        hadLegacy = true;
        legacyValue = dd.options[i].value;
        break;
      }
    }
    while (dd.firstChild) dd.removeChild(dd.firstChild);
    // Option default
    var opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = '— Choisir un client —';
    dd.appendChild(opt0);
    // Une option par client — textContent gere l'esc nativement (anti-XSS, CLI-09 / D-23)
    sorted.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = c.code;
      dd.appendChild(opt);
    });
    // Re-injecter l'option legacy si elle existait ET que sa valeur n'est PAS deja une option normale
    if (hadLegacy && legacyValue) {
      var alreadyPresent = false;
      for (var j = 0; j < dd.options.length; j++) {
        if (dd.options[j].value === legacyValue) { alreadyPresent = true; break; }
      }
      if (!alreadyPresent) {
        var legacyOpt = document.createElement('option');
        legacyOpt.value = legacyValue;
        legacyOpt.textContent = legacyValue; // textContent = anti-XSS natif
        legacyOpt.setAttribute('data-legacy', 'true');
        dd.appendChild(legacyOpt);
      }
    }
    // Restaurer la valeur courante si l'option existe encore
    var canRestore = false;
    for (var k = 0; k < dd.options.length; k++) {
      if (dd.options[k].value === currentValue) { canRestore = true; break; }
    }
    dd.value = canRestore ? currentValue : '';
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('refreshClientsDropdown:', e.message);
  }
}

// Init au chargement (CLI-07) — auto-seed si store vide
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('DOMContentLoaded', function() {
    // M-04 : Yield au microtask queue. Race possible avec getJwt() init en mode remote — recovery via openClientsModal (pattern Phase 4 W-3).
    setTimeout(function() { _clientsAutoSeed(); }, 0);
  });
}
