/* ============================================================
   GTR by Vero UK — client account portal
   A signed-in visitor sees a full view of THEIR OWN data:
   profile details, every booking/enquiry (all fields), and
   payments. Per-user access is enforced by row-level security.
   ============================================================ */
(function () {
  'use strict';

  var B = window.VeroBackend;
  var state = { subs: [], pays: [], mode: 'signin' };

  function el(id) { return document.getElementById(id); }
  function show(id) { var n = el(id); if (n) n.hidden = false; }
  function hide(id) { var n = el(id); if (n) n.hidden = true; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmtDate(s) {
    try { return new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return s; }
  }
  function gbp(p) { return '£' + ((p || 0) / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }

  /* ---------- Boot ---------- */
  async function boot() {
    if (!B || !B.configured) {
      hide('loading'); show('gate'); wireGate();
      el('gate-note').innerHTML = 'Backend not configured yet — see SETUP.md. <a class="dash-link" href="index.html">Back to site</a>';
      return;
    }
    var user = await B.currentUser();
    if (!user) { hide('loading'); show('gate'); wireGate(); return; }
    // Admins don't get the client account view — send them to the dashboard.
    // Admin status is verified server-side (DB), not a browser-side flag.
    if (await B.isAdmin()) { location.replace('dashboard.html'); return; }
    await enter(user);
  }

  // Swap the gate for the signed-in view. Used both on boot (persisted
  // session) and straight after a successful sign-in (no reload needed).
  async function enter(user) {
    hide('loading'); hide('gate'); show('app');
    el('who-email').textContent = user.email;
    state.user = user;
    await loadData();
  }

  /* ---------- Gate (sign in / sign up) ---------- */
  function setMode(mode) {
    state.mode = mode;
    el('gate-title').textContent = mode === 'signup' ? 'Create your account' : 'Sign in';
    el('gate-submit').textContent = mode === 'signup' ? 'Create account' : 'Sign in';
    el('gate-toggle-text').textContent = mode === 'signup' ? 'Already have an account?' : 'New here?';
    el('gate-toggle').textContent = mode === 'signup' ? 'Sign in' : 'Create an account';
    el('gate-error').hidden = true; el('gate-ok').hidden = true;
  }
  function wireGate() {
    var f = el('gate-form');
    if (!f || f.__wired) return; f.__wired = true;
    el('gate-toggle').addEventListener('click', function () { setMode(state.mode === 'signin' ? 'signup' : 'signin'); });
    f.addEventListener('submit', async function (e) {
      e.preventDefault();
      var err = el('gate-error'), ok = el('gate-ok'); err.hidden = true; ok.hidden = true;
      var btn = el('gate-submit'); var old = btn.textContent; btn.textContent = 'Please wait…'; btn.disabled = true;
      var r = !B ? { ok: false, error: 'Backend not configured.' }
            : state.mode === 'signup' ? await B.signUp(f.email.value, f.password.value)
            : await B.signIn(f.email.value, f.password.value);
      btn.textContent = old; btn.disabled = false;
      if (!r.ok) { err.textContent = r.error || 'Something went wrong.'; err.hidden = false; return; }
      if (state.mode === 'signup' && r.needsConfirm) {
        ok.textContent = 'Account created — check your email to confirm, then sign in.';
        ok.hidden = false; setMode('signin'); f.reset(); return;
      }
      // Go straight to the account view — don't reload (a reload can lose
      // the session when the page is opened via file://).
      f.reset();
      // An admin who signs in here belongs on the dashboard, not this page.
      if (r.isAdmin) { location.replace('dashboard.html'); return; }
      await enter(r.user);
    });
  }

  /* ---------- Data ---------- */
  async function loadData() {
    var s = await B.listSubmissions();   // RLS returns only this user's rows
    var p = await B.listPayments();
    state.subs = s.rows || [];
    state.pays = p.rows || [];
    el('tabs').innerHTML = '';           // single logical view, no tabs
    renderStats();
    render();
  }

  function renderStats() {
    var spent = state.pays.reduce(function (a, r) { return a + (r.amount || 0); }, 0);
    var latest = state.subs[0];
    var cards = [
      { n: state.subs.length, l: 'My requests' },
      { n: state.pays.length, l: 'My payments' },
      { n: gbp(spent), l: 'Total paid' },
      { n: latest ? cap(latest.status) : '—', l: 'Latest status' }
    ];
    el('stat-cards').innerHTML = cards.map(function (c) {
      return '<div class="dash-stat"><div class="dash-stat__num">' + esc(c.n) + '</div>' +
        '<div class="dash-stat__label">' + esc(c.l) + '</div></div>';
    }).join('');
  }

  /* ---------- Full logical view ---------- */
  function render() {
    var area = el('table-area');
    area.innerHTML = profileSection() + requestsSection() + paymentsSection();
  }

  // "Your details" — taken from the most recent submission on file.
  function profileSection() {
    var p = state.subs[0];
    var inner;
    if (p) {
      inner = '<div class="detail-card"><div class="detail-grid">' + pairs([
        ['Name', p.name], ['Email', p.email || (state.user && state.user.email)],
        ['Country', p.country], ['Profession / discipline', p.profession],
        ['Years of experience', p.years], ['Current visa status', p.visa],
        ['LinkedIn', p.linkedin], ['Portfolio / website', p.portfolio]
      ]) + '</div></div>';
    } else {
      inner = emptyCard('No details on file yet. Submit an enquiry from the site and it will appear here.');
    }
    return section('Your details', inner);
  }

  // "Your requests & bookings" — every enquiry with ALL fields.
  function requestsSection() {
    if (!state.subs.length) return section('Your requests & bookings', emptyCard('You have not made any requests yet.'));
    var cards = state.subs.map(function (r) {
      var head = '<div class="detail-card__head">' +
        '<span class="detail-eyebrow">' + esc(r.type === 'webinar' ? 'Webinar signup' : 'Enquiry') + ' · ' + esc(fmtDate(r.created_at)) + '</span>' +
        statusPill(r.status) + '</div>';
      var grid = '<div class="detail-grid">' + pairs([
        ['Interested in', r.interest], ['Hoping to apply', r.timeline],
        ['Name', r.name], ['Email', r.email], ['Country', r.country],
        ['Profession', r.profession], ['Experience', r.years], ['Visa status', r.visa],
        ['LinkedIn', r.linkedin], ['Portfolio', r.portfolio],
        ['CV', r.cv_path ? 'Uploaded ✓' : null]
      ]) + '</div>';
      var msg = r.message
        ? '<div class="detail-msg"><div class="detail-label">Message</div><div class="detail-value">' + esc(r.message) + '</div></div>'
        : '';
      return '<div class="detail-card">' + head + grid + msg + '</div>';
    }).join('');
    return section('Your requests &amp; bookings', cards);
  }

  // "Your payments"
  function paymentsSection() {
    if (!state.pays.length) return section('Your payments', emptyCard('No payments yet.'));
    var rows = state.pays.map(function (r) {
      return '<tr><td>' + esc(fmtDate(r.created_at)) + '</td><td>' + esc(r.plan || r.package_name || '—') +
        '</td><td>' + gbp(r.amount) + '</td><td>' + esc(r.status) + '</td></tr>';
    }).join('');
    var t = '<div class="dash-card dash-scroll"><table class="dash-table"><thead><tr>' +
      '<th>Date</th><th>Plan</th><th>Amount</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    return section('Your payments', t);
  }

  /* ---------- Small helpers ---------- */
  function section(title, inner) { return '<div class="dash-section"><h2 class="dash-section-title">' + title + '</h2>' + inner + '</div>'; }
  function pairs(list) {
    return list.map(function (p) {
      return '<div class="detail-item"><div class="detail-label">' + esc(p[0]) + '</div>' +
        '<div class="detail-value">' + (p[1] ? esc(p[1]) : '—') + '</div></div>';
    }).join('');
  }
  function emptyCard(msg) { return '<div class="dash-card"><div class="dash-empty">' + esc(msg) + '</div></div>'; }
  function statusPill(s) { s = s || 'new'; return '<span class="pill-status pill-' + esc(s) + '">' + esc(s) + '</span>'; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* ---------- Interactions ---------- */
  document.addEventListener('click', async function (e) {
    var out = e.target.closest('[data-signout]');
    if (out) { await B.signOut(); location.href = 'index.html'; return; }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
