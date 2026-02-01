-- ============================================================
-- MOTIF COMMUNITY FEATURES - SUPABASE DATABASE SCHEMA
-- ============================================================
--
-- IMPORTANT: Run this SQL in your Supabase SQL Editor to enable Community features
--
-- Instructions:
-- 1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Click on "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this entire file
-- 6. Click "Run" to execute
--
-- This will create:
-- - community_ideas table (stores all shared startup ideas)
-- - community_upvotes table (tracks user upvotes with one-per-user constraint)
-- - community_comments table (stores comments on ideas)
-- - Indexes for performance
-- - Row Level Security policies for data protection
-- - Triggers for automatic count updates
--
-- ============================================================

-- Table for storing community ideas
CREATE TABLE IF NOT EXISTS community_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upvotes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for tracking upvotes (one upvote per user per idea)
CREATE TABLE IF NOT EXISTS community_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES community_ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

-- Table for storing comments
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES community_ideas(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_community_ideas_author ON community_ideas(author_id);
CREATE INDEX IF NOT EXISTS idx_community_ideas_created_at ON community_ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_upvotes_idea ON community_upvotes(idea_id);
CREATE INDEX IF NOT EXISTS idx_community_upvotes_user ON community_upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_idea ON community_comments(idea_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE community_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (to allow re-running this script)
DROP POLICY IF EXISTS "Anyone can view community ideas" ON community_ideas;
DROP POLICY IF EXISTS "Authenticated users can create ideas" ON community_ideas;
DROP POLICY IF EXISTS "Users can update own ideas" ON community_ideas;
DROP POLICY IF EXISTS "Users can delete own ideas" ON community_ideas;
DROP POLICY IF EXISTS "Anyone can view upvotes" ON community_upvotes;
DROP POLICY IF EXISTS "Authenticated users can upvote" ON community_upvotes;
DROP POLICY IF EXISTS "Users can remove own upvotes" ON community_upvotes;
DROP POLICY IF EXISTS "Anyone can view comments" ON community_comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON community_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON community_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON community_comments;

-- Community Ideas Policies
-- Anyone can read ideas
CREATE POLICY "Anyone can view community ideas"
  ON community_ideas FOR SELECT
  USING (true);

-- Only authenticated users can insert ideas
CREATE POLICY "Authenticated users can create ideas"
  ON community_ideas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own ideas
CREATE POLICY "Users can update own ideas"
  ON community_ideas FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can delete their own ideas
CREATE POLICY "Users can delete own ideas"
  ON community_ideas FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Community Upvotes Policies
-- Anyone can view upvotes
CREATE POLICY "Anyone can view upvotes"
  ON community_upvotes FOR SELECT
  USING (true);

-- Authenticated users can insert upvotes
CREATE POLICY "Authenticated users can upvote"
  ON community_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own upvotes
CREATE POLICY "Users can remove own upvotes"
  ON community_upvotes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Community Comments Policies
-- Anyone can view comments
CREATE POLICY "Anyone can view comments"
  ON community_comments FOR SELECT
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can comment"
  ON community_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON community_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON community_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Function to update upvotes_count when upvote is added/removed
CREATE OR REPLACE FUNCTION update_idea_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_ideas
    SET upvotes_count = upvotes_count + 1, updated_at = NOW()
    WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_ideas
    SET upvotes_count = GREATEST(upvotes_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update upvotes count
DROP TRIGGER IF EXISTS trigger_update_upvotes_count ON community_upvotes;
CREATE TRIGGER trigger_update_upvotes_count
  AFTER INSERT OR DELETE ON community_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION update_idea_upvotes_count();

-- Function to update comments_count when comment is added/removed
CREATE OR REPLACE FUNCTION update_idea_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_ideas
    SET comments_count = comments_count + 1, updated_at = NOW()
    WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_ideas
    SET comments_count = GREATEST(comments_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update comments count
DROP TRIGGER IF EXISTS trigger_update_comments_count ON community_comments;
CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_idea_comments_count();

-- ============================================================================
-- ENABLE REAL-TIME REPLICATION (Critical for live updates)
-- ============================================================================

-- Enable real-time for all community tables
-- This allows WebSocket subscriptions to receive instant updates
-- Note: Using DO block to handle case where table is already in publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'community_ideas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE community_ideas;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'community_upvotes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE community_upvotes;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'community_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;
  END IF;
END $$;

-- Note: You can verify real-time is enabled in Supabase Dashboard:
-- Database → Replication → Check that tables are listed

-- ============================================================================
-- NOTIFICATIONS TABLE (For activity tracking)
-- ============================================================================

-- Table for storing user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('startup_submitted', 'startup_approved', 'startup_rejected', 'vc_intro_requested', 'vc_intro_approved')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable real-time for notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
