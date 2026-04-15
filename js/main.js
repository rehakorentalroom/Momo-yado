/* ============================================================
   百の宿 — main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initHeroSlideshow();
  initScrollReveal();
  initSmoothScroll();
  initReviews();
  initParallax();
});

/* --- 1. HEADER: transparent → solid on scroll --- */
function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const THRESHOLD = 80;

  const onScroll = () => {
    const scrolled = window.scrollY > THRESHOLD;
    header.classList.toggle('header--solid', scrolled);
    header.classList.toggle('header--transparent', !scrolled);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --- 2. MOBILE NAV: hamburger toggle --- */
function initMobileNav() {
  const toggle = document.querySelector('.header__menu-toggle');
  const nav    = document.querySelector('.header__nav');
  if (!toggle || !nav) return;

  const links = nav.querySelectorAll('a');

  const open = () => {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'メニューを閉じる');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    nav.classList.contains('is-open') ? close() : open();
  });

  links.forEach(link => link.addEventListener('click', close));

  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-open') &&
        !nav.contains(e.target) &&
        !toggle.contains(e.target)) {
      close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) close();
  });
}

/* --- 3. HERO SLIDESHOW --- */
function initHeroSlideshow() {
  const slides  = document.querySelectorAll('.hero__slide');
  const dots    = document.querySelectorAll('.hero__dot');
  if (!slides.length) return;

  const INTERVAL = 5000;
  let current = 0;
  let timer;

  // Set background images from data-src
  slides.forEach(slide => {
    if (slide.dataset.src) {
      slide.style.backgroundImage = `url('${slide.dataset.src}')`;
    }
  });

  const goTo = (index) => {
    slides[current].classList.remove('hero__slide--active');
    if (dots[current]) dots[current].classList.remove('hero__dot--active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('hero__slide--active');
    if (dots[current]) dots[current].classList.add('hero__dot--active');
  };

  const next = () => goTo(current + 1);

  const startTimer = () => {
    timer = setInterval(next, INTERVAL);
  };

  const stopTimer = () => {
    clearInterval(timer);
  };

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      stopTimer();
      goTo(i);
      startTimer();
    });
  });

  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    heroEl.addEventListener('mouseenter', stopTimer);
    heroEl.addEventListener('mouseleave', startTimer);
  }

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopTimer() : startTimer();
  });

  // Respect reduced motion: disable auto-play
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    startTimer();
  }
}

/* --- 4. SCROLL REVEAL --- */
function initScrollReveal() {
  const selectors = [
    '.concept__text',
    '.concept__image-wrap',
    '.room-card',
    '.amenities',
    '.access__info',
    '.access__map',
    '.booking__desc',
    '.booking__cta-wrap',
    '.booking__card',
  ];

  const targets = document.querySelectorAll(selectors.join(', '));
  if (!targets.length) return;

  // Track stagger per parent group
  const parentCounters = new Map();

  targets.forEach((el) => {
    el.classList.add('reveal');

    const parent = el.parentElement;
    const count  = parentCounters.get(parent) || 0;
    if (count === 1) el.classList.add('reveal--delay-1');
    if (count === 2) el.classList.add('reveal--delay-2');
    parentCounters.set(parent, count + 1);
  });

  if (!('IntersectionObserver' in window)) {
    // Fallback: show all immediately
    targets.forEach(el => el.classList.add('reveal--visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(el => observer.observe(el));
}

/* --- 5. SMOOTH SCROLL (with header offset) --- */
function initSmoothScroll() {
  const header = document.getElementById('site-header');

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href   = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();

      const headerH = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* --- 6. PARALLAX (booking section bg) --- */
function initParallax() {
  const bg = document.querySelector('.booking__bg');
  if (!bg) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const update = () => {
    const section = bg.closest('.booking');
    if (!section) return;
    const rect     = section.getBoundingClientRect();
    const progress = rect.top / window.innerHeight;
    bg.style.transform = `translateY(${progress * 25}px)`;
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* --- 7. REVIEWS --- */
async function initReviews() {
  const grid    = document.getElementById('reviews-grid');
  const avgEl   = document.getElementById('reviews-avg');
  const starsEl = document.getElementById('reviews-stars');
  const countEl = document.getElementById('reviews-count');
  const platformsEl = document.getElementById('reviews-platforms');
  if (!grid) return;

  let data;
  try {
    const res = await fetch('reviews.json?v=' + Date.now());
    if (!res.ok) throw new Error('fetch failed');
    data = await res.json();
  } catch (e) {
    grid.innerHTML = '<p class="reviews__error">口コミの読み込みに失敗しました。</p>';
    return;
  }

  const reviews = data.reviews || [];
  if (!reviews.length) {
    grid.innerHTML = '<p class="reviews__loading">口コミはまだありません。</p>';
    return;
  }

  // --- サマリー計算 ---
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const avgRounded = Math.round(avg * 10) / 10;

  const airbnbCount   = reviews.filter(r => r.platform === 'Airbnb').length;
  const bookingCount  = reviews.filter(r => r.platform === 'Booking.com').length;

  avgEl.textContent   = avgRounded.toFixed(1);
  starsEl.innerHTML   = renderStars(avg);
  countEl.textContent = reviews.length + '件の口コミ';

  const badges = [];
  if (airbnbCount)  badges.push(`<span class="reviews__platform-badge reviews__platform-badge--airbnb">Airbnb ${airbnbCount}件</span>`);
  if (bookingCount) badges.push(`<span class="reviews__platform-badge reviews__platform-badge--booking">Booking.com ${bookingCount}件</span>`);
  platformsEl.innerHTML = badges.join('');

  // --- カード生成 ---
  grid.innerHTML = reviews.map((r, i) => `
    <article class="review-card reveal reveal--delay-${i % 3}" role="article">
      <div class="review-card__header">
        <div class="review-card__avatar" aria-hidden="true">${getInitial(r.author)}</div>
        <div class="review-card__meta">
          <span class="review-card__author">${escHtml(r.author)}</span>
          <span class="review-card__date">${escHtml(r.date)}</span>
        </div>
        <span class="review-card__platform review-card__platform--${r.platform === 'Airbnb' ? 'airbnb' : 'booking'}">${escHtml(r.platform)}</span>
      </div>
      <div class="review-card__stars" aria-label="評価${r.rating}点">${renderStars(r.rating)}</div>
      <p class="review-card__comment">${escHtml(r.comment)}</p>
    </article>
  `).join('');

  // スクロールリビールを新カードにも適用
  const newCards = grid.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('reveal--visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    newCards.forEach(el => obs.observe(el));
  } else {
    newCards.forEach(el => el.classList.add('reveal--visible'));
  }
}

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function getInitial(name) {
  return name ? name.trim()[0].toUpperCase() : '?';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
