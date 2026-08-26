const html = document.documentElement;
const btn = document.getElementById('themeToggle');
const icon = document.getElementById('toggleIcon');
const label = document.getElementById('toggleLabel');
const btnMobile = document.getElementById('themeToggleMobile');
const iconMobile = document.getElementById('toggleIconMobile');
const labelMobile = document.getElementById('toggleLabelMobile');
const nav = document.getElementById('main-nav');
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
const progressBar = document.getElementById('scroll-progress');
const backToTop = document.getElementById('back-to-top');

const saved = localStorage.getItem('skv-theme')
  || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
applyTheme(saved);

btn.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('skv-theme', next);
});

btnMobile.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('skv-theme', next);
});

function applyTheme(t) {
  html.setAttribute('data-theme', t);
  const isDark = t === 'dark';
  // Desktop toggle
  icon.textContent = isDark ? '☀️' : '🌙';
  label.textContent = isDark ? 'Light' : 'Dark';
  btn.setAttribute('aria-label', isDark ? 'Switch to Light mode' : 'Switch to Dark mode');
  btn.setAttribute('aria-pressed', String(isDark));
  // Mobile toggle
  iconMobile.textContent = isDark ? '☀️' : '🌙';
  labelMobile.textContent = isDark ? 'Switch to Light' : 'Switch to Dark';
  btnMobile.setAttribute('aria-label', isDark ? 'Switch to Light mode' : 'Switch to Dark mode');
  btnMobile.setAttribute('aria-pressed', String(isDark));
  syncNavBg();
}

function syncNavBg() {
  const dark = html.getAttribute('data-theme') === 'dark';
  if (window.scrollY > 50) {
    nav.style.background = dark ? 'rgba(10,10,15,0.97)' : 'rgba(244,244,249,0.98)';
  } else {
    nav.style.background = dark ? 'rgba(10,10,15,0.72)' : 'rgba(244,244,249,0.8)';
  }

  // Scroll progress bar
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';

  // Back to top visibility
  backToTop.classList.toggle('visible', scrollTop > 400);
}
window.addEventListener('scroll', syncNavBg, { passive: true });

// back to top
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- Production-grade focus trap helpers ---
function getMenuFocusable() {
  return Array.from(mobileNav.querySelectorAll(
    'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => {
    const s = window.getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0;
  });
}

function openMobileNav() {
  mobileNav.classList.add('open');
  hamburger.classList.add('open');
  nav.classList.add('nav-open');
  hamburger.setAttribute('aria-expanded', 'true');
  mobileNav.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  // Move focus into menu (a11y: screen reader announces menu content)
  requestAnimationFrame(() => {
    const first = getMenuFocusable()[0];
    if (first) first.focus();
  });
}

function closeMobileNav(returnFocus) {
  mobileNav.classList.remove('open');
  hamburger.classList.remove('open');
  nav.classList.remove('nav-open');
  hamburger.setAttribute('aria-expanded', 'false');
  mobileNav.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (returnFocus !== false) hamburger.focus();
}

// hamburger toggle
hamburger.addEventListener('click', () => {
  mobileNav.classList.contains('open') ? closeMobileNav() : openMobileNav();
});

// close mobile nav on link click
document.querySelectorAll('.mobile-link').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    const target = document.querySelector(a.getAttribute('href'));
    closeMobileNav();

    if (target) {
      // Wait one frame for layout to settle (overflow restored, menu hidden)
      // before scrolling — fixes race condition where scroll fired before re-render
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // After scroll settles, force-reveal any fade-up elements in viewport
        // (IntersectionObserver can miss programmatic scrolls in some browsers)
        setTimeout(() => {
          document.querySelectorAll('.fade-up:not(.visible)').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
              el.classList.add('visible');
            }
          });
        }, 800);
      });
    }
  });
});

// Escape + Tab focus trap for mobile nav (WCAG 2.1 AA)
document.addEventListener('keydown', e => {
  if (!mobileNav.classList.contains('open')) return;

  if (e.key === 'Escape') {
    closeMobileNav();
    return;
  }

  if (e.key === 'Tab') {
    const focusable = getMenuFocusable();
    if (focusable.length === 0) { e.preventDefault(); return; }
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }
});

// scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// smooth nav links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) {
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (t.hasAttribute('tabindex')) t.focus({ preventScroll: true });
    }
  });
});

// active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' });
sections.forEach(s => navObserver.observe(s));

// copyright year
document.getElementById('copy-year').textContent = new Date().getFullYear();

window.addEventListener("load", () => {
  const maniFestLink = document.createElement("link")
  maniFestLink.rel = "manifest";
  maniFestLink.href = "./manifest.json";
  document.head.appendChild(maniFestLink);
})