-- ============================================================
-- GTR by Vero UK — migration 002: client accounts
-- Run this AFTER schema.sql (in Supabase → SQL Editor).
-- Adds per-user ownership so logged-in clients can see THEIR OWN
-- enquiries & payments, while the admin still sees everything and
-- guests can still submit/pay with no account.
-- Safe to run more than once.
-- ============================================================

-- Link rows to an auth user (nullable → guests stay anonymous)
alter table public.submissions add column if not exists user_id uuid references auth.users(id);
alter table public.payments    add column if not exists user_id uuid references auth.users(id);

create index if not exists submissions_user_idx on public.submissions (user_id);
create index if not exists payments_user_idx    on public.payments (user_id);

-- Tighten insert: a logged-in user may only tag their OWN id; guests stay null.
drop policy if exists submissions_insert_public on public.submissions;
create policy submissions_insert_public on public.submissions
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- Clients can read their own submissions (admin policy already allows all).
drop policy if exists submissions_select_own on public.submissions;
create policy submissions_select_own on public.submissions
  for select to authenticated using (user_id = auth.uid());

-- Clients can read their own payments (admin policy already allows all).
drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
  for select to authenticated using (user_id = auth.uid());
