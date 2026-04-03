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

const manifestId = generateManifestId();
document.getElementById('manifestId').textContent = manifestId;

let pmcCount = 0;

// --- Add a PMC block ---
function addPmc() {
    pmcCount++;
    const pmcIndex = pmcCount;
    const div = document.createElement('div');
    div.className = 'pmc-block';
    div.id = `pmc-${pmcIndex}`;
    div.innerHTML = `
        <div class="pmc-header">
            <label>PMC N° :</label>
            <input type="text" class="pmc-number" placeholder="Numéro PMC" style="width:180px">
            <button class="btn btn-danger" onclick="removePmc(${pmcIndex})">Supprimer PMC</button>
        </div>
        <table>
            <thead>
                <tr>
                    <th style="width:140px">LTA</th>
                    <th>Dossier</th>
                    <th style="width:100px">Nb Colis</th>
                    <th style="width:80px">DGR</th>
                    <th>Commentaire</th>
                    <th style="width:50px"></th>
                </tr>
            </thead>
            <tbody class="pmc-rows"></tbody>
        </table>
        <div class="pmc-totals">Total colis : <span class="total-colis">0</span></div>
        <div style="margin-top:8px">
            <button class="btn btn-secondary" onclick="addRow(${pmcIndex})">+ Ajouter ligne</button>
        </div>
    `;
    document.getElementById('pmcContainer').appendChild(div);
    addRow(pmcIndex);
}

// --- Add a row to a PMC ---
function addRow(pmcIndex) {
    const tbody = document.querySelector(`#pmc-${pmcIndex} .pmc-rows`);
    const rows = tbody.querySelectorAll('tr');
    // Default LTA from previous row
    let defaultLta = '';
    if (rows.length > 0) {
        const lastLtaInput = rows[rows.length - 1].querySelector('.lta-input');
        if (lastLtaInput) defaultLta = lastLtaInput.value;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="lta-input" value="${defaultLta}" placeholder="LTA"></td>
        <td><input type="text" class="dossier-input" placeholder="Dossier"></td>
        <td><input type="number" class="colis-input" min="0" value="0" onchange="updateTotals(${pmcIndex})" oninput="updateTotals(${pmcIndex})"></td>
        <td>
            <select class="dgr-input">
                <option value="N">N</option>
                <option value="O">O</option>
            </select>
        </td>
        <td><input type="text" class="comment-input" placeholder="Commentaire"></td>
        <td><button class="btn btn-danger" onclick="removeRow(this, ${pmcIndex})">×</button></td>
    `;
    tbody.appendChild(tr);
}

// --- Remove a row ---
function removeRow(btn, pmcIndex) {
    btn.closest('tr').remove();
    updateTotals(pmcIndex);
}

// --- Remove a PMC ---
function removePmc(pmcIndex) {
    const el = document.getElementById(`pmc-${pmcIndex}`);
    if (el) el.remove();
}

// --- Update totals ---
function updateTotals(pmcIndex) {
    const block = document.getElementById(`pmc-${pmcIndex}`);
    if (!block) return;
    const inputs = block.querySelectorAll('.colis-input');
    let total = 0;
    inputs.forEach(inp => { total += parseInt(inp.value) || 0; });
    block.querySelector('.total-colis').textContent = total;
}

// --- Show generate section ---
function showGenerateSection() {
    document.getElementById('generateSection').style.display = 'block';
    document.getElementById('generateSection').scrollIntoView({ behavior: 'smooth' });
}

// --- Collect all data ---
function collectData() {
    const pmcs = [];
    document.querySelectorAll('.pmc-block').forEach(block => {
        const pmcNumber = block.querySelector('.pmc-number').value || 'N/A';
        const rows = [];
        block.querySelectorAll('.pmc-rows tr').forEach(tr => {
            rows.push({
                lta: tr.querySelector('.lta-input').value,
                dossier: tr.querySelector('.dossier-input').value,
                colis: parseInt(tr.querySelector('.colis-input').value) || 0,
                dgr: tr.querySelector('.dgr-input').value,
                comment: tr.querySelector('.comment-input').value,
            });
        });
        const totalColis = rows.reduce((s, r) => s + r.colis, 0);
        pmcs.push({ pmcNumber, rows, totalColis });
    });
    return {
        manifestId,
        date: new Date().toLocaleDateString('fr-FR'),
        recipients: document.getElementById('recipients').value,
        cc: document.getElementById('cc').value,
        pmcs,
    };
}

// --- PDF Generation ---
function generatePdf() {
    const { jsPDF } = window.jspdf;
    const data = collectData();

    if (data.pmcs.length === 0) {
        alert('Veuillez ajouter au moins une PMC.');
        return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;

    // --- Helper: draw header ---
    function drawHeader(title) {
        // Logo placeholder
        doc.setFillColor(44, 82, 130);
        doc.rect(margin, 10, 30, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('LOADSHEET', margin + 2, 18);

        doc.setTextColor(44, 82, 130);
        doc.setFontSize(14);
        doc.text(title, margin + 35, 18);

        // Manifest info line
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(`Manifeste : ${data.manifestId}    |    Date : ${data.date}`, margin, 28);

        doc.setDrawColor(44, 82, 130);
        doc.setLineWidth(0.5);
        doc.line(margin, 31, pageW - margin, 31);
    }

    // =============================================
    // PAGE 1 : Récapitulatif de toutes les PMC
    // =============================================
    drawHeader('Récapitulatif Manifeste');

    // Summary table: per PMC
    const summaryHead = [['PMC', 'LTA(s)', 'Nb Colis', 'DGR']];
    const summaryBody = data.pmcs.map(pmc => {
        const ltas = [...new Set(pmc.rows.map(r => r.lta).filter(Boolean))].join(', ');
        const hasDgr = pmc.rows.some(r => r.dgr === 'O') ? 'OUI' : 'NON';
        return [pmc.pmcNumber, ltas, String(pmc.totalColis), hasDgr];
    });

    const grandTotal = data.pmcs.reduce((s, p) => s + p.totalColis, 0);
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
            // Bold total row
            if (hookData.row.index === summaryBody.length - 1) {
                hookData.cell.styles.fontStyle = 'bold';
                hookData.cell.styles.fillColor = [226, 232, 240];
            }
        }
    });

    // =============================================
    // ONE PAGE PER PMC
    // =============================================
    data.pmcs.forEach(pmc => {
        doc.addPage();
        drawHeader(`PMC : ${pmc.pmcNumber}`);

        // LTA recap block
        const ltas = [...new Set(pmc.rows.map(r => r.lta).filter(Boolean))];
        let y = 35;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 82, 130);
        doc.text('LTA concernés :', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 51, 51);
        doc.text(ltas.join(', ') || 'N/A', margin + 40, y);
        y += 8;

        // Detail table
        const detailHead = [['LTA', 'Dossier', 'Nb Colis', 'DGR', 'Commentaire']];
        const detailBody = pmc.rows.map(r => [
            r.lta, r.dossier, String(r.colis), r.dgr, r.comment
        ]);
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
                // Highlight DGR = O
                if (hookData.column.index === 3 && hookData.cell.raw === 'O') {
                    hookData.cell.styles.textColor = [220, 38, 38];
                    hookData.cell.styles.fontStyle = 'bold';
                }
            }
        });
    });

    // Update manifest status
    const statusEl = document.getElementById('manifestStatus');
    statusEl.textContent = 'Généré';
    statusEl.className = 'status status-generated';

    // Open PDF in new tab
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
}

// --- Initialize with one PMC ---
addPmc();
