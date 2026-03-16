-- ============================================================
-- IDEA_ANALYSES TABLE — FULL MIGRATION
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This script:
--   1. Creates the idea_analyses table if it doesn't exist (with all columns)
--   2. Adds any missing columns to an existing table (safe to re-run)
--   3. Creates indexes for performance
--   4. Sets up the updated_at auto-update trigger
--
-- ============================================================

-- ── 1. CREATE TABLE (if it doesn't exist at all) ────────────────────────────

CREATE TABLE IF NOT EXISTS idea_analyses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_title    VARCHAR(255) NOT NULL,
  idea_description TEXT      NOT NULL,
  target_market VARCHAR(255),
  score         INTEGER     NOT NULL,
  strengths     JSONB,
  weaknesses    JSONB,
  recommendations JSONB,
  market_size   TEXT,
  competition   TEXT,
  viability     TEXT,
  status        VARCHAR(50) NOT NULL DEFAULT 'draft',
  mentor_context JSONB,
  idea_summary  TEXT,
  heuristic_scores JSONB,
  investor_analysis JSONB,
  confidence_score INTEGER,
  competitive_advantage TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- ── 2. ADD MISSING COLUMNS (if table already exists without them) ────────────
-- These are idempotent — safe to run even if columns already exist.

ALTER TABLE idea_analyses
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'draft';

ALTER TABLE idea_analyses
  ADD COLUMN IF NOT EXISTS mentor_context JSONB;

ALTER TABLE idea_analyses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- ── 2b. ADD COLUMNS FOR FULL ANALYSIS DATA (needed for SavedAnalysisPage) ────
-- These fields are returned by the AI but were not originally persisted.

ALTER TABLE idea_analyses
  ADD COLUMN IF NOT EXISTS idea_summary TEXT;

ALTER TABLE idea_analyses
  ADD COLUMN IF NOT EXISTS heuristic_scores JSONB;

ALTER TABLE idea_analyses
  ADD COLUMN IF NOT EXISTS investor_analysis JSONB;

ALTER TABLE idea_analyses
  ADD COLUMN IF NOT EXISTS confidence_score INTEGER;

ALTER TABLE idea_analyses
  ADD COLUMN IF NOT EXISTS competitive_advantage TEXT;

-- ── 3. INDEXES ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_idea_analyses_user_id    ON idea_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_analyses_created_at ON idea_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_idea_analyses_status     ON idea_analyses(status);

-- ── 4. AUTO-UPDATE updated_at TRIGGER ────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_idea_analyses_updated_at ON idea_analyses;
CREATE TRIGGER trigger_idea_analyses_updated_at
  BEFORE UPDATE ON idea_analyses
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ── 5. VERIFY ────────────────────────────────────────────────────────────────
-- Run this query afterwards to confirm all columns exist:
--
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'idea_analyses'
-- ORDER BY ordinal_position;
--
-- You should see: id, user_id, idea_title, idea_description, target_market,
--   score, strengths, weaknesses, recommendations, market_size, competition,
--   viability, status, mentor_context, idea_summary, heuristic_scores,
--   investor_analysis, confidence_score, competitive_advantage, created_at, updated_at
