# Firebase Storage CORS Setup (Free Solution)

## Option 1: Firebase Console (Recommended - Free)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ki-82889`
3. Click on "Storage" in the left sidebar
4. Click on the "Rules" tab
5. Replace the rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

6. Click "Publish"

## Option 2: Alternative Image Loading (Already Implemented)

The code now includes multiple fallback strategies:
1. CORS-enabled loading
2. Direct image element loading (works with TensorFlow.js)
3. Free CORS proxy service
4. Clean canvas fallback

## Option 3: Local Development Proxy

If you want to test locally, you can use a simple proxy server:

1. Install a local CORS proxy:
```bash
npm install -g local-cors-proxy
```

2. Start the proxy:
```bash
lcp --proxyUrl https://firebasestorage.googleapis.com --port 8010
```

3. Update your image URLs to use: `http://localhost:8010/...`

## Testing

The application should now work with the implemented fallback strategies. The face detection will:
1. Try to load images with CORS
2. Fall back to direct image loading if CORS fails
3. Use TensorFlow.js BlazeFace for face detection
4. Provide manual verification if automatic detection fails

## Notes

- The free CORS proxy (allorigins.win) has rate limits but should work for testing
- Firebase Storage rules update is the best long-term solution
- The application gracefully handles CORS issues and provides manual verification options