-- ============================================================================
-- FIX: Align ideas & vc_applications schema with frontend expectations
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to ideas (safe if they already exist)
ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS stage TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Optional: if your app still uses target_market elsewhere
ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS target_market TEXT;

-- Backfill target_market from industry if needed
UPDATE ideas
SET target_market = industry
WHERE target_market IS NULL AND industry IS NOT NULL;

-- Ensure vc_applications has FK to ideas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vc_applications_idea_id_fkey'
  ) THEN
    ALTER TABLE vc_applications
      ADD CONSTRAINT vc_applications_idea_id_fkey
      FOREIGN KEY (idea_id)
      REFERENCES ideas(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Index for faster joins
CREATE INDEX IF NOT EXISTS idx_vc_applications_idea_id ON vc_applications(idea_id);

-- Success message
SELECT 'Ideas schema and FK verified/updated.' AS status;
