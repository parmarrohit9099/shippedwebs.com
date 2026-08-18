/* Shared across index.html and privacy.html. Every DOM lookup is guarded so a
   page that lacks a given element (e.g. the privacy page has no hero/form)
   simply skips that block instead of throwing. */

const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- TERMINAL TYPING (hero only) ---------- */
(function () {
  const term = document.getElementById('termBody');
  if (!term) return;

  const lines = [
    { text: '<span class="prompt">$</span> whoami', delay: 0 },
    { text: 'devops-engineer · full-stack builder', delay: 500 },
    { text: '<span class="prompt">$</span> ./build-your-site.sh', delay: 1100 },
    { text: '[design]   ✓ locked', delay: 1900 },
    { text: '[build]    ✓ compiled', delay: 2500 },
    { text: '[deploy]   ✓ pushed to production', delay: 3100 },
    { text: '[status]   <span style="color:#4ADE80">● live</span> — ready when you are', delay: 3800 },
  ];

  lines.forEach((line) => {
    const el = document.createElement('div');
    el.className = 'term-line';
    el.innerHTML = line.text;
    el.style.animationDelay = line.delay + 'ms';
    term.appendChild(el);
  });
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  setTimeout(() => term.appendChild(cursor), 4000);
})();

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
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = '☰';
  }));
})();

/* ---------- ACTIVE NAV LINK ON SCROLL ---------- */
(function () {
  const navSections = ['services', 'process', 'pricing', 'contact']
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
    '.section-head, .service-card, .stage-card, .price-card, .care-card, ' +
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
    '.services-grid, .process, .pricing-grid, .marketing-grid, .why-grid, ' +
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
        formStatus.textContent = 'Something went wrong — please try again or email directly.';
      }
    } catch (err) {
      formStatus.style.color = 'var(--signal)';
      formStatus.textContent = 'Something went wrong — please try again or email directly.';
    }
  });
})();
