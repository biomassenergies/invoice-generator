const fs = require('fs');
const path = require('path');

module.exports = (invoiceData) => {
  const firm = {
    name: 'MAHALAXMI AGRO ENERGIES',
    address:
      '70, Mahakali Nagar 3, Mhalginagar, Hudkeshwar Ring Road, Nagpur 34',
    contactNo: '8550952303',
    gstn: '27BOPPP0960N1Z7',
    state: 'MAHARASHTRA',
    email: 'biomassenergies@gmail.com',
    bankName: 'STATE BANK OF INDIA',
    accountNo: '39935045918',
    branchIfsc: 'UDAY NAGAR  SBIN0017637'
  };

  const {
    invoiceNumber,
    consigneeName,
    buyer,
    date,
    items,
    customerState,
    consigneeDetails = {},
    buyerDetails = {},
    invoiceMeta = {}
  } = invoiceData;

  const isMaharashtra = String(customerState || '').trim().toUpperCase() === 'MAHARASHTRA';
  const sealPath = path.join(__dirname, '../../frontend/public/mae-seal.png');
  const sealDataUri = fs.existsSync(sealPath)
    ? `data:image/png;base64,${fs.readFileSync(sealPath).toString('base64')}`
    : '';

  const pan = firm.gstn.slice(2, 12);
  const formatText = (value) => (value ? String(value) : '');
  const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

  const amountInWords = (value) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = [
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const twoDigits = (num) => {
      if (num < 10) return ones[num];
      if (num < 20) return teens[num - 10];
      return `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${ones[num % 10]}` : ''}`.trim();
    };

    const threeDigits = (num) => {
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      return `${hundred ? `${ones[hundred]} Hundred` : ''}${hundred && rest ? ' ' : ''}${rest ? twoDigits(rest) : ''}`.trim();
    };

    const integer = Math.floor(Number(value || 0));
    if (!integer) return 'INR Zero Only';

    const crore = Math.floor(integer / 10000000);
    const lakh = Math.floor((integer % 10000000) / 100000);
    const thousand = Math.floor((integer % 100000) / 1000);
    const hundred = integer % 1000;

    const parts = [];
    if (crore) parts.push(`${threeDigits(crore)} Crore`);
    if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
    if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
    if (hundred) parts.push(threeDigits(hundred));

    return `INR ${parts.join(' ').trim()} Only`;
  };

  let totalSGST = 0;
  let totalCGST = 0;
  let totalIGST = 0;
  let totalTaxable = 0;
  const transportValue = Number(invoiceMeta.transportValue || 0);

  const itemRows = items.map((item, index) => {
    const amount = Number(item.amount || 0);
    totalTaxable += amount;

    let sgstAmt = 0;
    let cgstAmt = 0;
    let igstAmt = 0;

    if (isMaharashtra) {
      sgstAmt = amount * 0.025;
      cgstAmt = amount * 0.025;
      totalSGST += sgstAmt;
      totalCGST += cgstAmt;
    } else {
      igstAmt = amount * 0.05;
      totalIGST += igstAmt;
    }

    return `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><strong>${formatText(item.product)}</strong></td>
        <td class="text-center">${formatText(item.hsn)}</td>
        <td class="text-right">${Number(item.qty || 0).toFixed(2)}</td>
        <td class="text-right">${Number(item.rate || 0).toFixed(2)}</td>
        <td class="text-center">${formatText(item.per || 'PCS')}</td>
        <td class="text-right">${amount.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const totalAmount = totalTaxable + totalSGST + totalCGST + totalIGST + transportValue;
  const totalTaxAmount = totalSGST + totalCGST + totalIGST;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          font-family: Arial, sans-serif;
          color: #111;
          margin: 0;
          font-size: 10px;
        }
        .sheet {
          width: 100%;
        }
        .title {
          text-align: center;
          font-weight: 700;
          margin: 0 0 6px;
        }
        .frame {
          border: 1px solid #222;
        }
        .top {
          display: grid;
          grid-template-columns: 1.12fr 1.88fr;
        }
        .seller {
          border-right: 1px solid #222;
          border-bottom: 1px solid #222;
          padding: 6px 7px;
          line-height: 1.35;
        }
        .seller-name {
          font-weight: 700;
        }
        .meta-table, .items-table, .tax-table {
          width: 100%;
          border-collapse: collapse;
        }
        .meta-wrap {
          border-bottom: 1px solid #222;
        }
        .meta-table td {
          border-right: 1px solid #222;
          border-bottom: 1px solid #222;
          padding: 4px 6px;
          vertical-align: top;
        }
        .meta-table tr:last-child td {
          border-bottom: 0;
        }
        .meta-table td:last-child {
          border-right: 0;
        }
        .second {
          display: grid;
          grid-template-columns: 1.08fr 1.08fr 1.84fr;
        }
        .box {
          border-right: 1px solid #222;
          border-bottom: 1px solid #222;
          padding: 6px 7px;
          min-height: 84px;
          line-height: 1.35;
        }
        .box:last-child {
          border-right: 0;
        }
        .box-title {
          font-weight: 700;
          margin-bottom: 2px;
        }
        .items-table th,
        .items-table td,
        .tax-table th,
        .tax-table td {
          border: 1px solid #222;
          padding: 4px 5px;
        }
        .items-table th,
        .tax-table th {
          text-align: center;
          font-weight: 700;
        }
        .items-table {
          margin-top: -1px;
        }
        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
        }
        .words {
          border-left: 1px solid #222;
          border-right: 1px solid #222;
          border-bottom: 1px solid #222;
          padding: 5px 7px;
          line-height: 1.35;
        }
        .bottom {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          border-left: 1px solid #222;
          border-right: 1px solid #222;
          border-bottom: 1px solid #222;
        }
        .bottom-cell {
          border-right: 1px solid #222;
          padding: 6px 7px;
          min-height: 88px;
          line-height: 1.35;
        }
        .bottom-cell:last-child {
          border-right: 0;
        }
        .label {
          font-weight: 700;
        }
        .signature {
          text-align: center;
          padding-top: 12px;
          font-weight: 700;
        }
        .seal {
          display: block;
          width: 90px;
          height: 90px;
          object-fit: contain;
          margin: 0 auto 8px;
        }
        .footer-note {
          text-align: center;
          font-size: 8px;
          margin-top: 3px;
        }
        .small {
          font-size: 8.5px;
        }
        .payable-summary {
          border-left: 1px solid #222;
          border-right: 1px solid #222;
          border-bottom: 1px solid #222;
          padding: 6px 7px;
        }
        .payable-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 4px;
        }
        .payable-row:last-child {
          margin-bottom: 0;
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="title">TAX INVOICE</div>

        <div class="frame">
          <div class="top">
            <div class="seller">
              <div class="seller-name">${firm.name}</div>
              <div>${firm.address}</div>
              <div><span class="label">GSTIN</span> ${firm.gstn}</div>
              <div><span class="label">State</span> ${firm.state}</div>
              <div><span class="label">Contact</span> ${firm.contactNo}</div>
              <div><span class="label">Mail</span> ${firm.email}</div>
            </div>
            <div class="meta-wrap">
              <table class="meta-table">
                <tr>
                  <td>Invoice No.</td>
                  <td>${formatText(invoiceNumber)}</td>
                  <td>Dated</td>
                  <td>${formatText(date)}</td>
                </tr>
                <tr>
                  <td>Delivery Note</td>
                  <td>${formatText(invoiceMeta.deliveryNote)}</td>
                  <td>Payment Mode/Terms</td>
                  <td>${formatText(invoiceMeta.paymentTerms)}</td>
                </tr>
                <tr>
                  <td>Supplier Ref.</td>
                  <td>${formatText(invoiceMeta.supplierRef)}</td>
                  <td>Other Reference(s)</td>
                  <td>${formatText(invoiceMeta.otherReference)}</td>
                </tr>
                <tr>
                  <td>Buyer's Order No.</td>
                  <td>${formatText(invoiceMeta.buyerOrderNo)}</td>
                  <td>Dated</td>
                  <td>${formatText(invoiceMeta.buyerOrderDate)}</td>
                </tr>
                <tr>
                  <td>Despatch Document No.</td>
                  <td>${formatText(invoiceMeta.despatchDocumentNo || invoiceNumber)}</td>
                  <td>Delivery Note Date</td>
                  <td>${formatText(invoiceMeta.deliveryNoteDate)}</td>
                </tr>
                <tr>
                  <td>Despatch Through</td>
                  <td>${formatText(invoiceMeta.despatchThrough)}</td>
                  <td>Destination</td>
                  <td>${formatText(invoiceMeta.destination)}</td>
                </tr>
                <tr>
                  <td>Bill of Lading/LR-RR No.</td>
                  <td>${formatText(invoiceMeta.billOfLading)}</td>
                  <td>Motor Vehicle Number</td>
                  <td>${formatText(invoiceMeta.vehicleNumber)}</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="second">
            <div class="box">
              <div class="box-title">Consignee</div>
              <div>${formatText(consigneeDetails.name || consigneeName)}</div>
              <div>${formatText(consigneeDetails.address)}</div>
              <div><span class="label">GSTIN</span> ${formatText(consigneeDetails.gstn)}</div>
              <div><span class="label">State</span> ${formatText(consigneeDetails.state)}</div>
              <div><span class="label">Mail</span> ${formatText(consigneeDetails.email)}</div>
            </div>
            <div class="box">
              <div class="box-title">Buyer (If Other Than Consignee)</div>
              <div>${formatText(buyerDetails.name || buyer)}</div>
              <div>${formatText(buyerDetails.address)}</div>
              <div><span class="label">GSTIN</span> ${formatText(buyerDetails.gstn)}</div>
              <div><span class="label">State</span> ${formatText(buyerDetails.state)}</div>
              <div><span class="label">Mail</span> ${formatText(buyerDetails.email)}</div>
            </div>
            <div class="box">
              <div class="box-title">Terms Of Delivery</div>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Description Of Goods</th>
              <th>HSN Code</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Per</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr>
              <td></td>
              <td class="text-right"><strong>Total</strong></td>
              <td></td>
              <td class="text-right"><strong>-</strong></td>
              <td></td>
              <td></td>
              <td class="text-right"><strong>${totalTaxable.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="words">
          <div><span class="label">Amount Chargeable (in words)</span></div>
          <div>${amountInWords(totalAmount)}</div>
        </div>

        <table class="tax-table">
          <thead>
            <tr>
              <th rowspan="2">HSN Code</th>
              <th rowspan="2">Taxable Value</th>
              <th colspan="2">Central Tax</th>
              <th colspan="2">State Tax</th>
              <th rowspan="2">Total Tax Amount</th>
            </tr>
            <tr>
              <th>Rate</th>
              <th>Amount</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${formatText(items[0]?.hsn)}</td>
              <td>${totalTaxable.toFixed(2)}</td>
              <td>${isMaharashtra ? '2.50%' : '0.00%'}</td>
              <td>${totalCGST.toFixed(2)}</td>
              <td>${isMaharashtra ? '2.50%' : '5.00%'}</td>
              <td>${(isMaharashtra ? totalSGST : totalIGST).toFixed(2)}</td>
              <td>${totalTaxAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Total</strong></td>
              <td><strong>${totalTaxable.toFixed(2)}</strong></td>
              <td></td>
              <td><strong>${totalCGST.toFixed(2)}</strong></td>
              <td></td>
              <td><strong>${(isMaharashtra ? totalSGST : totalIGST).toFixed(2)}</strong></td>
              <td><strong>${totalTaxAmount.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="payable-summary">
          ${transportValue > 0 ? `
          <div class="payable-row">
            <span class="label">Transport Charges</span>
            <strong>${formatCurrency(transportValue)}</strong>
          </div>
          ` : ''}
          <div class="payable-row">
            <span class="label">Total Payable Amount</span>
            <strong>${formatCurrency(totalAmount)}</strong>
          </div>
        </div>

        <div class="words">
          <div><span class="label">Total Payable Amount (in words)</span></div>
          <div>${amountInWords(totalAmount)}</div>
        </div>

        <div class="bottom">
          <div class="bottom-cell">
            <div><span class="label">PAN</span> ${pan}</div>
            <div class="small" style="margin-top:6px;">
              <div class="label">Declaration</div>
              <div>We declare that this invoice shows the actual price of the goods described and that all particulars given are true and correct.</div>
            </div>
          </div>
          <div class="bottom-cell">
            <div><span class="label">Bank Name</span> ${firm.bankName}</div>
            <div><span class="label">A/c No.</span> ${firm.accountNo}</div>
            <div><span class="label">Branch & IFSC</span> ${firm.branchIfsc}</div>
          </div>
          <div class="bottom-cell signature">
            ${sealDataUri ? `<img src="${sealDataUri}" alt="Company Seal" class="seal" />` : ''}
            <div>For ${firm.name}</div>
            <div style="margin-top:30px;">Authorised Signatory</div>
          </div>
        </div>

        <div class="footer-note">This is a computer generated invoice</div>
      </div>
    </body>
    </html>
  `;
};
