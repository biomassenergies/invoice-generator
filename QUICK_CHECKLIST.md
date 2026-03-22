# 🚀 Quick Start Checklist

Print this and use it as a checklist!

## Phase 1: Google Setup (Do First!)

- [ ] Go to console.cloud.google.com
- [ ] Create new project: "Invoice Generator"
- [ ] Enable Google Sheets API
- [ ] Create Service Account
- [ ] Download credentials.json → save to `backend/`
- [ ] Save service account email
- [ ] Create Google Sheet
- [ ] Add sheets: CUSTOMER DETAILS, PRODUCT TABLE, INVOICE DETAILS
- [ ] Copy your Excel data to Google Sheets
- [ ] Share Google Sheet with service account email
- [ ] Copy Sheet ID from URL
- [ ] Create `backend/.env` with PORT=5000 and SHEET_ID

## Phase 2: Installation

- [ ] Open terminal, go to backend folder
- [ ] Run: `npm install`
- [ ] Open second terminal, go to frontend folder
- [ ] Run: `npm install`

## Phase 3: Run Application

Terminal 1:
```bash
cd backend
npm start
```
✅ See message: "Backend running on http://localhost:5000"

Terminal 2:
```bash
cd frontend
npm start
```
✅ Browser opens to http://localhost:3000

## Phase 4: Test

- [ ] App loads and shows no errors
- [ ] Customers dropdown shows your customers
- [ ] Products dropdown shows your products
- [ ] Fill test invoice form
- [ ] Click "Create & Download Invoice"
- [ ] PDF downloads automatically
- [ ] Check Google Sheet has new row

## Phase 5: Go Live!

- [ ] Start creating real invoices
- [ ] Check Google Sheet for data
- [ ] Print/download invoices as needed
- [ ] Share with team (just share Google Sheet)

---

## Emergency Fixes

### Backend won't start
```bash
# Kill anything on port 5000
# Check: node --version
# Then: npm start
```

### No customers showing
- Check sheet names match exactly
- Check share email matches credentials.json
- Restart both terminal windows

### PDF not downloading
- Look at backend console for errors
- Check column headers in INVOICE DETAILS

### Google API error
- Verify credentials.json in backend/
- Check .env SHEET_ID value
- Verify sheet is shared

---

## Key URLs

- **App**: http://localhost:3000
- **API**: http://localhost:5000
- **Google Cloud**: https://console.cloud.google.com
- **Google Sheets**: https://sheets.google.com

---

## Important Files

```
Create/Edit These:
backend/.env                  ← Add SHEET_ID
backend/credentials.json      ← Download from Google

Don't Touch:
backend/index.js             (unless customizing)
frontend/src/Invoice.js      (unless customizing)
```

---

## GST Rules Built In

| State | Tax Type | Rate |
|-------|----------|------|
| Maharashtra | CGST + SGST | 2.5% each |
| Other States | IGST | 5% |

---

## Support

1. **Check documentation**: README.md, SETUP_GUIDE.md
2. **Look at errors**: Terminal console
3. **Browser console**: F12 key
4. **Check Google Sheet**: Data there?

---

**⏱️ Total Time: ~30 minutes from start to live system!**
