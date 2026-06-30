/* ============================================================
   GTR by Vero UK — admin dashboard
   Auth-gated view over clients, enquiries, webinar signups and
   payments. The "Clients" tab unifies everyone the admin can
   see (from submissions + payments) into one customer record,
   keyed by email, with a per-client drill-down.
   ============================================================ */
(function () {
  'use strict';

  var B = window.VeroBackend;
  var state = { tab: 'clients', subs: [], pays: [], clients: [], q: '', client: null };

  function el(id) { return document.getElementById(id); }
  function show(id) { var n = el(id); if (n) n.hidden = false; }
  function hide(id) { var n = el(id); if (n) n.hidden = true; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmtDate(s) {
    try { return new Date(s).toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return s; }
  }
  function fmtDay(t) {
    try { return new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch (e) { return String(t); }
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
    // force=true re-asks the database every time the dashboard is opened,
    // so a stale/tampered client flag can't get anyone in.
    if (!(await B.isAdmin(true))) { location.replace('account.html'); return; }
    await enter(user);
  }

  // Reveal the dashboard. Called on boot (persisted session) and right
  // after an admin signs in, so we never depend on a reload.
  async function enter(admin) {
    hide('loading'); hide('gate'); show('app');
    el('who-email').textContent = admin.email;
    // Ask once for desktop-notification permission so alerts show even when
    // the dashboard tab is in the background.
    try { if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
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
    state.clients = buildClients();
    renderStats(); renderTabs(); renderToolbar(); render();
    seedKnown();        // remember what's already here (no alerts for existing rows)
    startWatching();    // then watch for anything new
  }

  /* ---------- Live notifications ----------
     Poll the same RLS-protected queries for new enquiries / bookings /
     payments and alert the admin — no extra Supabase setup required. */
  var knownSub = {}, knownPay = {}, watchTimer = null;

  function seedKnown() {
    knownSub = {}; knownPay = {};
    state.subs.forEach(function (r) { knownSub[r.id] = true; });
    state.pays.forEach(function (r) { knownPay[r.id] = true; });
  }
  function startWatching() {
    if (watchTimer) return;
    watchTimer = setInterval(checkForNew, 15000);   // every 15 seconds
  }
  async function checkForNew() {
    var s = await B.listSubmissions();
    var p = await B.listPayments();
    if (s.error || p.error) return;
    var subs = s.rows || [], pays = p.rows || [];
    var newSubs = subs.filter(function (r) { return !knownSub[r.id]; });
    var newPays = pays.filter(function (r) { return !knownPay[r.id]; });
    if (!newSubs.length && !newPays.length) return;

    state.subs = subs; state.pays = pays; seedKnown();
    state.clients = buildClients();
    renderStats(); renderTabs();
    if (!(state.tab === 'clients' && state.client)) render();   // refresh the open list view

    newSubs.forEach(function (r) {
      notify(r.type === 'webinar' ? 'New webinar signup' : 'New enquiry',
        (r.name || r.email || 'Someone') + (r.interest ? ' · ' + r.interest : ''),
        r.type === 'webinar' ? 'webinar' : 'enquiry');
    });
    newPays.forEach(function (r) {
      notify('New payment', (r.name || r.email || 'Someone') + ' · ' + gbp(r.amount), 'payment');
    });
    ping();
  }
  function notify(title, body, tab) {
    var stack = el('notif-stack');
    if (stack) {
      var card = document.createElement('div');
      card.className = 'notif';
      card.setAttribute('data-tab', tab === 'payment' ? 'payment' : (tab === 'webinar' ? 'webinar' : 'enquiry'));
      card.innerHTML = '<div class="notif__title">🔔 ' + esc(title) + '</div><div class="notif__body">' + esc(body) + '</div>';
      stack.appendChild(card);
      setTimeout(function () { card.style.opacity = '0'; setTimeout(function () { card.remove(); }, 300); }, 10000);
    }
    try {
      if (window.Notification && Notification.permission === 'granted') new Notification(title, { body: body });
    } catch (e) {}
  }
  function ping() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
      var ctx = new Ctx(), o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.04;
      o.start(); o.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }

  /* ---------- Client aggregation ----------
     Unify everyone the admin can see into a single customer list,
     keyed by email (falling back to user id), merging their
     enquiries, webinar signups and payments. */
  function buildClients() {
    var map = {};
    function keyFor(r) {
      if (r.email) return 'e:' + String(r.email).toLowerCase();
      if (r.user_id) return 'u:' + r.user_id;
      return 'r:' + (r.id != null ? r.id : Math.random());
    }
    function touch(c, d) {
      if (!d) return;
      var t = new Date(d).getTime();
      if (!c.first || t < c.first) c.first = t;
      if (!c.last || t > c.last) c.last = t;
    }
    function ensure(k) {
      if (!map[k]) map[k] = {
        key: k, name: null, email: null, country: null, profession: null, visa: null,
        linkedin: null, portfolio: null, years: null, user_id: null,
        enquiries: 0, webinars: 0, payments: 0, paid: 0, statusNew: 0,
        first: 0, last: 0, subs: [], pays: []
      };
      return map[k];
    }
    function fill(c, r) {
      c.name = c.name || r.name; c.email = c.email || r.email;
      c.country = c.country || r.country; c.profession = c.profession || r.profession;
      c.visa = c.visa || r.visa; c.linkedin = c.linkedin || r.linkedin;
      c.portfolio = c.portfolio || r.portfolio; c.years = c.years || r.years;
      if (r.user_id) c.user_id = r.user_id;
    }
    state.subs.forEach(function (r) {
      var c = ensure(keyFor(r));
      if (r.type === 'webinar') c.webinars++; else c.enquiries++;
      if (r.status === 'new') c.statusNew++;
      fill(c, r); c.subs.push(r); touch(c, r.created_at);
    });
    state.pays.forEach(function (r) {
      var c = ensure(keyFor(r));
      c.payments++;
      if ((r.status || 'paid') === 'paid') c.paid += (r.amount || 0);
      fill(c, r); c.pays.push(r); touch(c, r.created_at);
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.last - a.last; });
  }

  /* ---------- Stats ---------- */
  function renderStats() {
    var enq = state.subs.filter(function (r) { return r.type !== 'webinar'; });
    var web = state.subs.filter(function (r) { return r.type === 'webinar'; });
    var unactioned = state.subs.filter(function (r) { return r.status === 'new'; }).length;
    var revenue = state.pays.reduce(function (a, r) { return a + ((r.status || 'paid') === 'paid' ? (r.amount || 0) : 0); }, 0);
    var paying = state.clients.filter(function (c) { return c.paid > 0; }).length;
    var aov = paying ? revenue / paying : 0;
    var cards = [
      { n: state.clients.length, l: 'Clients' },
      { n: enq.length, l: 'Enquiries' },
      { n: unactioned, l: 'New / unactioned' },
      { n: web.length, l: 'Webinar signups' },
      { n: paying, l: 'Paying clients' },
      { n: gbp(revenue), l: 'Revenue (paid)' },
      { n: gbp(aov), l: 'Avg / paying client' }
    ];
    el('stat-cards').innerHTML = cards.map(function (c) {
      return '<div class="dash-stat"><div class="dash-stat__num">' + esc(c.n) + '</div>' +
        '<div class="dash-stat__label">' + esc(c.l) + '</div></div>';
    }).join('');
  }

  /* ---------- Tabs ---------- */
  function tabCount(tab) {
    if (tab === 'clients') return state.clients.length;
    if (tab === 'payment') return state.pays.length;
    if (tab === 'webinar') return state.subs.filter(function (r) { return r.type === 'webinar'; }).length;
    return state.subs.filter(function (r) { return r.type !== 'webinar'; }).length;
  }
  function renderTabs() {
    var tabs = [['clients', 'Clients'], ['enquiry', 'Enquiries'], ['webinar', 'Webinar'], ['payment', 'Payments']];
    el('tabs').innerHTML = tabs.map(function (t) {
      return '<button class="dash-tab' + (state.tab === t[0] ? ' is-active' : '') + '" data-tab="' + t[0] + '">' +
        esc(t[1]) + ' <span class="dash-tab__count">' + tabCount(t[0]) + '</span></button>';
    }).join('');
  }

  /* ---------- Search ---------- */
  function renderToolbar() {
    var t = el('toolbar'); if (!t) return;
    t.innerHTML = '<input id="dash-q" class="dash-search" type="search" placeholder="Search name or email…" autocomplete="off" value="' + esc(state.q) + '">';
  }
  function matchQ(r) {
    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    return ['name', 'email', 'country', 'profession', 'interest', 'plan', 'package_name']
      .some(function (k) { return r[k] && String(r[k]).toLowerCase().indexOf(q) !== -1; });
  }
  function matchClientQ(c) {
    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    return ['name', 'email', 'country', 'profession']
      .some(function (k) { return c[k] && c[k].toLowerCase().indexOf(q) !== -1; });
  }

  /* ---------- Main render ---------- */
  function render() {
    var area = el('table-area');

    if (state.tab === 'clients') {
      if (state.client) { area.innerHTML = clientDetail(state.client); return; }
      return renderClients(area);
    }

    if (state.tab === 'payment') {
      var pays = state.pays.filter(matchQ);
      if (!pays.length) { area.innerHTML = empty('No payments yet.'); return; }
      area.innerHTML = wrapTable(
        ['Date', 'Name', 'Email', 'Booked for', 'Plan', 'Amount', 'Status'],
        pays.map(function (r) {
          return row([fmtDate(r.created_at), dash(r.name), dash(r.email), (r.booking_at ? fmtDate(r.booking_at) : '—'), dash(r.plan || r.package_name), gbp(r.amount), statusPill(r.status)]);
        }).join('')
      );
      return;
    }

    var rows = state.subs.filter(function (r) {
      return (state.tab === 'webinar' ? r.type === 'webinar' : r.type !== 'webinar') && matchQ(r);
    });
    if (!rows.length) { area.innerHTML = empty('Nothing here yet.'); return; }

    var body = rows.map(function (r) {
      var cv = r.cv_path ? '<a class="dash-link" href="#" data-cv="' + esc(r.cv_path) + '">View</a>' : '—';
      return '<tr>' +
        td(fmtDate(r.created_at)) + td(dash(r.name)) + td(dash(r.email)) +
        td(r.booking_at ? fmtDate(r.booking_at) : '—') +
        td(dash(r.interest)) + td(dash(r.timeline)) + td(dash(r.profession)) +
        td(dash(r.country)) + td(dash(r.years)) + td(cv) + td(statusSelect(r)) +
        '</tr>';
    }).join('');

    area.innerHTML = wrapTable(
      ['Date', 'Name', 'Email', 'Booked for', 'Interested in', 'Timeline', 'Profession', 'Country', 'Exp.', 'CV', 'Status'],
      body
    );
  }

  /* ---------- Clients tab ---------- */
  function renderClients(area) {
    var list = state.clients.filter(matchClientQ);
    if (!list.length) { area.innerHTML = empty(state.q ? 'No clients match “' + esc(state.q) + '”.' : 'No clients yet.'); return; }
    var body = list.map(function (c) {
      var acct = c.user_id
        ? '<span class="pill-status pill-contacted">Registered</span>'
        : '<span class="pill-status pill-closed">Guest</span>';
      return '<tr class="is-clickable" data-client="' + esc(c.key) + '">' +
        td('<strong>' + dash(c.name) + '</strong>') + td(dash(c.email)) + td(acct) +
        td(String(c.enquiries)) + td(String(c.webinars)) + td(String(c.payments)) +
        td('<strong>' + gbp(c.paid) + '</strong>') + td(c.last ? fmtDay(c.last) : '—') +
        '</tr>';
    }).join('');
    area.innerHTML = wrapTable(
      ['Client', 'Email', 'Account', 'Enquiries', 'Webinars', 'Payments', 'Total paid', 'Last activity'],
      body
    );
  }

  function clientDetail(key) {
    var c = state.clients.filter(function (x) { return x.key === key; })[0];
    if (!c) { state.client = null; return empty('Client not found.'); }

    var head = '<div class="client-detail-top">' +
      '<button class="dash-tab" data-client-back>← All clients</button>' +
      '<div class="client-detail-name">' + dash(c.name) + '</div></div>';

    var profile = '<div class="detail-card"><div class="detail-grid">' + pairs([
      ['Email', c.email], ['Account', c.user_id ? 'Registered' : 'Guest only'],
      ['Country', c.country], ['Profession', c.profession],
      ['Experience', c.years], ['Visa status', c.visa],
      ['LinkedIn', c.linkedin], ['Portfolio', c.portfolio],
      ['First seen', c.first ? fmtDay(c.first) : null], ['Last activity', c.last ? fmtDay(c.last) : null],
      ['Total paid', gbp(c.paid)], ['Payments', String(c.payments)]
    ]) + '</div></div>';

    var enq = c.subs.length
      ? c.subs.map(function (r) {
          var h = '<div class="detail-card__head"><span class="detail-eyebrow">' +
            esc(r.type === 'webinar' ? 'Webinar signup' : 'Enquiry') + ' · ' + esc(fmtDate(r.created_at)) +
            '</span>' + statusPill(r.status) + '</div>';
          var grid = '<div class="detail-grid">' + pairs([
            ['Booked for', r.booking_at ? fmtDate(r.booking_at) : null],
            ['Interested in', r.interest], ['Timeline', r.timeline],
            ['Country', r.country], ['Profession', r.profession],
            ['CV', r.cv_path ? 'Uploaded' : null]
          ]) + '</div>';
          var cv = r.cv_path ? '<div class="detail-msg"><a class="dash-link" href="#" data-cv="' + esc(r.cv_path) + '">Open CV ↗</a></div>' : '';
          var msg = r.message ? '<div class="detail-msg"><div class="detail-label">Message</div><div class="detail-value">' + esc(r.message) + '</div></div>' : '';
          return '<div class="detail-card">' + h + grid + cv + msg + '</div>';
        }).join('')
      : emptyInline('No enquiries.');

    var paysT = c.pays.length
      ? wrapTable(['Date', 'Booked for', 'Plan', 'Amount', 'Status'],
          c.pays.map(function (r) {
            return row([fmtDate(r.created_at), (r.booking_at ? fmtDate(r.booking_at) : '—'), dash(r.plan || r.package_name), gbp(r.amount), statusPill(r.status)]);
          }).join(''))
      : emptyInline('No payments.');

    return head +
      section('Profile', profile) +
      section('Enquiries &amp; bookings', enq) +
      section('Payments', paysT);
  }

  /* ---------- Small helpers ---------- */
  function statusPill(s) { s = s || 'new'; return '<span class="pill-status pill-' + esc(s) + '">' + esc(s) + '</span>'; }
  function statusSelect(r) {
    return '<select class="status-select" data-status="' + r.id + '">' +
      ['new', 'contacted', 'closed'].map(function (o) {
        return '<option' + (r.status === o ? ' selected' : '') + '>' + o + '</option>';
      }).join('') + '</select>';
  }
  function section(title, inner) { return '<div class="dash-section"><h2 class="dash-section-title">' + title + '</h2>' + inner + '</div>'; }
  function pairs(list) {
    return list.map(function (p) {
      return '<div class="detail-item"><div class="detail-label">' + esc(p[0]) + '</div>' +
        '<div class="detail-value">' + (p[1] ? esc(p[1]) : '—') + '</div></div>';
    }).join('');
  }
  function wrapTable(headers, body) {
    return '<div class="dash-card dash-scroll"><table class="dash-table"><thead><tr>' +
      headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }
  function row(cells) { return '<tr>' + cells.map(td).join('') + '</tr>'; }
  function td(v) { return '<td>' + v + '</td>'; }
  function empty(msg) { return '<div class="dash-card"><div class="dash-empty">' + esc(msg) + '</div></div>'; }
  function emptyInline(msg) { return '<div class="detail-card"><div class="dash-empty">' + esc(msg) + '</div></div>'; }

  /* ---------- Interactions ---------- */
  document.addEventListener('click', async function (e) {
    var back = e.target.closest('[data-client-back]');
    if (back) { state.client = null; render(); return; }
    var clientRow = e.target.closest('[data-client]');
    if (clientRow) { state.client = clientRow.getAttribute('data-client'); render(); return; }
    var tab = e.target.closest('[data-tab]');
    if (tab) { state.tab = tab.getAttribute('data-tab'); state.client = null; state.q = ''; renderTabs(); renderToolbar(); render(); return; }
    var cv = e.target.closest('[data-cv]');
    if (cv) { e.preventDefault(); var url = await B.cvUrl(cv.getAttribute('data-cv')); if (url) window.open(url, '_blank'); else alert('Could not open CV.'); return; }
    var out = e.target.closest('[data-signout]');
    if (out) { await B.signOut(); location.reload(); return; }
  });

  document.addEventListener('input', function (e) {
    if (!e.target.closest('#dash-q')) return;
    state.q = e.target.value; render();
  });

  document.addEventListener('change', async function (e) {
    var sel = e.target.closest('[data-status]');
    if (!sel) return;
    var id = sel.getAttribute('data-status');
    var r = await B.setSubmissionStatus(id, sel.value);
    if (r.ok) {
      var rowObj = state.subs.filter(function (x) { return String(x.id) === String(id); })[0];
      if (rowObj) rowObj.status = sel.value;
      state.clients = buildClients();
      renderStats(); renderTabs();
    } else {
      alert('Could not update status: ' + (r.error || ''));
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
