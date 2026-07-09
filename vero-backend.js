/* ============================================================
   GTR by Vero UK — backend bridge (Supabase + Stripe)
   Exposes window.VeroBackend used by script.js and dashboard.js.
   Loads after the Supabase UMD bundle and config.js.
   Degrades gracefully when not yet configured (DEMO mode).
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.VERO_CONFIG || {};
  var configured = !!(cfg.isConfigured && cfg.isConfigured()) && !!window.supabase;
  var client = configured
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,      // keep the session in storage across reloads
          autoRefreshToken: true,    // silently refresh before the token expires
          detectSessionInUrl: true,  // pick up sessions from magic-link / OAuth redirects
          storageKey: 'gtr-vero-auth'
        }
      })
    : null;

  /* ---------- Enquiries / appointments / webinar signups ---------- */
  // Stored in one `submissions` table; `type` separates them for the dashboard.
  async function submitEnquiry(data, file, opts) {
    if (!client) return { ok: true, demo: true };
    try {
      var cv_path = null;
      if (file && file.size) {
        var safe = file.name.replace(/[^\w.\-]+/g, '_');
        var path = Date.now() + '-' + safe;
        var up = await client.storage.from('cvs').upload(path, file, { upsert: false });
        if (!up.error) cv_path = up.data.path;
      }
      var type = data.interest === 'Webinar' ? 'webinar' : 'enquiry';
      var u = await currentUser();
      var row = {
        name: data.name || null,
        email: data.email || null,
        country: data.country || null,
        profession: data.profession || null,
        visa: data.visa || null,
        years: data.years || null,
        linkedin: data.linkedin || null,
        portfolio: data.portfolio || null,
        interest: data.interest || null,
        timeline: data.timeline || null,
        message: data.message || null,
        cv_path: cv_path,
        booking_at: data.booking_at || null,
        type: type,
        status: 'new',
        user_id: u ? u.id : null
      };
      var ins = await client.from('submissions').insert([row]);
      // Paid bookings get their calendar event + Meet link once, after payment
      // succeeds (stripe-webhook) — syncing here too would create a duplicate
      // event and a second, different Meet-link email for the same booking.
      if (!ins.error && row.booking_at && !(opts && opts.skipCalendarSync)) {
        syncCalendar({
          summary: 'GTR booking — ' + (row.name || 'Client') + (row.interest ? ' (' + row.interest + ')' : ''),
          description: 'Enquiry booking\nClient: ' + (row.name || '') + '\nEmail: ' + (row.email || '') +
            '\nInterest: ' + (row.interest || '') + '\nCountry: ' + (row.country || ''),
          startISO: row.booking_at,
          name: row.name,
          note: row.interest
        });
      }
      return { ok: !ins.error, error: ins.error && ins.error.message };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  // Best-effort: ask the edge function to add the booking to the admin's
  // Google Calendar. Failures are swallowed so they never block the booking.
  async function syncCalendar(details) {
    if (!client) return;
    try {
      var s = await client.auth.getSession();
      var token = s.data.session ? s.data.session.access_token : null;
      await fetch(cfg.SUPABASE_URL + '/functions/v1/add-to-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.SUPABASE_ANON_KEY },
        body: JSON.stringify({
          userToken: token, summary: details.summary, description: details.description, startISO: details.startISO,
          name: details.name, note: details.note
        })
      });
    } catch (e) { /* non-fatal */ }
  }

  // Which fixed slots are actually free on the owner's real calendar for a
  // given day. Returns { ok, slots: {"06:00": true, ...} } — if the check
  // fails (calendar not configured, network error), returns ok:false so the
  // caller can fall back to showing every slot as available.
  async function checkAvailability(dateStr) {
    if (!configured) return { ok: false };
    try {
      var res = await fetch(cfg.SUPABASE_URL + '/functions/v1/get-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.SUPABASE_ANON_KEY },
        body: JSON.stringify({ date: dateStr })
      });
      var j = await res.json();
      return j && j.slots ? { ok: true, slots: j.slots } : { ok: false };
    } catch (e) {
      return { ok: false };
    }
  }

  /* ---------- Stripe Checkout ---------- */
  // The plan id is resolved to an amount SERVER-SIDE in the edge function,
  // so the browser can never tamper with the price.
  async function startCheckout(planId, bookingAt) {
    if (!client) return { ok: false, demo: true };
    try {
      var s = await client.auth.getSession();
      var token = s.data.session ? s.data.session.access_token : null;
      var res = await fetch(cfg.SUPABASE_URL + '/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + cfg.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ plan: planId, origin: window.location.origin, userToken: token, bookingAt: bookingAt || null })
      });
      var j = await res.json();
      if (j && j.url) { window.location.href = j.url; return { ok: true }; }
      return { ok: false, error: (j && j.error) || 'No checkout URL returned' };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  /* ---------- Auth (clients + admin) ----------
     Admin status is decided by the DATABASE, never the browser. The
     is_admin() SQL function checks the signed-in user's email (taken from
     their verified JWT) against the public.admins table. The browser cannot
     fake this — the check runs server-side, and the same is_admin() guards
     every table through RLS, so faking the UI never exposes real data. */
  var _adminCache = null;            // null = not checked yet this session

  // Ask the database whether the signed-in user is an admin.
  // force=true bypasses the cache (used when entering the admin dashboard).
  async function isAdmin(force) {
    if (!client) return false;
    if (!force && _adminCache !== null) return _adminCache;
    try {
      var r = await client.rpc('is_admin');
      _adminCache = !r.error && r.data === true;
    } catch (e) { _adminCache = false; }
    return _adminCache;
  }

  async function signIn(email, password) {
    if (!client) return { ok: false, demo: true, error: 'Backend not configured yet.' };
    var r = await client.auth.signInWithPassword({ email: email, password: password });
    if (r.error) return { ok: false, error: r.error.message };
    _adminCache = null;                          // recheck for the new identity
    return { ok: true, user: r.data.user, isAdmin: await isAdmin(true) };
  }
  async function signUp(email, password) {
    if (!client) return { ok: false, demo: true, error: 'Backend not configured yet.' };
    var r = await client.auth.signUp({ email: email, password: password });
    if (r.error) return { ok: false, error: r.error.message };
    // When email confirmation is on, there is no session until the user confirms.
    return { ok: true, user: r.data.user, needsConfirm: !r.data.session };
  }
  // Confirms a signup using the 6-digit code emailed to the user (Supabase's
  // "Confirm signup" template must show {{ .Token }} — see SETUP.md).
  // Success returns a real session, so the caller can sign the user straight in.
  async function confirmSignUp(email, token) {
    if (!client) return { ok: false, demo: true, error: 'Backend not configured yet.' };
    var r = await client.auth.verifyOtp({ email: email, token: token, type: 'signup' });
    if (r.error) return { ok: false, error: r.error.message };
    _adminCache = null;
    return { ok: true, user: r.data.user, isAdmin: await isAdmin(true) };
  }
  // Re-sends the signup confirmation code (rate-limited server-side by Supabase).
  async function resendSignUpCode(email) {
    if (!client) return { ok: false, demo: true };
    var r = await client.auth.resend({ type: 'signup', email: email });
    return { ok: !r.error, error: r.error && r.error.message };
  }
  async function signOut() { _adminCache = null; if (client) await client.auth.signOut(); }
  async function currentUser() {
    if (!client) return null;
    var s = await client.auth.getSession();
    return (s.data.session && s.data.session.user) || null;
  }
  async function currentAdmin() {
    var u = await currentUser();
    if (!u) return null;
    return (await isAdmin()) ? u : null;
  }
  function onAuthChange(cb) {
    if (client) client.auth.onAuthStateChange(function (_e, session) { cb(session ? session.user : null); });
  }

  /* ---------- Dashboard data ---------- */
  async function listSubmissions() {
    if (!client) return { ok: false, demo: true, rows: [] };
    var r = await client.from('submissions').select('*').order('created_at', { ascending: false });
    return { ok: !r.error, rows: r.data || [], error: r.error && r.error.message };
  }
  async function listPayments() {
    if (!client) return { ok: false, demo: true, rows: [] };
    var r = await client.from('payments').select('*').order('created_at', { ascending: false });
    return { ok: !r.error, rows: r.data || [], error: r.error && r.error.message };
  }
  async function setSubmissionStatus(id, status) {
    if (!client) return { ok: false };
    var r = await client.from('submissions').update({ status: status }).eq('id', id);
    return { ok: !r.error, error: r.error && r.error.message };
  }
  // A signed-in client cancels their OWN booking. RLS (submissions_cancel_own)
  // ensures they can only set status to 'cancelled' on their own rows.
  async function cancelBooking(id) {
    if (!client) return { ok: false, error: 'Not connected.' };
    var r = await client.from('submissions').update({ status: 'cancelled' }).eq('id', id);
    return { ok: !r.error, error: r.error && r.error.message };
  }
  // Cancel a paid booking from the payments table (RLS: payments_cancel_own).
  async function cancelPayment(id) {
    if (!client) return { ok: false, error: 'Not connected.' };
    var r = await client.from('payments').update({ status: 'cancelled' }).eq('id', id);
    return { ok: !r.error, error: r.error && r.error.message };
  }
  async function cvUrl(path) {
    if (!client || !path) return null;
    var r = await client.storage.from('cvs').createSignedUrl(path, 3600);
    return r.data && r.data.signedUrl;
  }

  window.VeroBackend = {
    configured: configured,
    submitEnquiry: submitEnquiry,
    startCheckout: startCheckout,
    signIn: signIn,
    signUp: signUp,
    confirmSignUp: confirmSignUp,
    resendSignUpCode: resendSignUpCode,
    signOut: signOut,
    currentUser: currentUser,
    currentAdmin: currentAdmin,
    isAdmin: isAdmin,
    onAuthChange: onAuthChange,
    listSubmissions: listSubmissions,
    listPayments: listPayments,
    setSubmissionStatus: setSubmissionStatus,
    cancelBooking: cancelBooking,
    cancelPayment: cancelPayment,
    cvUrl: cvUrl,
    checkAvailability: checkAvailability
  };
})();
