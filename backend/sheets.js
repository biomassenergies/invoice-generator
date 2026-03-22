const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

const SHEET_ID = process.env.SHEET_ID;
const GOOGLE_SHEET_MIME_TYPE = 'application/vnd.google-apps.spreadsheet';
const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function getCredentialsPath() {
  if (process.env.CREDENTIALS_PATH && fs.existsSync(process.env.CREDENTIALS_PATH)) {
    return process.env.CREDENTIALS_PATH;
  }

  const candidates = [
    path.join(__dirname, 'credentials.json'),
    path.join(__dirname, 'credentials.json.json')
  ];

  const found = candidates.find(filePath => fs.existsSync(filePath));

  if (!found) {
    throw new Error(
      'Google credentials file not found. Expected backend/credentials.json or backend/credentials.json.json'
    );
  }

  return found;
}

function createAuthClient() {
  const creds = process.env.GOOGLE_CREDENTIALS_JSON
    ? JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
    : require(getCredentialsPath());

  return new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ]
  });
}

async function getAccessToken() {
  const auth = createAuthClient();
  const token = await auth.authorize();
  return token.access_token;
}

async function driveRequest(url, options = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Drive API error ${response.status}: ${message}`);
  }

  return response;
}

async function sheetsRequest(url, options = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Sheets API error ${response.status}: ${message}`);
  }

  return response;
}

async function getFileMetadata() {
  if (!SHEET_ID) {
    throw new Error('SHEET_ID is missing in backend/.env');
  }

  const response = await driveRequest(
    `https://www.googleapis.com/drive/v3/files/${SHEET_ID}?fields=id,name,mimeType`
  );
  return response.json();
}

async function getGoogleSheetSource() {
  const doc = new GoogleSpreadsheet(SHEET_ID, createAuthClient());
  await doc.loadInfo();

  return {
    type: 'google_sheet',
    metadata: {
      id: SHEET_ID,
      name: doc.title,
      mimeType: GOOGLE_SHEET_MIME_TYPE
    },
    doc
  };
}

async function getDriveExcelSource(metadata) {
  const response = await driveRequest(
    `https://www.googleapis.com/drive/v3/files/${SHEET_ID}?alt=media`
  );
  const buffer = Buffer.from(await response.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  return {
    type: 'drive_excel',
    metadata,
    workbook
  };
}

async function getSource() {
  const metadata = await getFileMetadata();

  if (metadata.mimeType === GOOGLE_SHEET_MIME_TYPE) {
    return getGoogleSheetSource();
  }

  if (metadata.mimeType === EXCEL_MIME_TYPE) {
    return getDriveExcelSource(metadata);
  }

  throw new Error(
    `Unsupported file type for SHEET_ID: ${metadata.mimeType}. Expected a Google Sheet or .xlsx file.`
  );
}

function getWorksheetHeaderValues(worksheet) {
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  return normalizeHeaders(rows[0] || []);
}

function normalizeHeaders(headers) {
  const counts = {};

  return headers.map(header => {
    if (!header) {
      return header;
    }

    counts[header] = (counts[header] || 0) + 1;
    return counts[header] === 1 ? header : `${header}_${counts[header]}`;
  });
}

function worksheetToStructuredData(worksheet) {
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  const headers = normalizeHeaders(rows[0] || []);
  const dataRows = rows
    .slice(1)
    .filter(row => row.some(value => value !== '' && value !== null && value !== undefined));

  const data = dataRows.map(row => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index] ?? '';
    });
    return entry;
  });

  return { headers, data };
}

async function getGoogleSheetValues(sheetName) {
  const range = encodeURIComponent(`${sheetName}!A:ZZ`);
  const response = await sheetsRequest(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`
  );
  const data = await response.json();
  return data.values || [];
}

function valuesToStructuredData(values) {
  const headers = normalizeHeaders(values[0] || []);
  const dataRows = values
    .slice(1)
    .filter(row => row.some(value => value !== '' && value !== null && value !== undefined));

  const data = dataRows.map(row => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index] ?? '';
    });
    return entry;
  });

  return { headers, data };
}

function getWorksheetFromWorkbook(workbook, sheetName) {
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(
      `Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`
    );
  }

  return worksheet;
}

function buildWorkbookDoc(source) {
  const sheetsByTitle = {};

  source.workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = source.workbook.Sheets[sheetName];
    const range = worksheet['!ref']
      ? XLSX.utils.decode_range(worksheet['!ref'])
      : XLSX.utils.decode_range('A1');

    sheetsByTitle[sheetName] = {
      title: sheetName,
      rowCount: range.e.r + 1,
      columnCount: range.e.c + 1,
      index
    };
  });

  return {
    title: source.metadata.name,
    sourceType: source.type,
    sheetsByTitle
  };
}

async function uploadWorkbook(workbook) {
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  await driveRequest(
    `https://www.googleapis.com/upload/drive/v3/files/${SHEET_ID}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': EXCEL_MIME_TYPE
      },
      body: buffer
    }
  );
}

function classifyGoogleError(err) {
  const message = err?.message || 'Unknown Google Sheets error';
  const statusCode = err?.response?.status;

  if (message.includes('SHEET_ID is missing')) {
    return {
      type: 'missing_sheet_id',
      message,
      suggestion: 'Set SHEET_ID in backend/.env to your Google spreadsheet ID.'
    };
  }

  if (message.includes('Google credentials file not found')) {
    return {
      type: 'missing_credentials',
      message,
      suggestion: 'Add backend/credentials.json or rename the downloaded file to that name.'
    };
  }

  if (message.includes('invalid_grant') || message.includes('Invalid JWT')) {
    return {
      type: 'invalid_service_account_credentials',
      message,
      suggestion: 'Re-download the service account JSON key and replace the credentials file.'
    };
  }

  if (message.includes('This operation is not supported for this document')) {
    return {
      type: 'unsupported_document_type',
      message,
      suggestion:
        'The configured SHEET_ID points to an Excel file in Drive, not a native Google Sheet. The app can now use either format directly.'
    };
  }

  if (message.includes('ENOTFOUND') || message.includes('EAI_AGAIN') || message.includes('EACCES')) {
    return {
      type: 'network_blocked',
      message,
      suggestion:
        'Check internet access, firewall, antivirus, proxy, or corporate network restrictions for Node.js HTTPS traffic.'
    };
  }

  if (statusCode === 401 || statusCode === 403 || message.includes('The caller does not have permission')) {
    return {
      type: 'sheet_access_denied',
      message,
      suggestion:
        'Share the Google file with the service account email from the credentials file and verify the necessary Google APIs are enabled.'
    };
  }

  if (message.includes('Sheet "') && message.includes('not found')) {
    return {
      type: 'worksheet_missing',
      message,
      suggestion:
        'Verify the worksheet titles exactly match CUSTOMER DETAILS, PRODUCT TABLE, and INVOICE DETAILS.'
    };
  }

  return {
    type: 'unknown_google_error',
    message,
    suggestion:
      'Check the backend logs and validate credentials, file sharing, API enablement, and network access.'
  };
}

async function getDoc() {
  try {
    const source = await getSource();

    if (source.type === 'google_sheet') {
      console.log(`Connected to Google Sheet: ${source.doc.title}`);
      console.log(`Available sheets: ${Object.keys(source.doc.sheetsByTitle).join(', ')}`);
      return source.doc;
    }

    const workbookDoc = buildWorkbookDoc(source);
    console.log(`Connected to Drive workbook: ${workbookDoc.title}`);
    console.log(`Available sheets: ${Object.keys(workbookDoc.sheetsByTitle).join(', ')}`);
    return workbookDoc;
  } catch (err) {
    console.error('Error loading spreadsheet:', err.message);
    throw err;
  }
}

async function getSheet(sheetName) {
  const source = await getSource();

  if (source.type === 'google_sheet') {
    const sheet = source.doc.sheetsByTitle[sheetName];

    if (!sheet) {
      throw new Error(
        `Sheet "${sheetName}" not found. Available sheets: ${Object.keys(source.doc.sheetsByTitle).join(', ')}`
      );
    }

    return {
      sourceType: source.type,
      sheet
    };
  }

  const worksheet = getWorksheetFromWorkbook(source.workbook, sheetName);
  return {
    sourceType: source.type,
    workbook: source.workbook,
    worksheet
  };
}

async function getSheetData(sheetName) {
  try {
    const result = await getSheet(sheetName);

    if (result.sourceType === 'google_sheet') {
      const values = await getGoogleSheetValues(sheetName);
      return valuesToStructuredData(values);
    }

    return worksheetToStructuredData(result.worksheet);
  } catch (err) {
    console.error(`Error fetching data from sheet "${sheetName}":`, err);
    throw err;
  }
}

async function addRowToSheet(sheetName, rowData) {
  try {
    const result = await getSheet(sheetName);

    if (result.sourceType === 'google_sheet') {
      const values = await getGoogleSheetValues(sheetName);
      const headers = normalizeHeaders(values[0] || []);
      const row = headers.map(header => rowData[header] ?? '');
      const range = encodeURIComponent(`${sheetName}!A:ZZ`);

      await sheetsRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=RAW`,
        {
          method: 'POST',
          body: JSON.stringify({
            values: [row]
          })
        }
      );
      return;
    }

    const headers = getWorksheetHeaderValues(result.worksheet);
    const headerOrder = headers.length
      ? [...headers, ...Object.keys(rowData).filter(key => !headers.includes(key))]
      : Object.keys(rowData);

    const existingRows = worksheetToStructuredData(result.worksheet).data;
    const nextRows = [...existingRows, rowData];
    const nextWorksheet = XLSX.utils.json_to_sheet(nextRows, {
      header: headerOrder
    });

    result.workbook.Sheets[sheetName] = nextWorksheet;
    if (!result.workbook.SheetNames.includes(sheetName)) {
      result.workbook.SheetNames.push(sheetName);
    }

    await uploadWorkbook(result.workbook);
  } catch (err) {
    console.error(`Error adding row to sheet "${sheetName}":`, err);
    throw err;
  }
}

async function getInvoiceRows(invoiceNumber) {
  try {
    const { data } = await getSheetData('INVOICE DETAILS');
    return data.filter(row => row['Invoice Number'] === invoiceNumber);
  } catch (err) {
    console.error('Error fetching invoice rows:', err);
    throw err;
  }
}

async function getAllInvoices() {
  try {
    const { data } = await getSheetData('INVOICE DETAILS');
    // Get unique invoice numbers
    const invoiceNumbers = [...new Set(data.map(row => row['Invoice Number']).filter(Boolean))];
    return invoiceNumbers.sort();
  } catch (err) {
    console.error('Error fetching all invoices:', err);
    throw err;
  }
}

async function invoiceExists(invoiceNumber) {
  try {
    const rows = await getInvoiceRows(invoiceNumber);
    return rows.length > 0;
  } catch (err) {
    console.error('Error checking invoice existence:', err);
    throw err;
  }
}

module.exports = {
  classifyGoogleError,
  getCredentialsPath,
  getDoc,
  getSheet,
  getSheetData,
  addRowToSheet,
  getInvoiceRows,
  getAllInvoices,
  invoiceExists
};
