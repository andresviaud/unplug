# Vercel Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Build Errors

**Check the build logs in Vercel:**
- Go to your Vercel project → Deployments → Click on the failed deployment → View build logs

**Common build errors:**
- TypeScript errors
- Missing dependencies
- Import errors
- Environment variable issues

### 2. Missing Environment Variables

**Required Environment Variables in Vercel:**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key (optional - only if you have one)
```

**Important:**
- Make sure these are set for **Production**, **Preview**, and **Development** environments
- Don't include quotes around the values
- Get these values from your `.env.local` file (but don't commit that file!)

### 3. Database Migration Not Run

**If you see errors about `habit_id` column:**
- The database migration needs to be run in Supabase
- Go to Supabase Dashboard → SQL Editor
- Run `supabase-migration-animals-per-habit.sql`

### 4. TypeScript/Compilation Errors

**Check for:**
- Type errors in the build logs
- Missing type definitions
- Import path issues

**Fix:**
- Run `npm run build` locally to see errors
- Fix any TypeScript errors
- Push fixes to GitHub

### 5. API Route Errors

**Common issues:**
- Edge Runtime errors (if using Node.js APIs in Edge)
- Missing environment variables in API routes
- CORS issues

### 6. Build Timeout

**If build takes too long:**
- Check for infinite loops in code
- Optimize imports
- Check for large dependencies

## Step-by-Step Debugging

### Step 1: Check Build Logs
1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Click on the failed deployment
5. Check the "Build Logs" section
6. Look for error messages (usually in red)

### Step 2: Test Build Locally
```bash
cd "/Users/andresjoseviaud/App development/Cambiora"
npm run build
```

If this fails locally, fix the errors before deploying.

### Step 3: Verify Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Make sure all required variables are set
3. Check that values are correct (no extra spaces, quotes, etc.)

### Step 4: Check Supabase Settings
1. Go to Supabase Dashboard
2. Make sure your database migrations are run
3. Check that RLS policies are set correctly
4. Verify your project URL and anon key match what's in Vercel

### Step 5: Check Vercel Project Settings
1. Framework Preset: Should be "Next.js"
2. Root Directory: Should be `./` (or leave empty)
3. Build Command: Should be `npm run build` (auto-detected)
4. Output Directory: Should be `.next` (auto-detected)
5. Install Command: Should be `npm install` (auto-detected)

## Quick Fixes

### If build fails with "Module not found":
```bash
# Make sure all dependencies are in package.json
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### If build fails with environment variable errors:
- Add missing variables in Vercel Dashboard
- Redeploy

### If build succeeds but app doesn't work:
- Check browser console for errors
- Verify Supabase connection
- Check that migrations are run
- Verify environment variables are correct

## Getting Help

**Share these details:**
1. The exact error message from Vercel build logs
2. Screenshot of the error
3. Whether `npm run build` works locally
4. What environment variables you've set in Vercel

