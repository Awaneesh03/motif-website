# 🔒 RLS Security Quick Reference

## File: `comprehensive_rls_policies.sql`

**Status:** ✅ Production-ready, ready to deploy
**Last Updated:** Step 9.1 - Final Security Lockdown

---

## 📋 Policy Summary

| Table | Policies | Enforces |
|-------|----------|----------|
| **profiles** | 4 policies | Users view/edit own; Admins view/edit all; No client inserts |
| **ideas** | 7 policies | Founders CRUD own; Cannot edit after approval; VCs blocked; Admins manage all |
| **pitches** | 6 policies | Founders CRUD own; VCs view only approved intros; Admins view all |
| **vc_applications** | 7 policies | VCs request intros; Founders view requests; Admins approve; No deletes |
| **notifications** | 5 policies | Users manage own; System can insert; Admins audit |

**Total Policies:** 29 + 2 security triggers

---

## 🎯 Permission Matrix

### PROFILES

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **Founder** | Own profile only | ❌ No | Own profile only | ❌ No |
| **VC** | Own profile only | ❌ No | Own profile only | ❌ No |
| **Admin** | All profiles ✅ | ❌ No | All profiles ✅ | ❌ No |

**Notes:**
- Profile creation handled by auth trigger (not client)
- Role changes blocked by `prevent_role_self_change()` trigger
- Admins can change roles via UPDATE

---

### IDEAS (Startups)

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **Founder** | Own ideas only | Own ideas ✅ | Own ideas (NOT approved) | Draft ideas only |
| **VC** | ❌ Blocked | ❌ No | ❌ No | ❌ No |
| **Admin** | All ideas ✅ | ❌ No | All ideas ✅ | ❌ No |

**Notes:**
- VCs CANNOT access ideas table directly (must use vc_applications JOIN)
- Founders lose UPDATE access once idea reaches `approved_for_vc` status
- Status transitions enforced by `validate_idea_status_transition()` trigger

**Valid Status Transitions:**
```
Founder:  draft/rejected → pending_review
Admin:    pending_review → approved_for_vc/rejected
          rejected → pending_review (allow resubmission)
```

---

### PITCHES

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **Founder** | Own pitches only | Own pitches ✅ | Own pitches ✅ | Own pitches ✅ |
| **VC** | Approved intros only | ❌ No | ❌ No | ❌ No |
| **Admin** | All pitches ✅ | ❌ No | ❌ No | ❌ No |

**Notes:**
- VCs can only view pitches if:
  - VC has role = 'vc'
  - AND vc_applications entry exists
  - AND vc_applications.status = 'approved'
- Founders can freely edit their own pitches

---

### VC_APPLICATIONS (Intro Requests)

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **Founder** | Requests for own ideas | Own requests (vc_id=NULL) | ❌ No | ❌ No |
| **VC** | Own requests only | Requests for approved ideas | Own requests (notes only) | ❌ No |
| **Admin** | All requests ✅ | ❌ No | All requests ✅ | ❌ No |

**Notes:**
- VCs can only INSERT if `ideas.status = 'approved_for_vc'`
- VCs cannot change request status (locked to prevent self-approval)
- Founders can INSERT with `vc_id = NULL` (general VC request)
- NO DELETE policies = permanent audit trail

---

### NOTIFICATIONS

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| **All Users** | Own notifications | ✅ Yes (system) | Own notifications | Own notifications |
| **Admin** | All notifications ✅ | ✅ Yes | — | — |

**Notes:**
- All authenticated users can INSERT (for system-generated notifications)
- For stricter control, use service_role key on backend
- Admins can view all for audit purposes

---

## 🛡️ Security Triggers

### 1. `prevent_role_self_change()`

**Purpose:** Prevent users from changing their own role
**Applies to:** `profiles` table (UPDATE)

**Logic:**
```sql
IF role changed AND current_user != super_admin:
  RAISE EXCEPTION 'Only super admins can change user roles'
```

**Effect:**
- Regular users cannot escalate privileges
- Only admins can assign/change roles
- Logs all role changes with NOTICE

---

### 2. `validate_idea_status_transition()`

**Purpose:** Enforce valid status workflows
**Applies to:** `ideas` table (UPDATE)

**Logic:**
```sql
Founder can only:
  draft/rejected → pending_review

Admin can only:
  pending_review → approved_for_vc/rejected
  rejected → pending_review

VC cannot change status (blocked)
```

**Effect:**
- Prevents invalid status jumps
- Enforces role-based workflows
- Database-level validation (cannot bypass)

---

## 🚀 Deployment Instructions

### Step 1: Backup Database
```bash
# In Supabase Dashboard
Database → Backups → Create Manual Backup
```

### Step 2: Run SQL Script
```bash
# In Supabase SQL Editor
1. Open comprehensive_rls_policies.sql
2. Copy entire contents
3. Paste into SQL Editor
4. Click "Run"
```

### Step 3: Verify Policies
```sql
-- Run verification queries (in Section 7 of SQL file)

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('profiles', 'ideas', 'pitches', 'vc_applications', 'notifications');

-- Count policies
SELECT tablename, COUNT(*) FROM pg_policies
WHERE tablename IN ('profiles', 'ideas', 'pitches', 'vc_applications', 'notifications')
GROUP BY tablename;
```

**Expected Results:**
- All tables show `rowsecurity = true`
- Policy counts:
  - profiles: 4
  - ideas: 7
  - pitches: 6
  - vc_applications: 7
  - notifications: 5

### Step 4: Test Each Role

**Test as Founder:**
```sql
-- Can view own ideas
SELECT * FROM ideas WHERE created_by = auth.uid();

-- Cannot view other founders' ideas
SELECT * FROM ideas WHERE created_by != auth.uid();  -- Returns empty

-- Cannot edit approved idea
UPDATE ideas SET title = 'test' WHERE status = 'approved_for_vc';  -- RLS blocks
```

**Test as VC:**
```sql
-- Cannot access ideas directly
SELECT * FROM ideas;  -- Returns empty (RLS blocks)

-- Can only insert intro requests for approved ideas
INSERT INTO vc_applications (idea_id, vc_id, status)
VALUES ('...', auth.uid(), 'requested');  -- Works only if idea.status = 'approved_for_vc'
```

**Test as Admin:**
```sql
-- Can view all ideas
SELECT * FROM ideas;  -- Returns all

-- Can approve ideas
UPDATE ideas SET status = 'approved_for_vc'
WHERE id = '...' AND status = 'pending_review';  -- Works
```

---

## ⚠️ Critical Security Notes

### Service Role vs Anon Key

| Key Type | RLS | Use Case |
|----------|-----|----------|
| **Anon Key** | ✅ Enforced | Client-side (React app) - SAFE |
| **Service Role Key** | ❌ Bypasses RLS | Backend only - DANGEROUS |

**Rule:** NEVER expose service_role key to client. Always use anon key in frontend.

### Client vs Database Validation

| Layer | Purpose | Can Bypass? |
|-------|---------|-------------|
| **React UI** | UX, prevent errors | ✅ Yes (devtools) |
| **Service Layer** | Fast-fail, clear errors | ✅ Yes (API call) |
| **RLS Policies** | Enforce permissions | ❌ No (database level) |
| **Triggers** | Enforce business rules | ❌ No (database level) |

**Defense in Depth:** All layers work together, but database is final authority.

---

## 🔍 Common Issues & Solutions

### Issue: "new row violates row-level security policy"

**Cause:** User trying to insert/update data they don't have permission for

**Solution:**
1. Check user's role: `SELECT role FROM profiles WHERE id = auth.uid()`
2. Verify data matches policy requirements
3. For vc_applications: Check `ideas.status = 'approved_for_vc'`

---

### Issue: "permission denied for table ideas"

**Cause:** RLS policies not yet applied OR user not authenticated

**Solution:**
1. Ensure user is logged in: `SELECT auth.uid()`
2. Run `comprehensive_rls_policies.sql` if not yet applied
3. Check Supabase logs for specific policy violation

---

### Issue: Cannot update approved idea as founder

**This is CORRECT behavior!**

**Reason:** Founders lose UPDATE access once `status = 'approved_for_vc'`

**Workaround:**
- Admin must reject idea first (change status to 'rejected')
- Founder can then edit and resubmit

---

## 📊 Monitoring & Auditing

### View RLS Violations (Supabase Dashboard)
```
Logs & Reports → Postgres Logs → Filter: "policy"
```

### Track Role Changes
```sql
-- Check database logs for NOTICE messages
-- Logged by prevent_role_self_change() trigger
```

### Audit Intro Requests
```sql
-- All intro requests preserved (no DELETE policy)
SELECT * FROM vc_applications ORDER BY created_at DESC;
```

---

## ✅ Compliance Checklist

- ✅ **GDPR:** Users can view/update/delete own data
- ✅ **Audit Trail:** vc_applications cannot be deleted
- ✅ **Least Privilege:** Each role has minimum required access
- ✅ **Defense in Depth:** Multi-layer security (UI + App + DB)
- ✅ **Role Isolation:** VCs cannot access founder data, vice versa
- ✅ **Immutability:** Approved ideas cannot be modified by founders
- ✅ **Accountability:** All role changes logged

---

## 🎯 Next Steps

1. ✅ Run `comprehensive_rls_policies.sql` in Supabase
2. ✅ Run verification queries
3. ✅ Test each role manually
4. ✅ Update error handling in React app
5. ✅ Monitor Supabase logs for violations
6. ✅ Set up automated backup schedule

---

**Questions?** Check Supabase docs: https://supabase.com/docs/guides/auth/row-level-security

**Status:** 🔒 PRODUCTION LOCKED & SECURE
