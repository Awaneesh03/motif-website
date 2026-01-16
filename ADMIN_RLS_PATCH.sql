-- ============================================================================
-- ADMIN RLS PATCH (NOTIFICATIONS + IDEAS + VC_APPLICATIONS)
-- Run in Supabase SQL Editor to allow super_admin SELECT access
-- ============================================================================

-- NOTIFICATIONS: Admins can SELECT all notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
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

-- IDEAS (STARTUPS): Admins can SELECT all ideas
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all ideas" ON ideas;
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

-- VC_APPLICATIONS: Admins can SELECT all requests
ALTER TABLE vc_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all requests" ON vc_applications;
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
