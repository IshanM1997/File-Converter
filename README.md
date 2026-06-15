[README.md](https://github.com/user-attachments/files/28950573/README.md)
# 🔄 FileForge — File Converter & Merger

A full-stack file conversion and merging tool.
**Stack:** Python (Flask) backend · Angular 17 frontend · Bootstrap 5

---

## Supported Formats

| Format | Convert To | Merge |
|--------|-----------|-------|
| PDF    | TXT, PNG, JPG | ✅ |
| CSV    | XLSX, TXT, PDF | ✅ |
| XLSX   | CSV, TXT, PDF | ✅ |
| DOC    | TXT, PDF | ✅ |
| TXT    | PDF, CSV, XLSX, DOC | ✅ |
| PNG    | JPG, JPEG, PDF | ✅ |
| JPG    | PNG, JPEG, PDF | ✅ |
| JPEG   | PNG, JPG, PDF | ✅ |

---

## Quick Start

### 1. Backend (Flask)

```bash
cd backend
pip install flask Pillow pypdf openpyxl pandas reportlab python-docx
python app.py
# API running at http://localhost:5000
```

### 2a. Angular Frontend (recommended)

```bash
cd frontend
npm install
npm start
# App running at http://localhost:4200
```

> Angular dev server proxies `/api/*` to `http://localhost:5000` via `proxy.conf.json`.

### 2b. Standalone HTML (no build needed)

Open `frontend/src/index-standalone.html` directly in a browser.
Make sure the Flask backend is running on port 5000 first.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/conversion-options` | Returns valid target formats for uploaded files |
| POST | `/api/convert` | Converts files to target format, returns file/zip |
| POST | `/api/merge` | Merges same-extension files into one |

All endpoints accept `multipart/form-data`.

---

## Project Structure

```
file_converter/
├── backend/
│   └── app.py                  ← Flask API (CORS, convert, merge)
└── frontend/
    ├── angular.json
    ├── package.json
    ├── proxy.conf.json          ← dev proxy: /api → localhost:5000
    ├── tsconfig.json
    └── src/
        ├── main.ts
        ├── index.html
        ├── index-standalone.html  ← works without npm/Angular
        ├── styles.scss
        └── app/
            ├── app.component.ts   ← main logic
            ├── app.component.html ← template
            ├── app.component.scss ← styles
            ├── converter.service.ts ← HTTP calls
            └── format-badge.component.ts
```

---

## Features

- **Drag & drop** or click-to-browse file upload
- **Convert To** — pops a modal showing all valid target formats; blocks same-extension conversions
- **Merge Files** — pops an error if files have different extensions; otherwise merges and downloads
- **Multiple files** — convert several files at once; downloaded as a ZIP
- **Format badges** — colour-coded extension tags throughout the UI
- Bootstrap 5 components (modal, spinner, grid, navbar, badges) — ready to extend
