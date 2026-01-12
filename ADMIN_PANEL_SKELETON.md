# Admin Control Panel Skeleton - Complete

**Status:** ✅ READY FOR TESTING

---

## What Was Built

A minimal internal control panel for gatekeeping startup visibility to VCs.

**Design Philosophy:**
- Clean, internal-tool feel
- No animations
- No public branding
- Control panel, not a marketing page
- Admin decides what VCs see

---

## Routes Created

### 1. `/admin/dashboard` - Control Overview

**Purpose:** High-level view of the system

**Content:**
- Page title: "Admin Dashboard"
- Three simple stat cards:
  - Total Founders: 24
  - Total Startups: 18
  - Pending Approvals: 5 (orange highlight)
- Primary CTA: "Review Startups" button → `/admin/startups`

**Design:**
- Clean grid layout
- White cards on gray background
- No charts or graphs
- Minimal text

**File:** `src/components/pages/admin/AdminDashboard.tsx`

---

### 2. `/admin/startups` - Approval Panel

**Purpose:** Review and approve/reject startups

**Content:**
- Page title: "Startup Approvals"
- Table of startups (5 mock entries)

**Table Columns:**
1. **Startup Name** - Name of the startup
2. **Founder** - Founder name
3. **Stage** - Pre-seed, Seed, Series A, etc.
4. **Status** - Badge showing:
   - Pending (yellow)
   - Approved for VC (green)
   - Rejected (red)
5. **Actions** - Two buttons:
   - Approve (green, becomes disabled when approved)
   - Reject (red, becomes disabled when rejected)

**Behavior:**
- Clicking "Approve" changes status to "Approved for VC" (green badge)
- Clicking "Reject" changes status to "Rejected" (red badge)
- Status changes persist in component state (local state, not database)
- Buttons disable after action to prevent re-clicking

**Design:**
- Clean table layout
- Color-coded status badges
- Clear action buttons
- Responsive design

**File:** `src/components/pages/admin/AdminStartups.tsx`

---

## Layout

**AdminLayout** - Wrapper for all admin pages

**Top Navigation:**
- Dark background (gray-900)
- Left side:
  - "Motif Admin" logo/title
  - "Dashboard" link
  - "Startups" link
- Right side:
  - User name (gray text)
  - "Logout" button

**Main Area:**
- Light gray background (gray-100)
- Max-width container
- Padding for content

**File:** `src/layouts/AdminLayout.tsx`

---

## Access Protection

All admin routes are protected by `ProtectedRoute` component.

**Allowed Roles:**
- `UserRole.SUPER_ADMIN` ONLY

**Access Rules:**
- If user is NOT logged in → Redirect to `/auth`
- If user role is `founder` → Redirect to `/dashboard` + "Access denied" toast
- If user role is `vc` → Redirect to `/vc/dashboard` + "Access denied" toast
- If user role is `super_admin` → Allow access

**Implementation:**
```tsx
<Route element={<AdminLayout />}>
  <Route
    path="/admin/dashboard"
    element={
      <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
        <AdminDashboard />
      </ProtectedRoute>
    }
  />
  <Route
    path="/admin/startups"
    element={
      <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
        <AdminStartups />
      </ProtectedRoute>
    }
  />
</Route>
```

**File:** `src/App.tsx` (lines 143-161)

---

## Mock Data

### Dashboard Stats
```typescript
const MOCK_STATS = {
  totalFounders: 24,
  totalStartups: 18,
  pendingApprovals: 5,
};
```

### Startup Records
```typescript
const INITIAL_STARTUPS = [
  {
    id: '1',
    name: 'CloudSync Pro',
    founderName: 'Sarah Chen',
    stage: 'Seed',
    status: 'pending',
  },
  {
    id: '2',
    name: 'HealthTrack AI',
    founderName: 'Mike Johnson',
    stage: 'Pre-seed',
    status: 'pending',
  },
  {
    id: '3',
    name: 'FinFlow',
    founderName: 'Emily Rodriguez',
    stage: 'Seed',
    status: 'approved',
  },
  {
    id: '4',
    name: 'EduConnect',
    founderName: 'David Kim',
    stage: 'Series A',
    status: 'pending',
  },
  {
    id: '5',
    name: 'GreenEnergy Solutions',
    founderName: 'Lisa Anderson',
    stage: 'Seed',
    status: 'rejected',
  },
];
```

---

## What Was NOT Built

**Explicitly excluded:**
- ❌ Analytics dashboards
- ❌ Charts or graphs
- ❌ VC matching logic
- ❌ Filters or search
- ❌ Bulk actions
- ❌ Audit logs
- ❌ AI scoring
- ❌ User management (create/edit/delete users)
- ❌ Database persistence (uses local state)
- ❌ Notifications
- ❌ Export features
- ❌ Detailed startup views (just table rows)

---

## How to Test

### 1. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

---

### 2. Change Your Role to Super Admin

**Option A: Supabase Dashboard**
1. Go to Supabase Dashboard
2. Table Editor → `profiles`
3. Find your email
4. Change `role` to `super_admin`
5. Save
6. Refresh browser

**Option B: SQL Editor**
```sql
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'your-email@example.com';
```

---

### 3. Test the Admin Panel

**Dashboard:**
1. Navigate to: `http://localhost:3000/admin/dashboard`
2. You should see:
   - "Admin Dashboard" heading
   - Three stat cards
   - "Review Startups" button
3. Click the button → should navigate to `/admin/startups`

**Startups Approval Panel:**
1. You should see:
   - "Startup Approvals" heading
   - Table with 5 startups
   - Each row shows: name, founder, stage, status badge, action buttons
2. Click "Approve" on a pending startup:
   - Badge changes to green "Approved for VC"
   - Approve button becomes disabled
3. Click "Reject" on another pending startup:
   - Badge changes to red "Rejected"
   - Reject button becomes disabled

**Navigation:**
1. Top nav shows:
   - "Motif Admin" logo
   - "Dashboard" link
   - "Startups" link
   - Your name
   - "Logout" button
2. Click links to navigate between pages
3. Click "Logout" → redirects to `/auth`

---

### 4. Test Access Protection

**As Founder (role = 'founder'):**
1. Try to visit: `http://localhost:3000/admin/dashboard`
2. **Expected:** Redirected to `/dashboard` with "Access denied" toast

**As VC (role = 'vc'):**
1. Try to visit: `http://localhost:3000/admin/startups`
2. **Expected:** Redirected to `/vc/dashboard` with "Access denied" toast

**As Unauthenticated:**
1. Logout
2. Try to visit: `http://localhost:3000/admin/dashboard`
3. **Expected:** Redirected to `/auth`

---

## Folder Structure

```
src/
├── components/
│   └── pages/
│       └── admin/
│           ├── AdminDashboard.tsx
│           └── AdminStartups.tsx
├── layouts/
│   └── AdminLayout.tsx
├── types/
│   └── roles.ts (existing)
└── App.tsx (updated with admin routes)
```

---

## Technical Details

### State Management

**Local State Only:**
- Approval/rejection status changes are stored in React component state
- Changes do NOT persist to database (by design for skeleton)
- Refreshing the page resets all changes

**Future Enhancement:**
- Connect to real database
- Persist approval status in `startups` table
- Add `approved_for_vc` boolean column
- Update status via API call

### Action Button Logic

```typescript
const handleApprove = (id: string) => {
  setStartups((prev) =>
    prev.map((startup) =>
      startup.id === id ? { ...startup, status: 'approved' } : startup
    )
  );
};

const handleReject = (id: string) => {
  setStartups((prev) =>
    prev.map((startup) =>
      startup.id === id ? { ...startup, status: 'rejected' } : startup
    )
  );
};
```

**Button Disabling:**
```typescript
disabled={startup.status === 'approved'}
// or
disabled={startup.status === 'rejected'}
```

---

## Design Validation Checklist

**Internal Tool Feel:**
- ✅ Dark top navigation (professional)
- ✅ Light background (readable)
- ✅ No animations
- ✅ No onboarding
- ✅ No public branding

**Clean Interface:**
- ✅ Simple stat cards
- ✅ Clear table layout
- ✅ Color-coded status badges
- ✅ Obvious action buttons

**No Distractions:**
- ✅ No charts or graphs
- ✅ No extra features
- ✅ Focused on core task (approve/reject)

---

## Next Steps (NOT Implemented Yet)

When ready to expand beyond skeleton:

1. **Database Integration**
   - Create `startups` table in Supabase
   - Add `approved_for_vc` boolean column
   - Connect approval actions to database

2. **Real Founder Data**
   - Fetch actual founder submissions
   - Link to founder profiles

3. **Detailed View**
   - Click startup row to see full details
   - Review pitch, market, traction
   - Make informed approval decision

4. **VC Visibility Logic**
   - Only show approved startups to VCs
   - Filter `/vc/startups` list by `approved_for_vc = true`

5. **Audit Trail**
   - Track who approved/rejected
   - Log approval timestamp
   - Record rejection reasons

6. **Search & Filters**
   - Filter by status (pending, approved, rejected)
   - Search by startup name or founder
   - Filter by stage or industry

---

## Success Criteria

**An admin should:**
- ✅ Log in and immediately see control panel
- ✅ Understand their role as gatekeeper
- ✅ Easily approve or reject startups
- ✅ See status changes immediately (visual feedback)
- ✅ Navigate between dashboard and approvals easily

**The panel should:**
- ✅ Feel like an internal tool, not a public website
- ✅ Be clean and focused on the core task
- ✅ Have obvious controls (approve/reject)
- ✅ Show clear status indicators

---

**Status:** ✅ Complete and ready for testing

**Server:** Running at `http://localhost:3000`

**Test Role:** Change role to `super_admin` in database to access

---

## Connection to VC Portal

**How Gatekeeping Works (Conceptually):**

1. **Founder submits startup** → Status: "Pending"
2. **Admin reviews in `/admin/startups`** → Clicks "Approve" or "Reject"
3. **If Approved** → Status becomes "Approved for VC"
4. **VC Portal** → Only shows startups where `status = 'approved'`

**Currently:** This logic is NOT implemented (skeleton only uses local state). VCs still see all mock startups.

**Future:** When database is connected, approved startups will automatically appear in `/vc/startups` list.

---

**The gatekeeping system is now in place!** 🔐
