/* ============================================================
   BA MENS — cart.js
   Ядро корзины. Подключается на КАЖДОЙ странице до остальных
   скриптов. Хранит товары, рисует счётчик в шапке.
   ============================================================ */

(() => {
  'use strict';

  const KEY = 'bamens_cart_v1';

  const $  = (s, r = document) => r.querySelector(s);

  /* ── Чтение и запись ─────────────────────────────────────── */
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_) {
      /* Если хранилище недоступно или в нём мусор — работаем с пустой */
      return [];
    }
  }

  function write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (_) { /* приватный режим — переживём */ }
    document.dispatchEvent(new CustomEvent('cart:change'));
  }

  /* Две позиции считаются одной, если совпали товар и размер */
  const same = (a, b) => a.product_id === b.product_id && (a.size || null) === (b.size || null);

  /* ── Публичные методы ────────────────────────────────────── */
  const Cart = {
    items: read,

    add(item) {
      const list = read();
      const found = list.find((x) => same(x, item));

      if (found) {
        found.quantity = Math.min(found.quantity + item.quantity, 20);
      } else {
        list.push({ ...item });
      }

      write(list);
      return list;
    },

    setQty(i, n) {
      const list = read();
      if (!list[i]) return;
      list[i].quantity = Math.max(1, Math.min(n, 20));
      write(list);
    },

    remove(i) {
      const list = read();
      list.splice(i, 1);
      write(list);
    },

    clear() { write([]); },

    /* Сколько всего штук, а не позиций */
    count() { return read().reduce((s, x) => s + x.quantity, 0); },

    total() { return read().reduce((s, x) => s + x.price * x.quantity, 0); }
  };

  window.Cart = Cart;

  /* ── Кнопка корзины в шапке ──────────────────────────────── */
  /* Вставляем скриптом, чтобы не править разметку каждой страницы */
  function mountButton() {
    const side = $('.head__side');
    if (!side || $('#cartBtn')) return;

    const a = document.createElement('a');
    a.href = 'cart.html';
    a.className = 'cartbtn';
    a.id = 'cartBtn';
    a.setAttribute('aria-label', 'Корзина');
    a.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <path d="M3 6h18M16 10a4 4 0 01-8 0"/>
      </svg>
      <span class="cartbtn__num" id="cartNum">0</span>`;

    const burger = $('#burger', side);
    side.insertBefore(a, burger || null);

    /* Пункт в выдвижном меню на телефоне */
    const nav = $('.drawer__nav');
    if (nav && !$('#cartLink')) {
      const link = document.createElement('a');
      link.href = 'cart.html';
      link.id = 'cartLink';
      link.innerHTML = '<span>Корзина</span>';
      nav.appendChild(link);
    }
  }

  function paint() {
    const num = $('#cartNum');
    if (!num) return;

    const n = Cart.count();
    num.textContent = n;
    num.classList.toggle('is-on', n > 0);

    /* Короткий толчок, когда число выросло */
    const btn = $('#cartBtn');
    if (btn && n > 0) {
      btn.classList.remove('is-bump');
      void btn.offsetWidth;      /* перезапуск анимации */
      btn.classList.add('is-bump');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    mountButton();
    paint();
  });

  document.addEventListener('cart:change', paint);

  /* Корзину могли изменить в другой вкладке */
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) paint();
  });
})();