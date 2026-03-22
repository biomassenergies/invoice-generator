# 🚀 Quick Start Guide - Step by Step

## Phase 1: Google Sheets API Setup (5-10 minutes)

### 1.1 Create Google Cloud Project
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project (click "Select a Project" → "New Project")
3. Name it: "Invoice Generator"
4. Wait for project to be created

### 1.2 Enable Google Sheets API
1. Search for "Google Sheets API" in the search bar
2. Click it and press "Enable"
3. Wait for it to be enabled

### 1.3 Create Service Account
1. Go to "Service Accounts" (left menu → IAM and Admin → Service Accounts)
2. Click "Create Service Account"
3. Name: "invoice-app"
4. Click "Create and Continue"
5. Skip optional steps, click "Done"

### 1.4 Generate JSON Key
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON"
5. Save the file as `backend/credentials.json`

### 1.5 Get Service Account Email
1. In service accounts list, copy the email of your service account
2. Example: `invoice-app@YOUR-PROJECT.iam.gserviceaccount.com`
3. **Save this email** - you'll need it next

---

## Phase 2: Prepare Google Sheet (5 minutes)

### 2.1 Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it: "Invoice Data"

### 2.2 Create Sheet Tabs
In this spreadsheet, rename the sheets or add new ones with these exact names:
- `CUSTOMER DETAILS`
- `PRODUCT TABLE`
- `INVOICE DETAILS`

### 2.3 Add Headers to Each Sheet

#### Sheet 1: CUSTOMER DETAILS
Add these headers in row 1:
```
Customer Name | GST No | State | Contact | Address
```

Add sample customer data below.

#### Sheet 2: PRODUCT TABLE
Add these headers in row 1:
```
Product Name | Rate | HSN Code | Unit
```

Add sample products below.

#### Sheet 3: INVOICE DETAILS
Add these headers in row 1:
```
Invoice Number | Consignee Name | Buyer | Dated | Delivery Note | Payment Mode/Terms | Supplier Ref. | Other Reference(s) | Buyer's Order No. | Date | Despatch Document No. | Delivery Note Date | Despatch through | Destination | Bill of Landing/LR-RR No. | Motor Vehicle Number | Description of Goods | HSN Code | QTY | Rate | per(wt) | Amount | SGST | CGST | IGST | Total | Roundoff | Transport | Taxable Value | SGST AMT | CGST AMT | IGST | Tax Total | Month | Year
```

(This sheet will be auto-filled by the application)

### 2.4 Share Sheet with Service Account
1. Click "Share" button
2. Paste the service account email from step 1.5
3. Give "Editor" access
4. Click "Share"

### 2.5 Get Sheet ID
1. Copy the URL: `https://docs.google.com/spreadsheets/d/1A2B3C4D5E.../edit`
2. The ID is the long string: `1A2B3C4D5E...`
3. **Save this ID** - you'll need it in next phase

---

## Phase 3: Backend Setup (5 minutes)

### 3.1 Open Terminal in backend folder
```bash
cd backend
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Create .env File
Create a file named `.env` with:
```
PORT=5000
SHEET_ID=YOUR_GOOGLE_SHEET_ID_HERE
NODE_ENV=development
```

Replace `YOUR_GOOGLE_SHEET_ID_HERE` with the ID from Phase 2.5

### 3.4 Verify credentials.json
Ensure you have `backend/credentials.json` (downloaded in Phase 1.4)

### 3.5 Start Backend
```bash
npm start
```

You should see:
```
✅ Invoice Generator Backend running on http://localhost:5000
```

✅ **Backend is ready!**

---

## Phase 4: Frontend Setup (5 minutes)

### 4.1 Open New Terminal in frontend folder
```bash
cd frontend
```

### 4.2 Install Dependencies
```bash
npm install
```

This will take a few minutes...

### 4.3 Start Frontend
```bash
npm start
```

React will automatically open http://localhost:3000 in your browser.

✅ **Frontend is ready!**

---

## Phase 5: Test the Application (5 minutes)

### 5.1 Check Connection
Refresh the page. You should see:
- Customer dropdown populated with your customers
- Product dropdown populated with your products

### 5.2 Create Test Invoice
1. Enter Invoice Number: `TEST/001`
2. Select a customer
3. Add a product with quantity and rate
4. Click "Create & Download Invoice"
5. PDF should download automatically
6. Check Google Sheet - new row should appear in INVOICE DETAILS

### 5.3 Verify Data
Open your Google Sheet → INVOICE DETAILS sheet
- You should see the invoice you just created
- All calculations should be correct

✅ **Application is working!**

---

## Troubleshooting

### Error: "Cannot find spreadsheet"
- Check SHEET_ID in .env is correct
- Verify sheet is shared with service account email

### Error: "Sheet 'CUSTOMER DETAILS' not found"
- Verify exact sheet names (case-sensitive)
- Check spelling matches exactly

### Error: Backend not responding
- Ensure backend is running (`npm start` in backend folder)
- Check port 5000 is not in use
- Restart backend

### PDFs not generating
- Ensure Puppeteer installed (`npm install` in backend)
- Check backend console for errors

### Data not saving to Google Sheets
- Verify service account has Editor access
- Check column headers match exactly
- Look at backend console for specific errors

---

## Next Steps

Once working, you can:
1. **View existing invoices** - Search by invoice number
2. **Generate reports** - Monthly GST, sales summary
3. **Manage inventory** - Track stock levels
4. **Multi-user access** - Share with team
5. **Automated backups** - Google Sheets handles this

---

## Need Help?

All API endpoints available at:
- Backend logs show detailed errors
- Browser console (F12) shows frontend errors
- Check Google Sheet for data consistency

---

**You're all set! Start creating invoices! 🎉**
