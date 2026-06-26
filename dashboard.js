/* ============================================================
   GTR by Vero UK — admin dashboard
   Auth-gated view over submissions, webinar signups and payments.
   ============================================================ */
(function () {
  'use strict';

  var B = window.VeroBackend;
  var state = { tab: 'enquiry', subs: [], pays: [] };

  function el(id) { return document.getElementById(id); }
  function show(id) { var n = el(id); if (n) n.hidden = false; }
  function hide(id) { var n = el(id); if (n) n.hidden = true; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmtDate(s) {
    try { return new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return s; }
  }
  function gbp(pence) { return '£' + ((pence || 0) / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function dash(v) { return v ? esc(v) : '—'; }

  /* ---------- Boot / auth gate ---------- */
  async function boot() {
    if (!B || !B.configured) {
      hide('loading'); show('gate');
      el('gate-note').textContent = 'Backend not configured yet — see SETUP.md. Sign-in is disabled until your Supabase keys are in config.js.';
      wireGate();
      return;
    }
    var user = await B.currentUser();
    if (!user) { hide('loading'); show('gate'); wireGate(); return; }
    // Signed in, but not an admin → send them to their own account page.
    if (!B.isAdminUser(user)) { location.replace('account.html'); return; }
    await enter(user);
  }

  // Reveal the dashboard. Called on boot (persisted session) and right
  // after an admin signs in, so we never depend on a reload.
  async function enter(admin) {
    hide('loading'); hide('gate'); show('app');
    el('who-email').textContent = admin.email;
    await loadData();
  }

  function wireGate() {
    var f = el('gate-form');
    if (!f || f.__wired) return; f.__wired = true;
    f.addEventListener('submit', async function (e) {
      e.preventDefault();
      var err = el('gate-error'); err.hidden = true;
      var btn = f.querySelector('button[type="submit"]');
      var old = btn.textContent; btn.textContent = 'Signing in…'; btn.disabled = true;
      var r = B ? await B.signIn(f.email.value, f.password.value) : { ok: false, error: 'Backend not configured.' };
      btn.textContent = old; btn.disabled = false;
      if (!r.ok) { err.textContent = r.error || 'Sign in failed.'; err.hidden = false; return; }
      // A normal user who signs in here belongs on their account page.
      if (!r.isAdmin) { location.replace('account.html'); return; }
      await enter(r.user);
    });
  }

  /* ---------- Data ---------- */
  async function loadData() {
    var s = await B.listSubmissions();
    var p = await B.listPayments();
    state.subs = s.rows || [];
    state.pays = p.rows || [];
    if (s.error || p.error) {
      var d = el('demo-note'); d.hidden = false;
      d.textContent = 'Note: ' + (s.error || p.error) + ' — check that the schema and RLS policies are installed.';
    }
    renderStats(); renderTabs(); render();
  }

  function renderStats() {
    var enq = state.subs.filter(function (r) { return r.type !== 'webinar'; });
    var web = state.subs.filter(function (r) { return r.type === 'webinar'; });
    var unactioned = state.subs.filter(function (r) { return r.status === 'new'; }).length;
    var revenue = state.pays.reduce(function (a, r) { return a + (r.amount || 0); }, 0);
    var cards = [
      { n: enq.length, l: 'Enquiries' },
      { n: unactioned, l: 'New / unactioned' },
      { n: web.length, l: 'Webinar signups' },
      { n: state.pays.length, l: 'Payments' },
      { n: gbp(revenue), l: 'Revenue (paid)' }
    ];
    el('stat-cards').innerHTML = cards.map(function (c) {
      return '<div class="dash-stat"><div class="dash-stat__num">' + esc(c.n) + '</div>' +
        '<div class="dash-stat__label">' + esc(c.l) + '</div></div>';
    }).join('');
  }

  function renderTabs() {
    var tabs = [['enquiry', 'Enquiries'], ['webinar', 'Webinar'], ['payment', 'Payments']];
    el('tabs').innerHTML = tabs.map(function (t) {
      return '<button class="dash-tab' + (state.tab === t[0] ? ' is-active' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join('');
  }

  function render() {
    var area = el('table-area');

    if (state.tab === 'payment') {
      if (!state.pays.length) { area.innerHTML = empty('No payments yet.'); return; }
      area.innerHTML = wrapTable(
        ['Date', 'Name', 'Email', 'Plan', 'Amount', 'Status'],
        state.pays.map(function (r) {
          return row([fmtDate(r.created_at), dash(r.name), dash(r.email), dash(r.plan || r.package_name), gbp(r.amount), esc(r.status)]);
        }).join('')
      );
      return;
    }

    var rows = state.subs.filter(function (r) {
      return state.tab === 'webinar' ? r.type === 'webinar' : r.type !== 'webinar';
    });
    if (!rows.length) { area.innerHTML = empty('Nothing here yet.'); return; }

    var body = rows.map(function (r) {
      var cv = r.cv_path ? '<a class="dash-link" href="#" data-cv="' + esc(r.cv_path) + '">View</a>' : '—';
      var sel = '<select class="status-select" data-status="' + r.id + '">' +
        ['new', 'contacted', 'closed'].map(function (o) {
          return '<option' + (r.status === o ? ' selected' : '') + '>' + o + '</option>';
        }).join('') + '</select>';
      return '<tr>' +
        td(fmtDate(r.created_at)) + td(dash(r.name)) + td(dash(r.email)) +
        td(dash(r.interest)) + td(dash(r.timeline)) + td(dash(r.profession)) +
        td(dash(r.country)) + td(dash(r.years)) + td(cv) + td(sel) +
        '</tr>';
    }).join('');

    area.innerHTML = wrapTable(
      ['Date', 'Name', 'Email', 'Interested in', 'Timeline', 'Profession', 'Country', 'Exp.', 'CV', 'Status'],
      body
    );
  }

  function wrapTable(headers, body) {
    return '<div class="dash-card dash-scroll"><table class="dash-table"><thead><tr>' +
      headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }
  function row(cells) { return '<tr>' + cells.map(td).join('') + '</tr>'; }
  function td(v) { return '<td>' + v + '</td>'; }
  function empty(msg) { return '<div class="dash-card"><div class="dash-empty">' + esc(msg) + '</div></div>'; }

  /* ---------- Interactions ---------- */
  document.addEventListener('click', async function (e) {
    var tab = e.target.closest('[data-tab]');
    if (tab) { state.tab = tab.getAttribute('data-tab'); renderTabs(); render(); return; }
    var cv = e.target.closest('[data-cv]');
    if (cv) { e.preventDefault(); var url = await B.cvUrl(cv.getAttribute('data-cv')); if (url) window.open(url, '_blank'); else alert('Could not open CV.'); return; }
    var out = e.target.closest('[data-signout]');
    if (out) { await B.signOut(); location.reload(); return; }
  });

  document.addEventListener('change', async function (e) {
    var sel = e.target.closest('[data-status]');
    if (!sel) return;
    var id = sel.getAttribute('data-status');
    var r = await B.setSubmissionStatus(id, sel.value);
    if (r.ok) {
      var row = state.subs.filter(function (x) { return String(x.id) === String(id); })[0];
      if (row) row.status = sel.value;
      renderStats();
    } else {
      alert('Could not update status: ' + (r.error || ''));
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
