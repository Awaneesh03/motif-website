# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Motif platform.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Motif Auth")
5. Click "Create"

### 2. Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type (or "Internal" if using Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - App name: "Motif"
   - User support email: Your email
   - Developer contact information: Your email
5. Click "Save and Continue"
6. Skip the "Scopes" section for now (click "Save and Continue")
7. Add test users if needed
8. Click "Save and Continue"

### 4. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Select "Web application" as the application type
4. Configure the settings:
   - **Name**: "Motif Web Client"
   - **Authorized JavaScript origins**:
     - For development: `http://localhost:5173`
     - For production: Add your production domain (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**:
     - For development: `http://localhost:5173`
     - For production: Add your production domain (e.g., `https://yourdomain.com`)
5. Click "Create"
6. Copy the **Client ID** (you'll need this in the next step)

### 5. Configure Your Application

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace `your_google_client_id_here` with your actual Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_actual_client_id_from_google_cloud_console
   ```

3. Save the file

### 6. Restart Your Development Server

If your development server is running, restart it to load the new environment variables:

```bash
npm run dev
```

## Testing Google OAuth

1. Navigate to the login/signup page at `http://localhost:5173/auth`
2. Click the "Continue with Google" button
3. You should see the Google OAuth consent screen
4. Select your Google account
5. Grant the requested permissions
6. You should be redirected back to the application and logged in

## Important Notes

### Security

- **Never commit your `.env` file to version control**
- The `.env` file is already in `.gitignore` by default
- Only share your Client ID in secure channels if needed
- Keep your Client Secret (if you have one) completely private

### Production Deployment

When deploying to production:

1. Add your production domain to the authorized JavaScript origins and redirect URIs in Google Cloud Console
2. Set the `VITE_GOOGLE_CLIENT_ID` environment variable in your hosting platform
3. Ensure your production domain uses HTTPS

### Token Handling

The current implementation:
- Receives a JWT credential token from Google
- Decodes it client-side for demonstration purposes
- **For production**, you should:
  - Send the credential to your backend server
  - Verify the token server-side using Google's token verification API
  - Create your own session/JWT token
  - Never trust client-side token validation alone

### One Tap Login

The implementation includes Google's "One Tap" feature, which shows a popup for easy sign-in if the user is already logged into Google.

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure the redirect URI in your code matches exactly what's in Google Cloud Console
- Check for trailing slashes - they matter!
- Ensure you're using the correct protocol (http vs https)

### "Error 401: invalid_client"
- Your Client ID is incorrect
- Make sure you're using the Client ID (not Client Secret)
- Check that there are no extra spaces in your `.env` file

### Google button not showing
- Check browser console for errors
- Verify that `VITE_GOOGLE_CLIENT_ID` is set in your `.env` file
- Make sure you restarted the dev server after adding the `.env` file
- Check that `@react-oauth/google` is installed

### "This app isn't verified"
- This is normal during development
- Users can click "Advanced" → "Go to [App Name] (unsafe)" to proceed
- To remove this warning, submit your app for verification in Google Cloud Console

## Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)

## Support

If you encounter any issues not covered here, please check:
- Google Cloud Console error logs
- Browser console errors
- Network tab in browser dev tools
