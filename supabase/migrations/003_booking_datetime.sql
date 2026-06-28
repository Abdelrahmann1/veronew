-- ============================================================
-- GTR by Vero UK — booking date/time
-- Adds the chosen appointment slot to every booking (enquiries +
-- payments). Run this once in the Supabase SQL editor.
-- Safe to run more than once (IF NOT EXISTS).
-- ============================================================
alter table public.submissions add column if not exists booking_at timestamptz;
alter table public.payments    add column if not exists booking_at timestamptz;
