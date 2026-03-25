# StashUp

StashUp is a simple budget tracking app built with Next.js and Supabase. It lets users create an account, log in, and manage a list of income and expense transactions in a cleaner dashboard-style UI.

## Features

- Email/password sign up and login with Supabase Auth
- Budget overview with balance, income, and expense totals
- Add and delete transactions
- Responsive UI with shared branding and navigation
- Dashboard route for authenticated users

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS v4
- Supabase

## Project Structure

- `src/app/page.tsx`: main budget tracker
- `src/app/login/page.tsx`: login page
- `src/app/signup/page.tsx`: sign up page
- `src/app/dashboard/page.tsx`: authenticated dashboard
- `src/components/site-header.tsx`: shared header and logo
- `src/lib/supabase/client.ts`: Supabase client for auth pages
- `src/lib/supabaseClient.ts`: Supabase client used by the tracker page

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Supabase Setup

This app uses Supabase Auth for sign up and login. You do not need to create your own login table.

Make sure:

- your Supabase project is active
- Email auth is enabled in Supabase Authentication settings
- your `.env.local` values match the current project URL and anon key

The app also expects a `transactions` table for budget entries.

## Expected Transactions Columns

The UI reads and writes these fields from `transactions`:

- `id`
- `created_at`
- `title`
- `amount`
- `type`
- `category`
- `tx_date`

## Available Scripts

- `npm run dev`: start the local dev server
- `npm run build`: build the app for production
- `npm run start`: run the production build
- `npm run lint`: run ESLint

## Current Routes

- `/`: budget tracker
- `/signup`: create an account
- `/login`: log in to an existing account
- `/dashboard`: logged-in landing page

## Notes

- If auth requests fail with `Failed to fetch`, the browser usually cannot reach your Supabase project. Double-check the project URL, anon key, and auth settings.
- After changing `.env.local`, restart the dev server.
