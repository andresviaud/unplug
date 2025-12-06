# Community Feature Troubleshooting Guide

## Issue: Can't See Community Link/Page on Vercel

### Quick Checks:

1. **Are you signed in?**
   - The Community link only appears when you're logged in
   - If you're not signed in, you won't see it in the navigation
   - Try signing in first

2. **Direct URL Access:**
   - Try going directly to: `https://your-vercel-url.vercel.app/community`
   - Even if not signed in, you should see a "Please sign in" message
   - If you see a 404, the page wasn't deployed correctly

3. **Check Vercel Deployment:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Check if the latest deployment succeeded
   - Look for any build errors in the logs

### Common Issues & Solutions:

#### Issue 1: Community Link Not Visible
**Cause:** You're not signed in
**Solution:** Sign in to your account - the link will appear in navigation

#### Issue 2: 404 Error on /community
**Cause:** Page wasn't deployed or build failed
**Solution:** 
1. Check Vercel deployment logs
2. Make sure `app/community/page.tsx` exists
3. Redeploy if needed

#### Issue 3: Page Loads But Shows Error
**Cause:** Database migration not run or RLS policy issue
**Solution:**
1. Make sure you ran `supabase-migration-community-support-fixed.sql` in Supabase
2. Check browser console (F12) for errors
3. Verify the `cheers` table exists in Supabase

#### Issue 4: "No Public Habits Yet" Message
**Cause:** No habits are marked as public
**Solution:**
1. Go to Habits page
2. Create a habit and check "Make this habit public"
3. OR click the 🌍 button on an existing habit to make it public
4. Refresh the Community page

### Step-by-Step Debugging:

1. **Check if page exists:**
   ```
   Visit: https://your-app.vercel.app/community
   ```
   - If 404: Page not deployed
   - If "Please sign in": Page works, just need to sign in
   - If error: Check browser console

2. **Check browser console:**
   - Press F12 → Console tab
   - Look for red errors
   - Common errors:
     - "Cannot read property 'is_public'" → Migration not run
     - "Table 'cheers' does not exist" → Migration not run
     - Network errors → Supabase connection issue

3. **Check Supabase:**
   - Go to Supabase Dashboard → Table Editor
   - Verify `habits` table has `is_public` column
   - Verify `cheers` table exists
   - Check RLS policies are enabled

4. **Check Vercel Logs:**
   - Vercel Dashboard → Your Project → Functions → Logs
   - Look for runtime errors
   - Check build logs for compilation errors

### Testing Checklist:

- [ ] Signed in to the app
- [ ] Community link appears in navigation
- [ ] Can access `/community` URL directly
- [ ] Database migration ran successfully
- [ ] At least one habit is marked as public
- [ ] No errors in browser console
- [ ] Vercel deployment succeeded

### Quick Test:

1. Sign in to your app
2. Go to Habits page
3. Create a new habit → Check "Make this habit public"
4. Click "Community" in navigation
5. You should see your public habit in the feed

If it still doesn't work, check the browser console (F12) and share the error message!

