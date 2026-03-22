# 📁 Project Structure Overview

## Complete Directory Structure

```
invoice-generator/
│
├── backend/                          # Node.js Express Backend
│   ├── node_modules/                (created after npm install)
│   ├── templates/
│   │   └── invoiceTemplate.js       # PDF template generator
│   ├── index.js                     # Main server file & API endpoints
│   ├── sheets.js                    # Google Sheets API integration
│   ├── credentials.json             # Google service account (DOWNLOAD SEPARATELY)
│   ├── credentials.json.example     # Template for credentials
│   ├── .env                         # Environment variables (create after setup)
│   ├── .env.example                 # Template for .env
│   ├── .gitignore                   # Git ignore rules
│   └── package.json                 # Backend dependencies
│
├── frontend/                         # React Frontend
│   ├── node_modules/                (created after npm install)
│   ├── public/
│   │   └── index.html               # HTML entry point
│   ├── src/
│   │   ├── api.js                   # API utility functions
│   │   ├── Invoice.js               # Main invoice form component
│   │   ├── Invoice.css              # Invoice styling
│   │   ├── App.js                   # Root React component
│   │   ├── App.css                  # App styling
│   │   ├── index.js                 # React DOM render
│   │   └── index.css                # Global styles
│   ├── .gitignore                   # Git ignore rules
│   └── package.json                 # Frontend dependencies
│
├── README.md                         # Main documentation
├── SETUP_GUIDE.md                   # Step-by-step setup instructions
└── Invoice Generator.xlsx           # Your original Excel file (reference)
```

## 🔧 What Each File Does

### Backend Files

**index.js** - Main server file
- Starts Express server on port 5000
- Defines all API endpoints
- Handles invoice creation
- Manages PDF generation
- Integrates with Google Sheets

**sheets.js** - Google Sheets integration
- Authenticates with Google API
- Reads data from sheets
- Writes invoice data
- Fetches customer and product lists
- Checks for duplicate invoices

**templates/invoiceTemplate.js** - PDF template
- Generates HTML for invoice
- Calculates GST based on state
- Formats invoice layout
- Includes all required fields

**package.json** - Dependencies
- express (web server)
- google-spreadsheet (Google API)
- puppeteer (PDF generation)
- cors (cross-origin requests)
- body-parser (JSON parsing)
- dotenv (environment variables)

### Frontend Files

**Invoice.js** - Main invoice form
- Customer dropdown (auto-loads from Google Sheets)
- Product selection with auto-fill
- Item addition/removal
- Real-time GST calculation
- Invoice submission
- PDF download

**api.js** - API utilities
- Wraps backend API calls
- getCustomers() - fetch customer list
- getProducts() - fetch product list
- createInvoice() - submit invoice data
- downloadInvoicePDF() - get PDF

**App.js** - Root React component
- Simple component tree
- Mounts Invoice component

**Styling Files**
- Invoice.css - Professional invoice form styling
- App.css - Global app styles
- index.css - Root element styles

**public/index.html** - HTML entry point
- React DOM mount point
- Meta tags for browsers

## 📊 Data Flow

### Creating an Invoice

```
User fills form
    ↓
React collects data (Invoice.js)
    ↓
POST /api/create-invoice (api.js)
    ↓
Backend validates (index.js)
    ↓
Retrieves customer state (sheets.js)
    ↓
Calculates GST (index.js)
    ↓
Adds rows to Google Sheet (sheets.js)
    ↓
Returns success
    ↓
Frontend auto-downloads PDF
    ↓
GET /api/invoice/:number/pdf (index.js)
    ↓
Fetches invoice rows (sheets.js)
    ↓
Generates HTML (invoiceTemplate.js)
    ↓
Converts to PDF (puppeteer)
    ↓
Returns file to browser
```

### Fetching Data

```
Page loads
    ↓
React calls useEffect
    ↓
GET /api/customers
GET /api/products
    ↓
Backend fetches from Google Sheets
    ↓
Returns headers + data
    ↓
React populates dropdowns
```

## 🔌 API Endpoints

### GET Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/api/health` | Check server status | `{status: "ok"}` |
| `/api/customers` | Get all customers | `{headers, data}` |
| `/api/products` | Get all products | `{headers, data}` |
| `/api/invoice/:number` | Get specific invoice | Invoice object |
| `/api/invoice/:number/pdf` | Download invoice PDF | PDF file |

### POST Endpoints

| Endpoint | Purpose | Input |
|----------|---------|-------|
| `/api/create-invoice` | Create new invoice | Invoice data with items |

## 📝 Invoice Data Model

### Input Format (POST /api/create-invoice)
```javascript
{
  invoiceNumber: "MAE/001",
  consigneeName: "ABC Traders",
  buyer: "ABC Traders",
  date: "2026-03-22",
  customerState: "Maharashtra",
  items: [
    {
      product: "Rice Husk",
      hsn: "1401",
      qty: 10,
      rate: 50,
      per: "kg"
    }
  ],
  transport: "Truck",
  vehicle: "MH40AB1234",
  destination: "Nagpur"
}
```

### Stored in Google Sheet
- One row per product in invoice
- All GST calculations included
- Month/Year auto-filled
- Amount calculations included

## 🔐 Security Features

- Credentials stored locally in `credentials.json`
- Service account authentication (not exposed to frontend)
- CORS configured for localhost only
- Environment variables for sensitive data
- No sensitive data in API responses

## ⚡ Performance Notes

- Frontend caches customer and product lists
- PDF generation on-demand only
- Google Sheets API calls minimized
- Lightweight React components
- Responsive design for all screen sizes

## 🔄 Environment Variables

### Backend (.env)
```
PORT=5000                          # Server port
SHEET_ID=your-sheet-id            # Google Sheet ID
NODE_ENV=development              # Environment
```

### Frontend
- Proxy configured in package.json → `http://localhost:5000`

## 📦 Dependencies Summary

### Backend
- **express**: Web framework
- **google-spreadsheet**: Google API client
- **puppeteer**: Browser automation for PDF
- **cors**: Cross-origin requests
- **body-parser**: JSON parsing
- **uuid**: Unique IDs
- **dotenv**: Environment configuration

### Frontend
- **react**: UI framework
- **react-dom**: React rendering
- **axios**: HTTP client
- **react-scripts**: Build tools

## 🚀 Deployment Considerations

When deploying to production:

1. **Backend Hosting**
   - AWS EC2, DigitalOcean, Heroku, or similar
   - Configure environment variables on server
   - Secure credentials.json access

2. **Frontend Hosting**
   - Build: `npm run build`
   - Deploy to Netlify, Vercel, or AWS S3
   - Update API URL to production backend

3. **Database**
   - Google Sheets stays as-is (cloud-based)
   - No database installation needed
   - Automatic backups via Google

4. **Security Enhancements**
   - Add user authentication
   - Implement role-based access
   - Add audit logging
   - Enable HTTPS only

## 📈 Scaling Future Features

The current structure supports:
- ✅ Invoice management
- ✅ Customer management (via Google Sheets)
- ✅ Product management (via Google Sheets)
- 🔄 Inventory tracking (add to PRODUCT TABLE)
- 🔄 Reports generation
- 🔄 GST reports
- 🔄 Multi-user access with authentication
- 🔄 Invoice templates management
- 🔄 Bulk invoice operations

---

**This is a production-ready local application structure!** 🎉
