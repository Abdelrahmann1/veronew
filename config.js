/* ============================================================
   GTR by Vero UK — front-end configuration
   Fill these in after creating your Supabase project (see SETUP.md).
   Only PUBLIC keys live here (safe to ship to the browser):
     • Supabase URL + anon/public key  — public by design (RLS protects data)
   Who counts as an admin is decided by the DATABASE (the public.admins
   table, via the is_admin() function) — never here — so it cannot be faked
   by editing anything in the browser.
   The Stripe SECRET key NEVER goes here — it lives only as a Supabase
   Edge Function secret that you set yourself.
   ============================================================ */
window.VERO_CONFIG = {
  SUPABASE_URL:      'https://agmotqdkhsvhkvsftvnk.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbW90cWRraHN2aGt2c2Z0dm5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDA0NDcsImV4cCI6MjA5Nzg3NjQ0N30.kbJerhEp5Up_pePX-A77Cki2idrPFY56iOBV0WFYZUY'
};

/* Until the values above are filled in, the site runs in DEMO mode:
   forms show the thank-you state without saving, pricing buttons fall
   back to the contact form, and the dashboard shows a setup notice. */
window.VERO_CONFIG.isConfigured = function () {
  var c = window.VERO_CONFIG;
  return c.SUPABASE_URL.indexOf('YOUR-PROJECT') === -1 &&
         c.SUPABASE_ANON_KEY.indexOf('YOUR-') === -1;
};
