const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { JWT } = require('google-auth-library');
require('dotenv').config();

const WORKBOOK_PATH = path.join(__dirname, '../Invoice Generator.xlsx');
const ENV_PATH = path.join(__dirname, '.env');
const SHEET_NAMES = ['CUSTOMER DETAILS', 'PRODUCT TABLE', 'INVOICE DETAILS'];

function loadCredentials() {
  const candidates = [
    path.join(__dirname, 'credentials.json'),
    path.join(__dirname, 'credentials.json.json')
  ];

  const credentialsPath = candidates.find(filePath => fs.existsSync(filePath));
  if (!credentialsPath) {
    throw new Error('Missing credentials.json file in backend/');
  }

  return require(credentialsPath);
}

async function getAccessToken() {
  const creds = loadCredentials();
  const auth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ]
  });

  const token = await auth.authorize();
  return token.access_token;
}

async function googleRequest(url, options = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`Google API error ${response.status}: ${data.error?.message || text}`);
  }

  return data;
}

function workbookToRows(sheet) {
  const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const headers = Object.keys(jsonRows[0] || {});

  return [
    headers,
    ...jsonRows.map(row => headers.map(header => row[header] ?? ''))
  ];
}

function updateEnvSheetId(newSheetId) {
  const env = fs.readFileSync(ENV_PATH, 'utf8');
  const next = env.match(/^SHEET_ID=/m)
    ? env.replace(/^SHEET_ID=.*$/m, `SHEET_ID=${newSheetId}`)
    : `${env.trim()}\nSHEET_ID=${newSheetId}\n`;

  fs.writeFileSync(ENV_PATH, `${next.trim()}\n`);
}

async function getOriginalOwnerEmail() {
  if (!process.env.SHEET_ID) {
    return null;
  }

  try {
    const data = await googleRequest(
      `https://www.googleapis.com/drive/v3/files/${process.env.SHEET_ID}?fields=owners(emailAddress)`
    );
    return data.owners?.[0]?.emailAddress || null;
  } catch {
    return null;
  }
}

async function shareSpreadsheet(spreadsheetId, emailAddress) {
  if (!emailAddress) {
    return;
  }

  await googleRequest(
    `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
    {
      method: 'POST',
      body: JSON.stringify({
        role: 'writer',
        type: 'user',
        emailAddress
      })
    }
  );
}

async function main() {
  if (!fs.existsSync(WORKBOOK_PATH)) {
    throw new Error(`Workbook not found: ${WORKBOOK_PATH}`);
  }

  const workbook = XLSX.readFile(WORKBOOK_PATH);
  const ownerEmail = await getOriginalOwnerEmail();

  const spreadsheet = await googleRequest('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        title: `Invoice Generator Data ${new Date().toISOString().slice(0, 10)}`
      },
      sheets: SHEET_NAMES.map(name => ({
        properties: { title: name }
      }))
    })
  });

  for (const sheetName of SHEET_NAMES) {
    const rows = workbookToRows(workbook.Sheets[sheetName]);
    const range = encodeURIComponent(`${sheetName}!A1`);

    await googleRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.spreadsheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: 'PUT',
        body: JSON.stringify({
          range: `${sheetName}!A1`,
          majorDimension: 'ROWS',
          values: rows
        })
      }
    );
  }

  await shareSpreadsheet(spreadsheet.spreadsheetId, ownerEmail);
  updateEnvSheetId(spreadsheet.spreadsheetId);

  console.log(
    JSON.stringify(
      {
        spreadsheetId: spreadsheet.spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheetId}/edit`,
        sharedWith: ownerEmail
      },
      null,
      2
    )
  );
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
