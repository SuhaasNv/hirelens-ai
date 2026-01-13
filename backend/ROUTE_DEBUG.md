# Route Debugging Information

## Registered Routes

Based on the code structure:

1. **Health Route**
   - File: `src/routes/health.ts`
   - Route definition: `fastify.get("/health", ...)`
   - Registered with prefix: `/api/v1`
   - **Full path: `GET /api/v1/health`**

2. **Analyze Route**
   - File: `src/routes/analyze.ts`
   - Route definition: `fastify.post("/analyze", ...)`
   - Registered with prefix: `/api/v1`
   - **Full path: `POST /api/v1/analyze`**

## Frontend API Call

- File: `frontend/lib/api.ts`
- Function: `analyzeResume()`
- URL constructed: `${API_BASE_URL}/api/v1/analyze`
- Where `API_BASE_URL = "http://localhost:3000"`
- **Full URL: `http://localhost:3000/api/v1/analyze`**
- Method: `POST`

## Expected Match

✅ Frontend calls: `POST http://localhost:3000/api/v1/analyze`
✅ Backend registers: `POST /api/v1/analyze`

These should match exactly.

## Test with curl

```bash
curl -X POST http://localhost:3000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3001" \
  -d '{
    "resume": {
      "file_content": "Sm9obiBEb2UKRW1haWw6IGpvaG4uZG9lQGV4YW1wbGUuY29tClBob25lOiAoNTU1KSAxMjMtNDU2Nwo=",
      "file_format": "txt",
      "file_name": "test.txt"
    },
    "job_description": {
      "job_description_text": "Looking for Python developer."
    }
  }'
```

## Debugging Steps

1. Check server logs for "Incoming request" entries
2. Check browser console for "[Frontend API] Making request" log
3. Check server logs for 404 warnings with available routes
4. Verify `server.printRoutes()` output matches expected routes

