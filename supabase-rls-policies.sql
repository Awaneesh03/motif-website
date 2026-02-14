-- ============================================================
-- RLS POLICIES FOR MISSING TABLES
-- ============================================================
--
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This adds Row Level Security to tables that currently have NO RLS:
--   1. profiles
--   2. idea_analyses
--   3. vc_applications
--   4. pitches
--   5. case_studies
--
-- IMPORTANT: Run this AFTER verifying your tables exist.
-- This script is idempotent (safe to re-run).
--
-- ============================================================


-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
-- Access pattern:
--   - Anyone can read profiles (needed for founder names, avatars, etc.)
--   - Users can only insert/update their OWN profile
--   - Users can only delete their OWN profile
--   - Admins should NOT be able to modify other profiles via client
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Public read: needed by startupService, metricsService, roleVerification
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can only create their own profile (id must match auth.uid())
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);


-- ============================================================
-- 2. IDEA_ANALYSES TABLE
-- ============================================================
-- Access pattern:
--   - Founders see their own ideas (filtered by user_id)
--   - VCs and Admins can also view ideas (for dashboard/review)
--   - Only the owner or admin can update an idea
--   - Only authenticated users can insert (for their own user_id)
--
-- NOTE: This table does NOT have a 'status' column.
--   Actual columns: id, user_id, idea_title, idea_description,
--   target_market, score, strengths, weaknesses, recommendations,
--   market_size, competition, viability, created_at
-- ============================================================

ALTER TABLE idea_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ideas" ON idea_analyses;
DROP POLICY IF EXISTS "VCs can view approved startups" ON idea_analyses;
DROP POLICY IF EXISTS "VCs can view ideas" ON idea_analyses;
DROP POLICY IF EXISTS "Admins can view all ideas" ON idea_analyses;
DROP POLICY IF EXISTS "Users can insert own ideas" ON idea_analyses;
DROP POLICY IF EXISTS "Users can update own ideas" ON idea_analyses;
DROP POLICY IF EXISTS "Admins can update any idea" ON idea_analyses;
DROP POLICY IF EXISTS "Users can delete own ideas" ON idea_analyses;

-- Founders can see their own ideas
CREATE POLICY "Users can view own ideas"
  ON idea_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- VCs can view ideas (needed for VC dashboard/browsing startups)
CREATE POLICY "VCs can view ideas"
  ON idea_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'vc'
    )
  );

-- Admins can see all ideas (for review/approval workflow)
CREATE POLICY "Admins can view all ideas"
  ON idea_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Users can only insert ideas for themselves
CREATE POLICY "Users can insert own ideas"
  ON idea_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own ideas
CREATE POLICY "Users can update own ideas"
  ON idea_analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any idea (for review actions)
CREATE POLICY "Admins can update any idea"
  ON idea_analyses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Users can delete their own ideas
CREATE POLICY "Users can delete own ideas"
  ON idea_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 3. VC_APPLICATIONS TABLE
-- ============================================================
-- Access pattern:
--   - VCs see their own applications
--   - Founders see applications for their startups
--   - Admins see all applications
--   - VCs can create applications (insert with their vc_id)
--   - Founders can create intro requests (insert with null vc_id)
--   - Only admins can update status (approve/reject)
-- ============================================================

ALTER TABLE vc_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "VCs can view own applications" ON vc_applications;
DROP POLICY IF EXISTS "Founders can view applications for their startups" ON vc_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON vc_applications;
DROP POLICY IF EXISTS "Authenticated users can create applications" ON vc_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON vc_applications;

-- VCs can see their own applications
CREATE POLICY "VCs can view own applications"
  ON vc_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = vc_id);

-- Founders can see applications for their startups
CREATE POLICY "Founders can view applications for their startups"
  ON vc_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM idea_analyses
      WHERE idea_analyses.id = vc_applications.idea_id
      AND idea_analyses.user_id = auth.uid()
    )
  );

-- Admins can see all applications
CREATE POLICY "Admins can view all applications"
  ON vc_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Authenticated users can create applications
-- (VCs create with their vc_id, founders create with null vc_id)
CREATE POLICY "Authenticated users can create applications"
  ON vc_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    -- VC creating: vc_id must be their own
    (vc_id = auth.uid())
    OR
    -- Founder creating: vc_id is null and they own the startup
    (
      vc_id IS NULL
      AND EXISTS (
        SELECT 1 FROM idea_analyses
        WHERE idea_analyses.id = idea_id
        AND idea_analyses.user_id = auth.uid()
      )
    )
  );

-- Only admins can update application status
CREATE POLICY "Admins can update applications"
  ON vc_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );


-- ============================================================
-- 4. PITCHES TABLE
-- ============================================================
-- Access pattern:
--   - Users can view their own pitches
--   - Users can create pitches for themselves
--   - Admins/VCs may need to view pitches for approved startups
-- ============================================================

ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pitches" ON pitches;
DROP POLICY IF EXISTS "Users can insert own pitches" ON pitches;
DROP POLICY IF EXISTS "Users can update own pitches" ON pitches;
DROP POLICY IF EXISTS "Users can delete own pitches" ON pitches;
DROP POLICY IF EXISTS "Admins can view all pitches" ON pitches;

-- Users can see their own pitches
CREATE POLICY "Users can view own pitches"
  ON pitches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can see all pitches
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

-- Users can create their own pitches
CREATE POLICY "Users can insert own pitches"
  ON pitches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pitches
CREATE POLICY "Users can update own pitches"
  ON pitches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own pitches
CREATE POLICY "Users can delete own pitches"
  ON pitches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 5. CASE_STUDIES TABLE
-- ============================================================
-- Access pattern:
--   - Public content, anyone can read
--   - Only admins can create/update/delete
-- ============================================================

ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view case studies" ON case_studies;
DROP POLICY IF EXISTS "Admins can manage case studies" ON case_studies;
DROP POLICY IF EXISTS "Admins can insert case studies" ON case_studies;
DROP POLICY IF EXISTS "Admins can update case studies" ON case_studies;
DROP POLICY IF EXISTS "Admins can delete case studies" ON case_studies;

-- Anyone can read case studies (public content)
CREATE POLICY "Anyone can view case studies"
  ON case_studies FOR SELECT
  USING (true);

-- Only admins can insert case studies
CREATE POLICY "Admins can insert case studies"
  ON case_studies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Only admins can update case studies
CREATE POLICY "Admins can update case studies"
  ON case_studies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Only admins can delete case studies
CREATE POLICY "Admins can delete case studies"
  ON case_studies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );


-- ============================================================
-- 6. STORAGE: AVATARS BUCKET
-- ============================================================
-- Set these manually in Supabase Dashboard:
--   Storage > avatars bucket > Policies
--
--   1. SELECT (public): Allow anyone to view avatars
--   2. INSERT (authenticated): Users can upload to their own folder
--      - Policy: (auth.uid())::text = (storage.foldername(name))[1]
--   3. UPDATE (authenticated): Users can update their own avatars
--      - Policy: (auth.uid())::text = (storage.foldername(name))[1]
-- ============================================================


-- ============================================================
-- VERIFICATION QUERY
-- ============================================================
-- Run this after applying to verify all tables have RLS enabled:
-- ============================================================

-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- All tables should show rowsecurity = true
