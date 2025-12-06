-- Community Support Feature Migration (FIXED VERSION)
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This adds community features: public habits and cheers

-- ============================================
-- STEP 1: Ensure UUID extension is enabled
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 2: Add is_public column to habits table
-- ============================================
-- This allows users to make their habits visible to the community

-- Check if column exists first, then add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'habits' 
        AND column_name = 'is_public'
    ) THEN
        ALTER TABLE habits ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Set all existing habits to private by default (for privacy)
UPDATE habits SET is_public = false WHERE is_public IS NULL;

-- ============================================
-- STEP 3: Create cheers table
-- ============================================
-- This stores when users "cheer" (support) other users' public habits

CREATE TABLE IF NOT EXISTS cheers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Prevent duplicate cheers (one user can cheer another user's habit once)
  UNIQUE(from_user_id, habit_id)
);

-- Create indexes for better query performance (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cheers_from_user_id') THEN
        CREATE INDEX idx_cheers_from_user_id ON cheers(from_user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cheers_to_user_id') THEN
        CREATE INDEX idx_cheers_to_user_id ON cheers(to_user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cheers_habit_id') THEN
        CREATE INDEX idx_cheers_habit_id ON cheers(habit_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_habits_is_public') THEN
        CREATE INDEX idx_habits_is_public ON habits(is_public);
    END IF;
END $$;

-- ============================================
-- STEP 4: Update Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on cheers table
ALTER TABLE cheers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all cheers" ON cheers;
DROP POLICY IF EXISTS "Users can create cheers" ON cheers;
DROP POLICY IF EXISTS "Users can delete their own cheers" ON cheers;
DROP POLICY IF EXISTS "Authenticated users can view public habits" ON habits;

-- Cheers policies:
-- 1. Users can view all cheers (to see who cheered what)
CREATE POLICY "Users can view all cheers" ON cheers
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Users can create cheers (but not for themselves - enforced in application code)
CREATE POLICY "Users can create cheers" ON cheers
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- 3. Users can delete their own cheers (to "un-cheer")
CREATE POLICY "Users can delete their own cheers" ON cheers
  FOR DELETE USING (auth.uid() = from_user_id);

-- Habits policies:
-- Allow authenticated users to view public habits
-- Note: This works alongside existing policies (users can still see their own habits)
CREATE POLICY "Authenticated users can view public habits" ON habits
  FOR SELECT USING (
    auth.role() = 'authenticated' AND is_public = true
  );

-- ============================================
-- VERIFICATION (run these separately to check)
-- ============================================

-- Check if is_public column exists:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'habits' AND column_name = 'is_public';

-- Check if cheers table exists:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'cheers';

-- Check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename IN ('habits', 'cheers');

