# Quick Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment
- [x] Local testing completed on ports 5001 and 5002
- [x] Sign In/Get Started redirects working locally
- [ ] All environment variables documented

## Phase 1: GitHub (15 minutes)
- [ ] Commit ElderVoice (Landing) changes
- [ ] Push ElderVoice to GitHub
- [ ] Commit ElderVoiceApp changes  
- [ ] Push ElderVoiceApp to GitHub

**Commands**:
```bash
# Landing
cd /Users/wajahatshaw/ReactNativeProjects/ElderVoice
git add .
git commit -m "Split landing site from main app"
git push origin main

# App
cd /Users/wajahatshaw/ReactNativeProjects/ElderVoiceApp
git add .
git commit -m "Setup main app for app.eldervoice.com"
git push origin main
```

---

## Phase 2: Update Existing Landing Replit (5 minutes)
- [ ] Open existing ElderVoice Replit
- [ ] Pull from GitHub
- [ ] Add Secret: `VITE_APP_DOMAIN=https://app.eldervoice.com`
- [ ] Restart Repl
- [ ] Test eldervoice.com loads

---

## Phase 3: Create New App Replit (20 minutes)
- [ ] Create new Repl from ElderVoiceApp GitHub repo
- [ ] Name it "ElderVoice-App"
- [ ] Add ALL Secrets (see PRODUCTION_DEPLOYMENT_GUIDE.md Phase 3.2)
- [ ] Set `VITE_LANDING_DOMAIN=https://eldervoice.com`
- [ ] Run the Repl
- [ ] Note preview URL for testing
- [ ] Test /auth/signin loads on preview URL

**Critical Secrets** to add:
```
VITE_LANDING_DOMAIN=https://eldervoice.com
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_STRIPE_PUBLIC_KEY=...
DATABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
(and all others from .env)
```

---

## Phase 4: Cloudflare DNS (15 minutes)
- [ ] In new App Replit: Deployments → Link custom domain → Enter `app.eldervoice.com`
- [ ] Copy CNAME target from Replit (e.g., `xyz.id.repl.co`)
- [ ] Go to Cloudflare DNS for eldervoice.com
- [ ] Add CNAME record:
  - Name: `app`
  - Target: `xyz.id.repl.co` (from Replit)
  - Proxy: OFF (DNS only)
- [ ] Save record
- [ ] Wait 5-10 minutes for DNS propagation
- [ ] Verify in Replit (should show "Connected")
- [ ] Test https://app.eldervoice.com loads

**Cloudflare Settings**:
- [ ] SSL/TLS → Encryption: "Full" or "Full (strict)"
- [ ] SSL/TLS → Edge Certificates → "Always Use HTTPS": ON

---

## Phase 5: Update CORS (10 minutes)
- [ ] Update `server/index.ts` CORS config in BOTH repos
- [ ] Add both domains to allowed origins:
  ```javascript
  const allowedOrigins = [
    'https://eldervoice.com',
    'https://app.eldervoice.com',
    'http://localhost:5001',
    'http://localhost:5002'
  ];
  ```
- [ ] Commit and push changes
- [ ] Pull in both Replits
- [ ] Restart both Replits

---

## Phase 6: Supabase Config (5 minutes)
- [ ] Go to Supabase dashboard
- [ ] Authentication → URL Configuration
- [ ] Add redirect URLs:
  - `https://app.eldervoice.com/*`
  - `https://app.eldervoice.com/auth/callback`
- [ ] Set Site URL: `https://app.eldervoice.com`
- [ ] Save changes

---

## Phase 7: Production Testing (30 minutes)

### Landing Site (eldervoice.com)
- [ ] Visit https://eldervoice.com
- [ ] Homepage loads correctly
- [ ] Navigate to /individuals, /facilities, /faqs
- [ ] Click "Sign In" → redirects to https://app.eldervoice.com/auth/signin
- [ ] Click "Get Started" → redirects to https://app.eldervoice.com/getstarted
- [ ] No console errors (F12)

### Main App (app.eldervoice.com)
- [ ] Visit https://app.eldervoice.com
- [ ] Redirects to /admin/dashboard
- [ ] Visit /auth/signin → signin page loads
- [ ] Sign in with test account
- [ ] Dashboard loads after login
- [ ] Navigate to Clients, Services, Settings
- [ ] No console errors
- [ ] API calls work (check Network tab)

### Full User Flow
- [ ] Start at https://eldervoice.com
- [ ] Click "Get Started"
- [ ] Complete signup at app.eldervoice.com
- [ ] Email verification works (if enabled)
- [ ] Login successfully
- [ ] Access dashboard with user data
- [ ] Create test client/service
- [ ] Sign out
- [ ] Sign back in
- [ ] Data persists

### Technical Checks
- [ ] No CORS errors in console
- [ ] API endpoints return 200/201
- [ ] WebSocket connections work (if applicable)
- [ ] Database queries succeed
- [ ] Stripe checkout works (if applicable)
- [ ] Email sending works

---

## Phase 8: Monitoring (Ongoing)
- [ ] Check Replit logs for errors (both projects)
- [ ] Monitor user signups
- [ ] Watch for failed API calls
- [ ] Check Stripe dashboard for payments
- [ ] Monitor email delivery

---

## Rollback Plan (Emergency Only)
If critical issues:
1. [ ] In Landing Replit, change `VITE_APP_DOMAIN` back to `https://eldervoice.com`
2. [ ] Restart Landing Repl
3. [ ] Temporarily disable App Replit
4. [ ] Investigate issue in logs
5. [ ] Fix and re-deploy

---

## Post-Deployment
- [ ] Update documentation
- [ ] Notify team of new URLs
- [ ] Update any external links/integrations
- [ ] Set up monitoring alerts
- [ ] Schedule performance review in 1 week

---

## Success Metrics
After 24 hours, verify:
- [ ] Zero CORS errors
- [ ] Signup conversion rate maintained
- [ ] All features working
- [ ] No increase in support tickets
- [ ] DNS fully propagated globally

---

## Need Help?
- See detailed guide: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- Check Replit logs for both projects
- Use browser DevTools (F12) → Console & Network tabs
- Test DNS: https://dnschecker.org

---

**Estimated Total Time**: 2-3 hours (including testing)

**Current Status**: Ready for Phase 1 (GitHub push)

