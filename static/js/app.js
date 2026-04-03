// --- Version ---
var APP_VERSION = "1.1.0";

// --- Storage ---
var STORAGE_KEY = "loadsheet_manifests";
var MAX_SAVED = 20;

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

var manifestId = '';
var pmcCount = 0;

function initApp() {
    manifestId = generateManifestId();
    document.getElementById('manifestId').textContent = manifestId;
    document.getElementById('appVersion').textContent = 'v' + APP_VERSION;
    document.getElementById('clientName').value = '';
    document.getElementById('pmcContainer').innerHTML = '';
    document.getElementById('generateSection').style.display = 'none';
    document.getElementById('manifestStatus').textContent = 'Brouillon';
    document.getElementById('manifestStatus').className = 'status status-draft';
    pmcCount = 0;
    addPmc();
    refreshSavedList();
}

// --- PMC ---
function addPmc() {
    pmcCount++;
    var pmcIndex = pmcCount;
    var div = document.createElement('div');
    div.className = 'pmc-block';
    div.id = 'pmc-' + pmcIndex;
    div.innerHTML =
        '<div class="pmc-header">' +
            '<label>PMC N\u00b0 :</label>' +
            '<input type="text" class="pmc-number" placeholder="Num\u00e9ro PMC" style="width:180px">' +
            '<button class="btn btn-danger" onclick="removePmc(' + pmcIndex + ')">Supprimer PMC</button>' +
        '</div>' +
        '<table><thead><tr>' +
            '<th style="width:140px">LTA</th>' +
            '<th>Dossier</th>' +
            '<th style="width:100px">Nb Colis</th>' +
            '<th style="width:80px">DGR</th>' +
            '<th>Commentaire</th>' +
            '<th style="width:50px"></th>' +
        '</tr></thead><tbody class="pmc-rows"></tbody></table>' +
        '<div class="pmc-totals">Total colis : <span class="total-colis">0</span></div>' +
        '<div style="margin-top:8px">' +
            '<button class="btn btn-secondary" onclick="addRow(' + pmcIndex + ')">+ Ajouter ligne</button>' +
        '</div>';
    document.getElementById('pmcContainer').appendChild(div);
    addRow(pmcIndex);
}

function addRow(pmcIndex) {
    var tbody = document.querySelector('#pmc-' + pmcIndex + ' .pmc-rows');
    if (!tbody) return;
    var rows = tbody.querySelectorAll('tr');
    var defaultLta = '';
    if (rows.length > 0) {
        var lastLtaInput = rows[rows.length - 1].querySelector('.lta-input');
        if (lastLtaInput) defaultLta = lastLtaInput.value;
    }
    var tr = document.createElement('tr');
    tr.innerHTML =
        '<td><input type="text" class="lta-input" value="' + defaultLta + '" placeholder="LTA"></td>' +
        '<td><input type="text" class="dossier-input" placeholder="Dossier"></td>' +
        '<td><input type="number" class="colis-input" min="0" value="0" onchange="updateTotals(' + pmcIndex + ')" oninput="updateTotals(' + pmcIndex + ')"></td>' +
        '<td><select class="dgr-input"><option value="N">N</option><option value="O">O</option></select></td>' +
        '<td><input type="text" class="comment-input" placeholder="Commentaire"></td>' +
        '<td><button class="btn btn-danger" onclick="removeRow(this,' + pmcIndex + ')">x</button></td>';
    tbody.appendChild(tr);
}

function removeRow(btn, pmcIndex) {
    btn.closest('tr').remove();
    updateTotals(pmcIndex);
}

function removePmc(pmcIndex) {
    var el = document.getElementById('pmc-' + pmcIndex);
    if (el) el.remove();
}

function updateTotals(pmcIndex) {
    var block = document.getElementById('pmc-' + pmcIndex);
    if (!block) return;
    var inputs = block.querySelectorAll('.colis-input');
    var total = 0;
    inputs.forEach(function(inp) { total += parseInt(inp.value) || 0; });
    block.querySelector('.total-colis').textContent = total;
}

function showGenerateSection() {
    document.getElementById('generateSection').style.display = 'block';
    document.getElementById('generateSection').scrollIntoView({ behavior: 'smooth' });
}

// --- Collect data ---
function collectData() {
    var pmcs = [];
    document.querySelectorAll('.pmc-block').forEach(function(block) {
        var pmcNumber = block.querySelector('.pmc-number').value || 'N/A';
        var rows = [];
        block.querySelectorAll('.pmc-rows tr').forEach(function(tr) {
            rows.push({
                lta: tr.querySelector('.lta-input').value,
                dossier: tr.querySelector('.dossier-input').value,
                colis: parseInt(tr.querySelector('.colis-input').value) || 0,
                dgr: tr.querySelector('.dgr-input').value,
                comment: tr.querySelector('.comment-input').value
            });
        });
        var totalColis = rows.reduce(function(s, r) { return s + r.colis; }, 0);
        pmcs.push({ pmcNumber: pmcNumber, rows: rows, totalColis: totalColis });
    });
    return {
        manifestId: manifestId,
        client: document.getElementById('clientName').value || '',
        date: new Date().toLocaleDateString('fr-FR'),
        timestamp: new Date().toISOString(),
        recipients: document.getElementById('recipients').value,
        cc: document.getElementById('cc').value,
        pmcs: pmcs
    };
}

// ============================================
// SAVE / LOAD MANIFESTS (localStorage)
// ============================================
function getSavedManifests() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveManifest() {
    var data = collectData();
    if (data.pmcs.length === 0) { alert('Rien a sauvegarder.'); return; }
    var saved = getSavedManifests();
    // Update if same manifestId exists, else add
    var idx = saved.findIndex(function(m) { return m.manifestId === data.manifestId; });
    if (idx >= 0) {
        saved[idx] = data;
    } else {
        saved.unshift(data);
        if (saved.length > MAX_SAVED) saved.pop();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    refreshSavedList();
    alert('Manifeste ' + data.manifestId + ' sauvegarde.');
}

function deleteSavedManifest(id) {
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
    document.getElementById('pmcContainer').innerHTML = '';
    document.getElementById('generateSection').style.display = 'none';
    document.getElementById('manifestStatus').textContent = 'Brouillon';
    document.getElementById('manifestStatus').className = 'status status-draft';
    pmcCount = 0;

    data.pmcs.forEach(function(pmcData) {
        pmcCount++;
        var pmcIndex = pmcCount;
        var div = document.createElement('div');
        div.className = 'pmc-block';
        div.id = 'pmc-' + pmcIndex;
        div.innerHTML =
            '<div class="pmc-header">' +
                '<label>PMC N\u00b0 :</label>' +
                '<input type="text" class="pmc-number" placeholder="Num\u00e9ro PMC" style="width:180px" value="' + (pmcData.pmcNumber || '') + '">' +
                '<button class="btn btn-danger" onclick="removePmc(' + pmcIndex + ')">Supprimer PMC</button>' +
            '</div>' +
            '<table><thead><tr>' +
                '<th style="width:140px">LTA</th><th>Dossier</th><th style="width:100px">Nb Colis</th><th style="width:80px">DGR</th><th>Commentaire</th><th style="width:50px"></th>' +
            '</tr></thead><tbody class="pmc-rows"></tbody></table>' +
            '<div class="pmc-totals">Total colis : <span class="total-colis">0</span></div>' +
            '<div style="margin-top:8px"><button class="btn btn-secondary" onclick="addRow(' + pmcIndex + ')">+ Ajouter ligne</button></div>';
        document.getElementById('pmcContainer').appendChild(div);

        var tbody = div.querySelector('.pmc-rows');
        pmcData.rows.forEach(function(r) {
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><input type="text" class="lta-input" value="' + (r.lta || '') + '" placeholder="LTA"></td>' +
                '<td><input type="text" class="dossier-input" value="' + (r.dossier || '') + '" placeholder="Dossier"></td>' +
                '<td><input type="number" class="colis-input" min="0" value="' + (r.colis || 0) + '" onchange="updateTotals(' + pmcIndex + ')" oninput="updateTotals(' + pmcIndex + ')"></td>' +
                '<td><select class="dgr-input"><option value="N"' + (r.dgr === 'N' ? ' selected' : '') + '>N</option><option value="O"' + (r.dgr === 'O' ? ' selected' : '') + '>O</option></select></td>' +
                '<td><input type="text" class="comment-input" value="' + (r.comment || '') + '" placeholder="Commentaire"></td>' +
                '<td><button class="btn btn-danger" onclick="removeRow(this,' + pmcIndex + ')">x</button></td>';
            tbody.appendChild(tr);
        });
        updateTotals(pmcIndex);
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
        var nbPmc = m.pmcs ? m.pmcs.length : 0;
        var totalColis = m.pmcs ? m.pmcs.reduce(function(s, p) { return s + (p.totalColis || 0); }, 0) : 0;
        var dateStr = m.timestamp ? new Date(m.timestamp).toLocaleString('fr-FR') : m.date || '';
        html += '<div class="saved-item" onclick="loadManifest(\'' + m.manifestId + '\')">' +
            '<div class="saved-item-info">' +
                '<div class="saved-item-id">' + m.manifestId + '</div>' +
                '<div class="saved-item-meta">' + (m.client || 'Sans client') + ' | ' + nbPmc + ' PMC | ' + totalColis + ' colis | ' + dateStr + '</div>' +
            '</div>' +
            '<div class="saved-item-actions">' +
                '<button class="btn btn-danger" onclick="event.stopPropagation();deleteSavedManifest(\'' + m.manifestId + '\')">Suppr.</button>' +
            '</div></div>';
    });
    list.innerHTML = html;
}

function toggleSavedManifests() {
    var list = document.getElementById('savedManifestsList');
    var toggle = document.getElementById('savedToggle');
    if (list.style.display === 'none') {
        list.style.display = 'block';
        toggle.textContent = 'Masquer';
    } else {
        list.style.display = 'none';
        toggle.textContent = 'Afficher';
    }
}

// ============================================
// PDF GENERATION — ATH branding
// ============================================
function drawAthLogo(doc, x, y) {
    // "ath" text in cursive blue
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(22);
    doc.setTextColor(26, 58, 92);
    doc.text('ath', x, y + 10);

    // Red accent line (diagonal)
    doc.setDrawColor(200, 30, 50);
    doc.setLineWidth(1.2);
    doc.line(x + 18, y + 2, x + 26, y - 4);

    // Small red plane triangle
    doc.setFillColor(200, 30, 50);
    doc.triangle(x + 26, y - 4, x + 23, y - 2, x + 26, y - 7, 'F');

    // Sub text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text('Air Terminal Handling', x, y + 14);
    doc.setFont('helvetica', 'bold');
    doc.text('PARIS ROISSY', x + 22, y + 14);
}

function generatePdf() {
    var jsPDF = window.jspdf.jsPDF;
    var data = collectData();

    if (data.pmcs.length === 0) {
        alert('Veuillez ajouter au moins une PMC.');
        return;
    }

    var doc = new jsPDF('p', 'mm', 'a4');
    var pageW = doc.internal.pageSize.getWidth();
    var pageH = doc.internal.pageSize.getHeight();
    var margin = 15;

    function drawHeader(title) {
        // Blue header bar
        doc.setFillColor(26, 58, 92);
        doc.rect(0, 0, pageW, 3, 'F');

        // ATH Logo
        drawAthLogo(doc, margin, 10);

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(26, 58, 92);
        doc.text(title, pageW / 2, 16, { align: 'center' });

        // Manifest info box
        doc.setFillColor(240, 244, 248);
        doc.roundedRect(margin, 22, pageW - margin * 2, 16, 2, 2, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text('Manifeste : ' + data.manifestId, margin + 4, 28);
        doc.text('Date : ' + data.date, margin + 4, 33);

        if (data.client) {
            doc.setFont('helvetica', 'bold');
            doc.text('Client : ' + data.client, pageW / 2, 28);
        }

        var grandTotal = data.pmcs.reduce(function(s, p) { return s + p.totalColis; }, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('Total colis : ' + grandTotal, pageW - margin - 4, 28, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.text(data.pmcs.length + ' PMC', pageW - margin - 4, 33, { align: 'right' });

        // Separator
        doc.setDrawColor(26, 58, 92);
        doc.setLineWidth(0.5);
        doc.line(margin, 40, pageW - margin, 40);

        return 44;
    }

    function drawFooter(pageNum, totalPages) {
        doc.setFillColor(26, 58, 92);
        doc.rect(0, pageH - 8, pageW, 8, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(200, 210, 220);
        doc.text('ATH - Air Terminal Handling - Paris Roissy', margin, pageH - 3);
        doc.text('Page ' + pageNum + ' / ' + totalPages, pageW - margin, pageH - 3, { align: 'right' });
        doc.text('v' + APP_VERSION, pageW / 2, pageH - 3, { align: 'center' });
    }

    var totalPages = 1 + data.pmcs.length;

    // =============================================
    // PAGE 1 : Recap
    // =============================================
    var startY = drawHeader('Recapitulatif Manifeste');

    var summaryHead = [['PMC', 'LTA(s)', 'Nb Colis', 'DGR']];
    var summaryBody = data.pmcs.map(function(pmc) {
        var ltaSet = {};
        pmc.rows.forEach(function(r) { if (r.lta) ltaSet[r.lta] = true; });
        var hasDgr = pmc.rows.some(function(r) { return r.dgr === 'O'; }) ? 'OUI' : 'NON';
        return [pmc.pmcNumber, Object.keys(ltaSet).join(', '), String(pmc.totalColis), hasDgr];
    });

    var grandTotal = data.pmcs.reduce(function(s, p) { return s + p.totalColis; }, 0);
    summaryBody.push(['TOTAL', '', String(grandTotal), '']);

    doc.autoTable({
        startY: startY,
        head: summaryHead,
        body: summaryBody,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 4, lineColor: [200, 210, 220], lineWidth: 0.3 },
        headStyles: { fillColor: [26, 58, 92], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        didParseCell: function(hookData) {
            if (hookData.row.index === summaryBody.length - 1) {
                hookData.cell.styles.fontStyle = 'bold';
                hookData.cell.styles.fillColor = [226, 232, 240];
            }
        }
    });

    drawFooter(1, totalPages);

    // =============================================
    // One page per PMC
    // =============================================
    data.pmcs.forEach(function(pmc, idx) {
        doc.addPage();
        var y = drawHeader('PMC : ' + pmc.pmcNumber);

        // LTA recap block
        var ltaSet = {};
        pmc.rows.forEach(function(r) { if (r.lta) ltaSet[r.lta] = true; });
        var ltas = Object.keys(ltaSet);

        doc.setFillColor(240, 244, 248);
        doc.roundedRect(margin, y, pageW - margin * 2, 10, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(26, 58, 92);
        doc.text('LTA concernes :', margin + 4, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 51, 51);
        doc.text(ltas.join(', ') || 'N/A', margin + 42, y + 7);
        y += 14;

        // Detail table
        var detailHead = [['LTA', 'Dossier', 'Nb Colis', 'DGR', 'Commentaire']];
        var detailBody = pmc.rows.map(function(r) {
            return [r.lta, r.dossier, String(r.colis), r.dgr, r.comment];
        });
        detailBody.push(['', 'TOTAL', String(pmc.totalColis), '', '']);

        doc.autoTable({
            startY: y,
            head: detailHead,
            body: detailBody,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9, cellPadding: 4, lineColor: [200, 210, 220], lineWidth: 0.3 },
            headStyles: { fillColor: [26, 58, 92], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { cellWidth: 30 },
                2: { cellWidth: 22, halign: 'center' },
                3: { cellWidth: 18, halign: 'center' }
            },
            didParseCell: function(hookData) {
                if (hookData.row.index === detailBody.length - 1) {
                    hookData.cell.styles.fontStyle = 'bold';
                    hookData.cell.styles.fillColor = [226, 232, 240];
                }
                if (hookData.column.index === 3 && hookData.cell.raw === 'O') {
                    hookData.cell.styles.textColor = [200, 30, 50];
                    hookData.cell.styles.fontStyle = 'bold';
                }
            }
        });

        drawFooter(idx + 2, totalPages);
    });

    // Update status
    document.getElementById('manifestStatus').textContent = 'Genere';
    document.getElementById('manifestStatus').className = 'status status-generated';

    // Auto-save on generate
    saveManifest();

    // Open PDF
    var pdfBlob = doc.output('blob');
    var url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
}
