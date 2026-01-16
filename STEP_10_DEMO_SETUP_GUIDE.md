# Step 10 - Demo Account Setup Guide

## 🎯 PURPOSE

This guide walks you through creating and configuring the three demo accounts needed for your live demo presentation.

**Complete this setup 24 hours before your demo.**

---

## 📋 SETUP OVERVIEW

You will create:
1. **Founder Account** — Sarah (demo-founder@motif.com)
2. **Admin Account** — Platform Admin (demo-admin@motif.com)
3. **VC Account** — Michael (demo-vc@motif.com)

Plus:
- Pre-stage 2-3 approved startups for realistic VC dashboard
- Prepare CloudSync Pro form data
- Test full demo flow end-to-end

**Total Setup Time:** ~45 minutes

---

## 🔐 ACCOUNT CREATION

### Account 1: Founder (Sarah)

**Purpose:** Show founder submission flow

**Email:** `demo-founder@motif.com` (or your own demo email)

**Steps:**

1. **Sign Up**
   - Navigate to `/auth`
   - Click "Sign Up"
   - Email: `demo-founder@motif.com`
   - Password: `DemoPass2025!` (or your secure password)
   - Click "Create Account"

2. **Verify Email**
   - Check email inbox for Supabase verification
   - Click verification link

3. **Set Role to Founder**

   **Option A: Via Supabase Dashboard (Recommended)**
   - Open Supabase dashboard
   - Go to Table Editor → `profiles`
   - Find row with email `demo-founder@motif.com`
   - Set `role` = `founder`
   - Set `name` = `Sarah Johnson`
   - Set `bio` = `First-time founder building B2B SaaS solutions`
   - Save changes

   **Option B: Via SQL**
   ```sql
   UPDATE profiles
   SET
     role = 'founder',
     name = 'Sarah Johnson',
     bio = 'First-time founder building B2B SaaS solutions'
   WHERE email = 'demo-founder@motif.com';
   ```

4. **Verify Dashboard Access**
   - Log in as demo-founder@motif.com
   - Navigate to `/dashboard`
   - Should see **FounderDashboard** component
   - Should see **demo mode** (no startups yet)

5. **Profile Setup (Optional)**
   - Add LinkedIn URL: `https://linkedin.com/in/sarahjohnson`
   - Add website: `https://sarahjohnson.dev`

---

### Account 2: Admin (Platform Admin)

**Purpose:** Show startup approval flow

**Email:** `demo-admin@motif.com`

**Steps:**

1. **Sign Up**
   - Navigate to `/auth`
   - Email: `demo-admin@motif.com`
   - Password: `AdminPass2025!`
   - Create account

2. **Verify Email**
   - Check inbox, click verification link

3. **Set Role to Super Admin**

   **Via Supabase Dashboard:**
   - Table Editor → `profiles`
   - Find `demo-admin@motif.com`
   - Set `role` = `super_admin` (MUST be exact spelling)
   - Set `name` = `Platform Admin`
   - Set `bio` = `Motif platform administrator`
   - Save

   **Via SQL:**
   ```sql
   UPDATE profiles
   SET
     role = 'super_admin',
     name = 'Platform Admin',
     bio = 'Motif platform administrator'
   WHERE email = 'demo-admin@motif.com';
   ```

4. **Verify Admin Access**
   - Log in as demo-admin@motif.com
   - Navigate to `/admin/dashboard`
   - Should see **AdminDashboard** with platform metrics
   - Should have access to:
     - `/admin/startups`
     - `/admin/intro-requests`

---

### Account 3: VC (Michael)

**Purpose:** Show VC discovery and intro request flow

**Email:** `demo-vc@motif.com`

**Steps:**

1. **Sign Up**
   - Navigate to `/auth`
   - Email: `demo-vc@motif.com`
   - Password: `VCPass2025!`
   - Create account

2. **Verify Email**
   - Check inbox, click verification link

3. **Set Role to VC**

   **Via Supabase Dashboard:**
   - Table Editor → `profiles`
   - Find `demo-vc@motif.com`
   - Set `role` = `vc`
   - Set `name` = `Michael Rodriguez`
   - Set `bio` = `Partner at Acme Ventures. Focus: B2B SaaS, AI/ML, HealthTech. $50M+ deployed.`
   - Set `linkedin_url` = `https://linkedin.com/in/michaelrodriguez`
   - Save

   **Via SQL:**
   ```sql
   UPDATE profiles
   SET
     role = 'vc',
     name = 'Michael Rodriguez',
     bio = 'Partner at Acme Ventures. Focus: B2B SaaS, AI/ML, HealthTech. $50M+ deployed.',
     linkedin_url = 'https://linkedin.com/in/michaelrodriguez'
   WHERE email = 'demo-vc@motif.com';
   ```

4. **Verify VC Access**
   - Log in as demo-vc@motif.com
   - Navigate to `/vc/dashboard`
   - Should see **VCDashboard**
   - Should have access to:
     - `/vc/startups` (browse approved startups)

---

## 🏗️ PRE-STAGE DEMO DATA

### Create 2-3 Approved Startups (For VC Dashboard)

**Purpose:** VC dashboard should look populated, not empty

**Option 1: Via Founder Account (Realistic)**

1. Log in as `demo-founder@motif.com`
2. Submit 2 test startups:

**Startup A: HealthBridge**
- Name: HealthBridge
- Stage: Series A
- Industry: HealthTech
- Problem: Patients wait 4+ weeks for specialist appointments
- Solution: Telemedicine platform connecting patients with specialists in 24 hours
- Target Market: Healthcare providers (hospitals, clinics)
- Funding Goal: $3M
- Submit → Status: Pending Review

**Startup B: FitnessPro AI**
- Name: FitnessPro AI
- Stage: Seed
- Industry: HealthTech
- Problem: 80% of fitness apps abandoned in 30 days due to generic plans
- Solution: AI-powered personalized fitness coaching adapting to user progress
- Target Market: Consumer (fitness enthusiasts)
- Funding Goal: $500K
- Submit → Status: Pending Review

3. Log in as `demo-admin@motif.com`
4. Approve both startups:
   - Navigate to `/admin/startups`
   - Click HealthBridge → Approve for VC
   - Click FitnessPro AI → Approve for VC

**Option 2: Via SQL (Faster)**

```sql
-- Insert as demo-founder user
INSERT INTO ideas (
  title, name, description, problem, solution,
  target_market, stage, industry, funding_goal,
  status, created_by
)
VALUES
(
  'HealthBridge',
  'HealthBridge',
  'Telemedicine platform for faster specialist access',
  'Patients wait 4+ weeks for specialist appointments, delaying treatment',
  'Telemedicine platform connecting patients with specialists in 24 hours',
  'Healthcare providers (hospitals, clinics)',
  'Series A',
  'HealthTech',
  '$3M',
  'approved_for_vc',
  (SELECT id FROM profiles WHERE email = 'demo-founder@motif.com')
),
(
  'FitnessPro AI',
  'FitnessPro AI',
  'AI-powered personalized fitness coaching',
  '80% of fitness apps abandoned in 30 days due to generic plans',
  'AI coaching adapting to user progress in real-time',
  'Consumer (fitness enthusiasts)',
  'Seed',
  'HealthTech',
  '$500K',
  'approved_for_vc',
  (SELECT id FROM profiles WHERE email = 'demo-founder@motif.com')
);
```

4. **Verify VC Can See Them**
   - Log in as `demo-vc@motif.com`
   - Navigate to `/vc/startups`
   - Should see HealthBridge and FitnessPro AI

---

## 📝 PREPARE FORM DATA

### CloudSync Pro - Copy This for Live Demo

**Keep this in a text file for easy copy-paste during demo:**

```
Startup Name: CloudSync Pro

Stage: Series A

Industry: B2B SaaS

Problem: Enterprise teams waste 4 hours per week dealing with file synchronization issues, versioning conflicts, and lost data. Current solutions (Dropbox, Google Drive) fail at scale.

Solution: AI-powered enterprise file synchronization with 99.9% reliability, real-time conflict resolution, and military-grade encryption. Handles 10TB+ per organization.

Target Market: Enterprise businesses (500+ employees), Fortune 1000 IT departments

Funding Goal: $2M

Pitch Deck URL: https://pitch.com/cloudsync-demo

Website: https://cloudsync.pro

Team Size: 5 (2 engineers, 1 designer, 1 sales, 1 CEO)

Current Traction: 3 pilot customers, $15K MRR, 92% retention
```

**During Demo:**
- Copy-paste these fields (don't type everything)
- Keeps demo fast and professional

---

## 🖥️ BROWSER SETUP

### Option A: Three Browser Windows (Same Browser)

**Setup:**
1. Open Browser Window 1: Log in as Founder
2. Open Browser Window 2: Log in as Admin
3. Open Browser Window 3: Log in as VC

**Pros:**
- Easy to switch windows (Alt+Tab)
- Can see all three at once (arrange side-by-side)

**Cons:**
- May log out one account when logging into another (session conflicts)

---

### Option B: Three Browser Profiles (Recommended)

**Setup (Chrome):**
1. Create Profile 1: "Demo Founder"
   - Chrome → Settings → Add Person
   - Name: Demo Founder
   - Log in as demo-founder@motif.com on Motif

2. Create Profile 2: "Demo Admin"
   - Add another person
   - Name: Demo Admin
   - Log in as demo-admin@motif.com

3. Create Profile 3: "Demo VC"
   - Add another person
   - Name: Demo VC
   - Log in as demo-vc@motif.com

**Pros:**
- No session conflicts (each profile isolated)
- Stays logged in across demo rehearsals

**Cons:**
- Need to click profile switcher to change roles

---

### Option C: Three Different Browsers (Maximum Safety)

**Setup:**
- Browser 1 (Chrome): Founder account
- Browser 2 (Firefox): Admin account
- Browser 3 (Edge): VC account

**Pros:**
- 100% session isolation
- No risk of logout conflicts
- Easy to visually distinguish

**Cons:**
- Need to manage three different browsers

**Recommended:** Use Option B (Browser Profiles) for best balance

---

## ✅ PRE-DEMO TESTING CHECKLIST

### 24 Hours Before Demo

**Test All Accounts:**
- [ ] Log in as Founder → Can access `/dashboard`
- [ ] Log in as Admin → Can access `/admin/dashboard`
- [ ] Log in as VC → Can access `/vc/dashboard`

**Test Data Visibility:**
- [ ] VC can see pre-staged approved startups (HealthBridge, FitnessPro AI)
- [ ] Founder sees demo mode (no startups yet for Sarah)
- [ ] Admin sees platform metrics

**Test Full Demo Flow Once:**
1. [ ] Founder submits CloudSync Pro
2. [ ] Admin sees pending startup
3. [ ] Admin approves CloudSync Pro
4. [ ] VC sees CloudSync Pro in `/vc/startups`
5. [ ] VC requests introduction
6. [ ] Intro request appears in `/admin/intro-requests`

**Clean Up After Test:**
- [ ] Delete test CloudSync Pro submission (so demo is fresh)
- [ ] Leave HealthBridge and FitnessPro AI (background data)

---

### 30 Minutes Before Demo

**Final Checks:**
- [ ] All 3 accounts logged in and dashboards loaded
- [ ] Home page loaded in separate tab
- [ ] CloudSync Pro form data ready (text file open)
- [ ] Browser windows positioned for easy switching
- [ ] Notifications silenced (browser and OS)
- [ ] Phone on silent / Do Not Disturb
- [ ] Internet connection stable
- [ ] Backup hotspot ready (if presenting remotely)

**Environment Setup:**
- [ ] Close unnecessary tabs/apps
- [ ] Clear browser cache (optional, for performance)
- [ ] Zoom/screen share tested (if remote)
- [ ] Screen resolution set correctly (1920×1080 recommended)
- [ ] Dark mode or light mode (choose one, keep consistent)

---

## 🎬 DEMO DAY CHECKLIST

### 5 Minutes Before Demo

**Quick Verifications:**
- [ ] All accounts still logged in
- [ ] Dashboards load correctly
- [ ] No error messages visible
- [ ] Internet connection working

**Mental Prep:**
- [ ] Review talking points (see STEP_10_DEMO_QUICK_REFERENCE.md)
- [ ] Deep breath
- [ ] Smile (you've built something awesome!)
- [ ] Remember: This is a real platform you built

---

## 🆘 TROUBLESHOOTING

### Issue: "Account logs out when switching roles"

**Fix:** Use separate browser profiles (Option B) instead of same browser window

---

### Issue: "VC can't see approved startups"

**Diagnose:**
1. Check startup status in Supabase:
   ```sql
   SELECT id, name, status FROM ideas WHERE status = 'approved_for_vc';
   ```
2. Verify VC role is set correctly:
   ```sql
   SELECT id, email, role FROM profiles WHERE email = 'demo-vc@motif.com';
   ```
3. Check RLS policies enabled on `ideas` table

**Fix:**
- Ensure startups have status `approved_for_vc` (exact spelling)
- Ensure VC role is `vc` (lowercase)

---

### Issue: "Admin can't approve startups"

**Diagnose:**
1. Check admin role:
   ```sql
   SELECT role FROM profiles WHERE email = 'demo-admin@motif.com';
   ```
2. Should be `super_admin` (exact spelling with underscore)

**Fix:**
```sql
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'demo-admin@motif.com';
```

---

### Issue: "Founder sees error when submitting startup"

**Diagnose:**
1. Check browser console for errors
2. Verify founder is authenticated (logged in)
3. Check RLS policies on `ideas` table

**Common Causes:**
- Missing required fields in form
- RLS policy blocking INSERT (check policy: "Founders can create ideas")

---

### Issue: "Demo mode not showing for founder"

**Expected:** Demo mode shows when founder has ZERO startups

**Fix:**
- Delete any test startups created during setup:
  ```sql
  DELETE FROM ideas
  WHERE created_by = (SELECT id FROM profiles WHERE email = 'demo-founder@motif.com');
  ```

---

## 📊 DEMO ACCOUNT SUMMARY

| Account | Email | Password | Role | Purpose | Dashboard URL |
|---------|-------|----------|------|---------|---------------|
| **Founder (Sarah)** | demo-founder@motif.com | DemoPass2025! | `founder` | Submit startup | `/dashboard` |
| **Admin** | demo-admin@motif.com | AdminPass2025! | `super_admin` | Approve startup | `/admin/dashboard` |
| **VC (Michael)** | demo-vc@motif.com | VCPass2025! | `vc` | Request intro | `/vc/dashboard` |

**Security Note:** Change these passwords after demo if accounts remain active

---

## 🎯 SUCCESS CRITERIA

After setup, you should be able to:

1. ✅ Log in as all three roles without errors
2. ✅ See appropriate dashboards for each role
3. ✅ Submit a test startup as Founder
4. ✅ Approve the test startup as Admin
5. ✅ View approved startup as VC
6. ✅ Request introduction as VC
7. ✅ See intro request as Admin

**If all 7 steps work: You're ready for demo! 🚀**

---

## 🔄 POST-DEMO CLEANUP (Optional)

**After Demo:**
- [ ] Delete demo CloudSync Pro submission
- [ ] Keep HealthBridge and FitnessPro AI (or delete if not needed)
- [ ] Reset any test data created during Q&A
- [ ] Keep demo accounts active for future demos

**Or:**
- [ ] Delete all three demo accounts if no longer needed
- [ ] Create fresh accounts for next demo

---

## 📝 NOTES SECTION

**Use this space to track your specific setup:**

**My Demo Accounts:**
- Founder Email: ___________________________
- Admin Email: ___________________________
- VC Email: ___________________________

**Passwords Stored:** ___________________________

**Last Tested:** ___________________________

**Issues Encountered:**
___________________________
___________________________
___________________________

**Fixes Applied:**
___________________________
___________________________
___________________________

---

## 🎉 YOU'RE READY!

**Setup Complete Checklist:**
- ✅ Three demo accounts created
- ✅ Roles assigned correctly
- ✅ Pre-staged startups created
- ✅ CloudSync Pro form data prepared
- ✅ Browser windows configured
- ✅ Full demo flow tested
- ✅ Backup plans ready

**Now go to: `STEP_10_DEMO_QUICK_REFERENCE.md` for your demo script.**

**Go crush that demo!** 🚀

---

**Setup Guide Version:** 1.0
**Created:** 2025-12-27
**Status:** Production-Ready
