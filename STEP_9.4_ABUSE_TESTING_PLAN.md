# Step 9.4 - Abuse & Edge Case Testing Plan

## 🎯 OBJECTIVE
Verify the system fails safely under abuse, invalid actions, and edge cases.

---

## 🛡️ EXISTING PROTECTIONS (Already in Place)

### Layer 1: UI Protection (Frontend)
- ✅ **useAsyncAction Hook** - Prevents double-clicks
  - `if (loading) return null` - Ignores duplicate calls
  - Automatic button disabling during execution
  - Loading state prevents rapid repeated clicks

### Layer 2: Service Layer Protection
- ✅ **Role Verification** (`src/lib/roleVerification.ts`)
  - `verifyAdminRole()` - Blocks non-admin actions
  - `verifyVCRole()` - Blocks non-VC actions
  - `verifyFounderRole()` - Blocks non-founder actions
  - `assertResourceOwnership()` - Verifies user owns resource

### Layer 3: Database Protection (RLS)
- ✅ **Row Level Security Policies** (`comprehensive_rls_policies.sql`)
  - 29 policies across 5 tables
  - Role-based SELECT/INSERT/UPDATE/DELETE restrictions
  - Status transition validation triggers
  - Prevents unauthorized data access

### Layer 4: Error Recovery
- ✅ **Error Boundaries** (Step 9.3)
  - Catches runtime/render errors
  - Shows friendly fallback UI
  - Provides recovery actions

---

## 🧪 TEST SCENARIOS

### Category 1️⃣: Rapid Repeated Clicks (Race Conditions)

#### Test 1.1: Submit Startup (Rapid Clicks)
**Component:** `SubmitStartupPage.tsx`
**Action:** Click "Submit for Review" 10 times rapidly
**Expected Behavior:**
- ✅ First click: Button disables, shows "Submitting..."
- ✅ Subsequent clicks: Ignored (button disabled)
- ✅ Only ONE startup created in database
- ✅ Success toast appears once
- ✅ User redirected to confirmation screen

**Protection Mechanism:**
```typescript
// useAsyncAction prevents double-execution
if (loading) {
  console.warn('Action already in progress, ignoring duplicate call');
  return null;
}
```

**Test Status:** ⏳ PENDING

---

#### Test 1.2: Request VC Intro (Rapid Clicks)
**Component:** `VCStartupDetail.tsx`, `StartupDetailPage.tsx`
**Action:** Click "Request Introduction" 10 times rapidly
**Expected Behavior:**
- ✅ First click: Button disables, shows "Requesting..."
- ✅ Subsequent clicks: Ignored (button disabled)
- ✅ Only ONE intro request created
- ✅ Success toast appears once
- ✅ Button state changes to "Request Submitted"

**Protection Mechanism:**
```typescript
// useAsyncAction + database unique constraints
const { loading: requestIntroLoading, execute: handleRequestIntro } = useAsyncAction(...)
disabled={requestIntroLoading}
```

**Test Status:** ⏳ PENDING

---

#### Test 1.3: Admin Approve/Reject (Rapid Clicks)
**Component:** `AdminStartups.tsx`
**Action:** Click "Approve" button 10 times rapidly
**Expected Behavior:**
- ✅ First click: Opens confirmation dialog
- ✅ Subsequent clicks: Ignored (button disabled)
- ✅ After confirmation: Only ONE status update
- ✅ Success toast appears once
- ✅ UI refreshes to show updated status

**Protection Mechanism:**
```typescript
// useAsyncAction + confirmation dialog + RLS
disabled={startup.status === 'approved_for_vc' || approveLoading || rejectLoading}
```

**Test Status:** ⏳ PENDING

---

### Category 2️⃣: Invalid State Transitions

#### Test 2.1: Approve Already-Approved Startup
**Component:** `AdminStartups.tsx`
**Action:** Approve a startup that's already `approved_for_vc`
**Expected Behavior:**
- ✅ Button is disabled (greyed out)
- ✅ No API call is made
- ✅ UI shows "Approved" badge
- ✅ No error message (button is simply disabled)

**Protection Mechanism:**
```typescript
// UI-level protection
disabled={startup.status === 'approved_for_vc' || approveLoading || rejectLoading}

// Database-level protection (RLS trigger)
CREATE OR REPLACE FUNCTION validate_idea_status_transition()
-- Prevents invalid status transitions
```

**Test Status:** ⏳ PENDING

---

#### Test 2.2: Reject Already-Rejected Intro
**Component:** `AdminIntroRequests.tsx`
**Action:** Reject an intro request that's already `rejected`
**Expected Behavior:**
- ✅ Button is disabled (greyed out)
- ✅ No API call is made
- ✅ UI shows "Rejected" badge
- ✅ No error message (button is simply disabled)

**Protection Mechanism:**
```typescript
disabled={request.status === 'rejected' || approveLoading || rejectLoading}
```

**Test Status:** ⏳ PENDING

---

#### Test 2.3: Resubmit Non-Rejected Startup
**Component:** `StartupDetailPage.tsx`
**Action:** Try to resubmit a startup with status `pending_review`
**Expected Behavior:**
- ✅ "Resubmit" button is NOT visible
- ✅ Only "Submit" or "Resubmit" shown based on status
- ✅ If user somehow triggers action: RLS blocks it

**Protection Mechanism:**
```typescript
// Conditional rendering based on status
{startup.status === 'rejected' && (
  <Button onClick={handleResubmit}>Resubmit for Review</Button>
)}
```

**Test Status:** ⏳ PENDING

---

### Category 3️⃣: Deleted or Missing Resources

#### Test 3.1: Startup Deleted While Viewing Detail
**Component:** `StartupDetailPage.tsx`
**Action:**
1. Open startup detail page
2. Admin deletes startup (in another tab)
3. User clicks any action button
**Expected Behavior:**
- ✅ Action fails with "Resource not found" error
- ✅ Toast shows: "This resource no longer exists. It may have been deleted."
- ✅ Error boundary does NOT trigger (handled gracefully)
- ✅ User can navigate back to dashboard

**Protection Mechanism:**
```typescript
// useAsyncAction error handling
if (error.message.includes('not found') || error.message.includes('PGRST116')) {
  return 'This resource no longer exists. It may have been deleted.';
}
```

**Test Status:** ⏳ PENDING

---

#### Test 3.2: VC Intro Deleted Mid-Flow
**Component:** `StartupDetailPage.tsx` (Founder viewing intros)
**Action:**
1. Founder views startup with intro requests
2. Admin deletes intro request
3. Founder refreshes page
**Expected Behavior:**
- ✅ Intro request disappears from list
- ✅ No error shown (data simply refetched)
- ✅ UI updates to show current state
- ✅ No crash or error boundary

**Protection Mechanism:**
```typescript
// Refetch on mount
useEffect(() => {
  const fetchData = async () => {
    const intros = await getIntroRequestsByStartup(id);
    setVcIntroRequests(intros);
  };
  fetchData();
}, [id]);
```

**Test Status:** ⏳ PENDING

---

#### Test 3.3: Founder Removed From Startup
**Component:** `DashboardPage.tsx`
**Action:**
1. Founder loads dashboard
2. Admin changes startup ownership
3. Founder refreshes dashboard
**Expected Behavior:**
- ✅ Startup no longer appears in founder's list
- ✅ No error shown
- ✅ Dashboard shows accurate data
- ✅ RLS prevents access to non-owned startups

**Protection Mechanism:**
```sql
-- RLS Policy: Founders can only view own ideas
CREATE POLICY "Founders can view own ideas"
ON ideas FOR SELECT TO authenticated
USING (
  auth.uid() = created_by
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'founder')
);
```

**Test Status:** ⏳ PENDING

---

### Category 4️⃣: Permission Violations

#### Test 4.1: Founder Attempting Admin Action
**Component:** Direct API call via browser console
**Action:** Founder calls `updateStartupStatus(id, 'approved_for_vc')`
**Expected Behavior:**
- ✅ Service layer blocks: `verifyAdminRole()` fails
- ✅ Error thrown: "Admin privileges required to approve startups"
- ✅ Toast shows error message
- ✅ Database unchanged (RLS also blocks)

**Protection Mechanism:**
```typescript
// Service layer protection
if (status === 'approved_for_vc') {
  const roleCheck = await verifyAdminRole();
  if (!roleCheck.valid) {
    throw new Error('Admin privileges required to approve startups');
  }
}

// RLS protection
CREATE POLICY "Only admins can approve ideas"
ON ideas FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  AND OLD.status = 'pending_review'
  AND NEW.status = 'approved_for_vc'
);
```

**Test Status:** ⏳ PENDING

---

#### Test 4.2: VC Accessing Non-Approved Startup
**Component:** Direct navigation to `/vc/startups/[non-approved-id]`
**Action:** VC navigates to startup with status `draft` or `pending_review`
**Expected Behavior:**
- ✅ Page loads but shows "Startup Not Found"
- ✅ RLS blocks data retrieval
- ✅ `getIdeaById()` returns null
- ✅ Fallback UI shown
- ✅ "Back to Startups" button works

**Protection Mechanism:**
```sql
-- RLS Policy: VCs can ONLY view approved startups
-- (No SELECT policy for VCs on ideas table = blocked by default)
```

**Test Status:** ⏳ PENDING

---

#### Test 4.3: User Accessing Another User's Data
**Component:** `ProfilePage.tsx` or direct API call
**Action:** User tries to view/edit another user's profile
**Expected Behavior:**
- ✅ UI prevents navigation to other profiles
- ✅ If user modifies URL: RLS blocks data access
- ✅ `getProfileById()` returns null for other users
- ✅ Error message: "You do not have permission to access this resource"

**Protection Mechanism:**
```sql
-- RLS Policy: Users can only view own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);
```

**Test Status:** ⏳ PENDING

---

## 📋 TEST EXECUTION CHECKLIST

### Manual Testing
- [ ] 1.1 - Submit Startup rapid clicks
- [ ] 1.2 - Request VC Intro rapid clicks
- [ ] 1.3 - Admin Approve/Reject rapid clicks
- [ ] 2.1 - Approve already-approved startup
- [ ] 2.2 - Reject already-rejected intro
- [ ] 2.3 - Resubmit non-rejected startup
- [ ] 3.1 - Deleted startup while viewing
- [ ] 3.2 - Deleted VC intro mid-flow
- [ ] 3.3 - Founder removed from startup
- [ ] 4.1 - Founder attempting admin action
- [ ] 4.2 - VC accessing non-approved startup
- [ ] 4.3 - User accessing another user's data

### Automated Testing (Future)
- [ ] Integration tests for race conditions
- [ ] E2E tests for edge cases
- [ ] Load testing for concurrent users

---

## 🎯 SUCCESS CRITERIA

| Requirement | Expected Outcome |
|-------------|------------------|
| **No silent failures** | All errors show user-friendly messages |
| **No crashes** | Error boundaries catch all UI errors |
| **No data corruption** | RLS prevents invalid database changes |
| **No permission bypass** | Multi-layer security blocks unauthorized actions |
| **Friendly error messages** | Users understand what went wrong |
| **Recovery possible** | Users can navigate away from errors |

---

## 📊 TEST RESULTS

**Status:** ⏳ TESTING IN PROGRESS

Results will be documented in: `STEP_9.4_ABUSE_TESTING_RESULTS.md`

---

## 🔍 NEXT STEPS

1. Execute manual tests for each scenario
2. Document actual vs expected behavior
3. Fix any gaps discovered during testing
4. Create final test report
5. Mark Step 9.4 as complete
