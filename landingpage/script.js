/* ═══════════════════════════════════════════════════════
   VaagBanda — script.js
   ═══════════════════════════════════════════════════════ */

/* ══════════════════════════════════════
   NAV: Add scrolled shadow on scroll
══════════════════════════════════════ */
const nav = document.querySelector('nav');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.4)';
  } else {
    nav.style.boxShadow = 'none';
  }
});

/* ══════════════════════════════════════
   SMOOTH SCROLL for nav links
══════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ══════════════════════════════════════
   SCROLL REVEAL: Animate sections on scroll
══════════════════════════════════════ */
const revealElements = document.querySelectorAll(
  '.feature-card, .step, .team-card, .stat-card'
);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      // Stagger each card slightly
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, index * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObserver.observe(el);
});

/* ══════════════════════════════════════
   ACTIVE NAV LINK: Highlight on scroll
══════════════════════════════════════ */
const sections   = document.querySelectorAll('section[id]');
const navLinks   = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';

  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.style.color = '';
    if (link.getAttribute('href') === `#${current}`) {
      link.style.color = 'var(--crimson-light)';
    }
  });
});

/* ══════════════════════════════════════
   STAT COUNTER: Animate numbers on scroll
══════════════════════════════════════ */
function animateCounter(el, target, suffix = '') {
  let count = 0;
  const duration = 1200;
  const steps = 40;
  const increment = target / steps;
  const interval = duration / steps;

  const timer = setInterval(() => {
    count += increment;
    if (count >= target) {
      el.textContent = target + suffix;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(count) + suffix;
    }
  }, interval);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const statNums = entry.target.querySelectorAll('.stat-num');
      statNums.forEach(num => {
        const text = num.textContent.trim();
        if (text === '0₦') animateCounter(num, 0, '₦');
        if (text === '5+') animateCounter(num, 5, '+');
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);