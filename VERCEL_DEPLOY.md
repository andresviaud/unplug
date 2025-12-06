# Deploying Cambiora to Vercel

## Step-by-Step Guide

### Prerequisites
1. A Vercel account (sign up at https://vercel.com)
2. Your Supabase credentials (from `.env.local`)
3. Your OpenAI API key (if you have one)

### Step 1: Push Your Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   cd "/Users/andresjoseviaud/App development/Cambiora"
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository (name it "Cambiora" or whatever you like)
   - **DO NOT** initialize with README, .gitignore, or license
   - Copy the repository URL

3. **Push to GitHub**:
   ```bash
   git remote add origin YOUR_GITHUB_REPO_URL
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to Vercel**:
   - Visit https://vercel.com
   - Sign in (or create an account)
   - Click "Add New Project"

2. **Import Your Repository**:
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Your Project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build` (should be auto-filled)
   - **Output Directory**: `.next` (should be auto-filled)

4. **Add Environment Variables**:
   Click "Environment Variables" and add these:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key (optional - only if you have one)
   ```
   
   **Important**: Get these values from your `.env.local` file (but don't share that file publicly!)

5. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (2-3 minutes)
   - Your app will be live at a URL like: `https://cambiora-xyz.vercel.app`

### Step 3: Update Supabase Settings

After deployment, you need to add your Vercel URL to Supabase:

1. **Go to Supabase Dashboard**:
   - Visit https://supabase.com/dashboard
   - Select your project
   - Go to "Authentication" → "URL Configuration"

2. **Add Your Vercel URL**:
   - Add your Vercel URL to "Site URL"
   - Add your Vercel URL to "Redirect URLs"
   - Format: `https://your-app.vercel.app`

### Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Try signing up/logging in
3. Test creating a habit
4. Test completing a challenge

### Troubleshooting

**If the build fails:**
- Check the build logs in Vercel
- Make sure all environment variables are set
- Ensure your code is pushed to GitHub

**If authentication doesn't work:**
- Double-check Supabase URL and keys in Vercel environment variables
- Make sure your Vercel URL is added to Supabase redirect URLs

**If you need to update your app:**
- Just push new changes to GitHub
- Vercel will automatically redeploy

