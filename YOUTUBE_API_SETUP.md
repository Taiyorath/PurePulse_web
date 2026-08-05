# How to Enable YouTube Data API v3 in Google Cloud Console

## Step-by-Step Instructions

### 1. Go to Google Cloud Console
- Open [https://console.cloud.google.com/](https://console.cloud.google.com/)
- Make sure you're signed in with the same Google account that has the API key

### 2. Select Your Project
- Your project ID is: `999036108821`
- Click on the project dropdown at the top
- Select your project (it might be named something like "My Project" or similar)

### 3. Navigate to APIs & Services
- In the left sidebar, click on "APIs & Services"
- Then click on "Library"

### 4. Search for YouTube Data API
- In the search box, type: `YouTube Data API v3`
- Click on the "YouTube Data API v3" result (not just "YouTube API")

### 5. Enable the API
- Click the "ENABLE" button
- Wait for it to process (usually takes a few seconds)

### 6. Verify It's Enabled
- Go to "APIs & Services" → "Enabled APIs"
- You should see "YouTube Data API v3" in the list

## Alternative Method (if you can't find it in Library)

### 1. Direct Link
- Go directly to: [https://console.cloud.google.com/apis/library/youtube.googleapis.com](https://console.cloud.google.com/apis/library/youtube.googleapis.com)
- Make sure your project is selected
- Click "ENABLE"

### 2. Using the API Explorer
- Go to: [https://console.cloud.google.com/apis/api/youtube.googleapis.com](https://console.cloud.google.com/apis/api/youtube.googleapis.com)
- Click "ENABLE"

## After Enabling

1. **No need to create a new API key** - your existing key will work
2. **Test the integration** by running: `node test-apis.js`
3. **All APIs should show as working** ✅

## Common Issues

- **Wrong API**: Make sure it's "YouTube Data API v3", not just "YouTube API"
- **Wrong Project**: Ensure you're in the correct project (ID: 999036108821)
- **Billing**: Some APIs require billing to be enabled, but YouTube Data API v3 has a free tier

## Expected Result

After enabling, when you run `node test-apis.js`, you should see:
```
📊 Test Results Summary:
📰 NewsAPI: ✅ Working
🎥 YouTube API: ✅ Working
🤖 Gemini API: ✅ Working

🎯 Overall: 3/3 APIs working (100%)
```

Let me know if you need help with any of these steps!