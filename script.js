/* Shared across index.html and privacy.html. Every DOM lookup is guarded so a
   page that lacks a given element (e.g. the privacy page has no hero/form)
   simply skips that block instead of throwing. */

const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- FOOTER YEAR ---------- */
(function () {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

/* ---------- MOBILE MENU ---------- */
(function () {
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!menuBtn || !mobileMenu) return;

  menuBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', isOpen);
    menuBtn.textContent = isOpen ? '✕' : '☰';
  });
  mobileMenu.querySelectorAll('a, button').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = '☰';
  }));
})();

/* ---------- ACTIVE NAV LINK ON SCROLL ---------- */
(function () {
  const navSections = ['work', 'services', 'process', 'pricing', 'contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  if (!navSections.length) return;

  const navAnchors = document.querySelectorAll('.nav-links a, .mobile-menu a:not(.nav-cta)');
  const setActiveNav = () => {
    let current = null;
    navSections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 140) current = sec.id;
    });
    navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  };
  window.addEventListener('scroll', setActiveNav, { passive: true });
  setActiveNav();
})();

/* ---------- SCROLL REVEAL (with per-grid stagger) ---------- */
(function () {
  const revealTargets = document.querySelectorAll(
    '.section-head, .work-card, .service-card, .stage-card, .price-card, .care-card, ' +
    '.marketing-head, .mkt-card, .pay-methods, ' +
    '.why-item, .testimonial-card, .faq-item, .contact-box, ' +
    '.legal-head, .legal-block'
  );
  if (!revealTargets.length) return;

  revealTargets.forEach(el => el.classList.add('reveal'));

  /* Stagger items inside a shared grid/row: each sibling reveal-target waits a
     little longer than the one before it, so a grid arrives in a wave rather
     than all at once. Overrides the CSS nth-child fallback. */
  const groups = document.querySelectorAll(
    '.work-grid, .services-grid, .process, .pricing-grid, .marketing-grid, .why-grid, ' +
    '.testimonial-grid, .faq-list'
  );
  groups.forEach(group => {
    const items = [...group.children].filter(c => c.classList.contains('reveal'));
    items.forEach((item, i) => {
      item.style.transitionDelay = Math.min(i * 70, 420) + 'ms';
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach(el => observer.observe(el));
})();

/* ---------- FAQ ACCORDION ---------- */
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  if (!q) return;
  q.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

/* ---------- SCROLL PROGRESS BAR ---------- */
(function () {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    bar.style.width = pct + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();

/* ---------- GENTLE BACKGROUND PARALLAX ---------- */
(function () {
  if (prefersReducedMotion) return;
  let ticking = false;
  const apply = () => {
    // move the ambient glow at ~12% of scroll for a subtle sense of depth
    document.body.style.setProperty('--parallax-y', (window.scrollY * 0.12) + 'px');
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(apply); ticking = true; }
  }, { passive: true });
})();

/* ---------- BACK TO TOP ---------- */
(function () {
  const backToTop = document.getElementById('backToTop');
  if (!backToTop) return;
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ---------- CONTACT FORM ---------- */
(function () {
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  if (!contactForm || !formStatus) return;

  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    formStatus.style.color = 'var(--muted)';
    formStatus.textContent = 'Sending…';

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        formStatus.style.color = 'var(--live)';
        formStatus.textContent = '✓ Request received — I\'ll be in touch within 24 hours.';
        contactForm.reset();
      } else {
        formStatus.style.color = 'var(--signal)';
        formStatus.innerHTML = 'Something went wrong — please try again, or email <a href="mailto:hello@shippedwebs.com">hello@shippedwebs.com</a> directly.';
      }
    } catch (err) {
      formStatus.style.color = 'var(--signal)';
      formStatus.innerHTML = 'Something went wrong — please try again, or email <a href="mailto:hello@shippedwebs.com">hello@shippedwebs.com</a> directly.';
    }
  });
})();

/* ==========================================================================
   BOOKING — "Book a 1:1 meeting"

   Availability is computed here, in the browser, from BOOKING below. There is
   no calendar API behind it, which has two consequences worth being honest
   about: a slot you are already busy in will still be offered, and two people
   can request the same slot. The confirmation copy therefore says the time is
   *held*, not booked — you confirm by replying.

   Everything is rendered in ONE timezone (BOOKING.timeZone). A visitor in
   London and you in India then read the same numbers off the same screen, and
   the email that lands in your inbox states the zone explicitly.

   To change your hours, edit BOOKING and nothing else.
   ========================================================================== */
(function () {
  const overlay = document.getElementById('bookingOverlay');
  if (!overlay) return;

  const BOOKING = {
    timeZone: 'Asia/Kolkata',   /* the studio's zone — all times shown in this */
    tzLabel: 'Asia/Kolkata (IST)',
    durationMins: 30,
    slotStepMins: 60,           /* start a new slot every hour */
    workingDays: [1, 2, 3, 4, 5, 6],  /* 0 = Sunday. Mon–Sat. */
    dayStart: '10:00',
    dayEnd: '19:00',            /* last slot must END by this time */
    breaks: [['13:00', '14:00']],
    leadTimeHours: 4,           /* no same-day bookings inside this window */
    maxDaysAhead: 45,
    eventTitle: 'Discovery call — Shipped.',
    eventDetails: 'Project discovery call with Shipped. The Google Meet link follows by email once the time is confirmed.'
  };

  /* ---------- small date helpers ----------
     Dates are handled as plain {y, m, d} calendar fields, never as local Date
     objects, so the visitor's own offset can't shift a day boundary. The only
     Date use is Date.UTC as a fixed-offset arithmetic surface. */
  const pad = n => String(n).padStart(2, '0');
  const toMins = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const fromMins = t => pad(Math.floor(t / 60)) + ':' + pad(t % 60);
  const dayNum = (y, m, d) => Date.UTC(y, m - 1, d);
  const dowOf = (y, m, d) => new Date(dayNum(y, m, d)).getUTCDay();
  const daysApart = (a, b) => Math.round((b - a) / 86400000);
  const key = (y, m, d) => y + '-' + pad(m) + '-' + pad(d);

  const zoneFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: BOOKING.timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });

  /* "now", as the studio's wall clock reads it */
  function studioNow() {
    const p = {};
    zoneFmt.formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
    return {
      y: +p.year, m: +p.month, d: +p.day,
      /* some engines render midnight as "24" under hour12:false */
      mins: (+p.hour % 24) * 60 + (+p.minute)
    };
  }

  const monthFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' });
  const longDateFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const prettyDate = (y, m, d) => longDateFmt.format(new Date(dayNum(y, m, d)));

  /* ---------- availability ---------- */
  const breaks = BOOKING.breaks.map(([a, b]) => [toMins(a), toMins(b)]);

  /* Slot start times (in minutes past midnight) open on a given day, or []. */
  function slotsFor(y, m, d, now) {
    now = now || studioNow();
    const ahead = daysApart(dayNum(now.y, now.m, now.d), dayNum(y, m, d));
    if (ahead < 0 || ahead > BOOKING.maxDaysAhead) return [];
    if (BOOKING.workingDays.indexOf(dowOf(y, m, d)) === -1) return [];

    /* today is special: only slots past the notice window survive */
    const earliest = ahead === 0 ? now.mins + BOOKING.leadTimeHours * 60 : -Infinity;
    const open = toMins(BOOKING.dayStart);
    const close = toMins(BOOKING.dayEnd);
    const out = [];

    for (let t = open; t + BOOKING.durationMins <= close; t += BOOKING.slotStepMins) {
      if (t < earliest) continue;
      const clashes = breaks.some(([bs, be]) => t < be && t + BOOKING.durationMins > bs);
      if (!clashes) out.push(t);
    }
    return out;
  }

  /* ---------- elements ---------- */
  const modal = overlay.querySelector('.booking-modal');
  const steps = overlay.querySelectorAll('.booking-step');
  const calGrid = document.getElementById('calGrid');
  const calMonth = document.getElementById('calMonth');
  const calPrev = document.getElementById('calPrev');
  const calNext = document.getElementById('calNext');
  const calNote = document.getElementById('calNote');
  const slotHead = document.getElementById('slotHead');
  const slotList = document.getElementById('slotList');
  const picked = document.getElementById('bookingPicked');
  const pickedText = document.getElementById('bookingPickedText');
  const form = document.getElementById('bookingForm');
  const status = document.getElementById('bookingStatus');
  const submitBtn = document.getElementById('bookingSubmit');

  let view = null;        /* {y, m} — the month on screen */
  let chosen = null;      /* {y, m, d, start} — the slot the visitor picked */
  let lastTrigger = null; /* focus goes back here on close */

  /* config-driven copy, so BOOKING stays the single source of truth */
  document.getElementById('bookingDuration').textContent = BOOKING.durationMins + ' min';
  document.getElementById('bookingTz').textContent = BOOKING.tzLabel;
  calNote.textContent = 'All times in ' + BOOKING.tzLabel + '. Slots need at least '
    + BOOKING.leadTimeHours + ' hours’ notice.';

  /* ---------- step switching ---------- */
  function showStep(n) {
    steps.forEach(s => s.classList.toggle('active', s.dataset.step === String(n)));
    if (modal) modal.scrollTop = 0;
    const main = overlay.querySelector('.booking-main');
    if (main) main.scrollTop = 0;
  }

  /* ---------- calendar ---------- */
  function renderMonth() {
    const now = studioNow();
    const { y, m } = view;

    calMonth.textContent = monthFmt.format(new Date(dayNum(y, m, 1)));

    /* clamp navigation to the bookable window rather than letting the visitor
       page into months that can only ever be empty */
    const firstMonth = now.y * 12 + (now.m - 1);
    const lastDay = new Date(dayNum(now.y, now.m, now.d) + BOOKING.maxDaysAhead * 86400000);
    const lastMonth = lastDay.getUTCFullYear() * 12 + lastDay.getUTCMonth();
    const thisMonth = y * 12 + (m - 1);
    calPrev.disabled = thisMonth <= firstMonth;
    calNext.disabled = thisMonth >= lastMonth;

    calGrid.textContent = '';
    ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(d => {
      const el = document.createElement('div');
      el.className = 'cal-dow';
      el.textContent = d;
      calGrid.appendChild(el);
    });

    /* leading blanks so the 1st lands under its weekday */
    for (let i = 0; i < dowOf(y, m, 1); i++) {
      const el = document.createElement('div');
      el.className = 'cal-day blank';
      calGrid.appendChild(el);
    }

    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (let d = 1; d <= days; d++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-day';
      btn.textContent = d;
      btn.dataset.day = d;

      const open = slotsFor(y, m, d, now);
      btn.disabled = open.length === 0;
      if (btn.disabled) {
        btn.setAttribute('aria-label', prettyDate(y, m, d) + ' — no times available');
      } else {
        btn.setAttribute('aria-label', prettyDate(y, m, d) + ' — ' + open.length + ' times available');
      }
      if (y === now.y && m === now.m && d === now.d) btn.classList.add('is-today');
      if (chosen && chosen.y === y && chosen.m === m && chosen.d === d) btn.classList.add('is-selected');

      calGrid.appendChild(btn);
    }
  }

  function renderSlots(y, m, d) {
    const open = slotsFor(y, m, d);
    slotHead.textContent = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short'
    }).format(new Date(dayNum(y, m, d)));

    slotList.textContent = '';
    if (!open.length) {
      const p = document.createElement('p');
      p.className = 'slot-empty';
      p.textContent = 'No times left on this day.';
      slotList.appendChild(p);
      return;
    }
    open.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot-btn';
      b.textContent = fromMins(t);
      b.dataset.start = t;
      slotList.appendChild(b);
    });
  }

  /* ---------- picking ---------- */
  calGrid.addEventListener('click', e => {
    const btn = e.target.closest('.cal-day');
    if (!btn || btn.disabled || btn.classList.contains('blank')) return;
    calGrid.querySelectorAll('.cal-day.is-selected').forEach(el => el.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    const d = +btn.dataset.day;
    chosen = { y: view.y, m: view.m, d: d, start: null };
    renderSlots(view.y, view.m, d);
  });

  slotList.addEventListener('click', e => {
    const btn = e.target.closest('.slot-btn');
    if (!btn || !chosen) return;
    chosen.start = +btn.dataset.start;
    applyChoice();
    showStep(2);
    const first = document.getElementById('bkName');
    if (first) first.focus();
  });

  /* Push the chosen slot into the aside and into the hidden fields, so the
     email carries the time even though the visitor never typed it. */
  function applyChoice() {
    const { y, m, d, start } = chosen;
    const end = start + BOOKING.durationMins;
    const dateText = prettyDate(y, m, d);
    const timeText = fromMins(start) + ' – ' + fromMins(end);

    pickedText.textContent = dateText + ', ' + timeText;
    picked.hidden = false;

    document.getElementById('bkDate').value = dateText;
    document.getElementById('bkTime').value = timeText + ' (' + BOOKING.tzLabel + ')';
    document.getElementById('bkTzField').value = BOOKING.tzLabel;
    document.getElementById('bkSubject').value =
      'Meeting request — ' + key(y, m, d) + ' ' + fromMins(start) + ' ' + BOOKING.timeZone;

    /* the visitor's own zone, so you can tell at a glance whether the time is
       civilised at their end before you confirm it */
    try {
      document.getElementById('bkVisitorTz').value =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
    } catch (err) {
      document.getElementById('bkVisitorTz').value = 'unknown';
    }
  }

  calPrev.addEventListener('click', () => {
    view.m--; if (view.m < 1) { view.m = 12; view.y--; }
    renderMonth();
  });
  calNext.addEventListener('click', () => {
    view.m++; if (view.m > 12) { view.m = 1; view.y++; }
    renderMonth();
  });

  document.getElementById('bookingBack').addEventListener('click', () => {
    showStep(1);
    status.textContent = '';
  });

  /* ---------- submit ---------- */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!chosen || chosen.start === null) {
      showStep(1);
      return;
    }
    status.style.color = 'var(--muted)';
    status.textContent = 'Sending…';
    submitBtn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('bad response');

      document.getElementById('bookingWhen').textContent =
        pickedText.textContent + '  ·  ' + BOOKING.tzLabel;
      document.getElementById('bookingGcal').href = gcalLink();
      status.textContent = '';
      form.reset();
      showStep(3);
    } catch (err) {
      status.style.color = 'var(--signal)';
      status.textContent = 'Couldn’t send that — please try again, or message me on WhatsApp.';
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* Google Calendar's template URL takes wall-clock times plus a `ctz`, which
     saves converting to UTC and getting the offset subtly wrong. */
  function gcalLink() {
    const { y, m, d, start } = chosen;
    const stamp = t => y + pad(m) + pad(d) + 'T' + pad(Math.floor(t / 60)) + pad(t % 60) + '00';
    const q = new URLSearchParams({
      action: 'TEMPLATE',
      text: BOOKING.eventTitle,
      dates: stamp(start) + '/' + stamp(start + BOOKING.durationMins),
      ctz: BOOKING.timeZone,
      details: BOOKING.eventDetails
    });
    return 'https://calendar.google.com/calendar/render?' + q.toString();
  }

  /* ---------- open / close ---------- */
  function open(trigger) {
    lastTrigger = trigger || null;

    /* a finished booking starts clean; an interrupted one is picked back up —
       but the month is always re-rendered, so a tab left open overnight can't
       still be offering yesterday. */
    const finished = overlay.querySelector('.booking-step[data-step="3"]').classList.contains('active');
    if (finished || !chosen) reset(); else renderMonth();

    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('open'));
    document.getElementById('bookingClose').focus();
  }

  function reset() {
    const now = studioNow();
    view = { y: now.y, m: now.m };
    chosen = null;
    picked.hidden = true;
    status.textContent = '';
    renderMonth();
    slotHead.textContent = 'Pick a date';
    slotList.textContent = '';
    const p = document.createElement('p');
    p.className = 'slot-empty';
    p.textContent = 'Pick a day to see the open times.';
    slotList.appendChild(p);
    showStep(1);
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    /* wait out the fade before pulling it from the layout */
    setTimeout(() => { overlay.hidden = true; }, 260);
    if (lastTrigger) lastTrigger.focus();
  }

  document.querySelectorAll('[data-book]').forEach(btn => {
    btn.addEventListener('click', () => open(btn));
  });
  document.getElementById('bookingClose').addEventListener('click', close);
  document.getElementById('bookingDoneClose').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });

  /* keep tabbing inside the dialog while it's open */
  overlay.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = [...overlay.querySelectorAll(
      'button:not([disabled]), a[href], input, select, textarea'
    )].filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  reset();
})();
