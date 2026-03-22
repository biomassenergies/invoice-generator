const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const generateInvoiceHTML = require('./templates/invoiceTemplate');
const {
  classifyGoogleError,
  getSheetData,
  addRowToSheet,
  getInvoiceRows,
  invoiceExists
} = require('./sheets');
const {
  getCustomers: getExcelCustomers,
  getInvoices: getExcelInvoices,
  getProducts: getExcelProducts,
  saveCustomerRow,
  saveInvoiceRow,
  invoiceExists: excelInvoiceExists
} = require('./excelData');

require('dotenv').config();

const AUTH_PASSWORD = process.env.APP_PASSWORD?.trim() || '';
const AUTH_ENABLED = Boolean(AUTH_PASSWORD);
const SESSION_SECRET = process.env.SESSION_SECRET?.trim() || 'invoice-generator-dev-session-secret';

function detectDataMode() {
  if (process.env.DATA_MODE) {
    return process.env.DATA_MODE;
  }

  const hasSheetId = Boolean(process.env.SHEET_ID);
  const hasCredentials =
    Boolean(process.env.GOOGLE_CREDENTIALS_JSON) ||
    Boolean(process.env.CREDENTIALS_PATH) ||
    fs.existsSync(path.join(__dirname, 'credentials.json')) ||
    fs.existsSync(path.join(__dirname, 'credentials.json.json'));

  return hasSheetId && hasCredentials ? 'google' : 'local';
}

function getSetupStatus() {
  const credentialsPath = [
    path.join(__dirname, 'credentials.json'),
    path.join(__dirname, 'credentials.json.json')
  ].find(filePath => fs.existsSync(filePath));

  return {
    dataMode: DATA_MODE,
    hasSheetId: Boolean(process.env.SHEET_ID),
    sheetId: process.env.SHEET_ID || null,
    hasCredentials: Boolean(
      process.env.GOOGLE_CREDENTIALS_JSON || process.env.CREDENTIALS_PATH || credentialsPath
    ),
    credentialsFile: process.env.CREDENTIALS_PATH
      ? process.env.CREDENTIALS_PATH
      : credentialsPath
        ? path.basename(credentialsPath)
        : null,
    authEnabled: AUTH_ENABLED
  };
}

function isAuthenticated(req) {
  return !AUTH_ENABLED || req.session?.isAuthenticated === true;
}

function requireAuth(req, res, next) {
  if (isAuthenticated(req)) {
    return next();
  }

  return res.status(401).json({ error: 'Authentication required' });
}

function getBrowserLaunchOptions() {
  const configuredExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  let executablePath = configuredExecutablePath;

  if (!executablePath && typeof puppeteer.executablePath === 'function') {
    try {
      executablePath = puppeteer.executablePath();
    } catch (error) {
      console.warn('Puppeteer executable path lookup failed:', error.message);
    }
  }

  return {
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };
}

async function launchPdfBrowser() {
  const launchOptions = getBrowserLaunchOptions();

  try {
    return await puppeteer.launch({
      ...launchOptions,
      headless: 'new'
    });
  } catch (error) {
    console.warn('Retrying Puppeteer launch with classic headless mode:', error.message);
    return puppeteer.launch(launchOptions);
  }
}

function parseNumericValue(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const normalized = String(value).replace(/,/g, '').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getCustomerDirectory() {
  if (DATA_MODE === 'local') {
    return getExcelCustomers().data;
  }

  return (await getSheetData('CUSTOMER DETAILS')).data;
}

async function getProductDirectory() {
  if (DATA_MODE === 'local') {
    return getExcelProducts().data;
  }

  return (await getSheetData('PRODUCT TABLE')).data;
}

function findCustomerNameField(customers) {
  const headers = Object.keys(customers[0] || {});
  return headers.find((header) => header.toLowerCase().includes('name')) || 'Customer Name';
}

function findCustomerByName(customers, customerName) {
  const nameField = findCustomerNameField(customers);
  const target = String(customerName || '').trim().toLowerCase();

  return customers.find((customer) => {
    const values = [customer[nameField], customer['Customer Name'], customer['Cust Name']]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());

    return values.includes(target);
  }) || null;
}

function buildCustomerProfile(customer) {
  if (!customer) {
    return {
      name: '',
      address: '',
      gstn: '',
      state: '',
      email: '',
      code: ''
    };
  }

  const keys = Object.keys(customer);
  const findField = (patterns) =>
    keys.find((key) => patterns.some((pattern) => key.toLowerCase().includes(pattern)));

  return {
    name:
      customer[findField(['name'])] ||
      customer['Customer Name'] ||
      customer['Cust Name'] ||
      '',
    address: customer[findField(['address'])] || '',
    gstn: customer[findField(['gst'])] || '',
    state: customer[findField(['state'])] || '',
    email: customer[findField(['email', 'mail'])] || '',
    code: customer[findField(['code'])] || ''
  };
}

function parseInvoiceDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'number' && value > 30000 && value < 60000) {
    const utcDays = Math.floor(value - 25569);
    return new Date(utcDays * 86400 * 1000);
  }

  const raw = String(value).trim();
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 30000 && numeric < 60000) {
    const utcDays = Math.floor(numeric - 25569);
    return new Date(utcDays * 86400 * 1000);
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const match = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (!match) {
    return null;
  }

  const [, dayString, monthToken, yearString] = match;
  const months = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11
  };

  const month = months[monthToken.toLowerCase()];
  if (month === undefined) {
    return null;
  }

  const yearNumber = Number(yearString);
  const normalizedYear =
    yearString.length === 2 ? (yearNumber >= 70 ? 1900 + yearNumber : 2000 + yearNumber) : yearNumber;
  return new Date(normalizedYear, month, Number(dayString));
}

function normalizeInvoiceRow(row) {
  const invoiceDate = parseInvoiceDate(row.Dated || row.Date);
  const amount = parseNumericValue(row.Amount);
  const taxTotal = parseNumericValue(row['Tax Total']);
  const total = parseNumericValue(row.Total) || amount + taxTotal;
  const quantity = parseNumericValue(row.QTY);
  const product = row['Description of Goods'] || '';
  const customer = row['Consignee Name'] || row.Buyer || '';

  return {
    invoiceNumber: row['Invoice Number'] || '',
    customer,
    buyer: row.Buyer || '',
    product,
    quantity,
    amount,
    total,
    hsn: row['HSN Code'] || '',
    destination: String(row.Destination || '').trim(),
    igstRate: parseNumericValue(row.IGST),
    invoiceDate,
    month: invoiceDate ? invoiceDate.getMonth() + 1 : parseNumericValue(row.Month),
    year: invoiceDate ? invoiceDate.getFullYear() : parseNumericValue(row.Year)
  };
}

function inferProductCategory(productName) {
  const name = String(productName || '').toUpperCase();

  if (name.includes('PELLET STOVE')) return 'Stoves';
  if (name.includes('PELLET')) return 'Pellets';
  if (name.includes('BRIQUETTE')) return 'Briquettes';
  if (name.includes('RICE HUSK')) return 'Rice Husk';
  if (name.includes('CHARCOAL')) return 'Charcoal';
  if (name.includes('PALLET')) return 'Pallets';
  if (name.includes('BAG')) return 'Bags';
  if (name.includes('DOC')) return 'Oil Cakes / DOC';
  if (name.includes('SAWDUST')) return 'Sawdust';

  return 'Other';
}

function normalizeEntityName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function getUniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function sortMetricEntries(metricMap, metricKey) {
  return Object.entries(metricMap)
    .map(([name, metric]) => ({ name, ...metric }))
    .sort((a, b) => b[metricKey] - a[metricKey] || a.name.localeCompare(b.name));
}

const DATA_MODE = detectDataMode();
const FRONTEND_BUILD_PATH = path.join(__dirname, '../frontend/build');

const app = express();
app.set('trust proxy', 1);
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(bodyParser.json());
app.use(
  session({
    name: 'invoice.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 12
    }
  })
);

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Invoice Generator API is running' });
});

app.get('/api/auth/status', (req, res) => {
  res.json({
    enabled: AUTH_ENABLED,
    authenticated: isAuthenticated(req)
  });
});

app.post('/api/auth/login', (req, res) => {
  const submittedPassword = String(req.body?.password || '');

  if (!AUTH_ENABLED) {
    req.session.isAuthenticated = true;
    return res.json({ success: true, authenticated: true, enabled: false });
  }

  if (submittedPassword !== AUTH_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  req.session.isAuthenticated = true;
  return res.json({ success: true, authenticated: true, enabled: true });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('invoice.sid');
    res.json({ success: true });
  });
});

app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/auth/')) {
    return next();
  }

  return requireAuth(req, res, next);
});

// ============================================================================
// DEBUG ENDPOINTS
// ============================================================================

app.get('/api/debug/setup', (req, res) => {
  res.json(getSetupStatus());
});

app.get('/api/debug', async (req, res) => {
  try {
    console.log('Debug: Attempting to connect to Google Sheet...');
    console.log('Sheet ID:', process.env.SHEET_ID);

    const { getDoc } = require('./sheets');
    const doc = await getDoc();

    console.log('Connected successfully');
    console.log('Sheet title:', doc.title);
    console.log('Available sheets:', Object.keys(doc.sheetsByTitle));

    res.json({
      connected: true,
      setup: getSetupStatus(),
      title: doc.title,
      sheets: Object.keys(doc.sheetsByTitle),
      sheetDetails: Object.entries(doc.sheetsByTitle).map(([name, sheet]) => ({
        name,
        rowCount: sheet.rowCount,
        colCount: sheet.columnCount,
        index: sheet.index
      }))
    });
  } catch (err) {
    console.error('Debug error:', err.message);
    const diagnosis = classifyGoogleError(err);

    res.status(500).json({
      error: 'Connection failed',
      message: diagnosis.message,
      diagnosis,
      setup: getSetupStatus()
    });
  }
});

// ============================================================================
// FETCH DATA ENDPOINTS
// ============================================================================

app.get('/api/customers', async (req, res) => {
  try {
    console.log(`Fetching customers from ${DATA_MODE.toUpperCase()} mode`);

    let result;
    if (DATA_MODE === 'local') {
      result = getExcelCustomers();
    } else {
      result = await getSheetData('CUSTOMER DETAILS');
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Error fetching customers', details: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const {
      code = '',
      customerName = '',
      address = '',
      gstn = '',
      stateName = '',
      pinCode = '',
      email = ''
    } = req.body || {};

    const payload = {
      CODE: String(code).trim(),
      'Cust Name': String(customerName).trim(),
      Address: String(address).trim(),
      GSTN: String(gstn).trim(),
      'State Name': String(stateName).trim(),
      'Pin Code': String(pinCode).trim(),
      Email: String(email).trim()
    };

    if (!payload.CODE || !payload['Cust Name']) {
      return res.status(400).json({ error: 'CODE and Cust Name are required' });
    }

    const existingCustomers = await getCustomerDirectory();
    const normalizedCode = normalizeEntityName(payload.CODE);
    const normalizedCustomerName = normalizeEntityName(payload['Cust Name']);

    const duplicateCustomer = existingCustomers.find((customer) => {
      const existingCode = normalizeEntityName(customer.CODE || customer.CODE_1);
      const existingName = normalizeEntityName(customer['Cust Name'] || customer['Customer Name']);
      return existingCode === normalizedCode || existingName === normalizedCustomerName;
    });

    if (duplicateCustomer) {
      return res.status(400).json({
        error: 'Customer with the same code or name already exists'
      });
    }

    if (DATA_MODE === 'local') {
      saveCustomerRow(payload);
    } else {
      await addRowToSheet('CUSTOMER DETAILS', payload);
    }

    return res.json({
      success: true,
      message: 'Customer added successfully',
      customer: payload
    });
  } catch (err) {
    console.error('Error creating customer:', err);
    return res.status(500).json({ error: 'Error creating customer', details: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    console.log(`Fetching products from ${DATA_MODE.toUpperCase()} mode`);

    let result;
    if (DATA_MODE === 'local') {
      result = getExcelProducts();
    } else {
      result = await getSheetData('PRODUCT TABLE');
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Error fetching products', details: err.message });
  }
});

app.get('/api/invoices', async (req, res) => {
  try {
    let invoiceRows;
    if (DATA_MODE === 'local') {
      invoiceRows = getExcelInvoices().data;
    } else {
      invoiceRows = (await getSheetData('INVOICE DETAILS')).data;
    }

    const invoiceNumbers = [...new Set(
      invoiceRows
        .map(row => row['Invoice Number'])
        .filter(Boolean)
    )].sort((a, b) => String(b).localeCompare(String(a)));

    res.json(invoiceNumbers);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: 'Error fetching invoices', details: err.message });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const { year, month, customer, product } = req.query;

    const [invoiceRows, customerDirectory, productDirectory] = await Promise.all([
      DATA_MODE === 'local'
        ? Promise.resolve(getExcelInvoices().data)
        : getSheetData('INVOICE DETAILS').then((result) => result.data),
      getCustomerDirectory(),
      getProductDirectory()
    ]);

    const normalizedRows = invoiceRows
      .map(normalizeInvoiceRow)
      .filter((row) => row.invoiceNumber && row.product);

    const years = [...new Set(normalizedRows.map((row) => row.year).filter(Boolean))]
      .sort((a, b) => b - a);
    const months = [...new Set(normalizedRows.map((row) => row.month).filter(Boolean))]
      .sort((a, b) => a - b);
    const customers = [...new Set(normalizedRows.map((row) => row.customer).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const products = [...new Set(normalizedRows.map((row) => row.product).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));

    const filteredRows = normalizedRows.filter((row) => {
      if (year && Number(year) !== row.year) return false;
      if (month && Number(month) !== row.month) return false;
      if (customer && customer !== row.customer) return false;
      if (product && product !== row.product) return false;
      return true;
    });

    const uniqueInvoices = new Map();
    filteredRows.forEach((row) => {
      if (!uniqueInvoices.has(row.invoiceNumber)) {
        uniqueInvoices.set(row.invoiceNumber, {
          invoiceNumber: row.invoiceNumber,
          customer: row.customer,
          total: 0,
          invoiceDate: row.invoiceDate
        });
      }

      uniqueInvoices.get(row.invoiceNumber).total += row.total;
    });

    const customerTotals = {};
    const customerFrequency = {};
    const productTotals = {};
    const productFrequency = {};
    const categoryTotals = {};
    const destinationTotals = {};
    const gstModeTotals = {
      interstate: { sales: 0, invoices: 0 },
      intrastate: { sales: 0, invoices: 0 }
    };
    let totalSales = 0;
    let totalQuantity = 0;

    const allCustomerInvoiceCounts = {};
    const allCustomerSales = {};
    const customerLastSeen = {};

    normalizedRows.forEach((row) => {
      allCustomerInvoiceCounts[row.customer] = (allCustomerInvoiceCounts[row.customer] || 0) + 1;
      allCustomerSales[row.customer] = (allCustomerSales[row.customer] || 0) + row.total;

      if (row.invoiceDate && (!customerLastSeen[row.customer] || row.invoiceDate > customerLastSeen[row.customer])) {
        customerLastSeen[row.customer] = row.invoiceDate;
      }
    });

    filteredRows.forEach((row) => {
      totalSales += row.total;
      totalQuantity += row.quantity;

      if (!customerTotals[row.customer]) {
        customerTotals[row.customer] = { sales: 0, invoices: new Set() };
      }
      customerTotals[row.customer].sales += row.total;
      customerTotals[row.customer].invoices.add(row.invoiceNumber);

      if (!customerFrequency[row.customer]) {
        customerFrequency[row.customer] = { count: 0 };
      }
      customerFrequency[row.customer].count += 1;

      if (!productTotals[row.product]) {
        productTotals[row.product] = { sales: 0, quantity: 0 };
      }
      productTotals[row.product].sales += row.total;
      productTotals[row.product].quantity += row.quantity;

      if (!productFrequency[row.product]) {
        productFrequency[row.product] = { count: 0, quantity: 0 };
      }
      productFrequency[row.product].count += 1;
      productFrequency[row.product].quantity += row.quantity;

      const category = inferProductCategory(row.product);
      if (!categoryTotals[category]) {
        categoryTotals[category] = { sales: 0 };
      }
      categoryTotals[category].sales += row.total;

      if (row.destination) {
        destinationTotals[row.destination] = (destinationTotals[row.destination] || 0) + row.total;
      }

      const gstMode = parseNumericValue(row.igstRate) > 0 ? 'interstate' : 'intrastate';
      gstModeTotals[gstMode].sales += row.total;
    });

    uniqueInvoices.forEach((invoice) => {
      const invoiceRowsForNumber = filteredRows.filter((row) => row.invoiceNumber === invoice.invoiceNumber);
      const gstMode = invoiceRowsForNumber.some((row) => parseNumericValue(row.igstRate) > 0)
        ? 'interstate'
        : 'intrastate';
      gstModeTotals[gstMode].invoices += 1;
    });

    const topCustomers = sortMetricEntries(
      Object.fromEntries(
        Object.entries(customerTotals).map(([name, metric]) => [
          name,
          { sales: metric.sales, invoices: metric.invoices.size }
        ])
      ),
      'sales'
    ).slice(0, 8);

    const frequentCustomers = sortMetricEntries(customerFrequency, 'count').slice(0, 8);
    const frequentProducts = sortMetricEntries(productFrequency, 'count').slice(0, 8);
    const topProducts = sortMetricEntries(productTotals, 'sales').slice(0, 8);
    const categorySplit = sortMetricEntries(categoryTotals, 'sales');
    const topDestinations = Object.entries(destinationTotals)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales || a.name.localeCompare(b.name))
      .slice(0, 8);

    const invoiceValues = [...uniqueInvoices.values()]
      .map((invoice) => invoice.total)
      .sort((a, b) => a - b);
    const medianInvoiceValue = invoiceValues.length === 0
      ? 0
      : invoiceValues.length % 2 === 1
        ? invoiceValues[Math.floor(invoiceValues.length / 2)]
        : (invoiceValues[invoiceValues.length / 2 - 1] + invoiceValues[invoiceValues.length / 2]) / 2;

    const top5CustomerSales = topCustomers.slice(0, 5).reduce((sum, entry) => sum + entry.sales, 0);
    const top5ProductSales = topProducts.slice(0, 5).reduce((sum, entry) => sum + entry.sales, 0);

    const customerMasterNames = getUniqueValues(
      customerDirectory.map((entry) => entry['Cust Name'] || entry['Customer Name'] || entry.Name)
    );
    const soldCustomerNames = getUniqueValues(normalizedRows.map((row) => row.customer));
    const normalizedCustomerMaster = new Set(customerMasterNames.map(normalizeEntityName));
    const normalizedSoldCustomers = new Set(soldCustomerNames.map(normalizeEntityName));

    const invoiceOnlyCustomers = soldCustomerNames
      .filter((name) => !normalizedCustomerMaster.has(normalizeEntityName(name)))
      .sort((a, b) => a.localeCompare(b));
    const masterOnlyCustomers = customerMasterNames
      .filter((name) => !normalizedSoldCustomers.has(normalizeEntityName(name)))
      .sort((a, b) => a.localeCompare(b));

    const customerVariantsMap = {};
    soldCustomerNames.forEach((name) => {
      const key = normalizeEntityName(name);
      customerVariantsMap[key] = customerVariantsMap[key] || new Set();
      customerVariantsMap[key].add(name);
    });

    const customerVariants = Object.values(customerVariantsMap)
      .filter((variants) => variants.size > 1)
      .map((variants) => ({ canonical: [...variants][0], variants: [...variants] }))
      .slice(0, 8);

    const soldProductNames = getUniqueValues(normalizedRows.map((row) => row.product));
    const productMasterNames = getUniqueValues(
      productDirectory.map((entry) => entry['PRODUCT NAME'] || entry['Product Name'] || entry.Name)
    );
    const normalizedSoldProducts = new Set(soldProductNames.map(normalizeEntityName));
    const unsoldProducts = productMasterNames
      .filter((name) => !normalizedSoldProducts.has(normalizeEntityName(name)))
      .sort((a, b) => a.localeCompare(b));

    const dormantCutoff = new Date();
    dormantCutoff.setMonth(dormantCutoff.getMonth() - 6);
    const dormantCustomers = Object.entries(customerLastSeen)
      .filter(([, invoiceDate]) => invoiceDate < dormantCutoff)
      .map(([name, invoiceDate]) => ({
        name,
        lastInvoiceDate: invoiceDate.toISOString().slice(0, 10),
        invoices: allCustomerInvoiceCounts[name] || 0,
        sales: allCustomerSales[name] || 0
      }))
      .sort((a, b) => a.lastInvoiceDate.localeCompare(b.lastInvoiceDate))
      .slice(0, 8);

    res.json({
      filters: {
        year: year ? Number(year) : '',
        month: month ? Number(month) : '',
        customer: customer || '',
        product: product || '',
        options: {
          years,
          months,
          customers,
          products
        }
      },
      summary: {
        totalSales,
        totalQuantity,
        invoiceCount: uniqueInvoices.size,
        customerCount: new Set(filteredRows.map((row) => row.customer)).size,
        averageInvoiceValue: uniqueInvoices.size ? totalSales / uniqueInvoices.size : 0,
        medianInvoiceValue
      },
      insights: {
        concentration: {
          top5CustomerShare: totalSales ? (top5CustomerSales / totalSales) * 100 : 0,
          top5ProductShare: totalSales ? (top5ProductSales / totalSales) * 100 : 0,
          topCustomerSales: topCustomers[0]?.sales || 0,
          topProductSales: topProducts[0]?.sales || 0
        },
        dormantCustomers,
        marketMix: {
          interstateSales: gstModeTotals.interstate.sales,
          interstateInvoices: gstModeTotals.interstate.invoices,
          intrastateSales: gstModeTotals.intrastate.sales,
          intrastateInvoices: gstModeTotals.intrastate.invoices
        },
        dataQuality: {
          invoiceOnlyCustomerCount: invoiceOnlyCustomers.length,
          masterOnlyCustomerCount: masterOnlyCustomers.length,
          invoiceOnlyCustomers: invoiceOnlyCustomers.slice(0, 8),
          masterOnlyCustomers: masterOnlyCustomers.slice(0, 8),
          customerVariants,
          unsoldProducts
        }
      },
      topCustomers,
      frequentCustomers,
      frequentProducts,
      topProducts,
      categorySplit,
      topDestinations
    });
  } catch (err) {
    console.error('Error building dashboard:', err);
    res.status(500).json({ error: 'Error building dashboard', details: err.message });
  }
});

app.get('/api/invoice/:invoiceNumber', async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const invoiceRows = await getInvoiceRows(invoiceNumber);

    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const items = invoiceRows.map(row => ({
      product: row['Description of Goods'],
      hsn: row['HSN Code'],
      qty: parseNumericValue(row.QTY),
      rate: parseNumericValue(row.Rate),
      amount: parseNumericValue(row.Amount),
      per: row['per(wt)'],
      transport: row.Transport,
      vehicle: row['Motor Vehicle Number'],
      destination: row.Destination
    }));

    const firstRow = invoiceRows[0];
    const total = invoiceRows.reduce((sum, row) => {
      const rowTotal = parseNumericValue(row.Total);
      if (rowTotal > 0) {
        return sum + rowTotal;
      }

      return sum + parseNumericValue(row.Amount) + parseNumericValue(row['Tax Total']);
    }, 0);

    res.json({
      invoiceNumber,
      consigneeName: firstRow['Consignee Name'],
      buyer: firstRow.Buyer,
      date: firstRow.Dated,
      items,
      total
    });
  } catch (err) {
    console.error('Error fetching invoice:', err);
    res.status(500).json({ error: 'Error fetching invoice', details: err.message });
  }
});

// ============================================================================
// CREATE INVOICE ENDPOINT
// ============================================================================

app.post('/api/create-invoice', async (req, res) => {
  try {
    const {
      invoiceNumber,
      consigneeName,
      buyer,
      date,
      customerState,
      items,
      transport,
      vehicle,
      destination
    } = req.body;

    if (!invoiceNumber || !consigneeName || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let exists;
    if (DATA_MODE === 'local') {
      exists = excelInvoiceExists(invoiceNumber);
    } else {
      exists = await invoiceExists(invoiceNumber);
    }

    if (exists) {
      return res.status(400).json({ error: 'Invoice number already exists!' });
    }

    const invoiceDate = new Date(date);
    const month = (invoiceDate.getMonth() + 1).toString();
    const year = invoiceDate.getFullYear().toString();

    for (const item of items) {
      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);
      const amount = qty * rate;

      let sgstRate = 0;
      let cgstRate = 0;
      let igstRate = 0;
      let sgstAmt = 0;
      let cgstAmt = 0;
      let igstAmt = 0;

      if (customerState === 'Maharashtra') {
        sgstRate = 2.5;
        cgstRate = 2.5;
        sgstAmt = amount * 0.025;
        cgstAmt = amount * 0.025;
      } else {
        igstRate = 5;
        igstAmt = amount * 0.05;
      }

      const taxTotal = sgstAmt + cgstAmt + igstAmt;
      const total = amount + taxTotal;

      const rowData = {
        'Invoice Number': invoiceNumber,
        'Consignee Name': consigneeName,
        Buyer: buyer || consigneeName,
        Dated: date,
        'Description of Goods': item.product || '',
        'HSN Code': item.hsn || '',
        QTY: qty,
        Rate: rate,
        'per(wt)': item.per || 'unit',
        Amount: amount,
        SGST: sgstRate,
        CGST: cgstRate,
        IGST: igstRate,
        'SGST AMT': sgstAmt,
        'CGST AMT': cgstAmt,
        IGST_2: igstAmt,
        'Tax Total': taxTotal,
        Total: total,
        Transport: transport || '',
        'Motor Vehicle Number': vehicle || '',
        Destination: destination || '',
        'Taxable Value': amount,
        Roundoff: 0,
        Month: month,
        Year: year
      };

      if (DATA_MODE === 'local') {
        saveInvoiceRow(rowData);
      } else {
        await addRowToSheet('INVOICE DETAILS', rowData);
      }
    }

    res.json({ success: true, message: 'Invoice created successfully', invoiceNumber });
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ error: 'Error creating invoice', details: err.message });
  }
});

// ============================================================================
// PDF GENERATION ENDPOINT
// ============================================================================

app.get('/api/invoice/:invoiceNumber/pdf', async (req, res) => {
  let browser;

  try {
    const { invoiceNumber } = req.params;
    const invoiceRows = await getInvoiceRows(invoiceNumber);

    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const items = invoiceRows.map(row => ({
      product: row['Description of Goods'],
      hsn: row['HSN Code'],
      qty: parseNumericValue(row.QTY),
      rate: parseNumericValue(row.Rate),
      amount: parseNumericValue(row.Amount)
    }));

    const firstRow = invoiceRows[0];
    const customers = await getCustomerDirectory();
    const consigneeProfile = buildCustomerProfile(
      findCustomerByName(customers, firstRow['Consignee Name'])
    );
    const buyerProfile = buildCustomerProfile(
      findCustomerByName(customers, firstRow.Buyer || firstRow['Consignee Name'])
    );
    const invoiceData = {
      invoiceNumber,
      consigneeName: firstRow['Consignee Name'],
      buyer: firstRow.Buyer,
      date: firstRow.Dated,
      customerState: consigneeProfile.state || buyerProfile.state || '',
      items,
      consigneeDetails: consigneeProfile,
      buyerDetails: buyerProfile,
      invoiceMeta: {
        deliveryNote: firstRow['Delivery Note'] || '',
        paymentTerms: firstRow['Payment Mode/Terms'] || '',
        supplierRef: firstRow['Supplier Ref.'] || '',
        otherReference: firstRow['Other Reference(s)'] || '',
        buyerOrderNo: firstRow["Buyer's Order No."] || '',
        buyerOrderDate: firstRow.Date || firstRow.Dated || '',
        despatchDocumentNo: firstRow['Despatch Document No.'] || invoiceNumber,
        deliveryNoteDate: firstRow['Delivery Note Date'] || firstRow.Dated || '',
        despatchThrough: firstRow['Despatch through'] || firstRow.Transport || '',
        destination: firstRow.Destination || '',
        billOfLading: firstRow['Bill of Landing/LR-RR No.'] || '',
        vehicleNumber: firstRow['Motor Vehicle Number'] || ''
      },
      transportDetails: {
        transport: firstRow.Transport,
        vehicle: firstRow['Motor Vehicle Number'],
        destination: firstRow.Destination
      }
    };

    const html = generateInvoiceHTML(invoiceData);

    browser = await launchPdfBrowser();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10px',
        bottom: '10px',
        left: '10px',
        right: '10px'
      }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Invoice-${invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF:', err);
    if (browser) {
      await browser.close();
    }
    res.status(500).json({ error: 'Error generating PDF', details: err.message });
  }
});

if (fs.existsSync(FRONTEND_BUILD_PATH)) {
  app.use(express.static(FRONTEND_BUILD_PATH));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    return res.sendFile(path.join(FRONTEND_BUILD_PATH, 'index.html'));
  });
}

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\nInvoice Generator Backend running on http://localhost:${PORT}`);
  console.log(`Data Mode: ${DATA_MODE.toUpperCase()}`);
  if (DATA_MODE === 'local') {
    console.log('Using Excel file for data storage\n');
  } else {
    console.log('Using Google Sheets for data storage\n');
  }
  console.log('API Endpoints:');
  console.log('   GET  /api/health - Server status');
  console.log('   GET  /api/debug/setup - Local setup status');
  console.log('   GET  /api/debug - Google Sheets connectivity');
  console.log('   GET  /api/customers - Get all customers');
  console.log('   GET  /api/products - Get all products');
  console.log('   POST /api/create-invoice - Create new invoice');
  console.log('   GET  /api/invoice/:number - Get invoice details');
  console.log('   GET  /api/invoice/:number/pdf - Generate invoice PDF\n');
});
