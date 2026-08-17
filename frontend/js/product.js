/* ============================================================
   BA MENS — product.js
   Карточка одного товара. Какой именно — берётся из адреса:
   product.html?id=3
   ============================================================ */

(() => {
  'use strict';

  const API_URL = 'http://127.0.0.1:8000';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const money = (n) => n.toLocaleString('ru-RU') + ' ₸';

  const CAT_LABEL = {
    clothing: 'Одежда',
    shoes:    'Обувь',
    perfume:  'Парфюм',
    watch:    'Часы'
  };

  /* ── Загрузка ────────────────────────────────────────────── */
  async function load() {
    const id = new URLSearchParams(location.search).get('id');

    if (!id) {
      fail('Товар не выбран');
      return;
    }

    try {
      /* Один товар — один запрос */
      const res = await fetch(`${API_URL}/products/${id}`);

      if (res.status === 404) {
        fail('Такого товара нет');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const p = await res.json();

      /* Похожие грузим отдельно — они не критичны,
         если запрос упадёт, страница всё равно покажется */
      let all = [];
      try {
        const listRes = await fetch(`${API_URL}/products`);
        if (listRes.ok) all = await listRes.json();
      } catch (_) { /* без похожих переживём */ }

      render(p, all);
    } catch (err) {
      console.error('Товар не загрузился:', err);
      fail('Не удалось загрузить товар');
    }
  }

  function fail(msg) {
    $('#pageBody').innerHTML = `
      <section class="prod">
        <div class="shell prod__fail">
          <p class="grid__state">${msg}</p>
          <a href="catalog.html" class="btn btn--solid">Вернуться в каталог</a>
        </div>
      </section>`;
  }

  /* ── Отрисовка ───────────────────────────────────────────── */
  function render(p, all) {
    document.title = `${p.brand} ${p.name} — BA MENS`;

    /* Похожие: та же категория, но не этот товар */
    const similar = all
      .filter((x) => x.in_stock && x.category === p.category && x.id !== p.id)
      .slice(0, 4);

    $('#pageBody').innerHTML = `
      <section class="prod">
        <div class="shell">
          <p class="cathead__crumbs">
            <a href="index.html">Главная</a>
            <span>/</span>
            <a href="catalog.html${p.category ? `?cat=${p.category}` : ''}">${CAT_LABEL[p.category] || 'Каталог'}</a>
            <span>/</span>
            <span>${p.name}</span>
          </p>

          <div class="prod__in">
            <figure class="prod__shot">
              <img src="${p.image || 'images/p-nike.jpg'}" alt="${p.brand} ${p.name}" />
              ${p.old_price ? '<span class="prod__badge">Скидка</span>' : ''}
            </figure>

            <div class="prod__copy">
              <p class="prod__brand">${p.brand}</p>
              <h1 class="prod__name">${p.name}</h1>

              <div class="prod__price">
                ${p.old_price ? `<span class="prod__old">${money(p.old_price)}</span>` : ''}
                <span class="prod__now">${money(p.price)}</span>
              </div>

              <dl class="prod__specs">
                ${p.size ? `<div><dt>Размеры</dt><dd>${p.size}</dd></div>` : ''}
                ${p.category ? `<div><dt>Категория</dt><dd>${CAT_LABEL[p.category] || p.category}</dd></div>` : ''}
                <div><dt>Наличие</dt><dd>${p.in_stock ? 'Есть в магазине' : 'Под заказ'}</dd></div>
                <div><dt>Оплата</dt><dd>Наличные, карта, Kaspi QR, рассрочка 0-0-12</dd></div>
              </dl>

              <div class="prod__cta">
                <a href="https://instagram.com/ba_mens" target="_blank" rel="noopener" class="btn btn--solid">
                  Заказать в Instagram
                </a>
                <a href="catalog.html" class="btn btn--line">Смотреть каталог</a>
              </div>

              <p class="prod__note">
                Товар можно померить в магазине: ТРЦ Рахмет, 3 этаж.
                Доставка по Казахстану — обсудим в переписке.
              </p>
            </div>
          </div>
        </div>
      </section>

      ${similar.length ? `
      <section class="more">
        <div class="shell">
          <header class="lead">
            <p class="lead__tag">Похожее</p>
            <h2 class="lead__title">Из этой же полки</h2>
          </header>
          <div class="shelf__grid">
            ${similar.map(card).join('')}
          </div>
        </div>
      </section>` : ''}
    `;
  }

  /* Карточка товара — ссылка на его страницу */
  function card(p) {
    return `
      <a class="card" href="product.html?id=${p.id}">
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
      </a>`;
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
    initMenu();
    initSmoothScroll();
    load();
  });
})();