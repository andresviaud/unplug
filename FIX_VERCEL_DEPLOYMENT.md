# Fix Vercel Deployment Issues

## Problem 1: Bird Shows 2/14 Instead of Matching Streak

### Cause
The database on your production Supabase has stale data. The animal was created with 2 nodes, but your streak is 1 (or 0).

### Solution

**Option A: Fix via Supabase Dashboard (Recommended)**

1. Go to Supabase Dashboard → Table Editor → `user_animals`
2. Find the row for your habit (where `habit_id` matches your alcohol habit ID)
3. Change `current_node_index` from `2` to match your streak:
   - If streak is 0 → set to `0`
   - If streak is 1 → set to `1`
4. Click Save

**Option B: Fix via SQL (Faster if you have multiple habits)**

1. Go to Supabase Dashboard → SQL Editor
2. Run this query to see current values:
   ```sql
   SELECT 
     ua.id,
     ua.habit_id,
     h.name as habit_name,
     ua.current_node_index,
     (SELECT COUNT(*) FROM habit_logs WHERE habit_id = h.id AND user_id = ua.user_id) as log_count
   FROM user_animals ua
   JOIN habits h ON h.id = ua.habit_id
   WHERE ua.user_id = auth.uid();
   ```

3. Then fix each one manually, or use this to reset all to 0:
   ```sql
   UPDATE user_animals
   SET current_node_index = 0
   WHERE user_id = auth.uid();
   ```

4. After resetting, refresh your Vercel app - the sync function will automatically set them to the correct values based on your streaks.

## Problem 2: Dashboard Design Looks Horrible on Vercel

### Cause
Vercel is serving a cached/old version of your code.

### Solution

**Step 1: Trigger a New Deployment**

1. Go to Vercel Dashboard → Your Project
2. Go to "Deployments" tab
3. Click the "..." menu on the latest deployment
4. Click "Redeploy"
5. Or make a small change and push to GitHub (Vercel auto-deploys)

**Step 2: Clear Vercel Build Cache (If Still Not Working)**

1. Go to Vercel Dashboard → Your Project → Settings
2. Go to "General" → Scroll down
3. Click "Clear Build Cache"
4. Then trigger a new deployment

**Step 3: Verify Environment Variables**

Make sure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (optional)

## Problem 3: Code Changes Not Reflecting

### Quick Fix: Force Redeploy

1. Make a tiny change to any file (add a space, comment, etc.)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Force redeploy"
   git push origin main
   ```
3. Vercel will automatically redeploy

## Verification Steps

After fixing:

1. **Check Animal Progress:**
   - Go to your Vercel app
   - Check the bird progress
   - It should match your habit streak exactly

2. **Check Dashboard Design:**
   - The habit streaks card should look clean
   - Daily challenges should be in a nice grid
   - Everything should match your local version

3. **Check Browser Console:**
   - Open DevTools (F12) → Console
   - Look for: `Animal progress synced: streak=X, nodes=X`
   - If you see mismatches, the sync is working to fix them

## If Still Not Working

1. **Hard Refresh Browser:**
   - Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - This clears browser cache

2. **Check Vercel Build Logs:**
   - Go to Vercel → Deployments → Click on deployment → View build logs
   - Look for errors or warnings

3. **Verify Database Migration:**
   - Make sure `supabase-migration-animals-per-habit.sql` was run in your production Supabase
   - The `user_animals` table needs the `habit_id` column

