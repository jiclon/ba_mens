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

  /* Бренды и сколько товаров у каждого */
  let BRANDS = [];
  let BRAND_COUNTS = {};

  /* Текущее состояние фильтров */
  const state = { cat: 'all', brand: 'all', sort: 'default', page: 1 };

  /* Сколько товаров на одной странице */
  const PER_PAGE = 12;

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

  /* ── Список брендов внутри выпадающего блока ─────────────── */
  /* Раньше все бренды выводились лентой кнопок. При сотне брендов
     это занимало пол-экрана, поэтому теперь выпадающий список с поиском. */
  function buildBrands() {
    /* считаем, сколько товаров у каждого бренда — только те, что в наличии */
    const counts = {};
    ALL.filter((p) => p.in_stock).forEach((p) => {
      counts[p.brand] = (counts[p.brand] || 0) + 1;
    });

    BRANDS = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'ru'));
    BRAND_COUNTS = counts;

    renderBrandList('');
  }

  function renderBrandList(query) {
    const list = $('#brandList');
    if (!list) return;

    const q = query.trim().toLowerCase();
    const shown = q ? BRANDS.filter((b) => b.toLowerCase().includes(q)) : BRANDS;

    const total = ALL.filter((p) => p.in_stock).length;

    let html = `
      <button class="pickbox__opt ${state.brand === 'all' ? 'is-on' : ''}"
              role="option" data-brand="all">
        <span>Все бренды</span><span class="pickbox__num">${total}</span>
      </button>`;

    if (!shown.length) {
      html += '<p class="pickbox__empty">Такого бренда нет</p>';
    } else {
      html += shown.map((b) => `
        <button class="pickbox__opt ${state.brand === b ? 'is-on' : ''}"
                role="option" data-brand="${b}">
          <span>${b}</span><span class="pickbox__num">${BRAND_COUNTS[b]}</span>
        </button>`).join('');
    }

    list.innerHTML = html;
  }

  /* ── Фильтрация и сортировка ─────────────────────────────── */
  function apply() {
    let list = ALL.filter((p) => p.in_stock);

    if (state.cat !== 'all')   list = list.filter((p) => p.category === state.cat);
    if (state.brand !== 'all') list = list.filter((p) => p.brand === state.brand);

    if (state.sort === 'cheap') list.sort((a, b) => a.price - b.price);
    if (state.sort === 'rich')  list.sort((a, b) => b.price - a.price);
    if (state.sort === 'brand') list.sort((a, b) => a.brand.localeCompare(b.brand, 'ru'));

    /* если после смены фильтра страниц стало меньше — возвращаемся на первую */
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (state.page > pages) state.page = 1;

    const from = (state.page - 1) * PER_PAGE;
    render(list.slice(from, from + PER_PAGE));
    renderPager(list.length, pages);
    count(list.length);
  }

  /* ── Переход по страницам ────────────────────────────────── */
  function renderPager(total, pages) {
    const pager = $('#pager');
    if (!pager) return;

    if (pages < 2) { pager.hidden = true; pager.innerHTML = ''; return; }
    pager.hidden = false;

    const cur = state.page;

    /* какие номера показывать: первая, последняя, текущая и соседние */
    const nums = [];
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || Math.abs(i - cur) <= 1) nums.push(i);
    }

    let html = `<button class="pager__arrow" data-page="${cur - 1}"
                  ${cur === 1 ? 'disabled' : ''} aria-label="Назад">‹</button>`;

    let prev = 0;
    nums.forEach((n) => {
      if (n - prev > 1) html += '<span class="pager__dots">…</span>';
      html += `<button class="pager__num ${n === cur ? 'is-on' : ''}" data-page="${n}">${n}</button>`;
      prev = n;
    });

    html += `<button class="pager__arrow" data-page="${cur + 1}"
               ${cur === pages ? 'disabled' : ''} aria-label="Вперёд">›</button>`;

    pager.innerHTML = html;
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
      state.page = 1;
      $$('#catRow .chip').forEach((b) => b.classList.toggle('is-on', b === btn));
      apply();
    });

    /* Переход по страницам */
    $('#pager').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;

      state.page = Number(btn.dataset.page);
      apply();
      scrollToGrid();
    });
  }

  /* После смены страницы возвращаем к началу сетки, а не к самому верху */
  function scrollToGrid() {
    const top = $('.catbody').getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  /* ── Выбор бренда ────────────────────────────────────────── */
  function initBrandBox() {
    const box    = $('#brandBox');
    const btn    = $('#brandBtn');
    const menu   = $('#brandMenu');
    const val    = $('#brandVal');
    const search = $('#brandSearch');
    const list   = $('#brandList');
    if (!box || !btn || !menu) return;

    const close = () => {
      box.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = box.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      if (open) {
        search.value = '';
        renderBrandList('');
        /* на телефоне клавиатура закрывает список — фокус только на широком экране */
        if (window.innerWidth > 720) setTimeout(() => search.focus(), 60);
      }
    });

    search.addEventListener('input', (e) => renderBrandList(e.target.value));
    search.addEventListener('click', (e) => e.stopPropagation());

    list.addEventListener('click', (e) => {
      const opt = e.target.closest('[data-brand]');
      if (!opt) return;

      state.brand = opt.dataset.brand;
      state.page = 1;
      val.textContent = state.brand === 'all' ? 'Все бренды' : state.brand;

      close();
      apply();
    });

    document.addEventListener('click', (e) => { if (!box.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
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
      state.page = 1;
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
    initBrandBox();
    initSort();
    initSmoothScroll();
    load();
  });
})();