# Port Configuration Guide

## Port Assignment

- **Frontend (Next.js)**: `http://localhost:3001`
- **Backend (Fastify)**: `http://localhost:3000`

## Why Separate Ports?

The browser was accessing `http://localhost:3000`, which is the Fastify backend server. This caused:
- Frontend not loading (404 for favicon.ico)
- API requests failing because browser was on wrong origin
- CORS issues due to origin mismatch

## Configuration

### Frontend (`frontend/package.json`)
```json
"dev": "next dev -p 3001"
```

This forces Next.js to always run on port 3001.

### Frontend Origin Verification (`frontend/app/page.tsx`)
```typescript
useEffect(() => {
  if (typeof window !== "undefined") {
    console.log("🌐 Frontend running on", window.location.origin);
  }
}, []);
```

This logs the actual origin when the page loads.

## Verification Checklist

### ✅ After Starting Servers

1. **Backend running:**
   ```bash
   cd backend
   npm run dev
   ```
   - Should show: `Server listening on http://localhost:3000`

2. **Frontend running:**
   ```bash
   cd frontend
   npm run dev
   ```
   - Should show: `Ready on http://localhost:3001`

3. **Open browser:**
   - **Correct URL**: `http://localhost:3001`
   - **Wrong URL**: `http://localhost:3000` (this is the backend!)

### ✅ Browser Console Verification

When opening `http://localhost:3001`, you should see:
```
🌐 Frontend running on http://localhost:3001
```

### ✅ Network Request Verification

When clicking "Analyze Resume":

1. **Browser origin**: `http://localhost:3001` ✓
2. **Network request**: `POST http://localhost:3000/api/v1/analyze` ✓
3. **Backend logs**: `HANDLER HIT application/json` ✓

## Troubleshooting

### If frontend still shows 404:

1. **Check which port frontend is actually running on:**
   - Look at terminal output: `Ready on http://localhost:XXXX`
   - Open that exact URL in browser

2. **Check browser console:**
   - Should show: `🌐 Frontend running on http://localhost:3001`
   - If it shows `http://localhost:3000`, you're on the wrong URL

3. **Verify backend is running:**
   - `curl http://localhost:3000/api/v1/health`
   - Should return: `{"status":"operational"}`

4. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

## Summary

- **Frontend URL**: `http://localhost:3001` ← Open this in browser
- **Backend URL**: `http://localhost:3000` ← API calls go here
- **No proxies needed**: Frontend directly calls backend API
- **Clean separation**: Each service on its own port

