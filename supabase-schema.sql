-- Cambiora Database Schema
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HABITS TABLE
-- Stores user habits (e.g., "Exercise", "Quit Alcohol", etc.)
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  xp_per_day INTEGER NOT NULL DEFAULT 20,
  start_date DATE NOT NULL,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HABIT_LOGS TABLE
-- Tracks when users log their habits (once per day)
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, habit_id, date) -- Prevent duplicate logs on same day
);

-- 3. DAILY_ENTRIES TABLE
-- Stores daily check-ins (mood, journal, challenge completion)
CREATE TABLE IF NOT EXISTS daily_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5), -- 1=Very Low, 5=Very Good
  journal_text TEXT,
  is_completed BOOLEAN DEFAULT false, -- Has user completed today's challenge?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date) -- One entry per user per day
);

-- 4. CHALLENGE_COMPLETIONS TABLE
-- Tracks when users complete daily challenges
CREATE TABLE IF NOT EXISTS challenge_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL, -- Reference to challenge (e.g., "1", "2", etc.)
  date DATE NOT NULL,
  xp INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id, date) -- Prevent duplicate completions
);

-- 5. USER_STATS TABLE
-- Stores aggregated user statistics (XP, streak)
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ANIMALS TABLE
-- Static list of animals that users can unlock
CREATE TABLE IF NOT EXISTS animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  total_nodes INTEGER NOT NULL,
  nodes JSONB NOT NULL, -- Array of {x, y} coordinates (0-100 normalized space)
  order_index INTEGER NOT NULL UNIQUE, -- Sequence order (1, 2, 3, ...)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. USER_ANIMALS TABLE
-- Tracks user progress on animals
CREATE TABLE IF NOT EXISTS user_animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  current_node_index INTEGER DEFAULT 0, -- How many nodes filled (0 to total_nodes)
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, animal_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_id ON daily_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_user_id ON challenge_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_date ON challenge_completions(date);
CREATE INDEX IF NOT EXISTS idx_user_animals_user_id ON user_animals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_animals_animal_id ON user_animals(animal_id);

-- Enable Row Level Security (RLS) - Users can only see/edit their own data
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_animals ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- Habits policies
CREATE POLICY "Users can view their own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- Habit logs policies
CREATE POLICY "Users can view their own habit logs" ON habit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit logs" ON habit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit logs" ON habit_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Daily entries policies
CREATE POLICY "Users can view their own daily entries" ON daily_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily entries" ON daily_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily entries" ON daily_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Challenge completions policies
CREATE POLICY "Users can view their own challenge completions" ON challenge_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge completions" ON challenge_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenge completions" ON challenge_completions
  FOR DELETE USING (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Animals policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view animals" ON animals
  FOR SELECT USING (auth.role() = 'authenticated');

-- User animals policies
CREATE POLICY "Users can view their own user animals" ON user_animals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own user animals" ON user_animals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own user animals" ON user_animals
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create user_stats when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user_stats on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


