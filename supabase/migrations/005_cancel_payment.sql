-- ============================================================
-- GTR by Vero UK — let clients cancel their own PAID booking
-- A signed-in client may update their OWN payment row, but only to
-- mark it 'cancelled'. (Refunds are handled separately in Stripe.)
-- Run once in the Supabase SQL editor.
-- ============================================================
drop policy if exists payments_cancel_own on public.payments;
create policy payments_cancel_own on public.payments
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'cancelled');
