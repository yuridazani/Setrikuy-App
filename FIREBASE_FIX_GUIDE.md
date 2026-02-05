# Firebase Configuration Fix Guide

## Problem
```
GET https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=... 400 (Bad Request)
{"error":{"code":400,"message":"CONFIGURATION_NOT_FOUND"}}
```

## Root Causes
1. **API Key Restrictions**: Your API key has IP/domain restrictions that block localhost
2. **Disabled APIs**: The Identity Toolkit API may not be enabled in your Firebase project
3. **Environment Mismatch**: Development environment doesn't match production restrictions

## Solutions

### Solution 1: Remove API Key Restrictions (DEVELOPMENT ONLY)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `setrikuy-app`
3. Go to **Settings** → **Project Settings** → **Service Accounts** → **API Keys**
4. Find your Web API Key (starting with `AIzaSy...`)
5. Click the key → **Edit API key**
6. Under **Application Restrictions**:
   - Change from "HTTP referrers" to **None** (for development)
   - Save
7. Wait 5 minutes for changes to propagate

### Solution 2: Add Localhost to Referrer Whitelist
1. Follow steps 1-4 above
2. Keep "HTTP referrers" selected
3. Add these referrers:
   ```
   http://localhost:5173
   http://localhost:5173/*
   http://127.0.0.1:5173
   ```
4. Save and wait 5 minutes

### Solution 3: Enable Identity Toolkit API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `setrikuy-app`
3. Go to **APIs & Services** → **Library**
4. Search for "Identity Toolkit API"
5. Click → **Enable**
6. Wait for activation (usually instant)

### Solution 4: Create Environment-Specific Config
Create `.env.local` for development:
```env
VITE_FIREBASE_API_KEY=AIzaSyBrGKE2zxBjvBF7Wu_74IZljiC_lvJZhEI
VITE_FIREBASE_AUTH_DOMAIN=setrikuy-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=setrikuy-app
VITE_FIREBASE_STORAGE_BUCKET=setrikuy-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=429860459035
VITE_FIREBASE_APP_ID=1:429860459035:web:10fa7b636f81e83d02debe
VITE_FIREBASE_MEASUREMENT_ID=G-GQMHRE61PF
```

Then update `src/lib/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
```

## Testing
After making changes:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart dev server (`npm run dev`)
3. Hard refresh page (Ctrl+Shift+R)
4. Check Console for errors

## What Was Fixed
✅ **Manifest Icons** - Updated to use existing logo.png (was referencing missing android-chrome files)
✅ **Meta Tags** - Added standard `mobile-web-app-capable` tag alongside deprecated Apple tag

## Still Needs Action
⏳ **Firebase API Key** - Choose Solution 1 or 2 above to allow localhost development access
