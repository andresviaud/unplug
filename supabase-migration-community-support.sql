-- Community Support Feature Migration
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This adds community features: public habits and cheers

-- ============================================
-- STEP 1: Add is_public column to habits table
-- ============================================
-- This allows users to make their habits visible to the community

ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Set all existing habits to private by default (for privacy)
UPDATE habits SET is_public = false WHERE is_public IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN habits.is_public IS 'If true, this habit is visible in the community feed';

-- ============================================
-- STEP 2: Create cheers table
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cheers_from_user_id ON cheers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_cheers_to_user_id ON cheers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_cheers_habit_id ON cheers(habit_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_public ON habits(is_public);

-- ============================================
-- STEP 3: Update Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on cheers table
ALTER TABLE cheers ENABLE ROW LEVEL SECURITY;

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

-- Habits policies (update existing):
-- Allow authenticated users to view public habits
-- Note: We keep the existing policy for users to see their own habits
-- And add a new policy for public habits

CREATE POLICY "Authenticated users can view public habits" ON habits
  FOR SELECT USING (
    auth.role() = 'authenticated' AND is_public = true
  );

-- ============================================
-- STEP 4: Helper function to get user display name
-- ============================================
-- This function helps display user info in the community feed
-- For now, we'll use a simple approach with auth.users metadata

-- Note: We'll handle user display names in the application code
-- This migration is complete!

-- ============================================
-- VERIFICATION QUERIES (optional - run these to test)
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

