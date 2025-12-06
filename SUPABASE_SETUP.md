# Supabase Setup Guide for Cambiora

Follow these steps to set up your Supabase database:

## Step 1: Run the Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your Cambiora project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `supabase-schema.sql` in this project
6. Copy the entire contents of that file
7. Paste it into the SQL Editor
8. Click **Run** (or press Cmd/Ctrl + Enter)
9. You should see "Success. No rows returned"

## Step 2: Seed the Animals Data

1. Still in the SQL Editor, click **New Query** again
2. Open the file `supabase-seed-animals.sql` in this project
3. Copy the entire contents
4. Paste it into the SQL Editor
5. Click **Run**
6. You should see "Success. 4 rows inserted" (or similar)

## Step 3: Verify Setup

1. In Supabase Dashboard, go to **Table Editor**
2. You should see these tables:
   - `animals` (should have 4 rows: Bird, Fox, Deer, Whale)
   - `habits`
   - `habit_logs`
   - `daily_entries`
   - `challenge_completions`
   - `user_stats`
   - `user_animals`

## Step 4: Test the App

1. Make sure your `.env.local` has your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Start your development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000
4. Click "Sign In" in the navigation
5. Create a new account
6. You should be able to log in!

## Troubleshooting

- **"relation does not exist"**: Make sure you ran `supabase-schema.sql` first
- **"permission denied"**: Check that Row Level Security (RLS) policies were created
- **Can't sign up**: Check your Supabase project settings - email confirmation might be enabled. You can disable it in Authentication > Settings

## Next Steps

Once this is working, we'll build:
1. User habits setup
2. Daily check-in
3. AI daily prompts
4. Daily challenges
5. Animal drawing system
6. Trophy room

