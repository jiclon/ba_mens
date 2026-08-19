/* ============================================================
   BA MENS — catalog.js
   Страница каталога. Товары приходят с бэкенда,
   фильтрация и сортировка выполняются на клиенте.
   ============================================================ */

(() => {
  'use strict';

  const API_URL = 'https://ba-mens.onrender.com';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const money = (n) => n.toLocaleString('ru-RU') + ' ₸';

  /* Полный список с сервера — не меняется после загрузки */
  let ALL = [];

  /* Текущее состояние фильтров */
  const state = { cat: 'all', brand: 'all', sort: 'default' };

  /* Русские подписи для категорий из базы */
  const CAT_LABEL = {
    clothing: 'Одежда',
    shoes:    'Обувь',
    perfume:  'Парфюм'
  };

  /* ── Загрузка ────────────────────────────────────────────── */
  async function load() {
    const grid = $('#catGrid');
    grid.innerHTML = '<p class="grid__state">Загружаем каталог…</p>';

    try {
      const res = await fetch(`${API_URL}/products`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      ALL = await res.json();
      buildBrands();
      apply();
    } catch (err) {
      console.error('Каталог не загрузился:', err);
      grid.innerHTML = '<p class="grid__state">Каталог временно недоступен</p>';
      $('#catCount').textContent = '';
    }
  }

  /* ── Кнопки брендов строятся из самих данных ─────────────── */
  function buildBrands() {
    const row = $('#brandRow');
    /* Set убирает повторы: два New Balance дадут одну кнопку */
    const brands = [...new Set(ALL.map((p) => p.brand))].sort();

    row.innerHTML =
      '<button class="chip chip--sm is-on" data-brand="all">Все бренды</button>' +
      brands.map((b) => `<button class="chip chip--sm" data-brand="${b}">${b}</button>`).join('');
  }

  /* ── Фильтрация и сортировка ─────────────────────────────── */
  function apply() {
    let list = ALL.filter((p) => p.in_stock);

    if (state.cat !== 'all')   list = list.filter((p) => p.category === state.cat);
    if (state.brand !== 'all') list = list.filter((p) => p.brand === state.brand);

    if (state.sort === 'cheap') list.sort((a, b) => a.price - b.price);
    if (state.sort === 'rich')  list.sort((a, b) => b.price - a.price);
    if (state.sort === 'brand') list.sort((a, b) => a.brand.localeCompare(b.brand, 'ru'));

    render(list);
    count(list.length);
  }

  function count(n) {
    const word = n % 10 === 1 && n % 100 !== 11 ? 'товар'
               : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'товара'
               : 'товаров';
    $('#catCount').textContent = n ? `${n} ${word}` : '';
  }

  /* ── Отрисовка ───────────────────────────────────────────── */
  function render(list) {
    const grid = $('#catGrid');

    if (!list.length) {
      grid.innerHTML = '<p class="grid__state">Ничего не нашлось — попробуйте другой фильтр</p>';
      return;
    }

    grid.innerHTML = list.map((p) => `
      <a class="card" href="product.html?id=${p.id}" data-fade>
        <div class="card__frame">
          <img src="${p.image || 'images/p-nike.jpg'}" alt="${p.brand} ${p.name}" loading="lazy" />
          <div class="tag ${p.old_price ? 'tag--sale' : ''}">
            <div class="tag__body">${money(p.price)}</div>
          </div>
        </div>
        <div class="card__body">
          <p class="card__brand">${p.brand}</p>
          <h3 class="card__name">${p.name}</h3>
          <div class="card__foot">
            ${p.old_price ? `<span class="card__old">${money(p.old_price)}</span>` : ''}
            <span class="card__price">${money(p.price)}</span>
            <span class="card__size">${p.size || ''}</span>
          </div>
        </div>
      </a>`).join('');

    fadeIn();
  }

  /* Мягкое появление карточек после смены фильтра */
  function fadeIn() {
    const cards = $$('#catGrid [data-fade]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || typeof gsap === 'undefined') {
      cards.forEach((el) => { el.style.opacity = 1; });
      return;
    }

    gsap.fromTo(cards,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.04 }
    );
  }

  /* ── Обработчики фильтров ────────────────────────────────── */
  function initFilters() {
    /* Категории */
    $('#catRow').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      state.cat = btn.dataset.cat;
      $$('#catRow .chip').forEach((b) => b.classList.toggle('is-on', b === btn));
      apply();
    });

    /* Бренды — слушаем контейнер, потому что кнопки создаются позже */
    $('#brandRow').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-brand]');
      if (!btn) return;
      state.brand = btn.dataset.brand;
      $$('#brandRow .chip').forEach((b) => b.classList.toggle('is-on', b === btn));
      apply();
    });
  }

  /* ── Своя сортировка вместо системного select ────────────── */
  function initSort() {
    const box  = $('#sortBox');
    const btn  = $('#sortBtn');
    const menu = $('#sortMenu');
    const val  = $('#sortVal');
    if (!box || !btn || !menu) return;

    const close = () => {
      box.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = box.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });

    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('[data-sort]');
      if (!opt) return;

      state.sort = opt.dataset.sort;
      val.textContent = opt.textContent;

      $$('.sortbox__opt', menu).forEach((o) => {
        const on = o === opt;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-selected', String(on));
      });

      close();
      apply();
    });

    /* Закрываем по клику мимо и по Escape */
    document.addEventListener('click', (e) => {
      if (!box.contains(e.target)) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
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

  /* ── Плавный скролл ──────────────────────────────────────── */
  function initSmoothScroll() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof Lenis === 'undefined') return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ── Старт ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    /* Категория может прийти из ссылки: catalog.html?cat=shoes */
    const fromUrl = new URLSearchParams(location.search).get('cat');
    if (fromUrl && CAT_LABEL[fromUrl]) {
      state.cat = fromUrl;
      $$('#catRow .chip').forEach((b) => b.classList.toggle('is-on', b.dataset.cat === fromUrl));
    }

    initMenu();
    initFilters();
    initSort();
    initSmoothScroll();
    load();
  });
})();