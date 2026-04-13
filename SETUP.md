# Tributary — Setup Guide

## Step 1: Create the project locally

Open terminal and run this entire block:

```bash
cd ~
npx create-next-app@latest tributary --typescript --tailwind --eslint --app --src=no --import-alias="@/*" --use-npm
cd tributary
npm install @supabase/supabase-js @anthropic-ai/sdk cheerio
```

## Step 2: Create GitHub repo

```bash
# Go to https://github.com/new and create a repo called "tributary" (public or private, your call)
# Then in your terminal:
cd ~/tributary
git remote add origin https://github.com/YOUR_USERNAME/tributary.git
git add .
git commit -m "initial skeleton"
git push -u origin main
```

## Step 3: Connect Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your "tributary" GitHub repo
4. It auto-detects Next.js — just click Deploy
5. You'll get a live URL like tributary-xyz.vercel.app

## Step 4: Set up Supabase

1. Go to https://supabase.com and create a free account
2. Create a new project (name it "tributary", choose closest region)
3. Once created, go to Settings → API
4. Copy your **Project URL** and **anon public key**
5. Go to SQL Editor and run the schema from `supabase-schema.sql` (I've created this file for you)

## Step 5: Environment variables

Create a `.env.local` file in your project root:

```bash
cp .env.local.example .env.local
# Then edit .env.local with your actual keys
```

Also add these same variables in Vercel:
1. Go to your project in Vercel dashboard
2. Settings → Environment Variables
3. Add each variable from .env.local

## Step 6: Replace the starter files

After running create-next-app, replace the generated files with the ones I've provided:
- Replace `app/page.tsx` with the intake page
- Replace `app/layout.tsx` with the root layout
- Add all files from `app/api/`, `lib/`, `components/`, `types/`

Then push:

```bash
git add .
git commit -m "tributary skeleton with intake flow"
git push
```

Vercel auto-deploys. You're live.
