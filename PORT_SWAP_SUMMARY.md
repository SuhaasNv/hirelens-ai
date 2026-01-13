# Port Swap Summary

## Industry-Standard Local Dev Setup

- **Frontend (Next.js)**: `http://localhost:3000`
- **Backend (Fastify API)**: `http://localhost:3001`

## Changes Applied

### 1️⃣ Backend: Fastify moved to port 3001

**File**: `backend/src/server.ts`

```diff
- const port = 3000;
+ const port = 3001;
```

**Startup logs will show:**
```
📡 Server listening on http://localhost:3001
📋 API Base URL: http://localhost:3001/api/v1
```

### 2️⃣ Frontend: Next.js on port 3000

**File**: `frontend/package.json`

```diff
- "dev": "next dev -p 3001",
+ "dev": "next dev -p 3000",
```

### 3️⃣ Frontend API base URL updated

**File**: `frontend/lib/api.ts`

```diff
- const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
+ const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
```

**Final request resolves to:**
```
POST http://localhost:3001/api/v1/analyze
```

### 4️⃣ CORS configuration updated

**File**: `backend/src/app.ts`

```diff
  origin: [
-   "http://localhost:3000",
-   "http://localhost:3001",
-   "http://127.0.0.1:3000",
-   "http://127.0.0.1:3001",
+   "http://localhost:3000",
+   "http://127.0.0.1:3000",
  ],
```

**CORS allows:**
- ✅ `http://localhost:3000` (frontend)
- ✅ `http://127.0.0.1:3000` (frontend alternative)
- ❌ No wildcard origins (security best practice)

## Verification Checklist

### ✅ Start Servers

1. **Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   **Expected output:**
   ```
   📡 Server listening on http://localhost:3001
   📋 API Base URL: http://localhost:3001/api/v1
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   **Expected output:**
   ```
   Ready on http://localhost:3000
   ```

### ✅ Backend Health Check

```bash
curl http://localhost:3001/api/v1/health
```

**Expected response:**
```json
{"status":"operational"}
```

### ✅ Browser Verification

1. **Open browser at:** `http://localhost:3000`
2. **Browser console should show:**
   ```
   🌐 Frontend running on http://localhost:3000
   ```

### ✅ Network Request Verification

When clicking "Analyze Resume":

1. **Browser origin:** `http://localhost:3000` ✓
2. **Network request:** `POST http://localhost:3001/api/v1/analyze` ✓
3. **Frontend console:**
   ```
   [Frontend API] Making request: {
     url: "http://localhost:3001/api/v1/analyze",
     contentType: "application/json"
   }
   ```
4. **Backend console:**
   ```
   HANDLER HIT application/json
   ✅ [HANDLER] POST /api/v1/analyze handler EXECUTED
   ```

## Final URLs Summary

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `http://localhost:3000` | User interface (browser) |
| **Backend API** | `http://localhost:3001` | API server |
| **Health Check** | `http://localhost:3001/api/v1/health` | Backend status |
| **Analyze Endpoint** | `http://localhost:3001/api/v1/analyze` | Resume analysis |

## Architecture

```
Browser (localhost:3000)
    ↓
Frontend (Next.js on :3000)
    ↓ HTTP POST
Backend (Fastify on :3001)
    ↓
/api/v1/analyze
```

## Constraints Maintained

- ✅ No proxy rewrites
- ✅ No demo mode
- ✅ No shortcuts
- ✅ Production-grade separation
- ✅ Clean CORS configuration (no wildcards)

