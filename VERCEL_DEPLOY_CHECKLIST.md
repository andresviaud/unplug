# Vercel Deployment Checklist - Community Feature

## Issue: Community feature works locally but not on Vercel

### Step 1: Check Vercel Deployment Status

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Find your Cambiora project
   - Click on it

2. **Check Latest Deployment:**
   - Look at the "Deployments" tab
   - Find the most recent deployment
   - Check its status:
     - ✅ **Ready** = Deployed successfully
     - ⏳ **Building...** = Still deploying (wait 2-3 minutes)
     - ❌ **Error** = Build failed (check logs)

3. **Check Deployment Commit:**
   - Click on the latest deployment
   - Check "Commit" - it should show: `0b4ff9d` or later
   - If it shows an older commit, Vercel hasn't picked up the latest changes

### Step 2: Force a New Deployment

If Vercel hasn't deployed the latest code:

**Option A: Trigger via Vercel Dashboard**
1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" tab
3. Click the "..." menu on the latest deployment
4. Click "Redeploy"
5. Wait 2-3 minutes

**Option B: Push an Empty Commit (triggers deployment)**
```bash
cd "/Users/andresjoseviaud/App development/Cambiora"
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin main
```

### Step 3: Check Build Logs

If deployment shows "Error":

1. Click on the failed deployment
2. Click "Build Logs" or "Functions" tab
3. Look for errors like:
   - "Module not found"
   - "TypeScript errors"
   - "Build timeout"
   - "Environment variables missing"

### Step 4: Verify Files Are Deployed

After deployment succeeds, check:

1. **Visit your Vercel URL:**
   - Go to: `https://your-app.vercel.app/community`
   - Should NOT show 404
   - Should show "Please sign in" or the community feed

2. **Check Navigation:**
   - Sign in to your Vercel app
   - Look for "Community" link in navigation
   - If missing, check browser console (F12)

### Step 5: Clear Browser Cache

Sometimes Vercel serves cached versions:

1. **Hard Refresh:**
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`

2. **Or Clear Cache:**
   - Open DevTools (F12)
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

### Step 6: Check Environment Variables

Make sure Supabase environment variables are set in Vercel:

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Should have:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. If missing, add them and redeploy

### Common Issues & Solutions

#### Issue: "404 Not Found" on /community
**Cause:** Page not deployed or build failed
**Solution:** Check deployment logs, redeploy if needed

#### Issue: Community link missing in navigation
**Cause:** Old cached version or not signed in
**Solution:** Hard refresh, make sure you're signed in

#### Issue: "Cannot read property 'is_public'"
**Cause:** Database migration not run in Supabase
**Solution:** Run `supabase-migration-community-support-fixed.sql` in Supabase

#### Issue: Build succeeds but page doesn't work
**Cause:** Runtime error or missing environment variables
**Solution:** Check browser console (F12) for errors

### Quick Test After Deployment

1. ✅ Visit: `https://your-app.vercel.app/community`
2. ✅ Sign in to your app
3. ✅ Check navigation for "Community" link
4. ✅ Create a public habit
5. ✅ Go to Community page - should see your habit

### Still Not Working?

1. **Check Browser Console:**
   - Press F12 → Console tab
   - Look for red errors
   - Share the error message

2. **Check Vercel Logs:**
   - Vercel Dashboard → Your Project → Functions → Logs
   - Look for runtime errors

3. **Verify Database:**
   - Make sure migration ran in Supabase
   - Check that `is_public` column exists
   - Check that `cheers` table exists

