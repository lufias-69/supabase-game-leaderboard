# Supabase Setup Guide

Follow these steps to set up a fresh Supabase project for the **Supabase Quest** game.

## 1. Create a Table
Go to the **SQL Editor** in your Supabase Dashboard and run the following script to create the `scores` table and set up row-level security.

```sql
-- 1. Create the scores table
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null unique,
  email text not null,
  high_score integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.scores enable row level security;

-- 3. Policy: Anyone can view the leaderboard (Read access)
create policy "Anyone can view leaderboard" on public.scores
  for select using (true);

-- 4. Policy: Users can insert their own score (Create access)
create policy "Users can insert own score" on public.scores
  for insert with check (auth.uid() = user_id);

-- 5. Policy: Users can update their own high score (Update access)
create policy "Users can update own score" on public.scores
  for update using (auth.uid() = user_id);
```

## 2. Enable Auth
Ensure that the **Email/Password** provider is enabled:
1. Navigate to **Authentication** > **Providers**.
2. Make sure **Email** is enabled.
3. (Optional) Disable "Confirm Email" if you want users to be able to play immediately without verifying their email address.

## 3. API Configuration
Update your `app.js` (or `.env` in React projects) with your project's credentials found in **Project Settings** > **API**:
- `Project URL`
- `anon` (public) key
