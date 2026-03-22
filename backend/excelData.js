const XLSX = require('xlsx');
const path = require('path');

// Path to the Excel file
const EXCEL_FILE = path.join(__dirname, '../Invoice Generator.xlsx');

/**
 * Load data from Excel file
 */
function loadExcelData() {
  try {
    console.log('📁 Loading Excel file from:', EXCEL_FILE);
    const workbook = XLSX.readFile(EXCEL_FILE);
    
    const sheets = {
      customers: {
        sheetName: 'CUSTOMER DETAILS',
        data: []
      },
      products: {
        sheetName: 'PRODUCT TABLE',
        data: []
      },
      invoices: {
        sheetName: 'INVOICE DETAILS',
        data: []
      }
    };

    // Load customers
    if (workbook.SheetNames.includes('CUSTOMER DETAILS')) {
      const ws = workbook.Sheets['CUSTOMER DETAILS'];
      const data = XLSX.utils.sheet_to_json(ws);
      sheets.customers.data = data;
      console.log(`✅ Loaded ${data.length} customers from Excel`);
    }

    // Load products
    if (workbook.SheetNames.includes('PRODUCT TABLE')) {
      const ws = workbook.Sheets['PRODUCT TABLE'];
      const data = XLSX.utils.sheet_to_json(ws);
      sheets.products.data = data;
      console.log(`✅ Loaded ${data.length} products from Excel`);
    }

    // Load invoices
    if (workbook.SheetNames.includes('INVOICE DETAILS')) {
      const ws = workbook.Sheets['INVOICE DETAILS'];
      const data = XLSX.utils.sheet_to_json(ws);
      sheets.invoices.data = data;
      console.log(`✅ Loaded ${data.length} invoice records from Excel`);
    }

    return sheets;
  } catch (err) {
    console.error('❌ Error loading Excel file:', err.message);
    return null;
  }
}

/**
 * Get customer list with headers
 */
function getCustomers() {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE);
    const ws = workbook.Sheets['CUSTOMER DETAILS'];
    const data = XLSX.utils.sheet_to_json(ws);
    const headers = Object.keys(data[0] || {});
    
    return {
      headers,
      data
    };
  } catch (err) {
    console.error('Error getting customers:', err);
    return { headers: [], data: [] };
  }
}

/**
 * Get products list with headers
 */
function getProducts() {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE);
    const ws = workbook.Sheets['PRODUCT TABLE'];
    const data = XLSX.utils.sheet_to_json(ws);
    const headers = Object.keys(data[0] || {});
    
    return {
      headers,
      data
    };
  } catch (err) {
    console.error('Error getting products:', err);
    return { headers: [], data: [] };
  }
}

/**
 * Get invoices with headers
 */
function getInvoices() {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE);
    const ws = workbook.Sheets['INVOICE DETAILS'];
    const data = XLSX.utils.sheet_to_json(ws);
    const headers = Object.keys(data[0] || {});
    
    return {
      headers,
      data
    };
  } catch (err) {
    console.error('Error getting invoices:', err);
    return { headers: [], data: [] };
  }
}

/**
 * Save new invoice row to Excel
 */
function saveInvoiceRow(rowData) {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE);
    let ws = workbook.Sheets['INVOICE DETAILS'];
    
    if (!ws) {
      // Create sheet if doesn't exist
      XLSX.utils.book_new();
      ws = XLSX.utils.aoa_to_sheet([Object.keys(rowData)]);
      workbook.Sheets['INVOICE DETAILS'] = ws;
    }

    // Get existing data
    const data = XLSX.utils.sheet_to_json(ws);
    data.push(rowData);

    // Update sheet
    ws = XLSX.utils.json_to_sheet(data);
    workbook.Sheets['INVOICE DETAILS'] = ws;

    // Save file
    XLSX.writeFile(workbook, EXCEL_FILE);
    console.log('✅ Invoice saved to Excel');
    return true;
  } catch (err) {
    console.error('Error saving invoice:', err.message);
    return false;
  }
}

function saveCustomerRow(rowData) {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE);
    let ws = workbook.Sheets['CUSTOMER DETAILS'];

    if (!ws) {
      ws = XLSX.utils.aoa_to_sheet([Object.keys(rowData)]);
      workbook.Sheets['CUSTOMER DETAILS'] = ws;
      if (!workbook.SheetNames.includes('CUSTOMER DETAILS')) {
        workbook.SheetNames.push('CUSTOMER DETAILS');
      }
    }

    const data = XLSX.utils.sheet_to_json(ws);
    data.push(rowData);

    ws = XLSX.utils.json_to_sheet(data);
    workbook.Sheets['CUSTOMER DETAILS'] = ws;
    XLSX.writeFile(workbook, EXCEL_FILE);
    return true;
  } catch (err) {
    console.error('Error saving customer:', err.message);
    return false;
  }
}

/**
 * Check if invoice number exists
 */
function invoiceExists(invoiceNumber) {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE);
    const ws = workbook.Sheets['INVOICE DETAILS'];
    const data = XLSX.utils.sheet_to_json(ws);
    
    return data.some(row => row['Invoice Number'] === invoiceNumber);
  } catch (err) {
    console.error('Error checking invoice:', err);
    return false;
  }
}

module.exports = {
  loadExcelData,
  getCustomers,
  getProducts,
  getInvoices,
  saveCustomerRow,
  saveInvoiceRow,
  invoiceExists
};
