# Animal Per Habit Setup

## What Changed

The animal system has been updated so that:
- **Each habit now has its own animal** (instead of one shared animal)
- **Animal progress = habit streak** (instead of challenge completions)
- The dashboard shows one animal visualization per habit

## Database Migration Required

You need to run a SQL migration in Supabase to add the `habit_id` column to the `user_animals` table.

### Steps:

1. **Go to Supabase Dashboard**:
   - Visit https://supabase.com/dashboard
   - Select your project
   - Go to "SQL Editor"

2. **Run the Migration**:
   - Open the file `supabase-migration-animals-per-habit.sql`
   - Copy and paste the SQL into the Supabase SQL Editor
   - Click "Run"

3. **What the Migration Does**:
   - Adds `habit_id` column to `user_animals` table
   - Creates an index for better performance
   - Updates the unique constraint to allow one animal per habit per user
   - Removes the old constraint

### Important Notes:

- **Existing Data**: If you have existing `user_animals` records, they will have `habit_id = NULL`. You may want to delete them or manually assign them to habits.
- **New Habits**: When you create a new habit, an animal will be automatically initialized for it.
- **Habit Deletion**: When you delete a habit, its associated animals are also deleted.

## How It Works Now

1. **When you log a habit**:
   - The habit streak is calculated
   - The animal progress for that habit is synced to match the streak
   - Each node filled = 1 day of streak

2. **When you undo a habit log**:
   - The habit streak decreases
   - The animal progress for that habit is synced to match the new streak

3. **Animal Completion**:
   - When a habit's streak reaches the total nodes for an animal, that animal is marked as complete
   - A new animal automatically starts for that habit (the next animal in sequence)

4. **Dashboard Display**:
   - The dashboard now shows a grid of animals, one for each active habit
   - Each animal card shows the habit name, animal name, and progress

## Testing

After running the migration:

1. Create a new habit (or use an existing one)
2. Log the habit for a few days
3. Check the dashboard - you should see an animal for that habit
4. The animal nodes should fill up as your streak increases
5. Try undoing a habit log - the animal progress should decrease

## Troubleshooting

**If animals don't show up:**
- Make sure you ran the migration SQL
- Check that your habits have `is_active = true`
- Try creating a new habit to see if an animal initializes

**If animal progress doesn't update:**
- Check the browser console for errors
- Make sure you're logged in
- Try refreshing the page


