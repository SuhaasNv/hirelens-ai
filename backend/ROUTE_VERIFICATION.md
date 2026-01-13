# Route Verification

## 1. Server Route Registration

**File:** `backend/src/app.ts`
- Health route registered: `await fastify.register(healthRoute, { prefix: "/api/v1" });`
- Analyze route registered: `await fastify.register(analyzeRoute, { prefix: "/api/v1" });`

**File:** `backend/src/routes/health.ts`
- Route definition: `fastify.get("/health", ...)`
- **Full registered path: `GET /api/v1/health`**

**File:** `backend/src/routes/analyze.ts`
- Route definition: `fastify.post("/analyze", ...)`
- **Full registered path: `POST /api/v1/analyze`**

## 2. Frontend API Client

**File:** `frontend/lib/api.ts`
- Function: `analyzeResume()`
- URL: `${API_BASE_URL}/api/v1/analyze`
- Where `API_BASE_URL = "http://localhost:3000"` (default)
- **Full URL called: `POST http://localhost:3000/api/v1/analyze`**

## 3. Verification

✅ **HTTP Method:** POST (matches)
✅ **Path:** `/api/v1/analyze` (matches)

## 4. Logging Added

**Frontend:** Console logs request URL and method before fetch
**Backend:** `onRequest` hook logs all incoming requests (method + URL)
**Backend:** 404 handler shows available routes when route not found

## 5. Test Command

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
      "job_description_text": "Looking for Python developer with React experience."
    }
  }'
```

## Root Cause Analysis

If you're getting 404, possible causes:
1. **Server not running** - Check if backend is started
2. **Route registration order** - Routes are registered after CORS, should be fine
3. **Path mismatch** - Frontend and backend paths match exactly
4. **Fastify route matching** - Check server logs for "Incoming request" to see what path is being requested

The logging will show exactly what URL the frontend is calling and what the backend receives.

