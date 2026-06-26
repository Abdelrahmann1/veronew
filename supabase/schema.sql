-- ============================================================
-- GTR by Vero UK — Supabase schema
-- Run this in the Supabase SQL editor (see SETUP.md).
-- Creates: submissions, payments, admins, is_admin(), RLS
-- policies, and the private `cvs` storage bucket.
-- ============================================================

-- ---------- Admin allowlist ----------
create table if not exists public.admins (
  email text primary key
);
-- Seed your admin (change to your real address; must match config.js ADMIN_EMAIL)
insert into public.admins (email) values ('admin@gtrvero.com')
  on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = auth.jwt() ->> 'email');
$$;

-- ---------- Submissions (enquiries / appointments / webinar) ----------
create table if not exists public.submissions (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text,
  email       text,
  country     text,
  profession  text,
  visa        text,
  years       text,
  linkedin    text,
  portfolio   text,
  interest    text,
  timeline    text,
  message     text,
  cv_path     text,
  type        text not null default 'enquiry',   -- enquiry | webinar
  status      text not null default 'new',        -- new | contacted | closed
  user_id     uuid references auth.users(id)      -- set when a logged-in client submits
);
create index if not exists submissions_created_idx on public.submissions (created_at desc);

alter table public.submissions enable row level security;

-- Anyone (anon) may submit the public form; a logged-in client may only tag their own id.
drop policy if exists submissions_insert_public on public.submissions;
create policy submissions_insert_public on public.submissions
  for insert to anon, authenticated with check (user_id is null or user_id = auth.uid());

-- The admin can read / update / delete everything...
drop policy if exists submissions_select_admin on public.submissions;
create policy submissions_select_admin on public.submissions
  for select to authenticated using (public.is_admin());
-- ...and a logged-in client can read their own.
drop policy if exists submissions_select_own on public.submissions;
create policy submissions_select_own on public.submissions
  for select to authenticated using (user_id = auth.uid());
drop policy if exists submissions_update_admin on public.submissions;
create policy submissions_update_admin on public.submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists submissions_delete_admin on public.submissions;
create policy submissions_delete_admin on public.submissions
  for delete to authenticated using (public.is_admin());

-- ---------- Payments (written by the Stripe webhook via service role) ----------
create table if not exists public.payments (
  id                 bigint generated always as identity primary key,
  created_at         timestamptz not null default now(),
  stripe_session_id  text unique,
  payment_intent     text,
  email              text,
  name               text,
  plan               text,
  package_name       text,
  amount             integer,          -- in pence
  currency           text default 'gbp',
  status             text default 'paid',
  user_id            uuid references auth.users(id)   -- set when a logged-in client pays
);
create index if not exists payments_created_idx on public.payments (created_at desc);

alter table public.payments enable row level security;
-- No anon/authenticated insert policy: the webhook uses the service-role key,
-- which bypasses RLS. Admin can read.
drop policy if exists payments_select_admin on public.payments;
create policy payments_select_admin on public.payments
  for select to authenticated using (public.is_admin());
-- A logged-in client can read their own payments.
drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
  for select to authenticated using (user_id = auth.uid());

-- ---------- Storage: private CV bucket ----------
insert into storage.buckets (id, name, public)
  values ('cvs', 'cvs', false)
  on conflict (id) do nothing;

-- Anyone may upload a CV with their enquiry...
drop policy if exists cvs_insert_public on storage.objects;
create policy cvs_insert_public on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'cvs');

-- ...only the admin can read them (via signed URLs from the dashboard).
drop policy if exists cvs_select_admin on storage.objects;
create policy cvs_select_admin on storage.objects
  for select to authenticated using (bucket_id = 'cvs' and public.is_admin());
