// --- Version ---
var APP_VERSION = "1.4.1";

// --- Storage ---
var STORAGE_KEY = "loadsheet_manifests";
var MAX_SAVED = 20;

// --- State ---
var manifestId = '';
var uldCount = 0;

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
function initApp() {
    newManifest();
    refreshSavedList();
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
    div.innerHTML =
        '<div class="uld-header">' +
            '<label>ULD N\u00b0 :</label>' +
            '<input type="text" class="uld-number" placeholder="Num\u00e9ro ULD" style="width:180px">' +
            '<button class="btn btn-danger" onclick="removeUld(' + i + ')">Supprimer ULD</button>' +
        '</div>' +
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
        '<td><input type="text" class="lta-input" value="' + defaultLta + '" placeholder="LTA"></td>' +
        '<td><input type="text" class="dossier-input" placeholder="Dossier"></td>' +
        '<td><input type="number" class="colis-input" min="0" value="0" onchange="updateTotals(' + uldIndex + ')" oninput="updateTotals(' + uldIndex + ')"></td>' +
        '<td><select class="dgr-input"><option value="N">N</option><option value="O">O</option></select></td>' +
        '<td><input type="text" class="comment-input" placeholder="Commentaire"></td>' +
        '<td><button class="btn btn-danger" onclick="removeRow(this,' + uldIndex + ')">x</button></td>';
    tbody.appendChild(tr);
}

function removeRow(btn, i) { btn.closest('tr').remove(); updateTotals(i); }
function removeUld(i) { var el = document.getElementById('uld-' + i); if (el) el.remove(); }

function updateTotals(i) {
    var block = document.getElementById('uld-' + i);
    if (!block) return;
    var total = 0;
    block.querySelectorAll('.colis-input').forEach(function(inp) { total += parseInt(inp.value) || 0; });
    block.querySelector('.total-colis').textContent = total;
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
        ulds.push({ uldNumber: uldNumber, rows: rows, totalColis: totalColis });
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
function getSavedManifests() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
}

function saveManifest() {
    var data = collectData();
    if (data.ulds.length === 0) { alert('Rien a sauvegarder.'); return; }
    var saved = getSavedManifests();
    var idx = saved.findIndex(function(m) { return m.manifestId === data.manifestId; });
    if (idx >= 0) { saved[idx] = data; } else { saved.unshift(data); if (saved.length > MAX_SAVED) saved.pop(); }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    refreshSavedList();
    alert('Manifeste ' + data.manifestId + ' sauvegarde.');
}

function deleteSavedManifest(id) {
    if (!confirm('Supprimer ce manifeste ?')) return;
    var saved = getSavedManifests().filter(function(m) { return m.manifestId !== id; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    refreshSavedList();
}

function loadManifest(id) {
    var saved = getSavedManifests();
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
    uldList.forEach(function(uldData) {
        uldCount++;
        var i = uldCount;
        var div = document.createElement('div');
        div.className = 'uld-block';
        div.id = 'uld-' + i;
        div.innerHTML =
            '<div class="uld-header"><label>ULD N\u00b0 :</label>' +
            '<input type="text" class="uld-number" placeholder="Num\u00e9ro ULD" style="width:180px" value="' + (uldData.uldNumber || uldData.pmcNumber || '') + '">' +
            '<button class="btn btn-danger" onclick="removeUld(' + i + ')">Supprimer ULD</button></div>' +
            '<table><thead><tr><th style="width:140px">LTA</th><th>Dossier</th><th style="width:100px">Nb Colis</th><th style="width:80px">DGR</th><th>Commentaire</th><th style="width:50px"></th></tr></thead><tbody class="uld-rows"></tbody></table>' +
            '<div class="uld-totals">Total colis : <span class="total-colis">0</span></div>' +
            '<div style="margin-top:8px"><button class="btn btn-secondary" onclick="addRow(' + i + ')">+ Ajouter ligne</button></div>';
        document.getElementById('pmcContainer').appendChild(div);
        var tbody = div.querySelector('.uld-rows');
        uldData.rows.forEach(function(r) {
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><input type="text" class="lta-input" value="' + (r.lta || '') + '"></td>' +
                '<td><input type="text" class="dossier-input" value="' + (r.dossier || '') + '"></td>' +
                '<td><input type="number" class="colis-input" min="0" value="' + (r.colis || 0) + '" onchange="updateTotals(' + i + ')" oninput="updateTotals(' + i + ')"></td>' +
                '<td><select class="dgr-input"><option value="N"' + (r.dgr === 'N' ? ' selected' : '') + '>N</option><option value="O"' + (r.dgr === 'O' ? ' selected' : '') + '>O</option></select></td>' +
                '<td><input type="text" class="comment-input" value="' + (r.comment || '') + '"></td>' +
                '<td><button class="btn btn-danger" onclick="removeRow(this,' + i + ')">x</button></td>';
            tbody.appendChild(tr);
        });
        updateTotals(i);
    });
}

function refreshSavedList() {
    var saved = getSavedManifests();
    document.getElementById('savedCount').textContent = saved.length;
    var list = document.getElementById('savedManifestsList');
    if (saved.length === 0) {
        list.innerHTML = '<div style="color:#a0aec0;font-size:0.9em;padding:8px 0;">Aucun manifeste sauvegarde.</div>';
        return;
    }
    var html = '';
    saved.forEach(function(m) {
        var uldList = m.ulds || m.pmcs || [];
        var nbUld = uldList.length;
        var totalColis = uldList.reduce(function(s, p) { return s + (p.totalColis || 0); }, 0);
        var ltas = getAllLtas(m).join(', ') || '-';
        var dateStr = m.timestamp ? new Date(m.timestamp).toLocaleString('fr-FR') : m.date || '';
        var dest = m.destAirport || '';
        html += '<div class="saved-item">' +
            '<div class="saved-item-info" onclick="loadManifest(\'' + m.manifestId + '\')">' +
                '<div class="saved-item-id">' + m.manifestId + (dest ? ' \u2192 ' + dest : '') + '</div>' +
                '<div class="saved-item-meta">' + (m.client || '-') + ' | ' + nbUld + ' ULD | ' + totalColis + ' colis | LTA: ' + ltas + '</div>' +
                '<div class="saved-item-meta">' + dateStr + '</div>' +
            '</div>' +
            '<div class="saved-item-actions">' +
                '<button class="btn btn-primary" style="font-size:0.75em;padding:4px 8px;" onclick="loadManifest(\'' + m.manifestId + '\')">Ouvrir</button>' +
                '<button class="btn btn-danger" onclick="event.stopPropagation();deleteSavedManifest(\'' + m.manifestId + '\')">Suppr.</button>' +
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
    var summaryHead = [['ULD', 'LTA(s)', 'Nb Colis', 'DGR']];
    var summaryBody = data.ulds.map(function(u) {
        var ltaSet = {};
        u.rows.forEach(function(r) { if (r.lta) ltaSet[r.lta] = true; });
        var hasDgr = u.rows.some(function(r) { return r.dgr === 'O'; }) ? 'OUI' : 'NON';
        return [u.uldNumber, Object.keys(ltaSet).join(', '), String(u.totalColis), hasDgr];
    });
    var grandTotal = data.ulds.reduce(function(s, p) { return s + p.totalColis; }, 0);
    summaryBody.push(['TOTAL', '', String(grandTotal), '']);

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
        doc.setFillColor(240, 244, 248);
        doc.roundedRect(margin, y, pageW - margin * 2, 10, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(26, 58, 92);
        doc.text('LTA concernes :', margin + 4, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 51, 51);
        doc.text(Object.keys(ltaSet).join(', ') || 'N/A', margin + 42, y + 7);
        y += 14;

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

function generatePdf() {
    if (!validateRequired()) return;
    var data = collectData();
    if (data.ulds.length === 0) { alert('Veuillez ajouter au moins une ULD.'); return; }

    var doc = buildPdf(data);

    document.getElementById('manifestStatus').textContent = 'Genere';
    document.getElementById('manifestStatus').className = 'status status-generated';
    saveManifest();

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
    html += '<h2 style="color:#1a3a5c;">Loadsheet - ' + data.manifestId + '</h2>';
    html += '<p><strong>Client :</strong> ' + (data.client || '-') + ' | <strong>Dest :</strong> ' + data.destAirport + ' | <strong>Agent :</strong> ' + data.agent + '</p>';
    html += '<p><strong>Date :</strong> ' + data.date + ' | <strong>LTA :</strong> ' + allLtas + '</p>';
    html += '<hr style="border-color:#1a3a5c;">';

    // Summary table
    html += '<h3 style="color:#1a3a5c;">Recapitulatif (' + data.ulds.length + ' ULD - ' + grandTotal + ' colis)</h3>';
    html += '<table style="width:100%;border-collapse:collapse;font-size:14px;">';
    html += '<tr style="background:#1a3a5c;color:#fff;"><th style="padding:8px;text-align:left;">ULD</th><th>LTA(s)</th><th>Nb Colis</th><th>DGR</th></tr>';
    data.ulds.forEach(function(u, idx) {
        var ltaSet = {};
        u.rows.forEach(function(r) { if (r.lta) ltaSet[r.lta] = true; });
        var bg = idx % 2 === 0 ? '#f5f7fa' : '#fff';
        var hasDgr = u.rows.some(function(r) { return r.dgr === 'O'; });
        html += '<tr style="background:' + bg + ';"><td style="padding:6px 8px;">' + u.uldNumber + '</td><td>' + Object.keys(ltaSet).join(', ') + '</td><td style="text-align:center;">' + u.totalColis + '</td><td style="text-align:center;' + (hasDgr ? 'color:red;font-weight:bold;' : '') + '">' + (hasDgr ? 'OUI' : 'NON') + '</td></tr>';
    });
    html += '<tr style="background:#e2e8f0;font-weight:bold;"><td style="padding:6px 8px;">TOTAL</td><td></td><td style="text-align:center;">' + grandTotal + '</td><td></td></tr>';
    html += '</table>';

    // Detail per ULD
    data.ulds.forEach(function(u) {
        html += '<h3 style="color:#1a3a5c;margin-top:20px;">ULD : ' + u.uldNumber + '</h3>';
        html += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
        html += '<tr style="background:#1a3a5c;color:#fff;"><th style="padding:6px;">LTA</th><th>Dossier</th><th>Colis</th><th>DGR</th><th>Commentaire</th></tr>';
        u.rows.forEach(function(r, idx) {
            var bg = idx % 2 === 0 ? '#f5f7fa' : '#fff';
            html += '<tr style="background:' + bg + ';"><td style="padding:4px 6px;">' + r.lta + '</td><td>' + r.dossier + '</td><td style="text-align:center;">' + r.colis + '</td><td style="text-align:center;' + (r.dgr === 'O' ? 'color:red;font-weight:bold;' : '') + '">' + r.dgr + '</td><td>' + r.comment + '</td></tr>';
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
            body: JSON.stringify({ recipients: data.recipients, cc: data.cc, subject: subject, htmlBody: html, _token: jwt, pdfBase64: pdfBase64, pdfFilename: pdfFilename })
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
