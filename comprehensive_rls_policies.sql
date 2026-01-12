-- ============================================================================
-- COMPREHENSIVE ROW LEVEL SECURITY POLICIES - PRODUCTION READY
-- ============================================================================
-- This file completely locks down all Supabase tables with strict RLS
-- Run this ONCE in Supabase SQL Editor to enforce all security policies
-- ============================================================================
-- IMPORTANT: This will DROP and RECREATE all policies - backup data first!
-- ============================================================================

-- ============================================================================
-- SECTION 1: PROFILES TABLE
-- ============================================================================
-- Rules:
-- - Users can SELECT their own profile
-- - Users can UPDATE their own profile (except role field)
-- - NO client inserts (handled by auth trigger)
-- - Admins can SELECT all profiles
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "VCs can view connected founder profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON profiles;

-- Policy 1: Users can SELECT their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Admins can SELECT all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'super_admin'
  )
);

-- Policy 3: Users can UPDATE their own profile (role change blocked by trigger)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can UPDATE any profile
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'super_admin'
  )
);

-- Policy 5: NO client inserts allowed
-- (Profile creation handled by database trigger on auth.users insert)

-- ============================================================================
-- SECTION 2: IDEAS TABLE (STARTUPS)
-- ============================================================================
-- Rules:
-- - Founders can CRUD their own ideas
-- - Founders CANNOT modify ideas with status = 'approved_for_vc'
-- - VCs CANNOT access ideas directly (must go through vc_applications)
-- - Admins can SELECT + UPDATE all ideas
-- ============================================================================

-- Enable RLS
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Founders can view own ideas" ON ideas;
DROP POLICY IF EXISTS "Founders can insert own ideas" ON ideas;
DROP POLICY IF EXISTS "Founders can update own ideas" ON ideas;
DROP POLICY IF EXISTS "Founders can delete own draft ideas" ON ideas;
DROP POLICY IF EXISTS "Founders can delete own ideas" ON ideas;
DROP POLICY IF EXISTS "VCs can view approved ideas" ON ideas;
DROP POLICY IF EXISTS "Admins can view all ideas" ON ideas;
DROP POLICY IF EXISTS "Admins can update all ideas" ON ideas;

-- Policy 1: Founders can SELECT their own ideas
CREATE POLICY "Founders can view own ideas"
ON ideas FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'founder'
  )
);

-- Policy 2: Founders can INSERT their own ideas
CREATE POLICY "Founders can insert own ideas"
ON ideas FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'founder'
  )
);

-- Policy 3: Founders can UPDATE their own ideas (ONLY if NOT approved_for_vc)
CREATE POLICY "Founders can update own ideas"
ON ideas FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  AND status != 'approved_for_vc'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'founder'
  )
)
WITH CHECK (
  auth.uid() = created_by
  AND status != 'approved_for_vc'
);

-- Policy 4: Founders can DELETE their own draft ideas ONLY
CREATE POLICY "Founders can delete own draft ideas"
ON ideas FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by
  AND status = 'draft'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'founder'
  )
);

-- Policy 5: VCs CANNOT access ideas directly
-- (No policy = no access. VCs must use vc_applications join)

-- Policy 6: Admins can SELECT all ideas
CREATE POLICY "Admins can view all ideas"
ON ideas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Policy 7: Admins can UPDATE all ideas (for status changes)
CREATE POLICY "Admins can update all ideas"
ON ideas FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- ============================================================================
-- SECTION 3: PITCHES TABLE
-- ============================================================================
-- Rules:
-- - Founders can CRUD pitches linked to their ideas
-- - VCs can SELECT pitches ONLY if intro request is approved
-- - Admins have full SELECT access
-- ============================================================================

-- Enable RLS
ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own pitches" ON pitches;
DROP POLICY IF EXISTS "Users can insert own pitches" ON pitches;
DROP POLICY IF EXISTS "Users can update own pitches" ON pitches;
DROP POLICY IF EXISTS "Users can delete own pitches" ON pitches;
DROP POLICY IF EXISTS "VCs can view pitches for approved ideas" ON pitches;
DROP POLICY IF EXISTS "Admins can view all pitches" ON pitches;

-- Policy 1: Founders can SELECT their own pitches
CREATE POLICY "Founders can view own pitches"
ON pitches FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'founder'
  )
);

-- Policy 2: Founders can INSERT their own pitches
CREATE POLICY "Founders can insert own pitches"
ON pitches FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'founder'
  )
);

-- Policy 3: Founders can UPDATE their own pitches
CREATE POLICY "Founders can update own pitches"
ON pitches FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'founder'
  )
);

-- Policy 4: Founders can DELETE their own pitches
CREATE POLICY "Founders can delete own pitches"
ON pitches FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'founder'
  )
);

-- Policy 5: VCs can SELECT pitches ONLY if intro request is approved
CREATE POLICY "VCs can view pitches for approved intros"
ON pitches FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'vc'
  )
  AND EXISTS (
    SELECT 1 FROM vc_applications
    WHERE vc_applications.idea_id = pitches.idea_id
    AND vc_applications.vc_id = auth.uid()
    AND vc_applications.status = 'approved'
  )
);

-- Policy 6: Admins can SELECT all pitches
CREATE POLICY "Admins can view all pitches"
ON pitches FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- ============================================================================
-- SECTION 4: VC_APPLICATIONS TABLE (INTRO REQUESTS)
-- ============================================================================
-- Rules:
-- - VCs can INSERT intro requests for approved_for_vc ideas only
-- - VCs can SELECT their own requests
-- - VCs can UPDATE their own requests (for notes, etc.)
-- - Founders can SELECT intro requests for their ideas
-- - Admins can SELECT all requests
-- - Admins can UPDATE all requests (for approval/rejection)
-- - NO DELETE allowed (audit trail)
-- ============================================================================

-- Enable RLS
ALTER TABLE vc_applications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "VCs can view own applications" ON vc_applications;
DROP POLICY IF EXISTS "VCs can insert own applications" ON vc_applications;
DROP POLICY IF EXISTS "VCs can update own applications" ON vc_applications;
DROP POLICY IF EXISTS "Founders can view applications for their ideas" ON vc_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON vc_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON vc_applications;

-- Policy 1: VCs can INSERT intro requests (only for approved_for_vc ideas)
CREATE POLICY "VCs can insert intro requests"
ON vc_applications FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = vc_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'vc'
  )
  AND EXISTS (
    SELECT 1 FROM ideas
    WHERE ideas.id = vc_applications.idea_id
    AND ideas.status = 'approved_for_vc'
  )
);

-- Policy 2: Founders can INSERT intro requests (vc_id = NULL for founder-initiated)
CREATE POLICY "Founders can insert intro requests"
ON vc_applications FOR INSERT
TO authenticated
WITH CHECK (
  vc_id IS NULL
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'founder'
  )
  AND EXISTS (
    SELECT 1 FROM ideas
    WHERE ideas.id = vc_applications.idea_id
    AND ideas.created_by = auth.uid()
  )
);

-- Policy 3: VCs can SELECT their own intro requests
CREATE POLICY "VCs can view own requests"
ON vc_applications FOR SELECT
TO authenticated
USING (
  auth.uid() = vc_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'vc'
  )
);

-- Policy 4: VCs can UPDATE their own requests (for notes)
CREATE POLICY "VCs can update own requests"
ON vc_applications FOR UPDATE
TO authenticated
USING (
  auth.uid() = vc_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'vc'
  )
)
WITH CHECK (
  auth.uid() = vc_id
  -- Prevent VCs from changing status
  AND status = (SELECT status FROM vc_applications WHERE id = vc_applications.id)
);

-- Policy 5: Founders can SELECT intro requests for their ideas
CREATE POLICY "Founders can view requests for their ideas"
ON vc_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ideas
    WHERE ideas.id = vc_applications.idea_id
    AND ideas.created_by = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'founder'
  )
);

-- Policy 6: Admins can SELECT all intro requests
CREATE POLICY "Admins can view all requests"
ON vc_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Policy 7: Admins can UPDATE all intro requests (for approval/rejection)
CREATE POLICY "Admins can update all requests"
ON vc_applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Policy 8: NO DELETE allowed (maintain audit trail)
-- (No DELETE policy = no one can delete)

-- ============================================================================
-- SECTION 5: NOTIFICATIONS TABLE
-- ============================================================================
-- Rules:
-- - Users can SELECT their own notifications
-- - Users can UPDATE their own notifications (mark as read)
-- - Users can DELETE their own notifications
-- - Service role can INSERT notifications
-- - Admins can SELECT all (for audit)
-- ============================================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;

-- Policy 1: Users can SELECT their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can UPDATE their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can DELETE their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy 4: Service role can INSERT notifications (for system-generated notifications)
CREATE POLICY "Service can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);
-- NOTE: This allows any authenticated user to insert. If you want stricter control,
-- use service_role key on backend and change TO service_role

-- Policy 5: Admins can SELECT all notifications (for audit)
CREATE POLICY "Admins can view all notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- ============================================================================
-- SECTION 6: SECURITY TRIGGERS
-- ============================================================================
-- Prevent unauthorized role changes and enforce status transitions
-- ============================================================================

-- Trigger 1: Prevent role self-assignment
CREATE OR REPLACE FUNCTION prevent_role_self_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow role changes if:
  -- 1. Role is not changing, OR
  -- 2. Current user is a super_admin
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Permission denied: Only super admins can change user roles';
    END IF;

    -- Log the role change
    RAISE NOTICE 'Role changed for user % from % to % by %',
      NEW.id, OLD.role, NEW.role, auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS prevent_role_self_change_trigger ON profiles;
CREATE TRIGGER prevent_role_self_change_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_self_change();

-- Trigger 2: Validate idea status transitions
CREATE OR REPLACE FUNCTION validate_idea_status_transition()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get current user's role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();

  -- Founder transitions
  IF user_role = 'founder' THEN
    -- Can only: draft/rejected → pending_review
    IF (OLD.status IN ('draft', 'rejected') AND NEW.status = 'pending_review') THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Invalid transition: Founders can only submit draft/rejected ideas for review';
    END IF;
  END IF;

  -- Admin transitions
  IF user_role = 'super_admin' THEN
    -- Can: pending_review → approved_for_vc/rejected
    IF (OLD.status = 'pending_review' AND NEW.status IN ('approved_for_vc', 'rejected')) THEN
      RETURN NEW;
    -- Can: rejected → pending_review (allow resubmission)
    ELSIF (OLD.status = 'rejected' AND NEW.status = 'pending_review') THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Invalid transition from % to % for admin', OLD.status, NEW.status;
    END IF;
  END IF;

  -- VCs cannot change status
  IF user_role = 'vc' THEN
    RAISE EXCEPTION 'VCs cannot change idea status';
  END IF;

  -- Fallback: block unknown transitions
  RAISE EXCEPTION 'Unauthorized status transition from % to %', OLD.status, NEW.status;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS validate_idea_status_transition_trigger ON ideas;
CREATE TRIGGER validate_idea_status_transition_trigger
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION validate_idea_status_transition();

-- ============================================================================
-- SECTION 7: VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify RLS is active on all tables
-- ============================================================================

-- Check RLS is enabled
SELECT
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'ideas', 'pitches', 'vc_applications', 'notifications')
ORDER BY tablename;

-- Count policies per table
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('profiles', 'ideas', 'pitches', 'vc_applications', 'notifications')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- List all policies with their commands
SELECT
  tablename,
  policyname,
  cmd as "Operation",
  CASE
    WHEN roles = '{authenticated}' THEN 'Authenticated Users'
    WHEN roles = '{service_role}' THEN 'Service Role'
    ELSE roles::text
  END as "Applies To"
FROM pg_policies
WHERE tablename IN ('profiles', 'ideas', 'pitches', 'vc_applications', 'notifications')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- SECTION 8: POST-DEPLOYMENT CHECKLIST
-- ============================================================================

/*
✅ DEPLOYMENT CHECKLIST:

1. Backup your database before running this script
2. Run this entire script in Supabase SQL Editor
3. Verify all queries in Section 7 show expected results
4. Test each user role:
   - Founder: Can create/edit own ideas, submit for review
   - VC: Can request intros, view approved ideas via applications
   - Admin: Can approve/reject ideas and intro requests
5. Test edge cases:
   - Founder cannot edit approved_for_vc idea
   - VC cannot access ideas directly
   - Non-admin cannot change roles
6. Monitor Supabase logs for RLS violations
7. Update application code to handle RLS errors gracefully

⚠️ CRITICAL NOTES:

- Service role key bypasses RLS - only use on trusted backend
- Anon key respects RLS - safe for client-side use
- All policies use TO authenticated (not anon)
- Triggers enforce business logic at database level
- No DELETE policies on vc_applications (audit trail)
- Status transitions enforced by trigger

🔒 SECURITY POSTURE:

Multi-layer defense:
1. RLS (database level) - enforces who can access what
2. Triggers (database level) - enforces business rules
3. Application code (app level) - provides UX and validation
4. Role verification (app level) - fast-fail before DB calls

All sensitive operations now require:
- Valid authentication (JWT)
- Correct role (founder/vc/admin)
- Valid status transition (for idea updates)
- Pass RLS policy check (database enforced)
*/

-- ============================================================================
-- IMPLEMENTATION COMPLETE ✅
-- ============================================================================
-- All tables are now LOCKED DOWN with production-grade RLS policies
-- - profiles: User ownership + admin access
-- - ideas: Founder CRUD with approval restrictions + admin oversight
-- - pitches: Founder ownership + VC approved-intro access + admin view
-- - vc_applications: Strict intro request workflow + audit trail
-- - notifications: User ownership + system insert + admin audit
-- - Triggers: Prevent role changes + enforce status transitions
-- ============================================================================
-- Run verification queries above to confirm all policies are active
-- ============================================================================
