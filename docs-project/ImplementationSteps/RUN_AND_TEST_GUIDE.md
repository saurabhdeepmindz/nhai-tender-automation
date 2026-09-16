# NHAI Tender Automation — Run & Test Guide

This guide captures the exact run commands, service URLs, and ready-to-use curl examples (for both Windows Command Prompt and PowerShell) to upload historical RFP documents and verify via Swagger.

## Services & URLs
- Backend API (NestJS): http://localhost:3000/api
- Backend Swagger: http://localhost:3000/api/docs
- Frontend App (Next.js): http://localhost:3001
- Admin Panel: http://localhost:3001/admin/vectorization-control
- Screen 7 API: http://localhost:8000 (Docs: http://localhost:8000/docs)
- Screen 8 API: http://localhost:8001 (Docs: http://localhost:8001/docs)

## Start Commands

### Backend (NestJS, port 3000)
- Script: see START_BACKEND.bat
- Manual:
```powershell
cd d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\backend
npm install
npm run start:dev
```

### Frontend (Next.js, port 3001)
- Script: see START_FRONTEND.bat
- Manual:
```powershell
cd d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\frontend
npm install
npm run dev -- -p 3001
```

### All Services
- Script: see START_ALL_SERVICES.bat

## Swagger (Historical RFP Upload)
- Endpoint: POST http://localhost:3000/api/historical-data/upload
- Tag: Historical Data Management
- Body: multipart/form-data
  - file: binary (PDF/DOCX/CSV/XLSX)
  - rfp_number: string
  - title: string
  - document_type: enum [RFP, Q&A, CORRIGENDUM]
  - description: string (optional)

## Curl Examples

### Windows Command Prompt (CMD)
Use caret `^` for line continuation.
```cmd
curl -X POST "http://localhost:3000/api/historical-data/upload" ^
  -H "Accept: application/json" ^
  -H "Content-Type: multipart/form-data" ^
  -F "file=@C:\Path\To\document.pdf" ^
  -F "rfp_number=RFP-2024-NH-001" ^
  -F "title=Mumbai-Pune Expressway Development" ^
  -F "document_type=RFP" ^
  -F "description=Historical RFP for reference"
```

Check document status (replace `123` with returned ID):
```cmd
curl -X GET "http://localhost:3000/api/historical-data/123" -H "Accept: application/json"
```

List documents with optional filters:
```cmd
curl -X GET "http://localhost:3000/api/historical-data?type=RFP&status=COMPLETED&rfp_number=RFP-2024-NH-001" -H "Accept: application/json"
```

### Windows PowerShell
Use backtick `` ` `` for line continuation.
```powershell
curl -X POST "http://localhost:3000/api/historical-data/upload" `
  -H "Accept: application/json" `
  -H "Content-Type: multipart/form-data" `
  -F "file=@D:\Docs\document.pdf" `
  -F "rfp_number=RFP-2024-NH-001" `
  -F "title=Mumbai-Pune Expressway Development" `
  -F "document_type=RFP" `
  -F "description=Historical RFP for reference"
```

Check document status:
```powershell
curl -X GET "http://localhost:3000/api/historical-data/123" -H "Accept: application/json"
```

List documents:
```powershell
curl -X GET "http://localhost:3000/api/historical-data?type=RFP&status=COMPLETED&rfp_number=RFP-2024-NH-001" -H "Accept: application/json"
```

## Tips
- Ensure the backend is running on port 3000 and Swagger is accessible at `/api/docs`.
- Use absolute Windows paths for the file upload field (e.g., `C:\...`).
- Allowed file types: PDF, DOCX, CSV, XLSX. Max size: 50MB.
- The response returns a document ID you can use to check status via GET `/api/historical-data/{id}`.

## Automation

- CSV matrix: docs/RUN_TEST_MATRIX.csv now includes a hands-free upload row with columns `FilePath`, `RfpNumber`, `Title`, `DocumentType`, `Description`.
- PowerShell runner: docs/run-tests.ps1
  - Run GET-only:
    ```powershell
    powershell -ExecutionPolicy Bypass -File "docs/run-tests.ps1"
    ```
  - Hands-free upload using row data, then status/list:
    ```powershell
    powershell -ExecutionPolicy Bypass -File "docs/run-tests.ps1" -StartAll
    ```
  - Override upload fields manually:
    ```powershell
    powershell -ExecutionPolicy Bypass -File "docs/run-tests.ps1" `
      -UploadFilePath "C:\Docs\document.pdf" `
      -RfpNumber "RFP-2024-NH-002" `
      -Title "Alternate Title" `
      -DocumentType "RFP"
    ```
  - Outputs JSON to docs/test-results. Add `-DryRun` to preview without executing.
