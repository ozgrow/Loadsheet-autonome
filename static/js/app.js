// --- Version ---
var APP_VERSION = "1.7.4";

// --- Storage ---
var STORAGE_KEY = "loadsheet_manifests";
var STORAGE_SALT_KEY = "loadsheet_salt";
var STORAGE_CK_KEY = "loadsheet_ck";
var MAX_SAVED = 50;

// --- State ---
var manifestId = '';
var uldCount = 0;
var _savedIds = []; // tableau d'IDs pour onclick (anti-XSS)

// --- HTML escape (anti-XSS) ---
function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ============================================
// MATERIAL MODAL (MAT-01..08, MAT-11, RECAP-01, RECAP-03)
// ============================================

// Ouvre le modal d'edition materiel pour une ULD donnee.
// Lit l'etat actuel depuis les data-attributes du bloc ULD et pre-remplit les champs.
function openMaterialModal(uldIndex) {
    var block = document.getElementById('uld-' + uldIndex);
    if (!block) return;
    closeMaterialModal(); // idempotent

    var straps = block.dataset.straps || '0';
    var flEu = block.dataset.flooringEu || '0';
    var flEuF = block.dataset.flooringEuForfait === 'true';
    var flStd = block.dataset.flooringStd || '0';
    var flStdF = block.dataset.flooringStdForfait === 'true';
    var blocks = block.dataset.blocks || '0';
    var tarps = block.dataset.tarps || '0';
    var dividers = block.dataset.dividers || '0';
    var honeycomb = block.dataset.honeycomb || '0';
    var uldComment = block.dataset.uldComment || '';

    var overlay = document.createElement('div');
    overlay.className = 'material-modal-overlay';
    overlay.id = 'materialModalOverlay';
    overlay.onclick = function(e) { if (e.target === overlay) closeMaterialModal(); };

    var modal = document.createElement('div');
    modal.className = 'material-modal';
    modal.setAttribute('data-uld-index', String(uldIndex));
    // Valeurs numeriques : setAttribute value via esc() (safe : parseInt en input).
    // uldComment : JAMAIS via innerHTML ; assigne via .value apres appendChild (anti-XSS MAT-11 / D-19).
    modal.innerHTML =
        '<div class="material-modal-header">' +
            '<h3>Matériel ULD</h3>' +
            '<button class="btn btn-danger btn-sm" onclick="closeMaterialModal()">Fermer</button>' +
        '</div>' +
        '<div class="material-modal-grid">' +
            '<label>Sangles<input type="number" min="0" class="mat-straps" value="' + esc(straps) + '"></label>' +
            '<label>Planchers bois EU<input type="number" min="0" class="mat-flooring-eu" value="' + esc(flEu) + '"' + (flEuF ? ' disabled' : '') + '>' +
                '<span class="mat-forfait-label"><input type="checkbox" class="mat-flooring-eu-forfait"' + (flEuF ? ' checked' : '') + ' onchange="toggleForfait(this, \'mat-flooring-eu\')"> Forfait négocié</span></label>' +
            '<label>Planchers bois Standard<input type="number" min="0" class="mat-flooring-std" value="' + esc(flStd) + '"' + (flStdF ? ' disabled' : '') + '>' +
                '<span class="mat-forfait-label"><input type="checkbox" class="mat-flooring-std-forfait"' + (flStdF ? ' checked' : '') + ' onchange="toggleForfait(this, \'mat-flooring-std\')"> Forfait négocié</span></label>' +
            '<label>Bois de calage<input type="number" min="0" class="mat-blocks" value="' + esc(blocks) + '"></label>' +
            '<label>Bâches<input type="number" min="0" class="mat-tarps" value="' + esc(tarps) + '"></label>' +
            '<label>Intercalaires<input type="number" min="0" class="mat-dividers" value="' + esc(dividers) + '"></label>' +
            '<label>Nids d\'abeille<input type="number" min="0" class="mat-honeycomb" value="' + esc(honeycomb) + '"></label>' +
            '<label class="mat-comment-label">Commentaire ULD<textarea class="mat-uld-comment" rows="3" placeholder="Commentaire libre niveau ULD"></textarea></label>' +
        '</div>' +
        '<div class="material-modal-actions">' +
            '<button class="btn btn-secondary" onclick="closeMaterialModal()">Annuler</button>' +
            '<button class="btn btn-primary" onclick="applyMaterialToUld(' + uldIndex + ')">Valider</button>' +
        '</div>';
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    // ANTI-XSS (MAT-11, D-19) : uldComment assigne via .value (textarea traite comme texte brut)
    modal.querySelector('.mat-uld-comment').value = uldComment;
}

// Active/desactive un input nombre en fonction de la checkbox forfait associee.
// Quand on coche forfait : input disabled + value remis a '0' (D-07).
function toggleForfait(checkbox, inputClass) {
    var modal = document.querySelector('.material-modal');
    if (!modal) return;
    var input = modal.querySelector('.' + inputClass);
    if (!input) return;
    if (checkbox.checked) { input.disabled = true; input.value = '0'; }
    else { input.disabled = false; }
}

// Ferme le modal materiel s'il existe (idempotent).
function closeMaterialModal() {
    var overlay = document.getElementById('materialModalOverlay');
    if (overlay) overlay.remove();
}

// Applique les valeurs du modal aux data-attributes du bloc ULD,
// rafraichit le badge, ferme le modal.
function applyMaterialToUld(uldIndex) {
    var modal = document.querySelector('.material-modal');
    var block = document.getElementById('uld-' + uldIndex);
    if (!modal || !block) return;

    var flEuF = modal.querySelector('.mat-flooring-eu-forfait').checked;
    var flStdF = modal.querySelector('.mat-flooring-std-forfait').checked;
    // D-07 : forfait coche => nombre force a 0 a la save
    var flEu = flEuF ? 0 : (parseInt(modal.querySelector('.mat-flooring-eu').value) || 0);
    var flStd = flStdF ? 0 : (parseInt(modal.querySelector('.mat-flooring-std').value) || 0);
    var straps = parseInt(modal.querySelector('.mat-straps').value) || 0;
    var blocks = parseInt(modal.querySelector('.mat-blocks').value) || 0;
    var tarps = parseInt(modal.querySelector('.mat-tarps').value) || 0;
    var dividers = parseInt(modal.querySelector('.mat-dividers').value) || 0;
    var honeycomb = parseInt(modal.querySelector('.mat-honeycomb').value) || 0;
    var uldComment = String(modal.querySelector('.mat-uld-comment').value || '');

    block.setAttribute('data-straps', String(straps));
    block.setAttribute('data-flooring-eu', String(flEu));
    block.setAttribute('data-flooring-eu-forfait', String(flEuF));
    block.setAttribute('data-flooring-std', String(flStd));
    block.setAttribute('data-flooring-std-forfait', String(flStdF));
    block.setAttribute('data-blocks', String(blocks));
    block.setAttribute('data-tarps', String(tarps));
    block.setAttribute('data-dividers', String(dividers));
    block.setAttribute('data-honeycomb', String(honeycomb));
    block.setAttribute('data-uld-comment', uldComment);

    refreshMaterialBadge(uldIndex);
    closeMaterialModal();
}

// Affiche/masque le badge "Materiel saisi" sous le header ULD.
// Badge neutre (pas de texte utilisateur) -> pas de vecteur XSS ici (D-19/D-20).
function refreshMaterialBadge(uldIndex) {
    var block = document.getElementById('uld-' + uldIndex);
    var wrapper = document.getElementById('material-badge-' + uldIndex);
    if (!block || !wrapper) return;
    var hasAny =
        (parseInt(block.dataset.straps) || 0) > 0 ||
        (parseInt(block.dataset.flooringEu) || 0) > 0 ||
        block.dataset.flooringEuForfait === 'true' ||
        (parseInt(block.dataset.flooringStd) || 0) > 0 ||
        block.dataset.flooringStdForfait === 'true' ||
        (parseInt(block.dataset.blocks) || 0) > 0 ||
        (parseInt(block.dataset.tarps) || 0) > 0 ||
        (parseInt(block.dataset.dividers) || 0) > 0 ||
        (parseInt(block.dataset.honeycomb) || 0) > 0 ||
        (block.dataset.uldComment || '').length > 0;
    wrapper.innerHTML = hasAny ? '<span class="material-badge">Matériel saisi</span>' : '';
}



// ============================================
// ENCRYPTED STORAGE (AES-256-GCM + PBKDF2)
// ============================================
function b64ToUint8(b64) {
    var raw = atob(b64);
    var arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
}

function uint8ToB64(uint8) {
    var s = '';
    for (var i = 0; i < uint8.length; i++) s += String.fromCharCode(uint8[i]);
    return btoa(s);
}

async function deriveAndStoreKey(password) {
    var saltB64 = localStorage.getItem(STORAGE_SALT_KEY);
    var salt;
    if (saltB64) {
        salt = b64ToUint8(saltB64);
    } else {
        salt = crypto.getRandomValues(new Uint8Array(16));
        localStorage.setItem(STORAGE_SALT_KEY, uint8ToB64(salt));
    }
    var keyMaterial = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
    );
    var key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true, ['encrypt', 'decrypt']
    );
    var exported = new Uint8Array(await crypto.subtle.exportKey('raw', key));
    sessionStorage.setItem(STORAGE_CK_KEY, uint8ToB64(exported));
    return key;
}

async function getStorageKey() {
    var raw = sessionStorage.getItem(STORAGE_CK_KEY);
    if (!raw) return null;
    return crypto.subtle.importKey('raw', b64ToUint8(raw), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptManifests(data) {
    var key = await getStorageKey();
    if (!key) return null;
    var json = new TextEncoder().encode(JSON.stringify(data));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, json));
    return JSON.stringify({ v: 1, iv: uint8ToB64(iv), ct: uint8ToB64(ct) });
}

async function decryptManifests(str) {
    var key = await getStorageKey();
    if (!key) return null;
    var enc = JSON.parse(str);
    if (!enc.v || !enc.iv || !enc.ct) return null;
    var iv = b64ToUint8(enc.iv);
    var ct = b64ToUint8(enc.ct);
    var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(pt));
}

async function migrateStorageIfNeeded() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
            var encrypted = await encryptManifests(parsed);
            if (encrypted) localStorage.setItem(STORAGE_KEY, encrypted);
        }
    } catch(e) {}
}

// --- Manifest ID generation ---
function generateManifestId() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var h = String(now.getHours()).padStart(2, '0');
    var min = String(now.getMinutes()).padStart(2, '0');
    var seq = String(Math.floor(Math.random() * 900) + 100);
    return 'MAN-' + y + m + d + '-' + h + min + '-' + seq;
}

// --- Init / New Manifest ---
async function initApp() {
    await migrateStorageIfNeeded();
    newManifest();
    await refreshSavedList();
}

function newManifest() {
    manifestId = generateManifestId();
    document.getElementById('manifestId').textContent = manifestId;
    document.getElementById('appVersion').textContent = 'v' + APP_VERSION;
    document.getElementById('clientName').value = '';
    document.getElementById('agentName').value = '';
    document.getElementById('destAirport').value = '';
    document.getElementById('recipients').value = '';
    document.getElementById('cc').value = '';
    document.getElementById('pmcContainer').innerHTML = '';
    document.getElementById('generateSection').style.display = 'none';
    document.getElementById('manifestStatus').textContent = 'Brouillon';
    document.getElementById('manifestStatus').className = 'status status-draft';
    uldCount = 0;
    addUld();
}

// --- ULD ---
function addUld() {
    uldCount++;
    var i = uldCount;
    var div = document.createElement('div');
    div.className = 'uld-block';
    div.id = 'uld-' + i;
    // Materiel ULD (MAT-01..08) : data-attributes sur le bloc, defaults
    div.setAttribute('data-straps', '0');
    div.setAttribute('data-flooring-eu', '0');
    div.setAttribute('data-flooring-eu-forfait', 'false');
    div.setAttribute('data-flooring-std', '0');
    div.setAttribute('data-flooring-std-forfait', 'false');
    div.setAttribute('data-blocks', '0');
    div.setAttribute('data-tarps', '0');
    div.setAttribute('data-dividers', '0');
    div.setAttribute('data-honeycomb', '0');
    div.setAttribute('data-uld-comment', '');
    div.innerHTML =
        '<div class="uld-header">' +
            '<label>ULD N\u00b0 :</label>' +
            '<input type="text" class="uld-number" placeholder="Num\u00e9ro ULD" style="width:180px">' +
            '<label style="margin-left:16px;">Poids (kg) :</label>' +
            '<input type="number" class="uld-weight" placeholder="Optionnel" style="width:100px" min="0" step="0.1" oninput="updateRecap()">' +
            '<button class="btn btn-secondary btn-sm btn-material" onclick="openMaterialModal(' + i + ')">Matériel</button>' +
            '<button class="btn btn-danger" onclick="removeUld(' + i + ')">Supprimer ULD</button>' +
        '</div>' +
        '<div class="material-badge-wrapper" id="material-badge-' + i + '"></div>' +
        '<table><thead><tr>' +
            '<th style="width:140px">LTA</th><th>Dossier</th><th style="width:100px">Nb Colis</th>' +
            '<th style="width:80px">DGR</th><th>Commentaire</th><th style="width:50px"></th>' +
        '</tr></thead><tbody class="uld-rows"></tbody></table>' +
        '<div class="uld-totals">Total colis : <span class="total-colis">0</span></div>' +
        '<div style="margin-top:8px"><button class="btn btn-secondary" onclick="addRow(' + i + ')">+ Ajouter ligne</button></div>';
    document.getElementById('pmcContainer').appendChild(div);
    addRow(i);
}

function addRow(uldIndex) {
    var tbody = document.querySelector('#uld-' + uldIndex + ' .uld-rows');
    if (!tbody) return;
    var rows = tbody.querySelectorAll('tr');
    var defaultLta = '';
    if (rows.length > 0) {
        var last = rows[rows.length - 1].querySelector('.lta-input');
        if (last) defaultLta = last.value;
    }
    var tr = document.createElement('tr');
    tr.innerHTML =
        '<td><input type="text" class="lta-input" value="' + esc(defaultLta) + '" placeholder="LTA" oninput="updateRecap()"></td>' +
        '<td><input type="text" class="dossier-input" placeholder="Dossier"></td>' +
        '<td><input type="number" class="colis-input" min="0" value="0" onchange="updateTotals(' + uldIndex + ')" oninput="updateTotals(' + uldIndex + ')"></td>' +
        '<td><select class="dgr-input" onchange="updateRecap()"><option value="N">N</option><option value="O">O</option></select></td>' +
        '<td><input type="text" class="comment-input" placeholder="Commentaire"></td>' +
        '<td><button class="btn btn-danger" onclick="removeRow(this,' + uldIndex + ')">x</button></td>';
    tbody.appendChild(tr);
}

function removeRow(btn, i) { btn.closest('tr').remove(); updateTotals(i); }
function removeUld(i) { var el = document.getElementById('uld-' + i); if (el) el.remove(); updateRecap(); }

function updateTotals(i) {
    var block = document.getElementById('uld-' + i);
    if (!block) return;
    var total = 0;
    block.querySelectorAll('.colis-input').forEach(function(inp) { total += parseInt(inp.value) || 0; });
    block.querySelector('.total-colis').textContent = total;
    updateRecap();
}

function updateRecap() {
    var blocks = document.querySelectorAll('.uld-block');
    var nbUld = blocks.length;
    var totalColis = 0;
    var totalWeight = 0;
    var hasWeight = false;
    var ltaSet = {};
    var hasDgr = false;
    blocks.forEach(function(block) {
        block.querySelectorAll('.colis-input').forEach(function(inp) { totalColis += parseInt(inp.value) || 0; });
        var w = parseFloat(block.querySelector('.uld-weight') ? block.querySelector('.uld-weight').value : '');
        if (!isNaN(w) && w > 0) { totalWeight += w; hasWeight = true; }
        block.querySelectorAll('.lta-input').forEach(function(inp) { if (inp.value.trim()) ltaSet[inp.value.trim()] = true; });
        block.querySelectorAll('.dgr-input').forEach(function(sel) { if (sel.value === 'O') hasDgr = true; });
    });
    var ltas = Object.keys(ltaSet);
    var html = '<span class="recap-item">ULD : <span class="recap-value">' + nbUld + '</span></span>';
    html += '<span class="recap-item">Colis : <span class="recap-value">' + totalColis + '</span></span>';
    if (hasWeight) html += '<span class="recap-item">Poids : <span class="recap-value">' + totalWeight + ' kg</span></span>';
    html += '<span class="recap-item">LTA : <span class="recap-value">' + (ltas.length > 0 ? esc(ltas.join(', ')) : '-') + '</span></span>';
    if (hasDgr) html += '<span class="recap-item recap-dgr">DGR : OUI</span>';
    document.getElementById('liveRecap').innerHTML = html;
}

function showGenerateSection() {
    if (!validateRequired()) return;
    document.getElementById('generateSection').style.display = 'block';
    document.getElementById('generateSection').scrollIntoView({ behavior: 'smooth' });
}

// --- Validation ---
function validateRequired() {
    var agent = document.getElementById('agentName').value.trim();
    var dest = document.getElementById('destAirport').value.trim();
    if (!agent) { alert('Le nom de l\'agent est obligatoire.'); document.getElementById('agentName').focus(); return false; }
    if (!dest || dest.length !== 3) { alert('Le code aeroport de destination (3 lettres) est obligatoire.'); document.getElementById('destAirport').focus(); return false; }
    return true;
}

// --- Collect data ---
function collectData() {
    var ulds = [];
    document.querySelectorAll('.uld-block').forEach(function(block) {
        var uldNumber = block.querySelector('.uld-number').value || 'N/A';
        var uldWeightVal = block.querySelector('.uld-weight') ? parseFloat(block.querySelector('.uld-weight').value) : NaN;
        var rows = [];
        block.querySelectorAll('.uld-rows tr').forEach(function(tr) {
            rows.push({
                lta: tr.querySelector('.lta-input').value,
                dossier: tr.querySelector('.dossier-input').value,
                colis: parseInt(tr.querySelector('.colis-input').value) || 0,
                dgr: tr.querySelector('.dgr-input').value,
                comment: tr.querySelector('.comment-input').value
            });
        });
        var totalColis = rows.reduce(function(s, r) { return s + r.colis; }, 0);
        var uldEntry = { uldNumber: uldNumber, rows: rows, totalColis: totalColis };
        if (!isNaN(uldWeightVal) && uldWeightVal > 0) uldEntry.weight = uldWeightVal;
        // Materiel ULD (MAT-01..08) : lecture des data-attributes
        uldEntry.strapsCount = parseInt(block.dataset.straps) || 0;
        uldEntry.flooringEuCount = parseInt(block.dataset.flooringEu) || 0;
        uldEntry.flooringEuForfait = block.dataset.flooringEuForfait === 'true';
        uldEntry.flooringStdCount = parseInt(block.dataset.flooringStd) || 0;
        uldEntry.flooringStdForfait = block.dataset.flooringStdForfait === 'true';
        uldEntry.blocksCount = parseInt(block.dataset.blocks) || 0;
        uldEntry.tarpsCount = parseInt(block.dataset.tarps) || 0;
        uldEntry.dividersCount = parseInt(block.dataset.dividers) || 0;
        uldEntry.honeycombCount = parseInt(block.dataset.honeycomb) || 0;
        uldEntry.uldComment = block.dataset.uldComment || '';
        ulds.push(uldEntry);
    });
    return {
        manifestId: manifestId,
        client: document.getElementById('clientName').value || '',
        agent: document.getElementById('agentName').value || '',
        destAirport: document.getElementById('destAirport').value.toUpperCase() || '',
        date: new Date().toLocaleDateString('fr-FR'),
        timestamp: new Date().toISOString(),
        recipients: document.getElementById('recipients').value,
        cc: document.getElementById('cc').value,
        ulds: ulds
    };
}

// --- Get all LTAs from a manifest data object ---
function getAllLtas(data) {
    var ltaSet = {};
    var list = data.ulds || data.pmcs || [];
    list.forEach(function(u) {
        u.rows.forEach(function(r) { if (r.lta) ltaSet[r.lta] = true; });
    });
    return Object.keys(ltaSet);
}

// ============================================
// SAVE / LOAD MANIFESTS
// ============================================
async function getSavedManifests() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed; // old unencrypted or empty
        if (parsed.v === 1 && parsed.iv && parsed.ct) {
            var data = await decryptManifests(raw);
            return Array.isArray(data) ? data : [];
        }
        return [];
    } catch (e) { return []; }
}

async function writeSavedManifests(manifests) {
    var encrypted = await encryptManifests(manifests);
    if (encrypted) localStorage.setItem(STORAGE_KEY, encrypted);
}

async function saveManifest() {
    var data = collectData();
    if (data.ulds.length === 0) { alert('Rien a sauvegarder.'); return; }
    var saved = await getSavedManifests();
    var idx = saved.findIndex(function(m) { return m.manifestId === data.manifestId; });
    if (idx >= 0) { saved[idx] = data; } else { saved.unshift(data); if (saved.length > MAX_SAVED) saved.pop(); }
    await writeSavedManifests(saved);
    await refreshSavedList();
    alert('Manifeste ' + data.manifestId + ' sauvegarde.');
}

async function deleteSavedManifest(id) {
    if (!confirm('Supprimer ce manifeste ?')) return;
    var saved = (await getSavedManifests()).filter(function(m) { return m.manifestId !== id; });
    await writeSavedManifests(saved);
    await refreshSavedList();
}

async function loadManifest(id) {
    var saved = await getSavedManifests();
    var data = saved.find(function(m) { return m.manifestId === id; });
    if (!data) return;

    manifestId = data.manifestId;
    document.getElementById('manifestId').textContent = manifestId;
    document.getElementById('clientName').value = data.client || '';
    document.getElementById('agentName').value = data.agent || '';
    document.getElementById('destAirport').value = data.destAirport || '';
    document.getElementById('recipients').value = data.recipients || '';
    document.getElementById('cc').value = data.cc || '';
    document.getElementById('pmcContainer').innerHTML = '';
    document.getElementById('generateSection').style.display = 'none';
    document.getElementById('manifestStatus').textContent = 'Brouillon';
    document.getElementById('manifestStatus').className = 'status status-draft';
    uldCount = 0;

    var uldList = data.ulds || data.pmcs || [];
    if (!Array.isArray(uldList)) uldList = [];
    uldList.forEach(function(uldData) {
        if (!uldData || !Array.isArray(uldData.rows)) return;
        uldCount++;
        var i = uldCount;
        var div = document.createElement('div');
        div.className = 'uld-block';
        div.id = 'uld-' + i;
        // Materiel ULD (MAT-01..08, MAT-10 retro-compat) : lecture defensive des data-attributes
        div.setAttribute('data-straps', String(parseInt(uldData.strapsCount) || 0));
        div.setAttribute('data-flooring-eu', String(parseInt(uldData.flooringEuCount) || 0));
        div.setAttribute('data-flooring-eu-forfait', String(uldData.flooringEuForfait === true));
        div.setAttribute('data-flooring-std', String(parseInt(uldData.flooringStdCount) || 0));
        div.setAttribute('data-flooring-std-forfait', String(uldData.flooringStdForfait === true));
        div.setAttribute('data-blocks', String(parseInt(uldData.blocksCount) || 0));
        div.setAttribute('data-tarps', String(parseInt(uldData.tarpsCount) || 0));
        div.setAttribute('data-dividers', String(parseInt(uldData.dividersCount) || 0));
        div.setAttribute('data-honeycomb', String(parseInt(uldData.honeycombCount) || 0));
        div.setAttribute('data-uld-comment', String(uldData.uldComment || ''));
        div.innerHTML =
            '<div class="uld-header"><label>ULD N\u00b0 :</label>' +
            '<input type="text" class="uld-number" placeholder="Num\u00e9ro ULD" style="width:180px" value="' + esc(uldData.uldNumber || uldData.pmcNumber || '') + '">' +
            '<label style="margin-left:16px;">Poids (kg) :</label>' +
            '<input type="number" class="uld-weight" placeholder="Optionnel" style="width:100px" min="0" step="0.1" oninput="updateRecap()" value="' + esc(uldData.weight || '') + '">' +
            '<button class="btn btn-secondary btn-sm btn-material" onclick="openMaterialModal(' + i + ')">Matériel</button>' +
            '<button class="btn btn-danger" onclick="removeUld(' + i + ')">Supprimer ULD</button></div>' +
            '<div class="material-badge-wrapper" id="material-badge-' + i + '"></div>' +
            '<table><thead><tr><th style="width:140px">LTA</th><th>Dossier</th><th style="width:100px">Nb Colis</th><th style="width:80px">DGR</th><th>Commentaire</th><th style="width:50px"></th></tr></thead><tbody class="uld-rows"></tbody></table>' +
            '<div class="uld-totals">Total colis : <span class="total-colis">0</span></div>' +
            '<div style="margin-top:8px"><button class="btn btn-secondary" onclick="addRow(' + i + ')">+ Ajouter ligne</button></div>';
        document.getElementById('pmcContainer').appendChild(div);
        var tbody = div.querySelector('.uld-rows');
        uldData.rows.forEach(function(r) {
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><input type="text" class="lta-input" value="' + esc(r.lta || '') + '" oninput="updateRecap()"></td>' +
                '<td><input type="text" class="dossier-input" value="' + esc(r.dossier || '') + '"></td>' +
                '<td><input type="number" class="colis-input" min="0" value="' + (parseInt(r.colis) || 0) + '" onchange="updateTotals(' + i + ')" oninput="updateTotals(' + i + ')"></td>' +
                '<td><select class="dgr-input" onchange="updateRecap()"><option value="N"' + (r.dgr === 'N' ? ' selected' : '') + '>N</option><option value="O"' + (r.dgr === 'O' ? ' selected' : '') + '>O</option></select></td>' +
                '<td><input type="text" class="comment-input" value="' + esc(r.comment || '') + '"></td>' +
                '<td><button class="btn btn-danger" onclick="removeRow(this,' + i + ')">x</button></td>';
            tbody.appendChild(tr);
        });
        updateTotals(i);
        refreshMaterialBadge(i);
    });
    updateRecap();
    // Si le manifeste avait des destinataires, afficher la section envoi
    if (data.recipients || data.cc) {
        document.getElementById('generateSection').style.display = 'block';
    }
}

async function refreshSavedList() {
    var saved = await getSavedManifests();
    document.getElementById('savedCount').textContent = saved.length;
    var list = document.getElementById('savedManifestsList');
    if (saved.length === 0) {
        list.innerHTML = '<div style="color:#a0aec0;font-size:0.9em;padding:8px 0;">Aucun manifeste sauvegarde.</div>';
        return;
    }
    _savedIds = saved.map(function(m) { return m.manifestId; });
    var html = '';
    saved.forEach(function(m, idx) {
        var uldList = m.ulds || m.pmcs || [];
        var nbUld = uldList.length;
        var totalColis = uldList.reduce(function(s, p) { return s + (p.totalColis || 0); }, 0);
        var ltas = getAllLtas(m).join(', ') || '-';
        var dateStr = m.timestamp ? new Date(m.timestamp).toLocaleString('fr-FR') : m.date || '';
        var dest = m.destAirport || '';
        html += '<div class="saved-item">' +
            '<div class="saved-item-info" onclick="loadManifest(_savedIds[' + idx + '])">' +
                '<div class="saved-item-id">' + esc(m.manifestId) + (dest ? ' \u2192 ' + esc(dest) : '') + '</div>' +
                '<div class="saved-item-meta">' + esc(m.client || '-') + ' | ' + nbUld + ' ULD | ' + totalColis + ' colis | LTA: ' + esc(ltas) + '</div>' +
                '<div class="saved-item-meta">' + esc(dateStr) + '</div>' +
            '</div>' +
            '<div class="saved-item-actions">' +
                '<button class="btn btn-primary" style="font-size:0.75em;padding:4px 8px;" onclick="loadManifest(_savedIds[' + idx + '])">Ouvrir</button>' +
                '<button class="btn btn-danger" onclick="event.stopPropagation();deleteSavedManifest(_savedIds[' + idx + '])">Suppr.</button>' +
            '</div></div>';
    });
    list.innerHTML = html;
}

function toggleSavedManifests() {
    var list = document.getElementById('savedManifestsList');
    var toggle = document.getElementById('savedToggle');
    if (list.style.display === 'none') { list.style.display = 'block'; toggle.textContent = 'Masquer'; }
    else { list.style.display = 'none'; toggle.textContent = 'Afficher'; }
}

// ============================================
// PDF GENERATION
// ============================================
function drawAthLogo(doc, x, y) {
    if (typeof ATH_LOGO_B64 !== 'undefined') {
        doc.addImage(ATH_LOGO_B64, 'PNG', x, y, 35, 18);
    } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(26, 58, 92);
        doc.text('ATH', x, y + 12);
    }
}

function buildPdf(data) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF('p', 'mm', 'a4');
    var pageW = doc.internal.pageSize.getWidth();
    var pageH = doc.internal.pageSize.getHeight();
    var margin = 15;
    var totalPages = 1 + data.ulds.length;

    function drawHeader(title) {
        doc.setFillColor(26, 58, 92);
        doc.rect(0, 0, pageW, 3, 'F');
        drawAthLogo(doc, margin, 6);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(26, 58, 92);
        doc.text(title, pageW / 2, 16, { align: 'center' });

        // Info box
        doc.setFillColor(240, 244, 248);
        doc.roundedRect(margin, 24, pageW - margin * 2, 20, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Manifeste : ' + data.manifestId, margin + 4, 30);
        doc.text('Date : ' + data.date, margin + 4, 35);
        doc.text('Agent : ' + data.agent, margin + 4, 40);

        if (data.client) {
            doc.setFont('helvetica', 'bold');
            doc.text('Client : ' + data.client, pageW / 2, 30);
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 30, 50);
        doc.text('Dest : ' + data.destAirport, pageW / 2, 35);

        var grandTotal = data.ulds.reduce(function(s, p) { return s + p.totalColis; }, 0);
        doc.setTextColor(26, 58, 92);
        doc.text('Total colis : ' + grandTotal, pageW - margin - 4, 30, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(data.ulds.length + ' ULD', pageW - margin - 4, 35, { align: 'right' });

        doc.setDrawColor(26, 58, 92);
        doc.setLineWidth(0.5);
        doc.line(margin, 46, pageW - margin, 46);
        return 50;
    }

    function drawFooter(pageNum) {
        doc.setFillColor(26, 58, 92);
        doc.rect(0, pageH - 8, pageW, 8, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(200, 210, 220);
        doc.text('ATH - Air Terminal Handling - Paris Roissy | Dest: ' + data.destAirport, margin, pageH - 3);
        doc.text('Page ' + pageNum + ' / ' + totalPages, pageW - margin, pageH - 3, { align: 'right' });
        doc.text('v' + APP_VERSION, pageW / 2, pageH - 3, { align: 'center' });
    }

    // PAGE 1 : Recap
    var startY = drawHeader('Recapitulatif Manifeste');
    var hasAnyWeight = data.ulds.some(function(u) { return u.weight > 0; });
    var summaryHead = hasAnyWeight ? [['ULD', 'LTA(s)', 'Nb Colis', 'Poids (kg)', 'DGR']] : [['ULD', 'LTA(s)', 'Nb Colis', 'DGR']];
    var summaryBody = data.ulds.map(function(u) {
        var ltaSet = {};
        u.rows.forEach(function(r) { if (r.lta) ltaSet[r.lta] = true; });
        var hasDgr = u.rows.some(function(r) { return r.dgr === 'O'; }) ? 'OUI' : 'NON';
        if (hasAnyWeight) {
            return [u.uldNumber, Object.keys(ltaSet).join(', '), String(u.totalColis), u.weight ? String(u.weight) : '-', hasDgr];
        }
        return [u.uldNumber, Object.keys(ltaSet).join(', '), String(u.totalColis), hasDgr];
    });
    var grandTotal = data.ulds.reduce(function(s, p) { return s + p.totalColis; }, 0);
    var grandWeight = data.ulds.reduce(function(s, u) { return s + (u.weight || 0); }, 0);
    if (hasAnyWeight) {
        summaryBody.push(['TOTAL', '', String(grandTotal), String(grandWeight), '']);
    } else {
        summaryBody.push(['TOTAL', '', String(grandTotal), '']);
    }

    doc.autoTable({
        startY: startY,
        head: summaryHead,
        body: summaryBody,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 4, lineColor: [200, 210, 220], lineWidth: 0.3 },
        headStyles: { fillColor: [26, 58, 92], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        didParseCell: function(h) {
            if (h.row.index === summaryBody.length - 1) { h.cell.styles.fontStyle = 'bold'; h.cell.styles.fillColor = [226, 232, 240]; }
        }
    });
    drawFooter(1);

    // One page per ULD
    data.ulds.forEach(function(u, idx) {
        doc.addPage();
        var y = drawHeader('ULD : ' + u.uldNumber);

        var ltaSet = {};
        u.rows.forEach(function(r) { if (r.lta) ltaSet[r.lta] = true; });
        var infoBoxH = u.weight > 0 ? 16 : 10;
        doc.setFillColor(240, 244, 248);
        doc.roundedRect(margin, y, pageW - margin * 2, infoBoxH, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(26, 58, 92);
        doc.text('LTA concernes :', margin + 4, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 51, 51);
        doc.text(Object.keys(ltaSet).join(', ') || 'N/A', margin + 42, y + 7);
        if (u.weight > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(26, 58, 92);
            doc.text('Poids :', margin + 4, y + 13);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 51, 51);
            doc.text(String(u.weight) + ' kg', margin + 22, y + 13);
        }
        y += infoBoxH + 4;

        var detailHead = [['LTA', 'Dossier', 'Nb Colis', 'DGR', 'Commentaire']];
        var detailBody = u.rows.map(function(r) { return [r.lta, r.dossier, String(r.colis), r.dgr, r.comment]; });
        detailBody.push(['', 'TOTAL', String(u.totalColis), '', '']);

        doc.autoTable({
            startY: y,
            head: detailHead,
            body: detailBody,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9, cellPadding: 4, lineColor: [200, 210, 220], lineWidth: 0.3 },
            headStyles: { fillColor: [26, 58, 92], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: { 0: { cellWidth: 30 }, 2: { cellWidth: 22, halign: 'center' }, 3: { cellWidth: 18, halign: 'center' } },
            didParseCell: function(h) {
                if (h.row.index === detailBody.length - 1) { h.cell.styles.fontStyle = 'bold'; h.cell.styles.fillColor = [226, 232, 240]; }
                if (h.column.index === 3 && h.cell.raw === 'O') { h.cell.styles.textColor = [200, 30, 50]; h.cell.styles.fontStyle = 'bold'; }
            }
        });
        drawFooter(idx + 2);
    });

    return doc;
}

async function generatePdf() {
    if (!validateRequired()) return;
    var data = collectData();
    if (data.ulds.length === 0) { alert('Veuillez ajouter au moins une ULD.'); return; }

    var doc = buildPdf(data);

    document.getElementById('manifestStatus').textContent = 'Genere';
    document.getElementById('manifestStatus').className = 'status status-generated';
    await saveManifest();

    var url = URL.createObjectURL(doc.output('blob'));
    window.open(url, '_blank');
}

// ============================================
// EMAIL SENDING
// ============================================
async function sendEmail() {
    if (!validateRequired()) return;
    var data = collectData();
    if (data.ulds.length === 0) { alert('Rien a envoyer.'); return; }
    if (!data.recipients) { alert('Veuillez renseigner au moins un destinataire.'); return; }

    var jwt = typeof getJwt === 'function' ? getJwt() : null;
    if (!jwt) { alert('Session expiree. Veuillez vous reconnecter.'); logout(); return; }

    var btn = document.getElementById('sendEmailBtn');
    btn.disabled = true;
    btn.textContent = 'Envoi en cours...';

    // Build HTML email body
    var allLtas = getAllLtas(data).join(', ') || '-';
    var grandTotal = data.ulds.reduce(function(s, u) { return s + u.totalColis; }, 0);

    var html = '<div style="font-family:Arial,sans-serif;max-width:700px;">';
    html += '<h2 style="color:#1a3a5c;">Loadsheet - ' + esc(data.manifestId) + '</h2>';
    html += '<p><strong>Client :</strong> ' + esc(data.client || '-') + ' | <strong>Dest :</strong> ' + esc(data.destAirport) + ' | <strong>Agent :</strong> ' + esc(data.agent) + '</p>';
    html += '<p><strong>Date :</strong> ' + esc(data.date) + ' | <strong>LTA :</strong> ' + esc(allLtas) + '</p>';
    html += '<hr style="border-color:#1a3a5c;">';

    // Summary table
    html += '<h3 style="color:#1a3a5c;">Recapitulatif (' + data.ulds.length + ' ULD - ' + grandTotal + ' colis)</h3>';
    var emailHasWeight = data.ulds.some(function(u) { return u.weight > 0; });
    html += '<table style="width:100%;border-collapse:collapse;font-size:14px;">';
    if (emailHasWeight) {
        html += '<tr style="background:#1a3a5c;color:#fff;"><th style="padding:8px;text-align:left;">ULD</th><th>LTA(s)</th><th>Nb Colis</th><th>Poids (kg)</th><th>DGR</th></tr>';
    } else {
        html += '<tr style="background:#1a3a5c;color:#fff;"><th style="padding:8px;text-align:left;">ULD</th><th>LTA(s)</th><th>Nb Colis</th><th>DGR</th></tr>';
    }
    data.ulds.forEach(function(u, idx) {
        var ltaSet = {};
        u.rows.forEach(function(r) { if (r.lta) ltaSet[r.lta] = true; });
        var bg = idx % 2 === 0 ? '#f5f7fa' : '#fff';
        var hasDgr = u.rows.some(function(r) { return r.dgr === 'O'; });
        html += '<tr style="background:' + bg + ';"><td style="padding:6px 8px;">' + esc(u.uldNumber) + '</td><td>' + esc(Object.keys(ltaSet).join(', ')) + '</td><td style="text-align:center;">' + u.totalColis + '</td>';
        if (emailHasWeight) html += '<td style="text-align:center;">' + (u.weight ? u.weight : '-') + '</td>';
        html += '<td style="text-align:center;' + (hasDgr ? 'color:red;font-weight:bold;' : '') + '">' + (hasDgr ? 'OUI' : 'NON') + '</td></tr>';
    });
    var emailGrandWeight = data.ulds.reduce(function(s, u) { return s + (u.weight || 0); }, 0);
    if (emailHasWeight) {
        html += '<tr style="background:#e2e8f0;font-weight:bold;"><td style="padding:6px 8px;">TOTAL</td><td></td><td style="text-align:center;">' + grandTotal + '</td><td style="text-align:center;">' + emailGrandWeight + '</td><td></td></tr>';
    } else {
        html += '<tr style="background:#e2e8f0;font-weight:bold;"><td style="padding:6px 8px;">TOTAL</td><td></td><td style="text-align:center;">' + grandTotal + '</td><td></td></tr>';
    }
    html += '</table>';

    // Detail per ULD
    data.ulds.forEach(function(u) {
        var uldTitle = 'ULD : ' + esc(u.uldNumber);
        if (u.weight > 0) uldTitle += ' — ' + u.weight + ' kg';
        html += '<h3 style="color:#1a3a5c;margin-top:20px;">' + uldTitle + '</h3>';
        html += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
        html += '<tr style="background:#1a3a5c;color:#fff;"><th style="padding:6px;">LTA</th><th>Dossier</th><th>Colis</th><th>DGR</th><th>Commentaire</th></tr>';
        u.rows.forEach(function(r, idx) {
            var bg = idx % 2 === 0 ? '#f5f7fa' : '#fff';
            html += '<tr style="background:' + bg + ';"><td style="padding:4px 6px;">' + esc(r.lta) + '</td><td>' + esc(r.dossier) + '</td><td style="text-align:center;">' + r.colis + '</td><td style="text-align:center;' + (r.dgr === 'O' ? 'color:red;font-weight:bold;' : '') + '">' + esc(r.dgr) + '</td><td>' + esc(r.comment) + '</td></tr>';
        });
        html += '<tr style="background:#e2e8f0;font-weight:bold;"><td></td><td>TOTAL</td><td style="text-align:center;">' + u.totalColis + '</td><td></td><td></td></tr>';
        html += '</table>';
    });

    html += '<hr style="border-color:#1a3a5c;margin-top:20px;"><p style="font-size:11px;color:#718096;">ATH - Air Terminal Handling - Paris Roissy | v' + APP_VERSION + '</p></div>';

    var allLtasSubject = getAllLtas(data).join('/') || '-';
    var subject = 'Loadsheet ' + allLtasSubject + ' - ' + data.destAirport + ' - ' + data.manifestId + (data.client ? ' - ' + data.client : '');

    // Generate PDF and convert to base64
    var pdfDoc = buildPdf(data);
    var pdfBase64 = pdfDoc.output('datauristring').split(',')[1];
    var pdfFilename = 'Loadsheet_' + data.manifestId + '_' + data.destAirport + '.pdf';

    try {
        var res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': jwt },
            body: JSON.stringify({ recipients: data.recipients, cc: data.cc, subject: subject, htmlBody: html, pdfBase64: pdfBase64, pdfFilename: pdfFilename })
        });
        var result = await res.json();
        if (res.ok) {
            alert('Email envoye avec succes !');
        } else {
            alert('Erreur: ' + (result.error || 'Echec envoi'));
        }
    } catch (err) {
        alert('Erreur reseau: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Envoyer par email';
    }
}
