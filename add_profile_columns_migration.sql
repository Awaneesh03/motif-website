-- ============================================================================
-- IdeaForge - Add Missing Profile Columns Migration
-- ============================================================================
-- This script adds all the custom columns needed for the profiles table
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Add missing columns to profiles table (if they don't exist)
-- These are used by the ProfilePage component

DO $$
BEGIN
    -- Add 'about' column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'about'
    ) THEN
        ALTER TABLE profiles ADD COLUMN about TEXT DEFAULT '';
    END IF;

    -- Add 'linkedin' column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'linkedin'
    ) THEN
        ALTER TABLE profiles ADD COLUMN linkedin TEXT DEFAULT '';
    END IF;

    -- Add 'role' column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'founder';
    END IF;

    -- Add 'location' column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'location'
    ) THEN
        ALTER TABLE profiles ADD COLUMN location TEXT DEFAULT '';
    END IF;

    -- Add 'education' column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'education'
    ) THEN
        ALTER TABLE profiles ADD COLUMN education TEXT DEFAULT '';
    END IF;

    -- Add 'avatar' column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'avatar'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar TEXT DEFAULT '';
    END IF;

    -- Add 'startup_goals' column if it doesn't exist (JSONB array)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'startup_goals'
    ) THEN
        ALTER TABLE profiles ADD COLUMN startup_goals JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add 'connections' column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'connections'
    ) THEN
        ALTER TABLE profiles ADD COLUMN connections INTEGER DEFAULT 0;
    END IF;

    -- Add 'ideasSaved' column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'ideasSaved'
    ) THEN
        ALTER TABLE profiles ADD COLUMN "ideasSaved" INTEGER DEFAULT 0;
    END IF;

    -- Add 'caseStudiesSaved' column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'caseStudiesSaved'
    ) THEN
        ALTER TABLE profiles ADD COLUMN "caseStudiesSaved" INTEGER DEFAULT 0;
    END IF;

    -- Add timestamps if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Enable Row Level Security if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist

-- Drop existing policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create a function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at on profile changes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Verification Query (Optional - Run this to check if all columns exist)
-- ============================================================================

-- SELECT
--     column_name,
--     data_type,
--     column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;
