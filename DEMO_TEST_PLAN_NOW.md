# Demo Test Plan - Execute Now

## 🎯 GOAL
Test the complete demo flow end-to-end to ensure everything works.

---

## ⚡ QUICK START (Choose Your Path)

### Path A: I DON'T have demo accounts yet
**Action:** Follow Section 1 (Create Accounts) then Section 2 (Test Flow)

### Path B: I ALREADY have demo accounts
**Action:** Skip to Section 2 (Test Flow)

---

## 📋 SECTION 1: CREATE DEMO ACCOUNTS (15 minutes)

### Step 1.1: Create Founder Account

1. **Open your app** (localhost or deployed URL)
2. **Navigate to:** `/auth`
3. **Click:** "Sign Up" tab
4. **Fill in:**
   - Email: Use your real email (e.g., `yourname+founder@gmail.com`)
   - Password: Something you'll remember (e.g., `DemoPass2025!`)
5. **Click:** "Create Account"
6. **Check email** → Click verification link
7. **You'll be logged in** → You'll see a dashboard

**Now set the role to Founder:**

**Option A: Via Supabase Dashboard (Easiest)**
- Open Supabase dashboard: https://supabase.com/dashboard
- Go to your project → Table Editor → `profiles` table
- Find the row with your email
- Click to edit
- Set `role` = `founder` (lowercase, exactly)
- Set `name` = `Sarah Johnson` (or your name)
- Click Save

**Option B: Via SQL Editor**
```sql
-- Run this in Supabase SQL Editor
UPDATE profiles
SET
  role = 'founder',
  name = 'Sarah Johnson'
WHERE email = 'yourname+founder@gmail.com'; -- Replace with your email
```

**Verify it worked:**
- Refresh your app
- Navigate to `/dashboard`
- You should see **FounderDashboard** with demo mode (no startups yet)

---

### Step 1.2: Create Admin Account

1. **Log out** (click user menu → Sign Out)
2. **Navigate to:** `/auth`
3. **Sign up with:**
   - Email: `yourname+admin@gmail.com`
   - Password: `AdminPass2025!`
4. **Verify email**
5. **Set role via Supabase:**

```sql
UPDATE profiles
SET
  role = 'super_admin',  -- MUST be 'super_admin' with underscore
  name = 'Platform Admin'
WHERE email = 'yourname+admin@gmail.com';
```

**Verify:**
- Refresh app
- Navigate to `/admin/dashboard`
- Should see **AdminDashboard** with metrics

---

### Step 1.3: Create VC Account

1. **Log out**
2. **Sign up with:**
   - Email: `yourname+vc@gmail.com`
   - Password: `VCPass2025!`
3. **Set role:**

```sql
UPDATE profiles
SET
  role = 'vc',
  name = 'Michael Rodriguez',
  bio = 'Partner at Acme Ventures. Focus: B2B SaaS, AI/ML.'
WHERE email = 'yourname+vc@gmail.com';
```

**Verify:**
- Navigate to `/vc/dashboard`
- Should see **VCDashboard**

---

### Step 1.4: Pre-Stage Background Data (Optional but Recommended)

**Purpose:** Make VC dashboard look populated (not empty)

**Quick method - SQL:**
```sql
-- Create 2 approved startups for background
INSERT INTO ideas (
  title, name, description, problem, solution,
  stage, industry, funding_goal, status, created_by
)
VALUES
(
  'HealthBridge',
  'HealthBridge',
  'Telemedicine platform for faster specialist access',
  'Patients wait 4+ weeks for appointments',
  'Connect patients with specialists in 24 hours',
  'Series A',
  'HealthTech',
  '$3M',
  'approved_for_vc',
  (SELECT id FROM profiles WHERE email = 'yourname+founder@gmail.com')
),
(
  'FitnessPro AI',
  'FitnessPro AI',
  'AI-powered personalized fitness coaching',
  'Generic fitness apps fail',
  'AI adapts to user progress in real-time',
  'Seed',
  'HealthTech',
  '$500K',
  'approved_for_vc',
  (SELECT id FROM profiles WHERE email = 'yourname+founder@gmail.com')
);
```

**Verify:**
- Log in as VC
- Navigate to `/vc/startups`
- Should see HealthBridge and FitnessPro AI

---

## 🧪 SECTION 2: TEST THE DEMO FLOW (10 minutes)

### Test 2.1: Founder Submits Startup

**Login as Founder** (`yourname+founder@gmail.com`)

1. **Navigate to:** `/dashboard`
   - ✅ Should see demo mode (0 startups)
   - ✅ Metrics show: Total Startups: 0

2. **Click:** "Submit Your First Startup" (or navigate to `/submit-startup`)

3. **Fill out form:**
   - **Startup Name:** CloudSync Pro
   - **Stage:** Series A (dropdown)
   - **Industry:** B2B SaaS
   - **Problem:** Enterprise teams waste 4 hours/week on file sync issues
   - **Solution:** AI-powered file sync with 99.9% reliability
   - **Target Market:** Enterprise (500+ employees)
   - **Funding Goal:** $2M
   - **Pitch Deck URL:** https://pitch.com/cloudsync
   - **(Leave other fields as optional)**

4. **Click:** "Submit for Review"

**Expected Results:**
- ✅ Success toast: "Startup submitted for review!"
- ✅ Redirected to startup detail page
- ✅ Status badge shows: **"Pending Review"** (orange/yellow)
- ✅ Timeline shows submission event

5. **Click:** "Back to Dashboard"

**Expected Results:**
- ✅ Dashboard now shows: Total Startups: 1
- ✅ Pending Review: 1
- ✅ Demo mode should be gone (you have real data now)
- ✅ CloudSync Pro appears in "My Startups" list

**🎯 Founder Flow Test: PASS ✅**

---

### Test 2.2: Admin Reviews & Approves

**Log out → Log in as Admin** (`yourname+admin@gmail.com`)

1. **Navigate to:** `/admin/dashboard`

**Expected Results:**
- ✅ Platform metrics visible
- ✅ "Pending Review" shows at least 1 (CloudSync Pro)
- ✅ Recent activity shows startup submission

2. **Navigate to:** `/admin/startups`

**Expected Results:**
- ✅ Table/cards showing all startups
- ✅ CloudSync Pro visible with "Pending Review" badge

3. **Click:** on CloudSync Pro row/card

**Expected Results:**
- ✅ Full startup details displayed
- ✅ Problem/Solution visible
- ✅ Two buttons: "Approve for VC" and "Reject" (or similar)

4. **Click:** "Approve for VC" button

**Expected Results:**
- ✅ Confirmation dialog appears: "Are you sure you want to approve CloudSync Pro?"
- ✅ Click "Approve" or "Confirm"

5. **After approval:**

**Expected Results:**
- ✅ Success toast: "Startup approved and now visible to VCs!"
- ✅ Status badge changes to: **"Approved for VC"** (green)
- ✅ Approve button disabled/hidden (can't approve twice)

**🎯 Admin Flow Test: PASS ✅**

---

### Test 2.3: VC Discovers & Requests Intro

**Log out → Log in as VC** (`yourname+vc@gmail.com`)

1. **Navigate to:** `/vc/dashboard`

**Expected Results:**
- ✅ Metrics show: Available Startups: 3 (or more)
- ✅ HealthBridge, FitnessPro AI, **CloudSync Pro** all visible

2. **Navigate to:** `/vc/startups`

**Expected Results:**
- ✅ Grid/list of approved startups
- ✅ **CloudSync Pro is now visible!** (the one we just approved)
- ✅ Shows: Name, stage, industry, funding goal

3. **Click:** on CloudSync Pro card/row

**Expected Results:**
- ✅ Full startup details page loads
- ✅ Problem, solution, funding goal all visible
- ✅ **"Request Introduction"** button visible (primary CTA)

4. **Click:** "Request Introduction"

**Expected Results:**
- ✅ Optional message field appears (or directly submits)
- ✅ (If message field: Type "Interested in B2B SaaS. Let's connect!")
- ✅ Click "Send Request" or "Request Introduction"

5. **After request:**

**Expected Results:**
- ✅ Success toast: "Introduction request sent! We'll review and connect you soon."
- ✅ Button changes to: **"Request Pending"** (disabled, grayed out)
- ✅ Can't click again (double-click prevention working!)

**🎯 VC Flow Test: PASS ✅**

---

### Test 2.4: Verify Full Circle (Optional)

**Switch back to Founder** (`yourname+founder@gmail.com`)

1. **Navigate to:** `/dashboard`

**Expected Results:**
- ✅ Metrics updated: Active Connections: 1 (or Pending Intros: 1)
- ✅ Notification badge shows (1 new notification)
- ✅ Recent activity shows: "VC requested introduction"

**Switch to Admin** (`yourname+admin@gmail.com`)

1. **Navigate to:** `/admin/intro-requests`

**Expected Results:**
- ✅ New intro request visible
- ✅ Shows: VC name (Michael Rodriguez), Startup (CloudSync Pro), Status (Pending)
- ✅ Can approve or reject

**🎯 Full Circle Test: PASS ✅**

---

## ✅ OVERALL TEST RESULTS

### All Tests Passed? ✅

If you successfully completed all steps above:
- ✅ Founder can submit startups
- ✅ Admin can approve startups
- ✅ VC can see approved startups
- ✅ VC can request introductions
- ✅ Notifications work
- ✅ Status transitions work
- ✅ Demo mode works (shows when no data, hides when data exists)

**🎉 YOUR DEMO IS READY TO PRESENT!**

---

## ❌ TROUBLESHOOTING

### Issue: "I can't log in to multiple accounts at once"

**Solution:** Use one of these methods:

**Method 1: Browser Profiles (Recommended)**
- Chrome: Settings → Add Person → Create "Demo Founder", "Demo Admin", "Demo VC"
- Each profile logs in separately

**Method 2: Different Browsers**
- Chrome for Founder
- Firefox for Admin
- Edge for VC

**Method 3: Incognito Windows**
- Regular window: Founder
- Incognito 1: Admin
- Incognito 2: VC

---

### Issue: "VC can't see CloudSync Pro after approval"

**Diagnose:**
1. Check startup status in Supabase:
   ```sql
   SELECT id, name, status FROM ideas WHERE name = 'CloudSync Pro';
   ```
2. Should show: `status = 'approved_for_vc'`

**Fix:**
- If status is still `pending_review`, approval didn't work
- Try approving again in admin panel
- Or manually update:
  ```sql
  UPDATE ideas
  SET status = 'approved_for_vc'
  WHERE name = 'CloudSync Pro';
  ```

---

### Issue: "Admin can't approve startups"

**Check admin role:**
```sql
SELECT email, role FROM profiles WHERE email = 'yourname+admin@gmail.com';
```

**Should show:** `role = 'super_admin'` (with underscore)

**Fix:**
```sql
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'yourname+admin@gmail.com';
```

Then refresh browser.

---

### Issue: "Founder sees error when submitting"

**Check browser console for errors:**
- Press F12 → Console tab
- Look for red errors

**Common causes:**
1. Missing required fields in form
2. RLS policy blocking (check Supabase logs)
3. Not logged in (session expired)

**Fix:**
- Try logging out and back in
- Ensure all required fields filled
- Check Supabase logs for policy violations

---

## 📊 TEST COMPLETION CHECKLIST

**Before Demo Day:**
- [ ] All 3 accounts created and working
- [ ] Founder can submit startups ✅
- [ ] Admin can approve startups ✅
- [ ] VC can see approved startups ✅
- [ ] VC can request intros ✅
- [ ] Status changes work ✅
- [ ] Notifications appear ✅
- [ ] Demo mode shows/hides correctly ✅
- [ ] No errors in browser console
- [ ] Tested on stable internet
- [ ] Know how to switch between accounts quickly

**Test Result:** 🎯 **READY FOR DEMO!**

---

## 🚀 NEXT STEPS AFTER SUCCESSFUL TEST

1. **Clean up test data** (so demo is fresh):
   ```sql
   DELETE FROM vc_applications WHERE idea_id IN (
     SELECT id FROM ideas WHERE name = 'CloudSync Pro'
   );
   DELETE FROM ideas WHERE name = 'CloudSync Pro';
   ```

2. **Keep background data** (HealthBridge, FitnessPro AI stay)

3. **Rehearse the flow 2-3 times** to get comfortable

4. **Print the quick reference card** (`STEP_10_DEMO_QUICK_REFERENCE.md`)

5. **You're ready to demo!** 🎉

---

## 💪 CONFIDENCE CHECK

After testing, you should feel confident that:
- ✅ The platform works end-to-end
- ✅ All three roles have working dashboards
- ✅ Status transitions happen correctly
- ✅ Security works (VCs can't see pending startups)
- ✅ Notifications work
- ✅ You can switch between roles smoothly

**If all ✅ = You're ready to show this to the world!** 🚀

---

**Happy Testing!** 🧪

Let me know if you hit any issues during testing.
