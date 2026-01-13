# Request Verification Guide

## Frontend Request (frontend/lib/api.ts)

**Request Format:**
- Method: `POST`
- URL: `http://localhost:3000/api/v1/analyze` (no trailing slash)
- Headers: `{ "Content-Type": "application/json" }`
- Body: `JSON.stringify(requestBody)` (string, NOT FormData)

**Request Body Structure:**
```json
{
  "resume": {
    "file_content": "<base64-string>",
    "file_format": "txt|pdf|doc|docx",
    "file_name": "resume.txt",
    "file_size_bytes": 1234
  },
  "job_description": {
    "job_description_text": "Job description text..."
  },
  "options": {}
}
```

## Backend Handler Verification

**Handler Location:** `backend/src/routes/analyze.ts`

**Verification Log:**
- `console.log("HANDLER HIT", request.headers["content-type"])`
- This log MUST appear if the route matches
- If this log doesn't appear → route is not matching (404)

## Expected Flow

1. **Frontend logs:**
   ```
   [Frontend API] Making request: {
     url: "http://localhost:3000/api/v1/analyze",
     contentType: "application/json",
     isJSON: true
   }
   ```

2. **Backend global hook logs:**
   ```
   🔍 [GLOBAL] Incoming request {
     method: "POST",
     url: "/api/v1/analyze",
     content-type: "application/json"
   }
   ```

3. **Backend handler logs:**
   ```
   HANDLER HIT application/json
   ✅ [HANDLER] POST /api/v1/analyze handler EXECUTED
   ```

4. **Frontend receives:**
   ```
   [Frontend API] Response received: {
     status: 200,
     ok: true
   }
   ```

## If 404 Occurs

**Check in order:**
1. Does global hook log appear? → Request reaches server
2. Does handler log appear? → Route matches
3. What URL is logged? → Verify exact path
4. What content-type is logged? → Must be "application/json"

## Root Cause Analysis

If handler log doesn't appear but global hook does:
- Route path mismatch
- HTTP method mismatch
- Fastify routing issue

If global hook doesn't appear:
- Network issue
- CORS blocking
- Server not running

