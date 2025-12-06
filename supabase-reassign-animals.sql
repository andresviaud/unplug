-- Reassign Animals to Ensure Each Habit Has a Unique Animal
-- Run this AFTER running supabase-add-more-animals.sql
-- This script reassigns animals to existing habits so each habit gets a different one

-- Step 1: Delete all existing user_animals (this will reset animal progress)
-- WARNING: This will reset all animal progress! Only run if you want to start fresh.
-- Uncomment the line below if you want to reset all animals:
-- DELETE FROM user_animals;

-- OR: Step 2 (Safer): Manually reassign animals for specific habits
-- This keeps progress but changes the animal
-- Example: Update a specific habit's animal
-- UPDATE user_animals 
-- SET animal_id = (SELECT id FROM animals WHERE name = 'Lion' LIMIT 1)
-- WHERE habit_id = 'YOUR_HABIT_ID_HERE';

-- Step 3: The application will automatically assign unique animals when:
-- - A new habit is created
-- - An animal is synced for a habit that doesn't have one yet
-- The new logic ensures each habit gets a different animal

-- Note: If you want to keep existing progress but change animals:
-- 1. Note down the current_node_index for each habit
-- 2. Delete the user_animal entry
-- 3. The app will recreate it with a new animal, but you'll need to manually set the progress

-- To check current animal assignments:
-- SELECT 
--   h.name as habit_name,
--   a.name as animal_name,
--   ua.current_node_index,
--   ua.habit_id
-- FROM user_animals ua
-- JOIN habits h ON ua.habit_id = h.id
-- JOIN animals a ON ua.animal_id = a.id
-- WHERE ua.user_id = auth.uid()
-- ORDER BY h.name;

