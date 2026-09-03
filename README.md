# Forme — Digital Wardrobe

A private, mobile-first wardrobe scanner and touch-friendly outfit builder built with Next.js 14, Tailwind CSS and Supabase.

## Features

- Direct-to-wardrobe access with a silent anonymous Supabase session
- Phone camera, photo-library, drag-and-drop and clipboard image upload
- Direct storage of prepared PNG, JPEG, WebP, HEIC and HEIF images
- Private Supabase Storage objects exposed only through one-hour signed URLs
- Categorized wardrobe with filters and custom tags
- Touch/swipe outfit studio powered by Framer Motion
- Saved outfits and category/tag personalization
- Mobile safe-area support, 44px minimum controls and pull-to-refresh containment
- Vercel-ready production configuration

## Local setup

1. Install Node.js 18.17 or newer.
2. Run `npm install`.
3. Create a Supabase project.
4. Open Supabase **SQL Editor**, paste all of `schema.sql`, and run it once.
5. In Supabase **Authentication → Providers**, enable **Anonymous Sign-Ins**.
6. Copy `.env.example` to `.env.local`. The supplied project URL and publishable key are already filled in.
7. Run `npm run dev` and open `http://localhost:3000`. The wardrobe opens directly with no login screen.

## Deploy to Vercel

1. Push this folder to a Git repository or import the folder directly into Vercel.
2. Vercel will detect Next.js and run `npm run vercel-build`.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.example` under **Project Settings → Environment Variables** for Production, Preview and Development.
4. In Supabase **Authentication → Providers**, enable **Anonymous Sign-Ins**.
5. Deploy. The app opens directly into the personal wardrobe.

The supplied Supabase project URL and publishable key are also included as safe defaults in the app. Vercel environment variables are recommended because they make future project or key changes possible without editing source code.

## Security notes

- All database tables use row-level security tied to the automatically created anonymous user ID.
- The `clothing-items` bucket is private. Image paths use the authenticated user's UUID and are protected by Storage policies.
- Images are stored exactly as supplied. Prepare or remove the background before uploading when desired.
- The wardrobe belongs to the current browser session. Clearing site data or opening the app on another device creates a separate empty wardrobe.

## Project map

- `app/closet` — wardrobe grid and category filtering
- `app/add` — camera, library, drag-and-drop and clipboard save flow
- `app/builder` — touch outfit combiner
- `app/outfits` — saved combinations
- `app/settings` — custom categories, tags and sign out
- `schema.sql` — complete Supabase database, triggers, RLS and Storage setup
