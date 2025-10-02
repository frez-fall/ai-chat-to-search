# Deploy to Your Vercel Account (jaidyns-projects)

## ✅ Font Issue Fixed
The font loading error has been resolved. Font files are now in `src/app/fonts/` directory.

Follow these steps to deploy the application to your personal Vercel account:

## Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Visit Vercel Import Page**
   - Go to: https://vercel.com/new
   - Make sure you're logged into your account (jaidyns-projects)

2. **Import Git Repository**
   - Click "Import Git Repository"
   - Connect your GitHub account if not already connected
   - Select the `ai-chat-to-search` repository
   - Or use "Import Third-Party Git Repository" and enter the URL manually

3. **Configure Project**
   - **Project Name**: `ai-chat-to-search` or `flight-search`
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `frontend` (IMPORTANT: Set this to frontend subdirectory)
   - **Build Command**: Leave as default (`npm run build`)
   - **Output Directory**: Leave as default (`.next`)

4. **Add Environment Variables**
   Click "Add" for each variable and enter:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=https://mwexffnofmlxaussvicr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_KEY=your_supabase_service_key_here
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (usually 2-3 minutes)

## Option 2: Deploy via CLI (Manual)

1. **First, login to Vercel in your terminal**:
   ```bash
   vercel logout  # Clear any existing login
   vercel login   # Login with your account
   # Choose "Continue with GitHub" and authenticate as jaidynl
   ```

2. **Navigate to frontend directory**:
   ```bash
   cd /Users/jaidynl/ai-chat-to-search/frontend
   ```

3. **Deploy with proper configuration**:
   ```bash
   vercel --yes
   ```
   
   When prompted:
   - Set up and deploy? **Yes**
   - Which scope? **jaidyns-projects** (your personal account)
   - Link to existing project? **No**
   - Project name? **ai-chat-to-search**
   - Directory with code? **./** (current directory)

4. **Add environment variables**:
   ```bash
   # Add each environment variable
   vercel env add OPENAI_API_KEY production
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_KEY production
   ```

5. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

## Option 3: Deploy from GitHub (Automatic)

1. **Push code to your GitHub**:
   ```bash
   git remote add origin https://github.com/jaidynl/ai-chat-to-search.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect GitHub to Vercel**:
   - Go to: https://vercel.com/jaidyns-projects-60ef1157
   - Click "Add New Project"
   - Import from GitHub
   - Select your repository
   - Configure as described in Option 1

## Important Notes

### 🔐 Get New API Keys

Since the previous keys were exposed, you need new ones:

1. **OpenAI API Key**:
   - Go to: https://platform.openai.com/api-keys
   - Create a new key
   - Copy it immediately (you can't see it again)

2. **Supabase Keys** (if you need new ones):
   - Go to: https://app.supabase.com
   - Select your project
   - Go to Settings → API
   - Copy the anon key and service role key

### 🎯 After Deployment

Your app will be available at:
- **Production URL**: `https://ai-chat-to-search.vercel.app` (or similar)
- **Dashboard**: https://vercel.com/jaidyns-projects-60ef1157/ai-chat-to-search

### 🛠️ Troubleshooting

If deployment fails:

1. **Build errors**: Check that all dependencies are installed
2. **Missing env vars**: Add them in Vercel dashboard → Settings → Environment Variables
3. **Wrong directory**: Ensure root directory is set to `frontend`

### 📱 Quick Deploy Button

Add this to your README for one-click deploys:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jaidynl/ai-chat-to-search&project-name=ai-chat-to-search&root-directory=frontend&env=OPENAI_API_KEY,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_KEY)

## Support

If you need help:
- Vercel Documentation: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Your Vercel Dashboard: https://vercel.com/jaidyns-projects-60ef1157