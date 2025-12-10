-- BugHunt Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/owkiedqwocevobswbfge/sql)

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bugs table
CREATE TABLE IF NOT EXISTS bugs (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL CHECK (status IN ('NEW', 'IN_PROGRESS', 'RESOLVED')),
  reporter_name TEXT NOT NULL,
  solver_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "public_read_sessions" ON sessions;
DROP POLICY IF EXISTS "public_insert_sessions" ON sessions;
DROP POLICY IF EXISTS "public_update_sessions" ON sessions;
DROP POLICY IF EXISTS "public_read_bugs" ON bugs;
DROP POLICY IF EXISTS "public_insert_bugs" ON bugs;
DROP POLICY IF EXISTS "public_update_bugs" ON bugs;
DROP POLICY IF EXISTS "public_delete_bugs" ON bugs;

-- Create policies for public access (since this is a shared bug hunt tool)
-- Sessions: anyone can read and insert
CREATE POLICY "public_read_sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "public_insert_sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_sessions" ON sessions FOR UPDATE USING (true) WITH CHECK (true);

-- Bugs: anyone can read, insert, update, and delete (for admin reset)
CREATE POLICY "public_read_bugs" ON bugs FOR SELECT USING (true);
CREATE POLICY "public_insert_bugs" ON bugs FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_bugs" ON bugs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_bugs" ON bugs FOR DELETE USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bugs_session_id ON bugs(session_id);
CREATE INDEX IF NOT EXISTS idx_bugs_created_at ON bugs(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at on bugs
DROP TRIGGER IF EXISTS update_bugs_updated_at ON bugs;
CREATE TRIGGER update_bugs_updated_at
    BEFORE UPDATE ON bugs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for bugs table (for live updates)
-- Note: This may fail if the table is already in the publication, which is fine
DO $$
BEGIN
    -- Try to add bugs table to realtime publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE bugs;
    EXCEPTION WHEN OTHERS THEN
        -- Table might already be in publication, which is fine
        RAISE NOTICE 'bugs table may already be in supabase_realtime publication';
    END;
    
    -- Also add sessions table for completeness
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'sessions table may already be in supabase_realtime publication';
    END;
END $$;

