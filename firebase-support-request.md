# Firebase Support Request - Gemini API Model Issue

## Project Details
- **Project ID**: gray-mirror-274ac
- **Project Number**: 147395492761
- **Region**: us-central1
- **Function**: callGemini

## Issue Description
Our Cloud Function `callGemini` is still attempting to use the deprecated `gemini-pro` model instead of the updated `gemini-1.5-flash` model, even after multiple deployments.

## Error Details
```
Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent: 
[404 Not Found] models/gemini-pro is not found for API version v1beta
```

## Code Changes Made
We updated our function code from:
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
```

To:
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

## Deployment History
1. **First deployment**: Updated code and deployed functions
2. **Second deployment**: Rebuilt and redeployed callGemini specifically
3. **Verification**: Logs still show `gemini-pro` being called

## Request
Please verify that:
1. The function deployment was successful
2. The updated code is actually running
3. There are no caching issues preventing the new model from being used

## Log Evidence
Recent logs show the function is still trying to access `gemini-pro`:
```
2025-10-05T17:05:24.427395Z ? callGemini: Error calling Gemini: GoogleGenerativeAIFetchError: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

## Expected Behavior
The function should now use `gemini-1.5-flash` model and work without 404 errors.

## Contact
- Email: alonsaranga@gmail.com
- Function: https://console.firebase.google.com/project/gray-mirror-274ac/functions/list

Thank you for your assistance.
