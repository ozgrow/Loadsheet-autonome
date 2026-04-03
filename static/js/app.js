// --- Version ---
const APP_VERSION = "1.0.6";

// --- Manifest ID generation ---
function generateManifestId() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 900) + 100);
    return `MAN-${y}${m}${d}-${h}${min}-${seq}`;
}

let manifestId = '';
let pmcCount = 0;

function initApp() {
    manifestId = generateManifestId();
    document.getElementById('manifestId').textContent = manifestId;
    document.getElementById('appVersion').textContent = 'v' + APP_VERSION;
    pmcCount = 0;
    addPmc();
}

// --- Add a PMC block ---
function addPmc() {
    pmcCount++;
    const pmcIndex = pmcCount;
    const div = document.createElement('div');
    div.className = 'pmc-block';
    div.id = 'pmc-' + pmcIndex;
    div.innerHTML =
        '<div class="pmc-header">' +
            '<label>PMC N\u00b0 :</label>' +
            '<input type="text" class="pmc-number" placeholder="Num\u00e9ro PMC" style="width:180px">' +
            '<button class="btn btn-danger" onclick="removePmc(' + pmcIndex + ')">Supprimer PMC</button>' +
        '</div>' +
        '<table>' +
            '<thead><tr>' +
                '<th style="width:140px">LTA</th>' +
                '<th>Dossier</th>' +
                '<th style="width:100px">Nb Colis</th>' +
                '<th style="width:80px">DGR</th>' +
                '<th>Commentaire</th>' +
                '<th style="width:50px"></th>' +
            '</tr></thead>' +
            '<tbody class="pmc-rows"></tbody>' +
        '</table>' +
        '<div class="pmc-totals">Total colis : <span class="total-colis">0</span></div>' +
        '<div style="margin-top:8px">' +
            '<button class="btn btn-secondary" onclick="addRow(' + pmcIndex + ')">+ Ajouter ligne</button>' +
        '</div>';
    document.getElementById('pmcContainer').appendChild(div);
    addRow(pmcIndex);
}

// --- Add a row to a PMC ---
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
        '<td><button class="btn btn-danger" onclick="removeRow(this, ' + pmcIndex + ')">x</button></td>';
    tbody.appendChild(tr);
}

// --- Remove a row ---
function removeRow(btn, pmcIndex) {
    btn.closest('tr').remove();
    updateTotals(pmcIndex);
}

// --- Remove a PMC ---
function removePmc(pmcIndex) {
    var el = document.getElementById('pmc-' + pmcIndex);
    if (el) el.remove();
}

// --- Update totals ---
function updateTotals(pmcIndex) {
    var block = document.getElementById('pmc-' + pmcIndex);
    if (!block) return;
    var inputs = block.querySelectorAll('.colis-input');
    var total = 0;
    inputs.forEach(function(inp) { total += parseInt(inp.value) || 0; });
    block.querySelector('.total-colis').textContent = total;
}

// --- Show generate section ---
function showGenerateSection() {
    document.getElementById('generateSection').style.display = 'block';
    document.getElementById('generateSection').scrollIntoView({ behavior: 'smooth' });
}

// --- Collect all data ---
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
                comment: tr.querySelector('.comment-input').value,
            });
        });
        var totalColis = rows.reduce(function(s, r) { return s + r.colis; }, 0);
        pmcs.push({ pmcNumber: pmcNumber, rows: rows, totalColis: totalColis });
    });
    return {
        manifestId: manifestId,
        date: new Date().toLocaleDateString('fr-FR'),
        recipients: document.getElementById('recipients').value,
        cc: document.getElementById('cc').value,
        pmcs: pmcs,
    };
}

// --- PDF Generation ---
function generatePdf() {
    var jsPDF = window.jspdf.jsPDF;
    var data = collectData();

    if (data.pmcs.length === 0) {
        alert('Veuillez ajouter au moins une PMC.');
        return;
    }

    var doc = new jsPDF('p', 'mm', 'a4');
    var pageW = doc.internal.pageSize.getWidth();
    var margin = 15;

    function drawHeader(title) {
        doc.setFillColor(44, 82, 130);
        doc.rect(margin, 10, 30, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('LOADSHEET', margin + 2, 18);

        doc.setTextColor(44, 82, 130);
        doc.setFontSize(14);
        doc.text(title, margin + 35, 18);

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('Manifeste : ' + data.manifestId + '    |    Date : ' + data.date, margin, 28);

        doc.setDrawColor(44, 82, 130);
        doc.setLineWidth(0.5);
        doc.line(margin, 31, pageW - margin, 31);
    }

    // PAGE 1 : Recap
    drawHeader('R\u00e9capitulatif Manifeste');

    var summaryHead = [['PMC', 'LTA(s)', 'Nb Colis', 'DGR']];
    var summaryBody = data.pmcs.map(function(pmc) {
        var ltaSet = {};
        pmc.rows.forEach(function(r) { if (r.lta) ltaSet[r.lta] = true; });
        var ltas = Object.keys(ltaSet).join(', ');
        var hasDgr = pmc.rows.some(function(r) { return r.dgr === 'O'; }) ? 'OUI' : 'NON';
        return [pmc.pmcNumber, ltas, String(pmc.totalColis), hasDgr];
    });

    var grandTotal = data.pmcs.reduce(function(s, p) { return s + p.totalColis; }, 0);
    summaryBody.push(['TOTAL', '', String(grandTotal), '']);

    doc.autoTable({
        startY: 35,
        head: summaryHead,
        body: summaryBody,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [44, 82, 130], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 244, 248] },
        didParseCell: function(hookData) {
            if (hookData.row.index === summaryBody.length - 1) {
                hookData.cell.styles.fontStyle = 'bold';
                hookData.cell.styles.fillColor = [226, 232, 240];
            }
        }
    });

    // One page per PMC
    data.pmcs.forEach(function(pmc) {
        doc.addPage();
        drawHeader('PMC : ' + pmc.pmcNumber);

        var ltaSet = {};
        pmc.rows.forEach(function(r) { if (r.lta) ltaSet[r.lta] = true; });
        var ltas = Object.keys(ltaSet);
        var y = 35;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 82, 130);
        doc.text('LTA concern\u00e9s :', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 51, 51);
        doc.text(ltas.join(', ') || 'N/A', margin + 40, y);
        y += 8;

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
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [44, 82, 130], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 244, 248] },
            columnStyles: {
                0: { cellWidth: 30 },
                2: { cellWidth: 22, halign: 'center' },
                3: { cellWidth: 18, halign: 'center' },
            },
            didParseCell: function(hookData) {
                if (hookData.row.index === detailBody.length - 1) {
                    hookData.cell.styles.fontStyle = 'bold';
                    hookData.cell.styles.fillColor = [226, 232, 240];
                }
                if (hookData.column.index === 3 && hookData.cell.raw === 'O') {
                    hookData.cell.styles.textColor = [220, 38, 38];
                    hookData.cell.styles.fontStyle = 'bold';
                }
            }
        });
    });

    // Update status
    document.getElementById('manifestStatus').textContent = 'G\u00e9n\u00e9r\u00e9';
    document.getElementById('manifestStatus').className = 'status status-generated';

    // Open PDF
    var pdfBlob = doc.output('blob');
    var url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
}
