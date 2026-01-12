-- ============================================================================
-- Design Idea Forge Website - Complete Database Schema
-- Missing Tables Migration Script
-- ============================================================================
-- This script creates all missing tables identified during the database audit
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CASES TABLE
-- Stores case study definitions and metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company TEXT NOT NULL,
  logo TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) NOT NULL,
  category TEXT NOT NULL,
  attempts_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cases_difficulty ON cases(difficulty);
CREATE INDEX IF NOT EXISTS idx_cases_category ON cases(category);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);

-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cases (public read, admin write)
CREATE POLICY "Anyone can view cases"
  ON cases FOR SELECT
  USING (true);

-- ============================================================================
-- 2. LEADERBOARD TABLE
-- Tracks user scores and rankings
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  total_score INTEGER DEFAULT 0,
  ideas_count INTEGER DEFAULT 0,
  cases_completed INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_score ON leaderboard(total_score DESC);

-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leaderboard
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users can update own leaderboard entry"
  ON leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leaderboard entry"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. IDEA_ANALYSES TABLE
-- Stores AI analysis results from Idea Analyser
-- ============================================================================

CREATE TABLE IF NOT EXISTS idea_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  idea_title TEXT NOT NULL,
  idea_description TEXT NOT NULL,
  target_market TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  market_size TEXT,
  competition TEXT,
  viability TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_idea_analyses_user_id ON idea_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_analyses_score ON idea_analyses(score DESC);
CREATE INDEX IF NOT EXISTS idx_idea_analyses_created_at ON idea_analyses(created_at DESC);

-- Enable RLS
ALTER TABLE idea_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for idea_analyses
CREATE POLICY "Users can view own analyses"
  ON idea_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON idea_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON idea_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON idea_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. PITCH_SLIDES TABLE
-- Stores individual slides from generated pitches
-- ============================================================================

CREATE TABLE IF NOT EXISTS pitch_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pitch_id UUID REFERENCES pitches(id) ON DELETE CASCADE NOT NULL,
  slide_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pitch_id, slide_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pitch_slides_pitch_id ON pitch_slides(pitch_id);
CREATE INDEX IF NOT EXISTS idx_pitch_slides_slide_number ON pitch_slides(pitch_id, slide_number);

-- Enable RLS
ALTER TABLE pitch_slides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pitch_slides (inherit from pitches table)
CREATE POLICY "Users can view own pitch slides"
  ON pitch_slides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pitches
      WHERE pitches.id = pitch_slides.pitch_id
      AND pitches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own pitch slides"
  ON pitch_slides FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pitches
      WHERE pitches.id = pitch_slides.pitch_id
      AND pitches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own pitch slides"
  ON pitch_slides FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pitches
      WHERE pitches.id = pitch_slides.pitch_id
      AND pitches.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. ACTIVITY_LOG TABLE
-- Tracks user activities for dashboard
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(activity_type);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_log
CREATE POLICY "Users can view own activity"
  ON activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. NOTIFICATIONS TABLE
-- User notification system
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. TAGS TABLE
-- Centralized tag management
-- ============================================================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags (public read)
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  USING (true);

-- ============================================================================
-- 8. POST_REPLIES TABLE
-- Nested replies to comments
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_post_replies_comment_id ON post_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_post_replies_user_id ON post_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_post_replies_created_at ON post_replies(created_at DESC);

-- Enable RLS
ALTER TABLE post_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_replies
CREATE POLICY "Anyone can view replies"
  ON post_replies FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert replies"
  ON post_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies"
  ON post_replies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies"
  ON post_replies FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to cases table
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to leaderboard table
CREATE TRIGGER update_leaderboard_updated_at
    BEFORE UPDATE ON leaderboard
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA FOR CASES TABLE (Optional - for testing)
-- ============================================================================

INSERT INTO cases (company, logo, title, description, difficulty, category, attempts_count) VALUES
('TechFlow', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop', 'Scaling User Acquisition on a Limited Budget', 'A B2B SaaS startup needs to grow from 100 to 1000 users in 3 months with only $5k marketing budget.', 'Medium', 'Marketing', 234),
('GrowthStack', 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop', 'Product-Market Fit Crisis', 'An AI tool with great tech but no clear use case. Help find the right market segment.', 'Hard', 'Product', 189),
('MealPal', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&h=100&fit=crop', 'Optimizing Food Delivery Operations', 'Reduce delivery time by 30% while maintaining quality and keeping costs low.', 'Medium', 'Operations', 156),
('StartupHub', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=100&h=100&fit=crop', 'Building a Community from Zero', 'Launch a founder community and get to 500 active members in the first month.', 'Easy', 'Growth', 312),
('DataViz Pro', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop', 'Pivot Strategy for Failing Product', 'A data visualization tool is losing users. Decide whether to pivot or persevere.', 'Hard', 'Product', 98),
('FitTrack', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop', 'Viral Marketing Campaign Design', 'Create a growth loop that turns every user into 3 new users organically.', 'Medium', 'Marketing', 267),
('CodeLearn', 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=100&h=100&fit=crop', 'Pricing Model Optimization', 'Find the optimal pricing tiers that maximize revenue without losing customers.', 'Easy', 'Growth', 445),
('CloudSync', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop', 'Enterprise Sales Strategy', 'Break into enterprise market with a product built for SMBs. What''s your approach?', 'Hard', 'Growth', 123)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA FOR TAGS TABLE (Optional - for testing)
-- ============================================================================

INSERT INTO tags (name, category, usage_count) VALUES
('AI', 'Technology', 150),
('SaaS', 'Business Model', 120),
('Mobile', 'Platform', 90),
('Web3', 'Technology', 75),
('HealthTech', 'Industry', 85),
('Fintech', 'Industry', 95),
('EdTech', 'Industry', 70),
('B2B', 'Business Model', 110),
('E-commerce', 'Business Model', 80),
('No-Code', 'Technology', 60),
('IoT', 'Technology', 55),
('Sustainability', 'Category', 65),
('Marketplace', 'Business Model', 70),
('Developer Tools', 'Category', 50),
('Entertainment', 'Industry', 40),
('Music', 'Industry', 35),
('Pets', 'Industry', 30),
('Accessibility', 'Category', 25),
('Smart City', 'Category', 20),
('VR', 'Technology', 45),
('Healthcare', 'Industry', 90),
('Automation', 'Category', 55),
('Productivity', 'Category', 60)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after migration to verify everything is set up correctly

-- 1. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cases', 'leaderboard', 'idea_analyses', 'pitch_slides', 'activity_log', 'notifications', 'tags', 'post_replies')
ORDER BY table_name;

-- 2. Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('cases', 'leaderboard', 'idea_analyses', 'pitch_slides', 'activity_log', 'notifications', 'tags', 'post_replies');

-- 3. Count policies per table
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('cases', 'leaderboard', 'idea_analyses', 'pitch_slides', 'activity_log', 'notifications', 'tags', 'post_replies')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 4. Check seed data
SELECT 'cases' as table_name, COUNT(*) as row_count FROM cases
UNION ALL
SELECT 'tags', COUNT(*) FROM tags;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All missing tables have been created with proper:
-- ✓ Schema definitions
-- ✓ Foreign key constraints
-- ✓ Check constraints
-- ✓ Indexes for performance
-- ✓ Row Level Security (RLS) policies
-- ✓ Triggers for updated_at timestamps
-- ✓ Seed data for testing
-- ============================================================================
