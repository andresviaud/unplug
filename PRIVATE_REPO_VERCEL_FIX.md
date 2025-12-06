# Fix Vercel Deployment for Private Repository

## The Issue
If your GitHub repository is **private**, Vercel needs proper permissions to access it. If permissions are missing or expired, Vercel can't see your latest commits.

## Solution: Reconnect Vercel to Private Repository

### Step 1: Check Vercel GitHub Integration
1. Go to: https://vercel.com/dashboard
2. Click your **profile/account** (top right)
3. Go to **Settings** → **Git** (or **Integrations**)
4. Look for **GitHub** integration
5. Check if it shows your repository

### Step 2: Re-authorize Vercel Access
1. In Vercel Settings → Git/Integrations
2. Find **GitHub** integration
3. Click **Configure** or **Reconnect**
4. You'll be redirected to GitHub
5. **Authorize** Vercel to access your repositories
6. Make sure to grant access to **private repositories**
7. Select the specific repository: `andresviaud/cambiora` or `andresviaud/unplug`

### Step 3: Reconnect Project to Repository
1. Go back to your **Cambiora project** in Vercel
2. Go to **Settings** → **Git**
3. Click **Disconnect** (if connected to wrong repo)
4. Click **Connect Git Repository**
5. Select your repository
6. Make sure **Production Branch** is `main`
7. Click **Deploy**

### Step 4: Grant Repository Access (if needed)
If Vercel can't see your private repo:

1. Go to GitHub: https://github.com/settings/installations
2. Find **Vercel** in the list
3. Click **Configure**
4. Under **Repository access**:
   - Select **Only select repositories**
   - Make sure your `cambiora` or `unplug` repo is selected
   - OR select **All repositories**
5. Click **Save**

### Step 5: Manual Deployment (Bypass Webhook)
Even with proper permissions, sometimes webhooks don't fire. Use manual deploy:

1. Vercel Dashboard → Your Project → **Deployments**
2. Click **Create Deployment** (top right)
3. Select:
   - **Git Repository**: Your repo
   - **Branch**: `main`
   - **Commit**: Should show latest (`cd615bb`)
4. Click **Deploy**
5. Wait 2-3 minutes

## Verify It's Working

After reconnecting:
1. Check Vercel Dashboard → Deployments
2. The latest deployment should show commit `cd615bb` or `8340c58`
3. NOT `70b349b` (old commit)

## Common Issues with Private Repos

### Issue 1: "Repository not found"
**Fix:** Re-authorize Vercel in GitHub settings

### Issue 2: "Access denied"
**Fix:** Grant Vercel access to private repositories in GitHub

### Issue 3: "Webhook not received"
**Fix:** Use manual deployment instead

### Issue 4: "Can't see latest commits"
**Fix:** Reconnect the project to the repository

## Quick Test

After fixing permissions:
1. Make a small change (add a comment to a file)
2. Commit and push
3. Check if Vercel automatically starts a new deployment
4. If yes → permissions are working!
5. If no → use manual deployment

