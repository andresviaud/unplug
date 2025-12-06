-- Migration: Add habit_id to user_animals table
-- This allows each habit to have its own animal progress

-- Step 1: Add habit_id column (nullable initially for migration)
ALTER TABLE user_animals 
ADD COLUMN IF NOT EXISTS habit_id UUID REFERENCES habits(id) ON DELETE CASCADE;

-- Step 2: Create index for habit_id
CREATE INDEX IF NOT EXISTS idx_user_animals_habit_id ON user_animals(habit_id);

-- Step 3: Remove old unique constraint
ALTER TABLE user_animals 
DROP CONSTRAINT IF EXISTS user_animals_user_id_animal_id_key;

-- Step 4: Add new unique constraint (one animal per habit per user)
ALTER TABLE user_animals 
ADD CONSTRAINT user_animals_user_habit_unique UNIQUE(user_id, habit_id);

-- Step 5: For existing data, we'll need to handle migration
-- Note: This migration assumes existing user_animals will need to be manually migrated
-- or deleted, as we can't automatically assign them to habits

