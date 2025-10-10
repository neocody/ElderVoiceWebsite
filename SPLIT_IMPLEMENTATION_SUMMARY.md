# ElderVoice Split Implementation Summary

## Overview
Successfully split the ElderVoice monolith into two separate applications:
- **ElderVoice** (Landing/Marketing site)
- **ElderVoiceApp** (Main application with auth, admin, and dashboard)

## What Was Done

### 1. Repository Setup ✅
- Synced all files from ElderVoice to ElderVoiceApp
- Both repositories now have complete, independent codebases

### 2. Domain Configuration ✅
Created domain config files for cross-site navigation:

**ElderVoice** (`client/src/config/domains.ts`):
```typescript
export const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN || 'http://localhost:5174';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
export const LANDING_DOMAIN = window.location.origin;
```

**ElderVoiceApp** (`client/src/config/domains.ts`):
```typescript
export const LANDING_DOMAIN = import.meta.env.VITE_LANDING_DOMAIN || 'http://localhost:5173';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
export const APP_DOMAIN = window.location.origin;
```

### 3. Environment Variables ✅
Updated `.env` files in both repositories:

**ElderVoice** (`.env`):
- Added `VITE_APP_DOMAIN=http://localhost:5174` for local development
- Production: `VITE_APP_DOMAIN=https://app.eldervoice.com`

**ElderVoiceApp** (`.env`):
- Added `VITE_LANDING_DOMAIN=http://localhost:5173` for local development
- Production: `VITE_LANDING_DOMAIN=https://eldervoice.com`

### 4. Environment Templates ✅
Created `.env.example` files for both repositories with documentation for all variables including:
- Session secrets
- API keys (Twilio, OpenAI, ElevenLabs, SendGrid, Resend)
- Stripe configuration
- Supabase credentials
- Frontend URLs
- Domain configuration variables

### 5. Route Separation ✅

**ElderVoice** (`App.tsx`) - Marketing Only:
- Removed all auth routes (`/auth/*`)
- Removed all admin routes (`/admin/*`, `/facility/*`, `/member/*`)
- Removed protected route logic (`AdminRoute` component)
- **Kept**:
  - `/` (Landing)
  - `/features`
  - `/individuals`
  - `/facilities`
  - `/vision`
  - `/careers`
  - `/faqs`
  - `/contact`
  - `/terms-of-service`
  - `/privacy-policy`
  - `/getstarted` (signup flow)
  - `/getstarted/facility-demo`

**ElderVoiceApp** (`App.tsx`) - App Only:
- Removed marketing routes (landing, features, individuals, facilities, vision, careers, faqs, contact)
- **Kept**:
  - `/` → redirects to `/admin/dashboard`
  - `/auth/*` (signin, signup, forgot-password, reset-password, verify-email)
  - `/pricing`
  - `/getstarted`
  - `/onboarding`
  - `/admin/*` (all admin routes)
  - `/facility/*` (all facility routes)
  - `/member/*` (all member routes)
  - Legacy routes for backward compatibility

### 6. CTA Button Updates ✅
Updated all "Sign In" and "Get Started" buttons in the landing site to redirect to `APP_DOMAIN`:

**Files Updated**:
- `client/src/components/MarketingLayout.tsx` (header navigation)
- `client/src/pages/Landing.tsx` (hero CTAs + final CTA)
- `client/src/pages/Individuals.tsx` (multiple CTAs)
- `client/src/pages/Features.tsx` (CTA button)
- `client/src/pages/Vision.tsx` (multiple CTAs)
- `client/src/pages/Contact.tsx` (CTA buttons)

**Before**: `<Link href="/auth/signin">` or `<Link href="/getstarted">`
**After**: `<a href={\`\${APP_DOMAIN}/auth/signin\`}>` or `<a href={\`\${APP_DOMAIN}/getstarted\`}>`

## Local Development Setup

### Running Both Applications Locally

**Landing Site (ElderVoice)**:
```bash
cd /Users/wajahatshaw/ReactNativeProjects/ElderVoice
npm install
npm run dev    # http://localhost:5173
```

**Main App (ElderVoiceApp)**:
```bash
cd /Users/wajahatshaw/ReactNativeProjects/ElderVoiceApp
npm install
npm run dev    # http://localhost:5174
```

### Testing the Split
1. Open `http://localhost:5173` (Landing site)
2. Click "Sign In" → should redirect to `http://localhost:5174/auth/signin`
3. Click "Get Started" → should redirect to `http://localhost:5174/getstarted`
4. Complete auth flow in the app
5. Access protected routes

## Replit Deployment

### Creating Two Replit Projects

**Landing Replit** (ElderVoice-Landing):
1. Create Repl → Import from GitHub → `ElderVoice` repo
2. Add Secrets:
   ```
   VITE_APP_DOMAIN=https://app.eldervoice.com
   (or temp: https://eldervoice-app.<id>.repl.co)
   
   All other API keys from .env.example
   ```
3. Run command: `npm run build && npm run preview -- --host 0.0.0.0 --port 3000`
4. Custom Domain: Connect `eldervoice.com`

**App Replit** (ElderVoice-App):
1. Create Repl → Import from GitHub → `ElderVoiceApp` repo
2. Add Secrets:
   ```
   VITE_LANDING_DOMAIN=https://eldervoice.com
   (or temp: https://eldervoice-landing.<id>.repl.co)
   
   All other API keys from .env.example
   ```
3. Run command: `npm run build && npm run preview -- --host 0.0.0.0 --port 3000`
4. Custom Domain: Connect `app.eldervoice.com`

### Backend CORS Configuration
Update your backend (ElderAI or wherever the API lives) to allow both origins:
```javascript
const allowed = [
  'https://eldervoice.com',
  'https://app.eldervoice.com',
  'http://localhost:5173',
  'http://localhost:5174',
  // Add Replit preview URLs during testing
  'https://eldervoice-landing.<id>.repl.co',
  'https://eldervoice-app.<id>.repl.co'
];
```

### Supabase Auth Redirect URLs
Add these to your Supabase project:
- `http://localhost:5174/*` (local dev)
- `https://eldervoice-app.<id>.repl.co/*` (Replit preview)
- `https://app.eldervoice.com/*` (production)

## Production Domain Setup
1. Point `eldervoice.com` → Landing Replit (via CNAME)
2. Point `app.eldervoice.com` → App Replit (via CNAME)
3. Update Secrets in both Replits to use production domains
4. Update backend CORS to include production domains

## Architecture Benefits
✅ **Separation of Concerns**: Marketing and app logic are completely separate
✅ **Independent Deployments**: Deploy landing or app without affecting the other
✅ **Domain Isolation**: `eldervoice.com` for marketing, `app.eldervoice.com` for the app
✅ **Shared Backend**: Both use the same API, DB, and Supabase instance
✅ **Clean Navigation**: Simple redirects between sites via domain variables
✅ **Environment Flexibility**: Works locally, on Replit, and in production

## Next Steps
1. ✅ Test both apps locally
2. Push changes to GitHub (when ready)
3. Create two Replit projects from the repos
4. Configure DNS for custom domains
5. Update backend CORS configuration
6. Test full flow from landing → auth → dashboard

## Files Modified

### ElderVoice (Landing)
- `client/src/config/domains.ts` (created)
- `client/src/App.tsx` (removed app routes)
- `client/src/components/MarketingLayout.tsx` (updated CTAs)
- `client/src/pages/Landing.tsx` (updated CTAs)
- `client/src/pages/Individuals.tsx` (updated CTAs)
- `client/src/pages/Features.tsx` (updated CTAs)
- `client/src/pages/Vision.tsx` (updated CTAs)
- `client/src/pages/Contact.tsx` (updated CTAs)
- `.env` (added VITE_APP_DOMAIN)
- `.env.example` (created)

### ElderVoiceApp (Main App)
- `client/src/config/domains.ts` (created)
- `client/src/App.tsx` (removed marketing routes)
- `.env` (added VITE_LANDING_DOMAIN)
- `.env.example` (created)

## Status
🎉 **Split Complete - Ready for Testing!**

All code changes are done. No commits have been made yet. Test both repositories locally before pushing to GitHub.

