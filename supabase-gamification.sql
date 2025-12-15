-- BugHunt Gamification Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create bug_events table to track all bug-related events
CREATE TABLE IF NOT EXISTS bug_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN (
    'bug_opened',
    'bug_triaged',
    'bug_fixed',
    'bug_reopened',
    'bug_closed_invalid',
    'bug_marked_duplicate'
  )),
  bug_id BIGINT NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  feature TEXT,
  reporter TEXT NOT NULL,
  solver TEXT,
  meta JSONB DEFAULT '{}'::jsonb
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_bug_events_created_at ON bug_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_events_bug_id ON bug_events(bug_id);
CREATE INDEX IF NOT EXISTS idx_bug_events_type ON bug_events(type);
CREATE INDEX IF NOT EXISTS idx_bug_events_reporter ON bug_events(reporter);
CREATE INDEX IF NOT EXISTS idx_bug_events_solver ON bug_events(solver);

-- Enable Row Level Security
ALTER TABLE bug_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public_read_bug_events" ON bug_events;
DROP POLICY IF EXISTS "public_insert_bug_events" ON bug_events;

-- Create policies for public access
CREATE POLICY "public_read_bug_events" ON bug_events FOR SELECT USING (true);
CREATE POLICY "public_insert_bug_events" ON bug_events FOR INSERT WITH CHECK (true);

-- Create view for leaderboard with scoring
CREATE OR REPLACE VIEW v_leaderboard AS
WITH base AS (
  SELECT
    created_at,
    type,
    bug_id,
    severity,
    feature,
    reporter,
    solver,
    meta,
    CASE severity
      WHEN 'CRITICAL' THEN 50
      WHEN 'HIGH' THEN 25
      WHEN 'MEDIUM' THEN 10
      WHEN 'LOW' THEN 5
      ELSE 0
    END AS pts
  FROM bug_events
),
scored AS (
  SELECT
    created_at,
    COALESCE(solver, reporter) AS person,
    CASE
      WHEN type = 'bug_triaged' THEN 
        (0.4 * pts)
        + (CASE WHEN (meta->>'repro')::boolean THEN 5 ELSE 0 END)
        + (CASE WHEN (meta->>'logs')::boolean THEN 5 ELSE 0 END)
      WHEN type = 'bug_fixed' THEN 
        (1.0 * pts)
        + (CASE WHEN ((meta->>'tests')::boolean OR (meta->>'rca')::boolean) THEN 10 ELSE 0 END)
      WHEN type = 'bug_reopened' THEN (-0.5 * pts)
      ELSE 0
    END AS score_delta
  FROM base
)
SELECT
  person,
  SUM(score_delta) AS score_total,
  SUM(CASE WHEN score_delta > 0 THEN score_delta ELSE 0 END) AS score_positive,
  SUM(CASE WHEN score_delta < 0 THEN score_delta ELSE 0 END) AS score_negative,
  COUNT(CASE WHEN score_delta > 0 THEN 1 END) AS events_count
FROM scored
GROUP BY person;

-- Create view for feature heatmap
CREATE OR REPLACE VIEW v_feature_heatmap AS
SELECT
  feature,
  COUNT(*) FILTER (WHERE type = 'bug_opened') AS opened_count,
  COUNT(*) FILTER (WHERE type = 'bug_fixed') AS fixed_count,
  COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND type = 'bug_opened') AS critical_count,
  COUNT(*) FILTER (WHERE severity = 'HIGH' AND type = 'bug_opened') AS high_count
FROM bug_events
WHERE feature IS NOT NULL AND feature != ''
GROUP BY feature
ORDER BY opened_count DESC;

-- Create view for streaks
CREATE OR REPLACE VIEW v_streaks AS
WITH solver_events AS (
  SELECT
    solver,
    created_at,
    type,
    severity,
    ROW_NUMBER() OVER (PARTITION BY solver ORDER BY created_at) AS event_num
  FROM bug_events
  WHERE solver IS NOT NULL
    AND type IN ('bug_fixed', 'bug_reopened')
  ORDER BY solver, created_at
),
streak_groups AS (
  SELECT
    solver,
    created_at,
    type,
    severity,
    event_num,
    SUM(CASE WHEN type = 'bug_reopened' THEN 1 ELSE 0 END) 
      OVER (PARTITION BY solver ORDER BY created_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS reopen_count
  FROM solver_events
)
SELECT
  solver,
  COUNT(*) FILTER (WHERE type = 'bug_fixed' AND reopen_count = 0) AS current_streak,
  MAX(created_at) AS last_fix_at
FROM streak_groups
WHERE type = 'bug_fixed'
GROUP BY solver;

-- Add feature column to bugs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bugs' AND column_name = 'feature'
  ) THEN
    ALTER TABLE bugs ADD COLUMN feature TEXT;
  END IF;
END $$;

-- Enable Realtime for bug_events
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE bug_events;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'bug_events table may already be in supabase_realtime publication';
    END;
END $$;

