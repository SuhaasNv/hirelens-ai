# Root Cause Analysis - HTTP 404 on POST /api/v1/analyze

## Current Route Registration Flow

1. **server.ts** creates root Fastify instance
2. **server.ts** adds global `onRequest` hook (logs ALL requests)
3. **server.ts** registers `app` plugin: `await server.register(app)`
4. **app.ts** registers CORS plugin
5. **app.ts** registers routes:
   - `await fastify.register(healthRoute, { prefix: "/api/v1" })`
   - `await fastify.register(analyzeRoute, { prefix: "/api/v1" })`
6. **routes/analyze.ts** defines: `fastify.post("/analyze", ...)`
7. **Final route:** `POST /api/v1/analyze` on root server instance

## Verification Steps

### Step 1: Check Global Hook Logs
When frontend makes request, you should see:
```
🔍 [GLOBAL] Incoming request
  method: POST
  url: /api/v1/analyze
  content-type: application/json
```

### Step 2: Check Handler Execution
If route matches, you should see:
```
✅ [HANDLER] POST /api/v1/analyze handler EXECUTED
```

### Step 3: Check 404 Handler
If route doesn't match, you should see:
```
404 - Route not found
  method: POST
  url: /api/v1/analyze
```

## Frontend Request Verification

Frontend logs will show:
```javascript
[Frontend API] Making request: {
  url: "http://localhost:3000/api/v1/analyze",
  method: "POST",
  contentType: "application/json",
  bodyType: "string"
}
```

## Possible Root Causes

1. **Request not reaching server** - No global hook log = network issue
2. **Route not matching** - Global hook logs but no handler execution = routing issue
3. **Content-type mismatch** - Check if content-type is "application/json"
4. **OPTIONS preflight failing** - Browser sends OPTIONS first, if that fails, POST never sent

## Test Command (Matches Frontend Exactly)

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

