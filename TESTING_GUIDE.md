# Role-Based Route Protection - Testing Guide

## What We Built

**STEP 1: Role-Based Route Protection ✅**
- ProtectedRoute component that enforces role-based access
- Automatic redirect based on user role
- Three-role system: founder, vc, super_admin

**STEP 2: VC Portal Skeleton ✅**
- Separate VCLayout with minimal navbar (no clutter)
- VC Dashboard with mock startup data
- VC Startups list page with filters
- VC Startup Detail page (full profile)

---

## How to Test

### 1. Start the Development Server

```bash
npm run dev
```

Visit: `http://localhost:5173`

---

### 2. Test Role Assignment

By default, all new signups get `role = 'founder'`.

To test different roles, you need to manually change the role in the database:

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project
2. Navigate to Table Editor > profiles
3. Find your user
4. Change the `role` field to one of:
   - `founder` (default)
   - `vc` (VC user)
   - `super_admin` (admin user)
4. Save
5. Refresh your browser

#### Option B: Using SQL Editor
```sql
-- Make yourself a VC
UPDATE profiles
SET role = 'vc'
WHERE email = 'your-email@example.com';

-- Make yourself an admin
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'your-email@example.com';

-- Back to founder
UPDATE profiles
SET role = 'founder'
WHERE email = 'your-email@example.com';
```

---

### 3. Test Route Protection

#### Test 1: Founder Cannot Access VC Routes
1. Sign up / Login as a founder (default role)
2. Try to manually navigate to: `http://localhost:5173/vc/dashboard`
3. **Expected:** You should be redirected to `/dashboard` with an "Access denied" toast

#### Test 2: VC Cannot Access Founder Tools
1. Change your role to `vc` in the database
2. Refresh the page
3. Try to navigate to: `http://localhost:5173/idea-analyser`
4. **Expected:** You should be redirected to `/vc/dashboard` with an "Access denied" toast

#### Test 3: VC Can Access VC Portal
1. As a VC user
2. Navigate to: `http://localhost:5173/vc/dashboard`
3. **Expected:** You should see the VC Dashboard with:
   - Stats cards (New Matches: 12, Saved: 8)
   - List of mock startups
   - Minimal navbar (no community, no chatbot)

#### Test 4: Public Routes Accessible to All
1. As any role (or not logged in)
2. Navigate to: `http://localhost:5173/about`
3. **Expected:** Page loads normally

---

### 4. Test VC Portal Features

As a `vc` user:

**Dashboard (`/vc/dashboard`)**
- ✅ Should show 3 mock startups
- ✅ Each card shows: name, tagline, stage, industry, ask amount, readiness score, match reason
- ✅ "View Full Profile" button works
- ✅ "Request Intro" button is disabled (coming soon)

**Startups List (`/vc/startups`)**
- ✅ Should show 5 mock startups
- ✅ Sidebar filters work (Stage, Industry)
- ✅ Filtering updates the list
- ✅ Empty state shows when no matches

**Startup Detail (`/vc/startups/1`)**
- ✅ Should show full startup profile:
  - Header with name, tagline, ask amount, valuation
  - Founders section with bios
  - Problem, Solution, Market, Business Model, Traction
  - Motif evaluation scores
- ✅ Sidebar actions:
  - Save/Unsave button (toggles state)
  - Request Intro button (disabled)
  - Pass button
  - Private notes textarea
- ✅ Match reason panel shows why it's a good fit

---

### 5. Test Navigation

**As Founder:**
- Navbar shows: Home, About, Features, Community, Idea Analyzer, etc.
- Chatbot is visible

**As VC:**
- VC Navbar shows only: Dashboard, Startups, Profile dropdown
- NO chatbot
- NO community link
- NO founder tools

---

## Expected Behavior Summary

| Scenario | Expected Result |
|----------|----------------|
| Founder tries `/vc/dashboard` | Redirect to `/dashboard` + toast |
| VC tries `/idea-analyser` | Redirect to `/vc/dashboard` + toast |
| VC visits `/vc/startups` | Shows VC startups list page |
| Unauthenticated user tries `/dashboard` | Redirect to `/auth` |
| Unauthenticated user tries `/vc/dashboard` | Redirect to `/auth` |
| Any user tries `/about` | Page loads normally |

---

## What's Protected

### Founder-Only Routes:
- `/dashboard`
- `/profile`
- `/idea-analyser`
- `/pitch-creator`
- `/community`
- `/resources`
- `/get-funded`
- `/saved-ideas`
- `/membership`

### VC-Only Routes:
- `/vc/dashboard`
- `/vc/startups`
- `/vc/startups/:id`
- `/vc/profile`

### Public Routes (No Protection):
- `/` (home)
- `/about`
- `/features`
- `/contact`
- `/auth`
- `/pricing`
- `/case-studies`

---

## Known Limitations (Expected)

1. **Mock Data:** All startup data is hardcoded (no API calls yet)
2. **Request Intro:** Button is disabled (functionality not implemented)
3. **Save/Pass:** Buttons toggle state locally but don't persist
4. **Notes:** Textarea doesn't save to database
5. **No Admin Portal:** Only VC and Founder portals exist
6. **No Real Matching:** Startups shown are static, not based on preferences

These are intentional for Step 1 & 2. Real data integration comes later.

---

## Troubleshooting

### Issue: "Access denied" toast appears on every page
**Solution:** Check your role in the database. Make sure it's a valid value: `founder`, `vc`, or `super_admin`

### Issue: VC pages show "Not Found"
**Solution:** Make sure you're logged in as a VC user and the dev server is running

### Issue: Redirects not working
**Solution:** Clear your browser cache and refresh. Check browser console for errors.

### Issue: TypeScript errors
**Solution:** Run `npm run build` to see any type errors. Fix imports if needed.

---

## Next Steps (Not Implemented Yet)

After testing Steps 1 & 2, you can proceed to:
- **Step 3:** Admin Control Panel
- **Step 4:** Connect Founder → Admin → VC flow
- **Step 5:** Real database integration
- **Step 6:** Matching algorithm
- **Step 7:** Intro request workflow

---

## Success Criteria

**Step 1 is successful if:**
- ✅ Founders cannot access `/vc/*` routes
- ✅ VCs cannot access founder tools (`/idea-analyser`, `/community`, etc.)
- ✅ Redirects happen automatically with toast notifications
- ✅ No manual hacks can bypass protection

**Step 2 is successful if:**
- ✅ VC can login and see `/vc/dashboard`
- ✅ VC portal looks like a "deal-flow tool" (professional, minimal)
- ✅ VC can browse startups and view details
- ✅ Layout is separate from founder layout (no chatbot, minimal navbar)

---

**Status: ✅ READY FOR TESTING**

Login, change your role, and test the routes!
