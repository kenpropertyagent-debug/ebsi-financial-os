# EBSI Financial Freedom OS — Complete Deployment Guide

---

## Prerequisites

- Node.js 18+ installed
- Git installed
- A Supabase account (free tier works)
- A Vercel account (free tier works)
- An OpenAI API key (GPT-4o for AI features)

---

## Step 1: Clone and Install

```bash
# Navigate into the project folder
cd ebsi-financial-freedom-os

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local
```

---

## Step 2: Set Up Supabase

### 2a. Create a new Supabase project
1. Go to https://supabase.com and sign in
2. Click **New project**
3. Choose a name (e.g. `ebsi-financial-os`) and set a strong database password
4. Select the closest region to your users (e.g. Singapore for Malaysia)
5. Click **Create new project** and wait ~2 minutes

### 2b. Run the database migration
1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open `supabase/migrations/001_initial_schema.sql` from this project
4. Paste the entire contents into the SQL editor
5. Click **Run** (green button)
6. You should see: "Success. No rows returned."

### 2c. Enable Google OAuth (optional but recommended)
1. In Supabase dashboard → **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth Client ID and Secret
   - Get these from https://console.cloud.google.com
   - Authorized redirect URI: `https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback`

### 2d. Get your API keys
1. Go to **Settings** → **API** in Supabase
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Step 3: Configure Environment Variables

Edit `.env.local` with your actual values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-proj-...your_openai_key
OPENAI_MODEL=gpt-4o

# App URL (use localhost for development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=EBSI Financial Freedom OS
```

**Note:** Never commit `.env.local` to git. It's already in `.gitignore`.

---

## Step 4: Run Locally

```bash
npm run dev
```

Visit http://localhost:3000

You should see the EBSI Financial Freedom OS landing page.

**Test the flow:**
1. Click "Get Started Free"
2. Sign up with email
3. Check your email for verification link
4. Log in and explore the dashboard

---

## Step 5: Deploy to Vercel

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Set up project settings
# - Deploy!
```

### Option B: Deploy via GitHub (Recommended)

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit: EBSI Financial Freedom OS"
git remote add origin https://github.com/YOUR_USERNAME/ebsi-financial-os.git
git push -u origin main
```

2. Go to https://vercel.com
3. Click **New Project** → Import your GitHub repository
4. Configure environment variables (add all from `.env.local.example`)
5. Click **Deploy**

### Add Environment Variables to Vercel
In your Vercel project dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add each variable from your `.env.local`
3. Set them for **Production**, **Preview**, and **Development**

---

## Step 6: Configure Supabase for Production

### Update Auth Redirect URLs
1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://your-app.vercel.app`
3. Add to **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

### Enable Email Confirmations (optional)
- Authentication → **Email Templates** to customize emails

---

## Step 7: Set Up Custom Domain (optional)

### In Vercel:
1. Project → **Settings** → **Domains**
2. Add your domain (e.g. `ebsi.yourdomain.com`)
3. Follow DNS configuration instructions

### Update Supabase:
- Add the custom domain to Supabase Auth redirect URLs

---

## Step 8: OpenAI API Setup

1. Go to https://platform.openai.com
2. Create an API key under **API Keys**
3. Add credits to your account (recommended: start with $10–20)
4. Set usage limits to avoid surprise bills:
   - Go to **Billing** → **Usage Limits**
   - Set a monthly budget

**Recommended model:** `gpt-4o` for best quality
**Budget model:** `gpt-4o-mini` for lower cost

---

## Supabase Security Checklist

- [x] Row Level Security (RLS) enabled on all user tables
- [x] All policies use `auth.uid() = user_id` 
- [x] Service role key only in server-side code
- [x] Never expose service role key in client code
- [ ] Enable 2FA on Supabase account
- [ ] Set up database backups (Supabase Pro plan)
- [ ] Review and rotate API keys regularly

---

## Vercel Security Checklist

- [ ] All secret env vars marked as **Secret** in Vercel
- [ ] Enable Vercel's DDoS protection
- [ ] Set up rate limiting on API routes if needed

---

## Monitoring & Maintenance

### Check Supabase Usage
- Dashboard → **Reports** shows DB size, API calls, storage

### Monitor OpenAI Costs
- platform.openai.com/usage shows API usage per day

### Update Dependencies
```bash
npm outdated
npm update
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Unauthorized" errors | Check Supabase anon key is correct |
| Google OAuth not working | Verify redirect URLs in Supabase + Google Console |
| AI features not working | Check OPENAI_API_KEY is set and has credits |
| Database errors | Re-run the SQL migration in Supabase SQL Editor |
| Build fails on Vercel | Check all env vars are set in Vercel dashboard |
| RLS blocking queries | Ensure user is authenticated; check policy in Supabase |

---

## Support

This application was built with:
- **Next.js 15** — https://nextjs.org/docs
- **Supabase** — https://supabase.com/docs
- **Vercel** — https://vercel.com/docs
- **OpenAI** — https://platform.openai.com/docs

---

*Built to inspire financial freedom. Every ringgit tracked is a step toward independence.* 🎯
