/* ============================================================
   GTR by Vero UK — standalone behaviour
   Page navigation, data-driven lists, FAQ accordion, contact form.
   Plain vanilla JS — no framework. Generated markup uses the
   classes defined in styles.css; no inline styles here.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Data ---------- */
  var navDefs = [
    { key: 'home', label: 'Home' },
    { key: 'about', label: 'About' },
    { key: 'services', label: 'Services' },
    { key: 'programme', label: 'Programme' },
    { key: 'contact', label: 'Contact' }
  ];

  var whoFor = [
    'Architects',
    'Interior & spatial designers',
    'Urban & masterplanning designers',
    'Landscape & built-environment specialists',
    'Visualisers & computational designers',
    'Architecture researchers & academics',
    'Design leaders & studio principals',
    'Advanced creative professionals',
    'Any creative professional in architecture & design'
  ];

  var evidence = [
    { num: '01', title: 'Authored projects', body: 'Work where your design authorship and decisions are clearly your own.' },
    { num: '02', title: 'Leadership & influence', body: 'Roles where you shaped teams, studios, or the direction of a project.' },
    { num: '03', title: 'Awards & honours', body: 'Competitions, prizes, and professional recognition in your field.' },
    { num: '04', title: 'Publications & media', body: 'Coverage, features, and writing that document your contribution.' },
    { num: '05', title: 'Exhibitions & talks', body: 'Public presentation of your work to a professional audience.' },
    { num: '06', title: 'Innovation & research', body: 'New methods, tools, or thinking that advance the discipline.' }
  ];

  var trustItems = [
    { stat: 'Endorsed', label: 'Team of UK Global Talent endorsed leaders' },
    { stat: '16 yrs', label: 'In architecture & design' },
    { stat: '35+', label: 'Professionals supported' },
    { stat: 'Independent', label: 'Not affiliated with any endorsing body' }
  ];

  var founderStats = [
    { stat: '15 yrs', label: 'Average international experience' },
    { stat: 'Endorsed', label: 'Team of Global Talent holders' },
    { stat: '35+', label: 'Professionals supported & welcomed' }
  ];

  var veroMeaning = [
    { word: 'Truth', body: 'Your achievements are real. The work is recognising and stating them clearly.' },
    { word: 'Authenticity', body: 'A profile grounded in genuine authorship and contribution, not inflation.' },
    { word: 'Clarity', body: 'Turning a complex career into a structured, legible case.' },
    { word: 'Potential', body: 'Seeing the pathway your record already supports — and preparing for it.' }
  ];

  var approach = [
    { title: 'Strategy-led', body: 'Every step is about positioning and evidence, not box-ticking.' },
    { title: 'Honest & responsible', body: 'We use careful language and never overpromise an outcome.' },
    { title: 'Personal', body: 'Built around your individual record, discipline, and ambitions.' }
  ];

  var responsibleTags = ['Strengthen your readiness', 'Prepare strategically', 'Improve clarity', 'Structure your evidence', 'Understand your pathway', 'Support your decision-making'];

  var steps = [
    { num: '01', name: 'Assess', desc: 'Understand your background, achievements, professional route, and current readiness — an honest baseline to build from.' },
    { num: '02', name: 'Position', desc: 'Identify whether your profile should be positioned around leadership, promise, impact, innovation, design excellence, authorship, or contribution.' },
    { num: '03', name: 'Map evidence', desc: 'Organise achievements, projects, awards, publications, media, exhibitions, leadership roles, and professional recognition into a structured evidence framework.' },
    { num: '04', name: 'Build portfolio strategy', desc: 'Transform your portfolio from a design presentation into a strategic evidence document that communicates authorship, value, impact, and credibility.' },
    { num: '05', name: 'Structure letters', desc: 'Identify the right recommenders and align letters with your professional narrative and evidence.' },
    { num: '06', name: 'Develop narrative', desc: 'Build a clear, convincing personal story that connects your past achievements, current position, and future contribution.' },
    { num: '07', name: 'Review and refine', desc: 'Review the overall pack for clarity, consistency, structure, and readiness.' },
    { num: '08', name: 'Move forward', desc: 'Understand your next steps and prepare for submission with a clearer, more confident strategy.' }
  ];

  var services = [
    { num: '01', name: 'Global Talent Assessment', tagline: 'The entry point',
      desc: 'A focused assessment for professionals who are unsure whether they are ready for the UK Global Talent Route.',
      includes: ['CV and background review', 'Professional experience review', 'Achievement and evidence check', 'Current visa status discussion, if relevant', 'Possible pathway direction', 'Exceptional Leader (Talent) vs Potential Leader (Promise)', 'Evidence gap overview', 'Recommended next step'],
      bestFor: 'People who are exploring the route or unsure if they qualify.', cta: 'Book assessment' },
    { num: '02', name: '1:1 Guidance', tagline: 'Personalised strategy',
      desc: 'Personalised guidance for professionals who want to understand how to structure their application journey and prepare strategically. Normally two to three sessions of around 40 minutes, up to a maximum of six, taken at your own pace.',
      includes: ['Route clarity', 'Evidence planning', 'Portfolio direction', 'Recommendation letter strategy', 'Career narrative development', 'Timeline planning', 'Normally 2–3 sessions of ~40 min, up to 6 maximum'],
      bestFor: 'Professionals who are ready, or close to ready.', cta: 'Start 1:1 guidance' },
    { num: '03', name: 'Document Review', tagline: 'Strategic feedback',
      desc: 'A focused review for applicants who have already started preparing documents and need strategic feedback.',
      includes: ['Portfolio review', 'Evidence pack review', 'Recommendation letter structure review', 'Career narrative feedback', 'Readiness comments', 'Improvement recommendations'],
      bestFor: 'Applicants who already have draft documents.', cta: 'Review my documents' },
    { num: '04', name: 'Full Mentorship', tagline: 'End-to-end · up to 4 weeks',
      desc: 'A complete, end-to-end pathway over up to four weeks — from readiness review to a fully structured evidence pack, with guidance tailored to your individual experience using proven, endorsed frameworks.',
      includes: ['Full profile and evidence strategy', 'Document structure guidance', 'Proven, endorsed structural frameworks', 'Portfolio and letters guidance', 'Career narrative development', 'Up to 3 mentorship sessions', 'Final readiness review', 'Priority support'],
      bestFor: 'Advanced professionals who want full structure at a considered pace.', cta: 'Apply for mentorship' },
    { num: '05', name: 'Accelerated Mentorship', tagline: 'Fast-track · within 5 days',
      desc: 'An intensive fast-track delivered within five days. You receive our structured document templates — the proven, endorsed structures we use — so every document can be built and tailored to your experience at speed.',
      includes: ['Structured document templates', 'Rapid readiness and gap review', 'Document structure tailored to your profile', 'Proven, endorsed structural frameworks', 'Portfolio and evidence prioritisation', 'Recommendation letter structure', 'Career narrative development', 'Daily working sessions', 'Priority, time-critical support'],
      bestFor: 'Professionals working to a tight deadline who need to prepare within days.', cta: 'Request fast-track' }
  ];

  var pricing = [
    { name: 'Eligibility Snapshot', price: 'Free', unit: 'no cost', note: 'Start here', cta: 'Get free snapshot', feature: false,
      feats: ['Short readiness snapshot', 'Honest view of where you stand', 'Recommended next step'] },
    { name: 'Global Talent Assessment', price: '£49', unit: 'one-off', note: 'Paid deep-dive', cta: 'Book assessment', feature: false,
      feats: ['CV and background review', 'Achievement and evidence check', 'Possible pathway direction', 'Exceptional Leader (Talent) vs Potential Leader (Promise)', 'Recommended next step'] },
    { name: '1:1 Guidance', price: '£119', unit: 'per 40-min session · normally 2–3, up to 6', note: 'Strategy on demand', cta: 'Start 1:1 guidance', feature: false,
      feats: ['Route clarity', 'Evidence planning', 'Portfolio direction', 'Career narrative development', 'Normally 2–3 sessions of ~40 min, up to 6 maximum'] },
    { name: 'Document Review', price: '£149', unit: 'full document review', note: 'For draft documents', cta: 'Review my documents', feature: false,
      feats: ['Portfolio review', 'Evidence pack review', 'Recommendation letter structure review', 'Career narrative feedback', 'Improvement recommendations'] },
    { name: 'Full Mentorship', price: '£349', unit: 'up to 4 weeks', note: 'Most popular', cta: 'Apply for mentorship', feature: true,
      feats: ['Full profile and evidence strategy', 'Portfolio and letters guidance', 'Career narrative development', 'Up to 3 mentorship sessions', 'Final readiness review', 'Priority support'] },
    { name: 'Accelerated Mentorship', price: '£949', unit: 'within 5 days · templates', note: 'Fast-track + templates', cta: 'Request fast-track', feature: false,
      feats: ['Structured document templates', 'Document structure tailored to you', 'Daily working sessions', 'Career narrative development', 'Priority, time-critical support'] }
  ];

  var faqs = [
    { q: 'Is this legal or immigration advice?', a: 'No. GTR by Vero UK provides educational and experience-based guidance only. For legal matters, you should consult a regulated immigration adviser and refer to official UK Government guidance.' },
    { q: 'Do I need to be in the UK already?', a: 'No. The programme supports professionals internationally. Where relevant, we will discuss your current visa status as part of the assessment.' },
    { q: 'Can you guarantee endorsement or a visa?', a: 'No. We help you prepare strategically and structure your evidence, but the decision rests entirely with the relevant endorsing body and the Home Office.' },
    { q: 'Where should I start?', a: 'Most people begin with the Global Talent Assessment. It is the simplest way to understand whether the route fits you and what to do next.' }
  ];

  /* ---------- Helpers ---------- */
  var CHECK = '<svg class="check-svg" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7.5" stroke="#c2b196" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function el(id) { return document.getElementById(id); }
  function setHTML(node, html) { if (node) node.innerHTML = html; }

  // Pricing plan ids — must match the edge function's PLANS keys.
  var PLAN_ID = {
    'Global Talent Assessment': 'assessment',
    '1:1 Guidance': 'guidance',
    'Document Review': 'review',
    'Full Mentorship': 'mentorship',
    'Accelerated Mentorship': 'accelerated',
  };

  // Plan id -> the contact form's "Interested in" option (demo fallback).
  var PLAN_INTEREST = {
    assessment: 'Global Talent Assessment',
    guidance: '1:1 Guidance',
    review: 'Document Review',
    mentorship: 'Full Mentorship',
    accelerated: 'Full Mentorship'
  };

  /* ---------- Navigation ---------- */
  var current = 'home';

  function go(page) {
    var pages = document.querySelectorAll('.page');
    if (!pages.length) {
      // Not the single-page app (e.g. the thank-you page) → jump to the real site.
      window.location.href = 'index.html' + (page && page !== 'home' ? '#' + page : '');
      return;
    }
    current = page;
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.toggle('is-active', pages[i].getAttribute('data-page') === page);
    }
    var nav = el('nav');
    nav.className = page === 'home' ? 'nav--home' : 'nav--inner';
    renderNav();
    closeMenu();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------- Mobile burger menu ---------- */
  function toggleMenu() {
    var n = el('nav'); if (!n) return;
    var open = n.classList.toggle('is-open');
    var b = el('nav-burger'); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeMenu() {
    var n = el('nav'); if (n) n.classList.remove('is-open');
    var b = el('nav-burger'); if (b) b.setAttribute('aria-expanded', 'false');
  }

  function renderNav() {
    var menu = navDefs.map(function (n) {
      return '<button class="navlink' + (n.key === current ? ' is-active' : '') + '" data-nav="' + n.key + '">' + esc(n.label) + '</button>';
    }).join('');
    setHTML(el('nav-menu'), menu);

    var foot = navDefs.map(function (n) {
      return '<button class="footer-link" data-nav="' + n.key + '">' + esc(n.label) + '</button>';
    }).join('');
    setHTML(el('footer-nav'), foot);
  }

  /* ---------- Renderers ---------- */
  function renderMarquees() {
    var who = whoFor.concat(whoFor).map(function (label) {
      return '<div class="who-chip"><span class="who-chip-dot"></span>' +
        '<span class="who-chip-label">' + esc(label) + '</span></div>';
    }).join('');
    setHTML(el('who-marquee'), who);

    var ev = evidence.concat(evidence).map(function (e) {
      return '<div class="evidence-card">' +
        '<div class="eyebrow eyebrow--sm">' + esc(e.num) + '</div>' +
        '<h3>' + esc(e.title) + '</h3>' +
        '<p>' + esc(e.body) + '</p></div>';
    }).join('');
    setHTML(el('evidence-marquee'), ev);
  }

  function renderTrust() {
    setHTML(el('trust-stats'), trustItems.map(function (t) {
      return '<div class="stat"><div class="stat-num">' + esc(t.stat) + '</div>' +
        '<div class="stat-label">' + esc(t.label) + '</div></div>';
    }).join(''));
  }

  function renderPricing() {
    var list = pricing.slice();
    var html = list.map(function (p) {
      var feats = p.feats.map(function (ft) {
        return '<div class="feat">' + CHECK + '<span>' + esc(ft) + '</span></div>';
      }).join('');
      var planId = p.price === 'Free' ? null : PLAN_ID[p.name];
      var action = planId ? 'data-checkout="' + planId + '"' : 'data-nav="contact" data-intent="Eligibility Snapshot"';
      return '<div class="price-card' + (p.feature ? ' price-card--feature' : '') + '">' +
        '<div class="eyebrow eyebrow--sm eyebrow--mb-sm">' + esc(p.note) + '</div>' +
        '<h3>' + esc(p.name) + '</h3>' +
        '<div class="price-row">' +
        '<span class="price-amount">' + esc(p.price) + '</span>' +
        '<span class="price-unit">' + esc(p.unit) + '</span></div>' +
        '<div class="price-sep"></div>' +
        '<div class="price-feats">' + feats + '</div>' +
        '<div class="price-cta-wrap"><button class="btn btn--md btn--block ' + (p.feature ? 'btn--light' : 'btn--pay') + '" ' + action + '>' + esc(p.cta) + '</button></div></div>';
    }).join('');
    var grids = document.querySelectorAll('.pricing-grid');
    for (var i = 0; i < grids.length; i++) grids[i].innerHTML = html;
  }

  function renderServices() {
    setHTML(el('services-list'), services.map(function (s) {
      var includes = s.includes.map(function (inc) {
        return '<div class="include">' + CHECK + '<span>' + esc(inc) + '</span></div>';
      }).join('');
      return '<div class="service-card">' +
        '<div class="service-main">' +
        '<div class="service-tagrow"><span class="service-num">' + esc(s.num) + '</span>' +
        '<span class="service-tag">' + esc(s.tagline) + '</span></div>' +
        '<h2>' + esc(s.name) + '</h2>' +
        '<p class="service-desc">' + esc(s.desc) + '</p>' +
        '<div class="service-bestfor"><span class="service-bestfor-label">Best for</span>' +
        '<div class="service-bestfor-val">' + esc(s.bestFor) + '</div></div>' +
        '<button class="btn btn--md btn--dark" data-nav="contact" data-intent="' + esc(s.name) + '">' + esc(s.cta) + '</button></div>' +
        '<div class="service-side"><span class="service-includes-label">What is included</span>' +
        '<div class="include-list">' + includes + '</div></div></div>';
    }).join(''));
  }

  function renderSteps() {
    setHTML(el('steps-list'), steps.map(function (st) {
      return '<div class="step">' +
        '<div class="step-side">' +
        '<div class="step-num">Step ' + esc(st.num) + '</div>' +
        '<div class="step-name it">' + esc(st.name) + '</div></div>' +
        '<div class="step-main"><p>' + esc(st.desc) + '</p></div></div>';
    }).join(''));
  }

  function renderFounderStats() {
    setHTML(el('founder-stats'), founderStats.map(function (fs) {
      return '<div><div class="stat-num">' + esc(fs.stat) + '</div>' +
        '<div class="stat-label">' + esc(fs.label) + '</div></div>';
    }).join(''));
  }

  function renderVeroMeaning() {
    setHTML(el('vero-meaning'), veroMeaning.map(function (v) {
      return '<div class="meaning-card"><div class="meaning-word it">' + esc(v.word) + '</div>' +
        '<div class="meaning-body">' + esc(v.body) + '</div></div>';
    }).join(''));
  }

  function renderApproach() {
    setHTML(el('approach-list'), approach.map(function (a) {
      return '<div class="approach-item"><h3>' + esc(a.title) + '</h3>' +
        '<p>' + esc(a.body) + '</p></div>';
    }).join(''));
  }

  function renderResponsibleTags() {
    setHTML(el('responsible-tags'), responsibleTags.map(function (r) {
      return '<span class="chip">' + esc(r) + '</span>';
    }).join(''));
  }

  /* ---------- FAQ accordion ---------- */
  var openFaq = 0;
  function renderFaq() {
    setHTML(el('faq-list'), faqs.map(function (f, i) {
      var isOpen = i === openFaq;
      var answer = isOpen ? '<p class="faq-a">' + esc(f.a) + '</p>' : '';
      return '<div class="faq-item">' +
        '<button class="faq-q" data-faq="' + i + '">' +
        '<span class="faq-q-text">' + esc(f.q) + '</span>' +
        '<span class="faq-toggle">' + (isOpen ? '–' : '+') + '</span>' +
        '</button>' + answer + '</div>';
    }).join(''));
  }

  /* ---------- Backend bridge (Supabase + Stripe) ---------- */
  function B() { return window.VeroBackend; }

  function preselectInterest(val) {
    var sel = document.querySelector('#contact-form select[name="interest"]');
    if (!sel || !val) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === val || sel.options[i].text === val) { sel.selectedIndex = i; break; }
    }
    updateSubmitLabel();
  }

  // Paid services need a date/time + payment ("Continue to payment"); every
  // free option (snapshot, webinar, "not sure") is a simple "Send" with no
  // booking — so the date/time field only shows for paid services.
  function selectedIsPaid() {
    var sel = document.querySelector('#contact-form select[name="interest"]');
    return !!(sel && PLAN_ID[sel.value]);
  }
  function updateSubmitLabel() {
    var form = el('contact-form'); if (!form) return;
    var sel = form.querySelector('select[name="interest"]');
    var btn = form.querySelector('button[type="submit"]');
    if (!sel || !btn) return;
    var paid = !!PLAN_ID[sel.value];
    btn.textContent = paid ? 'Continue to payment →' : 'Send';
    var row = el('booking-field-row');
    if (row) row.hidden = !paid;
  }

  async function handleCheckout(planId, btn, bookingAt) {
    if (!B() || !B().configured) {              // demo mode → route to the enquiry form
      go('contact');
      preselectInterest(PLAN_INTEREST[planId]);
      if (bookingAt) setContactBooking(bookingAt);
      return;
    }
    var old = btn.textContent;
    btn.textContent = 'Redirecting…'; btn.disabled = true;
    var r = await B().startCheckout(planId, bookingAt);
    if (!r.ok) {
      btn.textContent = old; btn.disabled = false;
      showToast('Could not start checkout: ' + (r.error || 'unknown error'));
    }
  }

  /* ---------- Booking date/time picker (calendar + slots) ---------- */
  var bookingCb = null;      // called with the chosen ISO string on confirm
  var bookingView = null;    // first-of-month Date currently shown
  var bookingDay = null;     // selected day (Date at midnight)
  var bookingISO = null;     // selected full datetime (ISO string)
  var SLOT_GROUPS = [
    { label: 'Morning', times: ['06:00', '06:30', '07:00', '07:30', '08:00'] },
    { label: 'Evening', times: ['19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'] }
  ];

  function startOfToday() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function fmtSlot(iso) {
    return new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/London', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' (UK time)';
  }
  // Booking slots are FIXED UK (Europe/London) times, so the same slot is the
  // same moment for everyone wherever they are. Convert a chosen UK wall-clock
  // time to a correct UTC ISO string (handles BST/GMT automatically).
  function tzOffsetMs(timeZone, date) {
    var utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
    var loc = new Date(date.toLocaleString('en-US', { timeZone: timeZone })).getTime();
    return loc - utc;
  }
  function ukSlotToISO(y, m, d, hh, mm) {
    var guess = Date.UTC(y, m, d, hh, mm);
    return new Date(guess - tzOffsetMs('Europe/London', new Date(guess))).toISOString();
  }

  function openBooking(cb, presetISO) {
    bookingCb = cb || null;
    var base = presetISO ? new Date(presetISO) : new Date();
    bookingView = new Date(base.getFullYear(), base.getMonth(), 1);
    bookingISO = presetISO || null;
    bookingDay = presetISO ? new Date(base.getFullYear(), base.getMonth(), base.getDate()) : null;
    renderBookingCal(); renderBookingSlots(); updateBookingSummary();
    var c = el('booking-confirm'); if (c) c.disabled = !bookingISO;
    var m = el('booking-modal'); if (m) m.hidden = false;
  }
  function closeBooking() { var m = el('booking-modal'); if (m) m.hidden = true; }

  function renderBookingCal() {
    var cal = el('booking-cal'); if (!cal || !bookingView) return;
    var y = bookingView.getFullYear(), m = bookingView.getMonth();
    var first = new Date(y, m, 1);
    var startDow = (first.getDay() + 6) % 7;            // Monday-first grid
    var days = new Date(y, m + 1, 0).getDate();
    var today = startOfToday();
    var canPrev = !(y === today.getFullYear() && m === today.getMonth());
    var head = '<div class="cal-head">' +
      '<button type="button" class="cal-nav" data-cal-prev' + (canPrev ? '' : ' disabled') + '>‹</button>' +
      '<span class="cal-month">' + esc(first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })) + '</span>' +
      '<button type="button" class="cal-nav" data-cal-next>›</button></div>';
    var dows = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(function (d) { return '<span class="cal-dow">' + d + '</span>'; }).join('');
    var cells = '';
    for (var i = 0; i < startDow; i++) cells += '<span class="cal-cell cal-empty"></span>';
    for (var d = 1; d <= days; d++) {
      var date = new Date(y, m, d);
      var disabled = date < today;          // all 7 days open; only past dates blocked
      var sel = sameDay(date, bookingDay);
      cells += '<button type="button" class="cal-cell' + (disabled ? ' is-disabled' : '') + (sel ? ' is-selected' : '') + '"' +
        (disabled ? ' disabled' : '') + ' data-cal-day="' + d + '">' + d + '</button>';
    }
    cal.innerHTML = head + '<div class="cal-grid">' + dows + cells + '</div>';
  }

  function renderBookingSlots() {
    var box = el('booking-slots'); if (!box) return;
    if (!bookingDay) { box.innerHTML = '<div class="slots-hint">Pick a day to see available times.</div>'; return; }
    var now = new Date();
    var isToday = sameDay(bookingDay, startOfToday());
    box.innerHTML = SLOT_GROUPS.map(function (g) {
      var btns = g.times.map(function (t) {
        var p = t.split(':');
        var iso = ukSlotToISO(bookingDay.getFullYear(), bookingDay.getMonth(), bookingDay.getDate(), +p[0], +p[1]);
        var passed = isToday && new Date(iso).getTime() <= now.getTime();
        var sel = bookingISO === iso;
        return '<button type="button" class="slot' + (sel ? ' is-selected' : '') + '"' + (passed ? ' disabled' : '') + ' data-slot="' + t + '">' + t + '</button>';
      }).join('');
      return '<div class="slots-group"><div class="slots-group__label">' + g.label + '</div><div class="slots-grid">' + btns + '</div></div>';
    }).join('');
  }

  function updateBookingSummary() {
    var s = el('booking-selected'); if (!s) return;
    s.textContent = bookingISO ? 'Selected: ' + fmtSlot(bookingISO) : '';
  }

  function setContactBooking(iso) {
    var input = el('booking-field-input'), text = el('booking-field-text'), btn = el('booking-field');
    if (input) input.value = iso;
    if (text) text.textContent = fmtSlot(iso);
    if (btn) btn.classList.add('is-set');
  }

  /* ---------- Contact form ---------- */
  // Webinar signups are free & open: no account and no date/time slot needed.
  function isWebinarEnquiry() {
    var sel = document.querySelector('#contact-form select[name="interest"]');
    return !!(sel && sel.value === 'Webinar');
  }

  async function submitContact() {
    var form = el('contact-form');
    var thanks = el('contact-thanks');
    var fd = new FormData(form);
    var data = {};
    fd.forEach(function (v, k) { if (k !== 'cv') data[k] = v; });
    if (PLAN_ID[data.interest] && !data.booking_at) {   // only paid services need a slot
      showToast('Please choose a preferred date & time first.');
      openBooking(function (iso) { setContactBooking(iso); }, null);
      return;
    }
    var fileInput = form.querySelector('input[type="file"]');
    var file = fileInput && fileInput.files[0];
    var btn = form.querySelector('button[type="submit"]');
    var old = btn.textContent; btn.textContent = 'Sending…'; btn.disabled = true;
    var r = B() ? await B().submitEnquiry(data, file) : { ok: true, demo: true };
    if (!r.ok) {
      btn.textContent = old; btn.disabled = false;
      showToast('Sorry — could not send your enquiry. ' + (r.error || ''));
      return;
    }
    // Paid service selected → enquiry saved, now take payment for it.
    // The date/time chosen on the form is reused as the session time.
    var planId = PLAN_ID[data.interest];
    if (planId && B() && B().configured) {
      btn.textContent = 'Redirecting to payment…';
      var c = await B().startCheckout(planId, data.booking_at || null);
      if (!c.ok) {
        btn.textContent = old; btn.disabled = false;
        showToast('Could not start payment: ' + (c.error || 'unknown error'));
      }
      return;   // on success Stripe redirects away
    }
    // Free enquiry / webinar / not sure yet → show the thank-you state.
    btn.textContent = old; btn.disabled = false;
    form.classList.add('is-hidden');
    thanks.classList.add('is-visible');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function initForm() {
    var form = el('contact-form');
    if (form) {
      // Only PAID services need an account first; free options (snapshot,
      // webinar, general enquiry) submit straight away as a guest.
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (selectedIsPaid()) requireAuthThen(submitContact);
        else submitContact();
      });
      var interestSel = form.querySelector('select[name="interest"]');
      if (interestSel) interestSel.addEventListener('change', updateSubmitLabel);
      updateSubmitLabel();
    }
    var reset = el('reset-form');
    if (reset) {
      reset.addEventListener('click', function () {
        var f = el('contact-form'), thanks = el('contact-thanks');
        f.reset();
        thanks.classList.remove('is-visible');
        f.classList.remove('is-hidden');
        updateSubmitLabel();
      });
    }
  }

  /* ---------- Auth (clients + admin) ---------- */
  var authUser = null;
  var authIsAdmin = false;   // mirrors the server-side is_admin() result for UI only
  var authMode = 'signin';
  var pendingAction = null;   // runs after a logged-out user signs up/in via a gated action

  // Gate: booking & payment actions require an account first.
  function requireAuthThen(action) {
    if (authUser) { action(); return; }
    pendingAction = action;
    openAuth('signup');
  }

  function renderAuthSlot() {
    var slot = el('auth-slot'); if (!slot) return;
    if (authUser) {
      var link = authIsAdmin ? '<a class="navlink" href="dashboard.html">Dashboard</a>'
                             : '<a class="navlink" href="account.html">My account</a>';
      slot.innerHTML = link + '<button class="navlink" data-signout>Sign out</button>';
    } else {
      slot.innerHTML = '<button class="navlink" data-auth-open="signin">Sign in</button>' +
                       '<button class="btn btn--xs btn--dark" data-auth-open="signup">Sign up</button>';
    }
  }

  function prefillFromUser() {
    if (!authUser) return;
    var em = document.querySelector('#contact-form input[name="email"]');
    if (em && !em.value) em.value = authUser.email;
  }

  async function refreshAuth() {
    if (B() && B().configured) {
      authUser = await B().currentUser();
      authIsAdmin = authUser ? await B().isAdmin() : false;
    }
    renderAuthSlot();
    prefillFromUser();
  }

  function setAuthMode(mode) {
    authMode = mode;
    el('auth-title').textContent = mode === 'signup' ? 'Create your account' : 'Sign in';
    el('auth-submit').textContent = mode === 'signup' ? 'Create account' : 'Sign in';
    el('auth-toggle-text').textContent = mode === 'signup' ? 'Already have an account?' : 'New here?';
    el('auth-toggle').textContent = mode === 'signup' ? 'Sign in' : 'Create an account';
    var pw = document.querySelector('#auth-form input[name="password"]');
    if (pw) pw.setAttribute('autocomplete', mode === 'signup' ? 'new-password' : 'current-password');
    el('auth-error').hidden = true; el('auth-ok').hidden = true;
  }

  function openAuth(mode) {
    closeMenu();
    var m = el('auth-modal'); if (!m) return;
    setAuthMode(mode || 'signin');
    m.hidden = false;
    var i = m.querySelector('input[name="email"]'); if (i) i.focus();
  }
  function closeAuth() { var m = el('auth-modal'); if (m) m.hidden = true; }

  function initAuth() {
    var af = el('auth-form');
    if (!af) return;
    af.addEventListener('submit', async function (e) {
      e.preventDefault();
      var err = el('auth-error'), ok = el('auth-ok');
      err.hidden = true; ok.hidden = true;
      var btn = el('auth-submit');
      var old = btn.textContent; btn.textContent = 'Please wait…'; btn.disabled = true;
      var email = af.email.value, pw = af.password.value;
      var r = !B() ? { ok: false, error: 'Backend not configured yet.' }
            : authMode === 'signup' ? await B().signUp(email, pw)
            : await B().signIn(email, pw);
      btn.textContent = old; btn.disabled = false;
      if (!r.ok) { err.textContent = r.error || 'Something went wrong.'; err.hidden = false; return; }
      if (authMode === 'signup' && r.needsConfirm) {
        ok.textContent = 'Account created — check your email to confirm, then sign in to continue.';
        ok.hidden = false; setAuthMode('signin'); af.reset();
        pendingAction = null;
        return;
      }
      authUser = r.user || (B() ? await B().currentUser() : null);
      authIsAdmin = !!r.isAdmin;   // r.isAdmin came from the server is_admin() check
      renderAuthSlot(); prefillFromUser();
      if (authIsAdmin) { window.location.href = 'dashboard.html'; return; }
      closeAuth();
      if (pendingAction) { var act = pendingAction; pendingAction = null; act(); }
      else showToast('Signed in — welcome.');
    });
  }

  /* ---------- Toast + return-from-Stripe ---------- */
  function showToast(msg) {
    var t = el('pay-toast'); if (!t) return;
    el('pay-toast-text').textContent = msg; t.hidden = false;
  }
function initParams() {
  var p = new URLSearchParams(location.search);
  if (p.get('paid') === '1') window.location.replace('thankyou.html');
  else if (p.get('canceled') === '1') showToast('Checkout canceled — no charge was made.');
  if (p.has('paid') || p.has('canceled')) history.replaceState({}, '', location.pathname);
}
  /* ---------- Delegated clicks ---------- */
  document.addEventListener('click', function (e) {
    if (e.target.closest('#nav-burger')) { toggleMenu(); return; }
    // Tap outside the open menu to dismiss it.
    var navEl = el('nav');
    if (navEl && navEl.classList.contains('is-open') && !e.target.closest('#nav')) closeMenu();
    // Booking date/time picker
    if (e.target.closest('#booking-field')) { openBooking(function (iso) { setContactBooking(iso); }, el('booking-field-input').value || null); return; }
    if (e.target.closest('[data-booking-close]')) { closeBooking(); return; }
    if (e.target.closest('[data-cal-prev]')) { bookingView.setMonth(bookingView.getMonth() - 1); renderBookingCal(); return; }
    if (e.target.closest('[data-cal-next]')) { bookingView.setMonth(bookingView.getMonth() + 1); renderBookingCal(); return; }
    var calDay = e.target.closest('[data-cal-day]');
    if (calDay) { bookingDay = new Date(bookingView.getFullYear(), bookingView.getMonth(), +calDay.getAttribute('data-cal-day')); bookingISO = null; renderBookingCal(); renderBookingSlots(); updateBookingSummary(); var cc = el('booking-confirm'); if (cc) cc.disabled = true; return; }
    var slotBtn = e.target.closest('[data-slot]');
    if (slotBtn) { var sp = slotBtn.getAttribute('data-slot').split(':'); bookingISO = ukSlotToISO(bookingDay.getFullYear(), bookingDay.getMonth(), bookingDay.getDate(), +sp[0], +sp[1]); renderBookingSlots(); updateBookingSummary(); var cf = el('booking-confirm'); if (cf) cf.disabled = false; return; }
    if (e.target.closest('#booking-confirm')) { if (!bookingISO) return; var cb = bookingCb; bookingCb = null; closeBooking(); if (cb) cb(bookingISO); return; }
    var ao = e.target.closest('[data-auth-open]');
    if (ao) { openAuth(ao.getAttribute('data-auth-open') || 'signin'); return; }
    if (e.target.closest('[data-auth-close]')) { closeAuth(); return; }
    if (e.target.closest('[data-auth-toggle]')) { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); return; }
    if (e.target.closest('[data-toast-close]')) { var t = el('pay-toast'); if (t) t.hidden = true; return; }
    if (e.target.closest('[data-signout]')) { if (B()) B().signOut(); authUser = null; authIsAdmin = false; renderAuthSlot(); showToast('Signed out.'); return; }
    var pay = e.target.closest('[data-checkout]');
    if (pay) {
      var plan = pay.getAttribute('data-checkout');
      // Account first → pick a date & time → then Stripe checkout.
      requireAuthThen(function () { openBooking(function (iso) { handleCheckout(plan, pay, iso); }); });
      return;
    }
    var navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
      var page = navBtn.getAttribute('data-nav');
      var intent = navBtn.getAttribute('data-intent');
      var act = function () { go(page); if (intent) preselectInterest(intent); };
      // Only PAID-service CTAs require an account first; free options
      // (snapshot, webinar, general enquiry) go straight to the form.
      if (page === 'contact' && navBtn.classList.contains('btn') && intent && PLAN_ID[intent]) requireAuthThen(act);
      else act();
      return;
    }
    var faqBtn = e.target.closest('[data-faq]');
    if (faqBtn) {
      var i = parseInt(faqBtn.getAttribute('data-faq'), 10);
      openFaq = openFaq === i ? -1 : i;
      renderFaq();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAuth(); closeMenu(); closeBooking(); }
  });

  /* ---------- Boot ---------- */
  function init() {
    renderNav();
    renderMarquees();
    renderTrust();
    renderPricing();
    renderServices();
    renderSteps();
    renderFounderStats();
    renderVeroMeaning();
    renderApproach();
    renderResponsibleTags();
    renderFaq();
    initForm();
    initAuth();
    initParams();
    renderAuthSlot();
    if (B() && B().configured) {
      B().onAuthChange(async function (u) { authUser = u; authIsAdmin = u ? await B().isAdmin() : false; renderAuthSlot(); prefillFromUser(); });
      refreshAuth();
    }
    // Only run SPA routing on the single-page site. Standalone pages
    // (thank-you, etc.) have no .page sections — leave them as-is.
    if (document.querySelector('.page')) {
      var hash = (location.hash || '').replace('#', '');
      go(navDefs.some(function (n) { return n.key === hash; }) ? hash : 'home');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
