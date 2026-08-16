/* ============================================================
   BA MENS — main.js
   Товары пока лежат прямо здесь. Когда будет готов бэкенд —
   массив PRODUCTS заменяется на fetch(`${API_URL}/products`).
   ============================================================ */

(() => {
  'use strict';

  /* ── Данные (временно, до подключения API) ───────────────── */
  const PRODUCTS = [
    { brand: 'Nike',           name: 'Tech Tracksuit',        price: 24900, image: 'images/p-nike.jpg',     size: 'M — XL' },
    { brand: 'New Balance',    name: '1906R Grey Green',      price: 24500, image: 'images/p-nb-green.jpg', size: '39 — 45' },
    { brand: 'Tommy Hilfiger', name: 'Костюм Half-Zip',       price: 16500, image: 'images/p-tommy.jpg',    size: 'M — XL' },
    { brand: 'Stüssy',         name: 'Футболка Basic',        price: 14500, image: 'images/p-stussy.jpg',   size: 'S — XXL' },
    { brand: 'New Balance',    name: '860v2 Black Gold',      price: 24500, image: 'images/p-nb-black.jpg', size: '44 — 45' },
    { brand: 'Reebok',         name: 'Футболка Sport',        price: 13500, image: 'images/p-reebok.jpg',   size: 'S — XXL' },
    { brand: 'Nomads',         name: 'Футболка Qazaqstan',    price: 13500, image: 'images/p-nomads.jpg',   size: 'S — XXL' },
    { brand: 'Givenchy',       name: 'Gentleman Parfum',      price: 12950, old: 18500, image: 'images/p-givenchy.jpg', size: '100 мл' }
  ];

  const BRANDS = ['Nike', 'Tommy Hilfiger', 'New Balance', 'Reebok', 'Stüssy', 'Creed', 'Dior', 'Tom Ford', 'Chanel', 'Givenchy'];

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const money = (n) => n.toLocaleString('ru-RU') + ' ₸';

  /* ── Каталог ─────────────────────────────────────────────── */
  function renderGrid() {
    const grid = $('#grid');
    if (!grid) return;

    grid.innerHTML = PRODUCTS.map((p) => `
      <article class="card" data-reveal>
        <div class="card__frame">
          <img src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy" />
          <div class="tag ${p.old ? 'tag--sale' : ''}">
            <div class="tag__body">${money(p.price)}</div>
          </div>
        </div>
        <div class="card__body">
          <p class="card__brand">${p.brand}</p>
          <h3 class="card__name">${p.name}</h3>
          <div class="card__foot">
            ${p.old ? `<span class="card__old">${money(p.old)}</span>` : ''}
            <span class="card__price">${money(p.price)}</span>
            <span class="card__size">${p.size}</span>
          </div>
        </div>
      </article>`).join('');
  }

  /* ── Бегущая строка брендов ──────────────────────────────── */
  function renderTicker() {
    const track = $('#ticker');
    if (!track) return;
    const row = BRANDS.map((b) => `<span class="ticker__item">${b}</span>`).join('');
    track.innerHTML = row + row; // дублируем для бесшовной прокрутки
  }

  /* ── Меню ────────────────────────────────────────────────── */
  function initMenu() {
    const burger = $('#burger');
    const drawer = $('#drawer');
    if (!burger || !drawer) return;

    const close = () => {
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
    };

    burger.addEventListener('click', () => {
      const open = drawer.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      drawer.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('is-locked', open);
    });

    $$('.drawer__nav a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* ── Шапка при скролле ───────────────────────────────────── */
  function initHeader() {
    const head = $('#head');
    if (!head) return;
    const onScroll = () => head.classList.toggle('is-stuck', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Плавный скролл (Lenis) ──────────────────────────────── */
  let lenis = null;
  function initSmoothScroll() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof Lenis === 'undefined') return;

    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);

    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }
  }

  /* ── Якорные ссылки ──────────────────────────────────────── */
  function initAnchors() {
    $$('[data-link]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || !id.startsWith('#')) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -70 });
        else target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* ── Анимации ────────────────────────────────────────────── */
  function initMotion() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof gsap === 'undefined') {
      $$('[data-reveal]').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    /* Вступление: буквы имени поднимаются, фигура проявляется */
    const intro = gsap.timeline({ delay: 0.35 });
    intro
      .from('.hero__ch', { yPercent: 108, duration: 1.05, ease: 'power4.out', stagger: 0.045 })
      .from('.hero__figure', { yPercent: 8, opacity: 0, duration: 1.1, ease: 'power3.out' }, '-=0.75')
      .from('.hero__eyebrow, .hero__base', { y: 22, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 }, '-=0.8');

    /* Буквы медленно расходятся при скролле, фигура остаётся */
    gsap.to('.hero__word', {
      scale: 1.14, opacity: 0.35, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
    });
    gsap.to('.hero__figure', {
      yPercent: -12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
    });

    /* Бесконечная лента брендов */
    const track = $('#ticker');
    if (track) {
      gsap.to(track, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });
    }

    /* Появление блоков */
    $$('[data-reveal]').forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.95, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  }

  /* ── Прелоадер ───────────────────────────────────────────── */
  function hideLoader() {
    const el = $('#loader');
    if (el) setTimeout(() => el.classList.add('is-done'), 900);
  }

  /* ── Старт ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    renderTicker();
    renderGrid();
    initMenu();
    initHeader();
    initSmoothScroll();
    initAnchors();
    initMotion();
    hideLoader();
  });
})();
