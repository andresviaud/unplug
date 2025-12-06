# VERCEL DEPLOYMENT FIX - Step by Step

## The Problem
Vercel is deploying commit `70b349b` (old) instead of `cd615bb` (latest with community feature).

## Root Cause
Vercel might be:
1. Connected to wrong GitHub repository
2. Watching wrong branch
3. Not receiving webhook notifications from GitHub

## SOLUTION: Manual Fix in Vercel Dashboard

### Step 1: Check Vercel Git Connection
1. Go to: https://vercel.com/dashboard
2. Click on your **Cambiora** project
3. Go to **Settings** → **Git**
4. Check:
   - **Repository**: Should be `andresviaud/cambiora` OR `andresviaud/unplug`
   - **Production Branch**: Should be `main` (NOT `master`)
   - **Root Directory**: Should be empty or `/` (NOT `/Cambiora`)

### Step 2: Disconnect and Reconnect (if needed)
If the repository looks wrong:
1. Click **Disconnect** (at bottom of Git settings)
2. Click **Connect Git Repository**
3. Select the correct repository
4. Make sure **Production Branch** is `main`
5. Click **Deploy**

### Step 3: Manual Deploy from Latest Commit
1. Go to **Deployments** tab
2. Click **Create Deployment** (top right)
3. Select:
   - **Branch**: `main`
   - **Commit**: `cd615bb` or latest
   - **Framework Preset**: Next.js
4. Click **Deploy**
5. Wait 2-3 minutes

### Step 4: Verify Deployment
Once deployment is "Ready":
1. Click on the deployment
2. Check **Commit** - should show `cd615bb` or `8340c58`
3. If it shows `70b349b`, the deployment failed

### Step 5: Check Build Logs
If deployment fails:
1. Click on the failed deployment
2. Click **Build Logs**
3. Look for errors like:
   - "File not found"
   - "Module not found"
   - "TypeScript errors"

## Alternative: Check GitHub Repository

Your local repo pushes to: `github.com/andresviaud/unplug.git`
But GitHub says it moved to: `github.com/andresviaud/cambiora.git`

**This might be the issue!** Vercel might be connected to the old repo name.

### Fix GitHub Remote (if needed):
```bash
cd "/Users/andresjoseviaud/App development/Cambiora"
git remote set-url origin https://github.com/andresviaud/cambiora.git
git push origin main
```

Then reconnect Vercel to the correct repo.

## Quick Test After Fix

1. Visit: `https://your-vercel-url.vercel.app/community`
2. Should NOT show 404
3. Should show "Please sign in" or community feed
4. Sign in and check navigation for "Community" link

## Still Not Working?

1. **Check Vercel Logs:**
   - Vercel Dashboard → Your Project → Functions → Logs
   - Look for runtime errors

2. **Check Browser Console:**
   - Press F12 → Console tab
   - Look for red errors

3. **Verify Database:**
   - Make sure you ran the migration in Supabase
   - Check that `is_public` column exists

