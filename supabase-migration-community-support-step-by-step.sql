-- Community Support Feature Migration (STEP-BY-STEP VERSION)
-- Run each section separately if the full migration fails
-- Copy and paste each section one at a time into Supabase SQL Editor

-- ============================================
-- SECTION 1: Enable UUID extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SECTION 2: Add is_public column
-- ============================================
-- Run this section first
ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Update existing habits to be private
UPDATE habits SET is_public = false WHERE is_public IS NULL;

-- ============================================
-- SECTION 3: Create cheers table
-- ============================================
-- Run this section second
CREATE TABLE IF NOT EXISTS cheers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, habit_id)
);

-- ============================================
-- SECTION 4: Create indexes
-- ============================================
-- Run this section third
CREATE INDEX IF NOT EXISTS idx_cheers_from_user_id ON cheers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_cheers_to_user_id ON cheers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_cheers_habit_id ON cheers(habit_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_public ON habits(is_public);

-- ============================================
-- SECTION 5: Enable RLS and create policies
-- ============================================
-- Run this section fourth
ALTER TABLE cheers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all cheers" ON cheers;
DROP POLICY IF EXISTS "Users can create cheers" ON cheers;
DROP POLICY IF EXISTS "Users can delete their own cheers" ON cheers;
DROP POLICY IF EXISTS "Authenticated users can view public habits" ON habits;

-- Create policies
CREATE POLICY "Users can view all cheers" ON cheers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create cheers" ON cheers
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete their own cheers" ON cheers
  FOR DELETE USING (auth.uid() = from_user_id);

CREATE POLICY "Authenticated users can view public habits" ON habits
  FOR SELECT USING (
    auth.role() = 'authenticated' AND is_public = true
  );

