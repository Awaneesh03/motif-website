-- ============================================================================
-- FIX: Create case_studies table with RLS policies
-- Run this in Supabase SQL Editor to fix missing table errors
-- ============================================================================

-- Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create case_studies table if it doesn't exist
CREATE TABLE IF NOT EXISTS case_studies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')) NOT NULL,
  problem_statement TEXT NOT NULL,
  background TEXT,
  constraints TEXT,
  expected_outcome TEXT,
  hints TEXT,
  solution TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT CHECK (status IN ('Draft', 'Published')) DEFAULT 'Draft',
  image_url TEXT,
  category TEXT DEFAULT 'General',
  company TEXT DEFAULT 'Case Study',
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists (safe migration)
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS company TEXT DEFAULT 'Case Study';
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_case_studies_status ON case_studies(status);
CREATE INDEX IF NOT EXISTS idx_case_studies_difficulty ON case_studies(difficulty);
CREATE INDEX IF NOT EXISTS idx_case_studies_created_at ON case_studies(created_at DESC);

-- Enable RLS
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view published case studies" ON case_studies;
DROP POLICY IF EXISTS "Admins can manage case studies" ON case_studies;

-- Policy: Anyone (authenticated) can view published case studies
CREATE POLICY "Anyone can view published case studies"
ON case_studies FOR SELECT
TO authenticated
USING (status = 'Published');

-- Policy: Admins can manage all case studies
CREATE POLICY "Admins can manage case studies"
ON case_studies FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON case_studies TO authenticated;

-- Success message
SELECT 'case_studies table created successfully with RLS policies!' AS status;
