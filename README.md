# Invoice Generator

A React + Node.js invoice system backed by Google Sheets / Google Drive workbook data, with PDF invoice generation and analytics dashboard support.

## Run locally

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Set at least:

```env
PORT=5000
SHEET_ID=YOUR_GOOGLE_SHEET_ID_HERE
DATA_MODE=google
NODE_ENV=development
```

Add Google credentials in one of these ways:

1. `backend/credentials.json`
2. `CREDENTIALS_PATH=/full/path/to/credentials.json`
3. `GOOGLE_CREDENTIALS_JSON={...full service account json...}`

Then start:

```bash
npm start
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Deploy on Render as one service

This repository is set up for a single Render web service:

- React frontend is built during deploy
- Express backend serves the built frontend
- API and frontend run from the same domain

### Files already prepared

- [render.yaml](/C:/Projects/invoice-generator/render.yaml)
- [frontend/src/api.js](/C:/Projects/invoice-generator/frontend/src/api.js)
- [backend/index.js](/C:/Projects/invoice-generator/backend/index.js)
- [backend/sheets.js](/C:/Projects/invoice-generator/backend/sheets.js)

### What you need to do

1. Push this project to a GitHub repository.
2. Log in to [Render](https://render.com/).
3. Click `New +` -> `Blueprint`.
4. Connect your GitHub repository.
5. Render should detect [render.yaml](/C:/Projects/invoice-generator/render.yaml) and create the web service.
6. In the Render service, add environment variables:

Required:

- `SHEET_ID` = your Google Sheet / Drive workbook ID
- `DATA_MODE` = `google`
- `NODE_ENV` = `production`

Google credentials, choose one option:

Option A: Secret file on Render

- Upload your service account JSON as a secret file named `credentials.json`
- Set `CREDENTIALS_PATH=/etc/secrets/credentials.json`

Option B: Raw JSON environment variable

- Add `GOOGLE_CREDENTIALS_JSON`
- Paste the full contents of your service account JSON into that variable

7. Deploy the service.
8. Open the Render URL after deploy finishes.

### Important Google setup

Your Google file must be shared with the service account email from the credentials JSON.

If you are using:

- a native Google Sheet: share the Sheet
- an `.xlsx` file in Google Drive: share that Drive file

Editor access is recommended because the app writes invoice rows.

## Render notes

- Free Render services sleep after inactivity, so the first request can be slow.
- PDF generation uses Puppeteer, so the backend must stay on Render or another Node server, not a static host.
- The frontend API uses relative `/api` URLs in production, so no extra frontend env var is required for the single-service Render setup.

## Main routes

- `/` create invoice
- `/lookup` invoice lookup
- `/dashboard` analytics dashboard
- `/api/health` backend health

## Troubleshooting

### App deploys but data does not load

Check:

- `SHEET_ID` is correct
- the Google file is shared with the service account
- credentials are present via `CREDENTIALS_PATH` or `GOOGLE_CREDENTIALS_JSON`

### Frontend loads but API fails

Check Render logs for backend startup errors.

### PDF generation fails

Check Render logs for Puppeteer errors or Google data lookup errors.

## Suggested GitHub safety

Do not commit:

- `backend/.env`
- `backend/credentials.json`
- `backend/credentials.json.json`

The root [.gitignore](/C:/Projects/invoice-generator/.gitignore) already excludes them.
