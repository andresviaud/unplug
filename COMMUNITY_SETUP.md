# Community Support Feature - Setup Guide

## 🎯 What We Built

A lightweight community support system where users can:
- Make their habits **public** (visible to community) or **private** (only visible to them)
- View other users' public habits in a community feed
- "Cheer" (support) other users' public habits
- See how many cheers each habit has received

## 📋 Step-by-Step Setup Instructions

### Step 1: Run the Database Migration

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open the file: `supabase-migration-community-support.sql`
5. Copy the entire contents of that file
6. Paste it into the SQL Editor
7. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

**What this does:**
- Adds `is_public` column to `habits` table (defaults to `false` = private)
- Creates `cheers` table to store support interactions
- Sets up Row Level Security (RLS) policies so users can see public habits
- Creates indexes for better performance

### Step 2: Verify the Migration

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check if is_public column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'habits' AND column_name = 'is_public';

-- Check if cheers table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'cheers';
```

You should see:
- `is_public` column with type `boolean` and default `false`
- `cheers` table in the list

### Step 3: Test the Application

1. **Start your development server:**
   ```bash
   cd "/Users/andresjoseviaud/App development/Cambiora"
   npm run dev
   ```

2. **Open your app:**
   - Go to `http://localhost:3000`
   - Sign in (or create an account)

3. **Create a public habit:**
   - Go to **Habits** page
   - Click **+ Create New Habit**
   - Fill in the form
   - **Check the box**: "Make this habit public"
   - Click **Create Habit**

4. **View the community feed:**
   - Click **Community** in the navigation
   - You should see your public habit (if you're signed in as a different user, or after refreshing)
   - Try clicking **👏 Cheer Them On!** on someone's habit

5. **Toggle visibility:**
   - Go back to **Habits** page
   - Find your habit card
   - Click the **🌍** or **🔒** button to toggle between public/private
   - The badge will update immediately

## 🎨 Features Overview

### 1. Habit Visibility Toggle

**When creating a habit:**
- Checkbox: "Make this habit public"
- Default: **Private** (unchecked)
- When checked: Habit appears in community feed

**On existing habits:**
- **🌍** button = Make public
- **🔒** button = Make private
- Badge shows current status: "🌍 Public" or "🔒 Private"

### 2. Community Feed (`/community`)

**What you see:**
- List of all public habits from other users
- User display name (anonymous: "User [first 4 chars of ID]")
- Habit name and description
- Current streak (🔥 X days)
- XP per day
- Cheer count (👏 X)
- **Cheer** button (or **Un-cheer** if you already cheered)

**Privacy:**
- Only shows habits where `is_public = true`
- Never shows your own habits
- Only shows active habits

### 3. Cheer System

**How it works:**
- Click **👏 Cheer Them On!** to support someone
- Each user can cheer a habit **once**
- Cheer count updates immediately
- You can **Un-cheer** to remove your support

**Database:**
- Stored in `cheers` table
- Prevents duplicate cheers (one per user per habit)
- Prevents self-cheering (enforced in code)

## 🔒 Privacy & Security

### Row Level Security (RLS) Policies

**Habits:**
- Users can see their own habits (existing policy)
- Authenticated users can see public habits (new policy)
- Users can only update/delete their own habits

**Cheers:**
- Anyone can view all cheers (to see counts)
- Users can only create their own cheers
- Users can only delete their own cheers

### Privacy Rules (Enforced in Code)

1. ✅ Private habits never appear in community feed
2. ✅ Users cannot cheer their own habits
3. ✅ Users cannot see other users' private habits
4. ✅ Cheer counts are visible to everyone (for transparency)

## 📁 Files Changed

### New Files:
- `supabase-migration-community-support.sql` - Database migration
- `app/community/page.tsx` - Community feed page
- `COMMUNITY_SETUP.md` - This guide

### Modified Files:
- `lib/storage-supabase.ts` - Added:
  - `is_public` to `Habit` interface
  - `toggleHabitVisibility()` function
  - `getPublicHabits()` function
  - `cheerHabit()` function
  - `uncheerHabit()` function
  - `PublicHabit` interface

- `app/habits/page.tsx` - Added:
  - Visibility checkbox in create form
  - `newHabitIsPublic` state

- `app/habits/HabitCardSimple.tsx` - Added:
  - Visibility toggle button (🌍/🔒)
  - Public/Private badge
  - `handleToggleVisibility()` function

- `components/Navigation.tsx` - Added:
  - "Community" link to navigation

## 🐛 Troubleshooting

### Issue: "Column is_public does not exist"
**Solution:** Run the migration SQL in Supabase SQL Editor

### Issue: "Cannot read property 'is_public'"
**Solution:** Make sure you've run the migration and restarted your dev server

### Issue: "No public habits showing"
**Solution:** 
1. Make sure at least one habit has `is_public = true`
2. Check that you're signed in as a different user (or create a test account)
3. Verify RLS policies are set correctly

### Issue: "Cannot cheer habit"
**Solution:**
1. Make sure the habit is public
2. Make sure you're not trying to cheer your own habit
3. Check browser console for errors

## 🚀 Next Steps (Optional Enhancements)

1. **User Profiles:**
   - Create `user_profiles` table with usernames
   - Replace anonymous display names

2. **Notifications:**
   - Notify users when someone cheers their habit
   - Add notification settings

3. **Comments:**
   - Allow users to leave supportive messages
   - Create `comments` table

4. **Filtering:**
   - Filter by habit type
   - Sort by streak, cheers, or date

5. **Leaderboards:**
   - Top streaks
   - Most cheered habits

## ✅ Testing Checklist

- [ ] Migration runs successfully
- [ ] Can create a public habit
- [ ] Can create a private habit
- [ ] Public habit appears in community feed
- [ ] Private habit does NOT appear in community feed
- [ ] Can toggle visibility on existing habit
- [ ] Can cheer someone else's habit
- [ ] Cannot cheer own habit
- [ ] Cheer count updates correctly
- [ ] Can un-cheer a habit
- [ ] Navigation shows "Community" link
- [ ] Community page loads without errors

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs (Dashboard > Logs)
3. Verify all migrations have been run
4. Make sure you're signed in

---

**Congratulations!** 🎉 Your community support feature is now live!

