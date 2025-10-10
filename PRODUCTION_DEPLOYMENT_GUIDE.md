# Production Deployment Guide - ElderVoice Split

## Overview
This guide will help you deploy the split ElderVoice architecture:
- **eldervoice.com** → Landing/Marketing site (existing Replit)
- **app.eldervoice.com** → Main application (new Replit - to be created)

---

## Phase 1: Push Code to GitHub

### Step 1.1: Commit ElderVoice (Landing) Changes
```bash
cd /Users/wajahatshaw/ReactNativeProjects/ElderVoice

# Check what files changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Split landing site from main app - marketing pages only

- Created domain config for cross-site navigation
- Updated all CTAs to redirect to APP_DOMAIN
- Removed app/auth/admin routes
- Added .env.example template
- Updated for standalone landing site deployment"

# Push to GitHub
git push origin main
```

### Step 1.2: Commit ElderVoiceApp (Main App) Changes
```bash
cd /Users/wajahatshaw/ReactNativeProjects/ElderVoiceApp

# Initialize git if not already initialized
git status || git init

# Add remote (if not already added)
git remote add origin https://github.com/Inverse-Labs/ElderVoiceApp.git

# Check current status
git status

# Add all changes
git add .

# Commit
git commit -m "Setup main app for app.eldervoice.com deployment

- Created domain config for landing site navigation
- Removed marketing routes (now in separate landing repo)
- Kept all app/auth/admin functionality
- Added .env.example template
- Root path redirects to /admin/dashboard"

# Push to GitHub
git push origin main
```

---

## Phase 2: Update Existing Landing Replit

### Step 2.1: Update ElderVoice Landing Replit
1. Go to your existing Replit project for ElderVoice
2. Click **"Pull from GitHub"** to get the latest changes
3. Update Secrets (go to Tools → Secrets):
   ```
   VITE_APP_DOMAIN=https://app.eldervoice.com
   ```
4. Restart the Repl
5. Test that eldervoice.com loads correctly
6. Test that Sign In/Get Started buttons redirect to app.eldervoice.com (will be 404 for now, that's OK)

---

## Phase 3: Create New Replit for Main App

### Step 3.1: Create New Replit Project
1. Go to https://replit.com
2. Click **"+ Create Repl"**
3. Select **"Import from GitHub"**
4. Choose repository: **`Inverse-Labs/ElderVoiceApp`**
5. Name your Repl: **"ElderVoice-App"** (or similar)
6. Click **"Import from GitHub"**

### Step 3.2: Configure Replit Environment
Once imported:

1. **Set Run Command** (if not auto-detected):
   - Click on `.replit` file (or create it)
   - Add:
     ```
     run = "npm install && npm run dev"
     ```

2. **Configure Secrets** (Tools → Secrets):
   Add ALL these secrets from your `.env.example`:

   ```
   # Session
   SESSION_SECRET=your-actual-session-secret

   # Twilio (your actual credentials)
   TWILIO_ACCOUNT_SID=AC371c4fbc7d5e15e835e5b1c0a134faab
   TWILIO_AUTH_TOKEN=your-actual-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-actual-twilio-phone

   # OpenAI
   OPENAI_API_KEY=your-actual-openai-key

   # ElevenLabs
   ELEVENLABS_AGENT_ID=agent_01jz1b17gbfcf9wrrp9ztnvmbp

   # Email
   FROM_EMAIL=no-reply@mentalreminders.com
   SENDGRID_API_KEY=your-actual-sendgrid-key
   RESEND_API_KEY=your-actual-resend-key

   # Stripe
   STRIPE_WEBHOOK_SECRET=your-actual-stripe-webhook-secret
   STRIPE_SECRET=your-actual-stripe-secret
   VITE_STRIPE_PUBLIC_KEY=pk_test_YphvzZShBoVH5DFezNJpUy7L

   # Supabase
   SUPABASE_SERVICE_ROLE_KEY=your-actual-supabase-service-role-key
   DATABASE_URL=your-actual-database-url
   SUPABASE_URL=https://ffqxmlwrlxlwqwftnviv.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-supabase-anon-key
   VITE_SUPABASE_URL=https://ffqxmlwrlxlwqwftnviv.supabase.co

   # Frontend URLs
   FRONTEND_URL_DEV=https://app.eldervoice.com
   FRONTEND_URL_PROD=https://app.eldervoice.com

   # Server Port
   PORT=5001

   # IMPORTANT: Domain Configuration for Split Architecture
   VITE_LANDING_DOMAIN=https://eldervoice.com
   ```

   ⚠️ **Important**: Use your ACTUAL API keys, not the placeholder text!

3. **Run the Repl**:
   - Click the **"Run"** button
   - Wait for installation and server start
   - Note the preview URL (e.g., `https://eldervoice-app-username.repl.co`)

### Step 3.3: Test the Replit App
1. Click on the preview URL
2. You should be redirected to `/admin/dashboard`
3. Try accessing `/auth/signin` - should load
4. Confirm no 500 errors in the console

---

## Phase 4: Configure Cloudflare DNS for app.eldervoice.com

### Step 4.1: Get Replit CNAME Target
1. In your ElderVoice-App Replit, go to **"Deployments"** tab (or domain settings)
2. Click **"Link custom domain"**
3. Enter: **`app.eldervoice.com`**
4. Replit will show you CNAME targets (something like):
   ```
   CNAME: your-unique-id.id.repl.co
   ```
   **Write this down!**

### Step 4.2: Add CNAME in Cloudflare
1. Go to https://dash.cloudflare.com
2. Select **eldervoice.com** domain
3. Go to **DNS** → **Records**
4. Click **"Add record"**
5. Configure:
   - **Type**: `CNAME`
   - **Name**: `app`
   - **Target**: `your-unique-id.id.repl.co` (from Replit)
   - **Proxy status**: **DNS only** (orange cloud OFF)
   - **TTL**: Auto
6. Click **"Save"**

### Step 4.3: Complete Replit Domain Connection
1. Go back to Replit → Deployments → Custom Domain
2. Click **"Verify"** or **"Connect"**
3. Wait 2-10 minutes for DNS propagation
4. Replit will confirm when `app.eldervoice.com` is connected

### Step 4.4: Update SSL/TLS Settings (Cloudflare)
1. In Cloudflare, go to **SSL/TLS** → **Overview**
2. Set encryption mode to: **"Full"** or **"Full (strict)"**
3. Go to **SSL/TLS** → **Edge Certificates**
4. Enable **"Always Use HTTPS"**

---

## Phase 5: Update Environment Variables for Production

### Step 5.1: Update Landing Replit Secrets
Go to your **ElderVoice (Landing)** Replit:
- Update `VITE_APP_DOMAIN`:
  ```
  VITE_APP_DOMAIN=https://app.eldervoice.com
  ```
- Restart the Repl

### Step 5.2: Update App Replit Secrets
In your **ElderVoice-App** Replit (already done in Step 3.2, but verify):
- `VITE_LANDING_DOMAIN=https://eldervoice.com`
- `FRONTEND_URL_PROD=https://app.eldervoice.com`

---

## Phase 6: Configure Backend CORS

Your backend needs to accept requests from BOTH domains.

### Step 6.1: Update CORS in Server
Assuming your backend is in `server/index.ts` or similar:

```typescript
// In both ElderVoice and ElderVoiceApp server/index.ts (or your CORS config)

const allowedOrigins = [
  'https://eldervoice.com',
  'https://app.eldervoice.com',
  'http://localhost:5001',
  'http://localhost:5002',
  // Add your Replit preview URLs for testing
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Step 6.2: Deploy CORS Changes
After updating CORS:
1. Commit and push to GitHub
2. Pull changes in both Replits
3. Restart both Replits

---

## Phase 7: Update Supabase Configuration

### Step 7.1: Add Redirect URLs
1. Go to https://supabase.com/dashboard
2. Select your project: **ffqxmlwrlxlwqwftnviv**
3. Go to **Authentication** → **URL Configuration**
4. Add these to **Redirect URLs**:
   ```
   https://app.eldervoice.com/*
   https://app.eldervoice.com/auth/callback
   http://localhost:5002/*
   ```

### Step 7.2: Update Site URL
Set **Site URL** to:
```
https://app.eldervoice.com
```

### Step 7.3: Update Email Templates (Optional)
If you use Supabase email templates:
- Update all links to point to `https://app.eldervoice.com`
- Magic link redirect: `https://app.eldervoice.com/auth/callback`

---

## Phase 8: Testing Production Deployment

### Test Checklist

#### 8.1: Landing Site Tests (eldervoice.com)
- [ ] Visit https://eldervoice.com
- [ ] All marketing pages load (Home, Individuals, Facilities, FAQs, Contact)
- [ ] Click **"Sign In"** → Should go to https://app.eldervoice.com/auth/signin
- [ ] Click **"Get Started"** → Should go to https://app.eldervoice.com/getstarted
- [ ] No JavaScript errors in console (F12)
- [ ] Images and assets load correctly

#### 8.2: Main App Tests (app.eldervoice.com)
- [ ] Visit https://app.eldervoice.com → Should redirect to `/admin/dashboard`
- [ ] Visit https://app.eldervoice.com/auth/signin → Signin page loads
- [ ] **Create test account** or sign in
- [ ] After login, dashboard loads correctly
- [ ] Navigate to different admin pages (Clients, Services, Settings)
- [ ] Check browser console for errors
- [ ] Test API calls work (check Network tab)

#### 8.3: Cross-Domain Flow Test
- [ ] Start at https://eldervoice.com
- [ ] Click **"Get Started"**
- [ ] Complete signup flow at app.eldervoice.com
- [ ] Confirm payment/stripe works
- [ ] Login successfully
- [ ] Dashboard loads with user data

#### 8.4: Auth Flow Tests
- [ ] Sign up with new account
- [ ] Check email verification (if enabled)
- [ ] Password reset flow
- [ ] Sign out and sign back in
- [ ] Token persists across page refreshes

#### 8.5: API and Backend Tests
- [ ] Open browser DevTools → Network tab
- [ ] Perform actions (create client, schedule call, etc.)
- [ ] Confirm API calls succeed (200/201 responses)
- [ ] No CORS errors in console
- [ ] WebSocket connections work (if applicable)

---

## Phase 9: Monitoring and Rollback Plan

### Step 9.1: Monitor Both Sites
After deployment:
- Check logs in both Replits regularly
- Monitor error tracking (if you have Sentry, etc.)
- Watch for 404s, 500s, or CORS errors

### Step 9.2: Rollback Plan (If Issues Occur)
If app.eldervoice.com has critical issues:

**Quick Rollback**:
1. In Landing Replit, change `VITE_APP_DOMAIN` back to `https://eldervoice.com`
2. Restart Landing Replit
3. Users will be redirected to old monolith (if still running)

**Full Rollback**:
1. Point app.eldervoice.com CNAME back to your original server
2. Disable the new App Replit
3. Re-deploy monolith version

---

## Phase 10: Post-Deployment Optimization

### Step 10.1: Performance
- Enable Cloudflare caching for static assets
- Optimize images on landing site
- Enable compression in both Replits

### Step 10.2: Analytics
- Add Google Analytics to both sites (use different tracking codes)
- Track conversion: Landing → Sign Up → Paid

### Step 10.3: SEO
- Update sitemap.xml (landing only)
- Add robots.txt to app.eldervoice.com:
  ```
  User-agent: *
  Disallow: /
  ```
  (Don't index the app)

---

## Quick Reference Commands

### Local Development
```bash
# Landing site
cd /Users/wajahatshaw/ReactNativeProjects/ElderVoice
npm run dev  # Port 5001

# Main app
cd /Users/wajahatshaw/ReactNativeProjects/ElderVoiceApp
PORT=5002 npm run dev  # Port 5002
```

### Stop Local Servers
```bash
pkill -f "ElderVoice.*tsx server/index.ts"
```

### View Production Logs
- Landing: Replit logs for ElderVoice
- App: Replit logs for ElderVoice-App

---

## Troubleshooting

### Issue: "Sign In" redirects to 404
**Cause**: app.eldervoice.com not deployed yet or DNS not propagated
**Fix**: Wait for DNS (up to 48hrs), verify CNAME in Cloudflare

### Issue: CORS errors on app.eldervoice.com
**Cause**: Backend doesn't allow the new domain
**Fix**: Update CORS config (Phase 6), restart backend

### Issue: Supabase auth not working
**Cause**: Redirect URLs not configured
**Fix**: Add app.eldervoice.com to Supabase redirect URLs (Phase 7)

### Issue: 500 errors on app.eldervoice.com
**Cause**: Missing environment variables
**Fix**: Check all Secrets in Replit (Phase 3.2)

### Issue: Database connection fails
**Cause**: DATABASE_URL incorrect or IP restrictions
**Fix**: Verify DATABASE_URL in Secrets, check Supabase IP allowlist

---

## Success Criteria

✅ **Deployment is successful when**:
1. eldervoice.com loads marketing pages
2. app.eldervoice.com handles all auth and app functionality
3. Sign In/Get Started redirects work
4. Users can sign up and login
5. Dashboard and admin features work
6. No CORS errors in production
7. API calls succeed
8. Database connections work
9. Stripe payments work (if applicable)
10. Email notifications work

---

## Support

If you encounter issues:
1. Check Replit logs for both projects
2. Check browser console (F12) for errors
3. Verify DNS propagation: https://dnschecker.org
4. Test API endpoints directly (Postman/curl)
5. Review CORS configuration

---

**You're ready to deploy! 🚀**

Start with Phase 1 (push to GitHub) and work through each phase sequentially.

