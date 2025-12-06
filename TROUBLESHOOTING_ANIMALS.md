# Troubleshooting: Animal Progress Not Syncing

## Problem: Animal shows 0 progress but habit streak is 1 (or higher)

### Possible Causes:

1. **Database Migration Not Run** (Most Common)
   - The `habit_id` column doesn't exist in the `user_animals` table
   - Solution: Run the migration SQL file in Supabase

2. **Animal Created Before Migration**
   - Existing animals don't have a `habit_id` set
   - Solution: Delete old animals or manually assign them

3. **Sync Function Not Running**
   - The animal sync might be failing silently
   - Solution: Check browser console for errors

## Quick Fix Steps:

### Step 1: Verify Migration Was Run

1. Go to Supabase Dashboard → SQL Editor
2. Run this query:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'user_animals' AND column_name = 'habit_id';
   ```
3. If it returns no rows, the migration hasn't been run!

### Step 2: Run the Migration

1. Open `supabase-migration-animals-per-habit.sql`
2. Copy and paste into Supabase SQL Editor
3. Click "Run"

### Step 3: Fix Existing Animals

If you have existing animals without `habit_id`, you can either:

**Option A: Delete and Recreate** (Recommended)
```sql
-- Delete all existing user_animals (they'll be recreated automatically)
DELETE FROM user_animals;
```

**Option B: Manually Assign** (If you want to keep progress)
```sql
-- This is complex - better to just delete and let them recreate
```

### Step 4: Force Sync for a Habit

After running the migration, you can force a sync by:
1. Logging the habit again (even if already logged today, undo and re-log)
2. Or refresh the page - the animal should sync automatically

### Step 5: Check Browser Console

Open browser DevTools (F12) → Console tab
- Look for errors mentioning "habit_id" or "column"
- Look for "ERROR: The database migration has not been run!" message

## Testing

After fixing:
1. Go to your dashboard
2. Log a habit (or undo and re-log if already logged)
3. Check the animal progress - it should match your streak
4. If still showing 0, check the browser console for errors

## Still Not Working?

If the issue persists:
1. Check that your habit actually has a streak (check the "Habit Streaks" section)
2. Verify the animal exists in the database:
   ```sql
   SELECT * FROM user_animals WHERE habit_id = 'YOUR_HABIT_ID';
   ```
3. Check the `current_node_index` value - it should match your streak

