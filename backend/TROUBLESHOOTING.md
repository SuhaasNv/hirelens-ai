# Troubleshooting "Failed to fetch" Error

## 1. Verify Server Startup

**Run the backend:**
```bash
cd backend
npm install
npm run dev
```

**Expected output:**
```
📋 Registered Routes:
└── /api/v1
    ├── /health (GET)
    └── /analyze (POST)

🚀 HireLens AI Backend started successfully
📡 Server listening on http://localhost:3000
📋 API Base URL: http://localhost:3000/api/v1
🏥 Health Check: http://localhost:3000/api/v1/health
📊 Analyze Endpoint: http://localhost:3000/api/v1/analyze
```

## 2. Test Health Endpoint

**Using curl:**
```bash
curl http://localhost:3000/api/v1/health
```

**Expected response:**
```json
{
  "status": "operational",
  "service": "HireLens AI Backend",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45
}
```

## 3. CORS Configuration

**Why "Failed to fetch" occurs:**
- Browser enforces CORS (Cross-Origin Resource Sharing)
- When frontend (localhost:3001) calls backend (localhost:3000), it's a cross-origin request
- If backend doesn't send proper CORS headers, browser blocks the request
- Browser shows "Failed to fetch" instead of the actual CORS error

**Current CORS config allows:**
- `http://localhost:3000` (backend)
- `http://localhost:3001` (frontend)
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

## 4. Route Registration

Routes are registered in `src/app.ts`:
- Health: `GET /api/v1/health`
- Analyze: `POST /api/v1/analyze`

Server prints all registered routes at startup.

## 5. Request Body Validation

The analyze endpoint logs:
- Request headers
- Body keys
- Body shape (hasResume, hasJobDescription, hasOptions)

Check server logs to see if request is reaching the backend.

## 6. Test with curl

**PowerShell (Windows):**
```powershell
cd backend
.\test-analyze.ps1
```

**Bash (Linux/Mac):**
```bash
cd backend
chmod +x test-analyze.sh
./test-analyze.sh
```

**Manual curl command:**
```bash
curl -X POST http://localhost:3000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "resume": {
      "file_content": "Sm9obiBEb2UKRW1haWw6IGpvaG4uZG9lQGV4YW1wbGUuY29tClBob25lOiAoNTU1KSAxMjMtNDU2NwoKRVhQRVJJRU5DRQpTb2Z0d2FyZSBFbmdpbmVlciB8IFRlY2ggQ29ycCB8IDIwMjAtMjAyMwoKUFlUSE9OCkRBVEFCQVNFClJFQUNUCg==",
      "file_format": "txt",
      "file_name": "test.txt"
    },
    "job_description": {
      "job_description_text": "Looking for Python developer with React experience."
    }
  }'
```

## Common Issues

1. **Backend not running**: Start with `npm run dev`
2. **Wrong port**: Backend runs on 3000, frontend expects 3000
3. **CORS blocked**: Check browser console for CORS errors
4. **Request format**: Ensure Content-Type is `application/json`
5. **Base64 encoding**: Frontend must encode resume file correctly

