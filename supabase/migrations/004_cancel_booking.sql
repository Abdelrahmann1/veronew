-- ============================================================
-- GTR by Vero UK — let clients cancel their own booking
-- A signed-in client may update their OWN submission, but only to
-- mark it 'cancelled' (the WITH CHECK enforces status = 'cancelled').
-- Run once in the Supabase SQL editor.
-- ============================================================
drop policy if exists submissions_cancel_own on public.submissions;
create policy submissions_cancel_own on public.submissions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'cancelled');
