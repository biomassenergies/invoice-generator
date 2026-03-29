const fs = require('fs');
const path = require('path');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

module.exports = (quotationData) => {
  const logoPath = path.join(__dirname, '../../frontend/public/mae-logo.png');
  const logoDataUri = fs.existsSync(logoPath)
    ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
    : '';

  const {
    quoteNumber,
    quoteDate,
    discussionDate,
    recipient = {},
    items = [],
    notes = {},
    totals = {}
  } = quotationData;

  const itemRows = items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.product)}</td>
          <td>${Number(item.quantity || 0).toLocaleString('en-IN')}</td>
          <td>${formatCurrency(item.unitRate)}</td>
          <td>${formatCurrency(item.totalAmount)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <style>
          @page {
            size: A4;
            margin: 14mm;
          }
          body {
            margin: 0;
            color: #1c2238;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
          }
          .page {
            border: 1px solid #d6dceb;
            border-radius: 18px;
            overflow: hidden;
          }
          .hero {
            padding: 18px 22px 16px;
            background: linear-gradient(135deg, #f6efe0 0%, #fff 42%, #eef2ff 100%);
            border-bottom: 1px solid #d6dceb;
          }
          .brand {
            display: table;
            width: 100%;
          }
          .brand-cell {
            display: table-cell;
            vertical-align: top;
          }
          .brand-logo {
            width: 72px;
            height: 72px;
            object-fit: contain;
            margin-right: 16px;
          }
          .brand-name {
            font-size: 25px;
            font-weight: 700;
            letter-spacing: 0.04em;
            color: #18203c;
            margin-bottom: 4px;
          }
          .brand-copy {
            color: #4c5679;
            font-size: 11px;
          }
          .quote-meta {
            text-align: right;
          }
          .quote-label {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 999px;
            background: #1f8f56;
            color: white;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 10px;
          }
          .quote-number {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .meta-copy {
            color: #4c5679;
            font-size: 11px;
          }
          .section {
            padding: 18px 22px 0;
          }
          .section-title {
            margin: 0 0 8px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #6a4f16;
          }
          .to-card,
          .note-card,
          .terms-card {
            background: #f8faff;
            border: 1px solid #dfe5f1;
            border-radius: 16px;
            padding: 14px 16px;
          }
          .to-name {
            font-size: 18px;
            font-weight: 700;
            color: #1a2340;
            margin-bottom: 4px;
          }
          .muted {
            color: #54607f;
          }
          .body-copy {
            margin-top: 12px;
            color: #2f3856;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .items-wrap {
            margin-top: 12px;
            border: 1px solid #dfe5f1;
            border-radius: 16px;
            overflow: hidden;
          }
          .items-table thead {
            background: #eef2fb;
          }
          .items-table th,
          .items-table td {
            padding: 12px 14px;
            border-bottom: 1px solid #e7ebf4;
            text-align: left;
          }
          .items-table th {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: #5d6788;
          }
          .items-table tbody tr:last-child td {
            border-bottom: 0;
          }
          .total-row td {
            font-weight: 700;
            background: #f8fafc;
          }
          .details-grid {
            display: table;
            width: 100%;
            table-layout: fixed;
            border-spacing: 0 12px;
          }
          .details-col {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 8px;
          }
          .details-col:last-child {
            padding-right: 0;
            padding-left: 8px;
          }
          .detail-item {
            margin-bottom: 8px;
          }
          .detail-label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #7c869f;
            margin-bottom: 3px;
          }
          .detail-value {
            font-size: 13px;
            font-weight: 600;
            color: #1f2742;
          }
          ul {
            margin: 0;
            padding-left: 18px;
          }
          li {
            margin-bottom: 8px;
          }
          .footer {
            padding: 18px 22px 22px;
            color: #55617d;
          }
          .footer strong {
            color: #1f2742;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="hero">
            <div class="brand">
              <div class="brand-cell">
                ${
                  logoDataUri
                    ? `<img src="${logoDataUri}" alt="MAE logo" class="brand-logo" />`
                    : ''
                }
              </div>
              <div class="brand-cell">
                <div class="brand-name">MAHALAXMI AGRO ENERGIES</div>
                <div class="brand-copy">
                  70, Mahakali Nagar 3, Mhalginagar, Hudkeshwar Ring Road, Nagpur 34<br />
                  GSTIN: 27BOPPP0960N1Z7 | Contact: 8550952303 | Mail: biomassenergies@gmail.com
                </div>
              </div>
              <div class="brand-cell quote-meta">
                <div class="quote-label">Quotation</div>
                <div class="quote-number">${escapeHtml(quoteNumber)}</div>
                <div class="meta-copy">Date: ${escapeHtml(quoteDate)}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">To</div>
            <div class="to-card">
              <div class="to-name">${escapeHtml(recipient.companyName)}</div>
              ${
                recipient.gstin
                  ? `<div><strong>GSTIN:</strong> ${escapeHtml(recipient.gstin)}</div>`
                  : ''
              }
              ${recipient.address ? `<div class="muted">${escapeHtml(recipient.address)}</div>` : ''}
              <div class="body-copy">
                Hi Team,<br /><br />
                As per our discussion dated ${escapeHtml(
                  discussionDate
                )}, we are pleased to share our quotation for the following products and services. We assure that the commercial and supply standards discussed with your team will be maintained throughout our business relationship.
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Quoted Products</div>
            <div class="items-wrap">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Sr.</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Rate</th>
                    <th>Total Quote</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                  <tr class="total-row">
                    <td></td>
                    <td>Total</td>
                    <td></td>
                    <td></td>
                    <td>${formatCurrency(totals.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="section">
            <div class="details-grid">
              <div class="details-col">
                <div class="section-title">Commercial Notes</div>
                <div class="note-card">
                  <div class="detail-item">
                    <span class="detail-label">Transport</span>
                    <div class="detail-value">${escapeHtml(notes.transportNote)}</div>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Delivery Commitment</span>
                    <div class="detail-value">${escapeHtml(notes.deliveryLeadTime)}</div>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Payment Terms</span>
                    <div class="detail-value">${escapeHtml(notes.paymentTerms)}</div>
                  </div>
                  ${
                    notes.additionalNotes
                      ? `
                        <div class="detail-item">
                          <span class="detail-label">Additional Notes</span>
                          <div class="detail-value">${escapeHtml(notes.additionalNotes)}</div>
                        </div>
                      `
                      : ''
                  }
                </div>
              </div>
              <div class="details-col">
                <div class="section-title">Standard Terms</div>
                <div class="terms-card">
                  <ul>
                    <li>${escapeHtml(notes.transportTerm)}</li>
                    <li>${escapeHtml(notes.orderTerm)}</li>
                    <li>${escapeHtml(notes.orderConfirmationTerm)}</li>
                    <li>${escapeHtml(notes.paymentTerm)}</li>
                    <li>${escapeHtml(notes.declaration)}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <strong>For MAHALAXMI AGRO ENERGIES</strong><br />
            Authorized Signatory
          </div>
        </div>
      </body>
    </html>
  `;
};
