/* ============================================================
   BA MENS — cart-page.js
   Страница корзины: список товаров и оформление заказа.
   Один заказ уходит на бэкенд со всеми позициями сразу.
   ============================================================ */

(() => {
  'use strict';

  const API_URL = 'https://ba-mens.onrender.com';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const money = (n) => n.toLocaleString('ru-RU') + ' ₸';

  const PAYMENTS = [
    { v: 'kaspi',       label: 'Kaspi QR' },
    { v: 'card',        label: 'Картой' },
    { v: 'cash',        label: 'Наличными' },
    { v: 'installment', label: 'Рассрочка 0-0-12' }
  ];

  /* Что выбрано в форме */
  const form = { delivery: 'pickup', payment: 'kaspi' };

  /* ── Отрисовка страницы ──────────────────────────────────── */
  function draw() {
    const items = Cart.items();
    const body = $('#cartBody');

    countLine(items);

    if (!items.length) {
      body.innerHTML = `
        <div class="cartempty">
          <div class="cartempty__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <path d="M3 6h18M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <p class="cartempty__tx">Здесь пока пусто</p>
          <a href="catalog.html" class="btn btn--solid">Перейти в каталог</a>
        </div>`;
      return;
    }

    body.innerHTML = `
      <div class="cartgrid">
        <div class="cartlist" id="cartList">
          ${items.map(row).join('')}
        </div>

        <aside class="cartside">
          <div class="cartsum">
            <div class="cartsum__row">
              <span>Товары</span>
              <span id="sumGoods">${money(Cart.total())}</span>
            </div>
            <div class="cartsum__row">
              <span>Доставка</span>
              <span id="sumShip">по договорённости</span>
            </div>
            <div class="cartsum__total">
              <span>Итого</span>
              <strong id="sumTotal">${money(Cart.total())}</strong>
            </div>
          </div>

          ${formHtml()}
        </aside>
      </div>`;

    bind();
  }

  function countLine(items) {
    const n = items.reduce((s, x) => s + x.quantity, 0);
    const word = n % 10 === 1 && n % 100 !== 11 ? 'товар'
               : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'товара'
               : 'товаров';
    $('#cartCount').textContent = n ? `${n} ${word}` : '';
  }

  /* Одна строка корзины */
  function row(x, i) {
    return `
      <article class="crow" data-i="${i}">
        <a class="crow__shot" href="product.html?id=${x.product_id}">
          <img src="${x.image || 'images/p-nike.jpg'}" alt="${x.brand} ${x.name}" loading="lazy" />
        </a>

        <div class="crow__tx">
          <p class="crow__brand">${x.brand}</p>
          <h3 class="crow__name">
            <a href="product.html?id=${x.product_id}">${x.name}</a>
          </h3>
          ${x.size ? `<p class="crow__size">Размер ${x.size}</p>` : ''}
          <p class="crow__unit">${money(x.price)} за штуку</p>
        </div>

        <div class="crow__ctrl">
          <div class="crow__step">
            <button type="button" class="crow__stepbtn" data-act="minus" aria-label="Меньше">−</button>
            <span class="crow__qty">${x.quantity}</span>
            <button type="button" class="crow__stepbtn" data-act="plus" aria-label="Больше">+</button>
          </div>
          <p class="crow__sum">${money(x.price * x.quantity)}</p>
          <button type="button" class="crow__del" data-act="del">Убрать</button>
        </div>
      </article>`;
  }

  /* Форма заказа — одна на всю корзину */
  function formHtml() {
    return `
      <div class="cartform" id="cartForm">
        <h2 class="cartform__title">Оформление</h2>

        <div class="ord__field">
          <label class="ord__label" for="cName">Как вас зовут</label>
          <input class="ord__input" id="cName" type="text" placeholder="Имя" autocomplete="name" />
          <p class="ord__err" id="errName"></p>
        </div>

        <div class="ord__field">
          <label class="ord__label" for="cPhone">Телефон</label>
          <input class="ord__input" id="cPhone" type="tel" placeholder="+7 (___) ___-__-__"
                 autocomplete="tel" inputmode="tel" />
          <p class="ord__hint">Позвоним, чтобы подтвердить заказ</p>
          <p class="ord__err" id="errPhone"></p>
        </div>

        <div class="ord__field">
          <span class="ord__label">Как получите</span>
          <div class="ord__chips" id="cDelivery">
            <button type="button" class="ord__chip is-on" data-delivery="pickup">Заберу сам</button>
            <button type="button" class="ord__chip" data-delivery="delivery">Доставка</button>
          </div>
        </div>

        <div class="ord__field" id="cAddrField" hidden>
          <span class="ord__label">Куда привезти</span>
          <div class="ord__addr">
            <input class="ord__input" id="cCity" type="text" placeholder="Город"
                   autocomplete="address-level2" maxlength="30" />
            <input class="ord__input" id="cStreet" type="text" placeholder="Улица и дом"
                   autocomplete="address-line1" maxlength="40" />
            <input class="ord__input" id="cFlat" type="text" placeholder="Квартира, подъезд — если есть"
                   autocomplete="address-line2" maxlength="20" />
          </div>
          <p class="ord__err" id="errAddr"></p>
        </div>

        <div class="ord__field">
          <span class="ord__label">Чем оплатите</span>
          <div class="ord__chips" id="cPay">
            ${PAYMENTS.map((x, i) => `
              <button type="button" class="ord__chip ${i === 0 ? 'is-on' : ''}" data-pay="${x.v}">${x.label}</button>
            `).join('')}
          </div>
        </div>

        <p class="ord__err ord__err--big" id="errAll"></p>

        <button type="button" class="btn btn--solid cartform__send" id="cSend">
          Отправить заказ
        </button>

        <p class="ord__fine">
          Оплата при получении. Сначала подтвердим наличие по телефону.
        </p>
      </div>`;
  }

  /* ── Обработчики ─────────────────────────────────────────── */
  function bind() {
    /* Кнопки внутри строк — слушаем список целиком */
    const list = $('#cartList');
    if (list) {
      list.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;

        const i = Number(btn.closest('.crow').dataset.i);
        const items = Cart.items();
        if (!items[i]) return;

        if (btn.dataset.act === 'plus')  Cart.setQty(i, items[i].quantity + 1);
        if (btn.dataset.act === 'minus') Cart.setQty(i, items[i].quantity - 1);
        if (btn.dataset.act === 'del')   Cart.remove(i);

        draw();
      });
    }

    /* Доставка */
    $$('#cDelivery .ord__chip').forEach((b) => {
      b.addEventListener('click', () => {
        $$('#cDelivery .ord__chip').forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
        form.delivery = b.dataset.delivery;
        $('#cAddrField').hidden = form.delivery !== 'delivery';
        $('#sumShip').textContent = form.delivery === 'delivery'
          ? 'по договорённости'
          : 'самовывоз, бесплатно';
      });
    });

    /* Оплата */
    $$('#cPay .ord__chip').forEach((b) => {
      b.addEventListener('click', () => {
        $$('#cPay .ord__chip').forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
        form.payment = b.dataset.pay;
      });
    });

    /* Телефон */
    const phone = $('#cPhone');
    phone.addEventListener('input', () => {
      phone.value = maskPhone(phone.value);
      $('#errPhone').textContent = '';
    });
    $('#cName').addEventListener('input', () => { $('#errName').textContent = ''; });

    ['#cCity', '#cStreet', '#cFlat'].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener('input', () => { $('#errAddr').textContent = ''; });
    });

    $('#cSend').addEventListener('click', send);
  }

  /* ── Телефон ─────────────────────────────────────────────── */
  function maskPhone(raw) {
    let d = String(raw).replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);

    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 5) out += ') ' + d.slice(4, 7);
    if (d.length >= 8) out += '-' + d.slice(7, 9);
    if (d.length >= 10) out += '-' + d.slice(9, 11);
    return out;
  }
  const digits = (s) => String(s).replace(/\D/g, '');

  /* ── Отправка заказа ─────────────────────────────────────── */
  async function send() {
    const items = Cart.items();
    if (!items.length) return;

    const name   = $('#cName').value.trim();
    const phone  = $('#cPhone').value;
    const val    = (id) => { const el = $(id); return el ? el.value.trim() : ''; };
    const city   = val('#cCity');
    const street = val('#cStreet');
    const flat   = val('#cFlat');

    /* В базе колонка адреса одна — склеиваем три поля */
    const addr = [city, street, flat].filter(Boolean).join(', ').slice(0, 80);

    $$('.ord__err').forEach((el) => (el.textContent = ''));

    let bad = false;

    if (name.length < 2) { $('#errName').textContent = 'Напишите имя'; bad = true; }
    if (digits(phone).length !== 11) {
      $('#errPhone').textContent = 'Номер из 11 цифр, начиная с +7';
      bad = true;
    }
    if (form.delivery === 'delivery') {
      if (!city) { $('#errAddr').textContent = 'Укажите город'; bad = true; }
      else if (street.length < 4) { $('#errAddr').textContent = 'Укажите улицу и номер дома'; bad = true; }
    }

    if (bad) return;

    const btn = $('#cSend');
    btn.disabled = true;
    btn.textContent = 'Отправляем…';

    const payload = {
      customer_name: name,
      phone: digits(phone),
      delivery_type: form.delivery,
      address: form.delivery === 'delivery' ? addr : null,
      payment_type: form.payment,
      items: items.map((x) => ({
        product_id: x.product_id,
        quantity: x.quantity,
        size: x.size || null
      }))
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let msg = 'Заказ не отправился. Попробуйте ещё раз';
        try {
          const err = await res.json();
          if (err.detail && typeof err.detail === 'string') msg = err.detail;
        } catch (_) { /* тело не JSON */ }
        throw new Error(msg);
      }

      const created = await res.json();
      done(created, items);
    } catch (err) {
      console.error('Заказ не ушёл:', err);
      $('#errAll').textContent = err.message;
      btn.disabled = false;
      btn.textContent = 'Отправить заказ';
    }
  }

  /* ── Экран «принято» ─────────────────────────────────────── */
  function done(o, items) {
    const sum = items.reduce((s, x) => s + x.price * x.quantity, 0);
    const n = items.reduce((s, x) => s + x.quantity, 0);

    /* Корзину чистим только после успешного ответа сервера */
    Cart.clear();

    $('#cartCount').textContent = '';
    $('#cartBody').innerHTML = `
      <div class="cartok">
        <div class="cartok__mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M12 25l8 8 16-18" stroke="currentColor" stroke-width="3"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <h2 class="cartok__title">Заказ №${o.id} принят</h2>

        <p class="cartok__tx">
          Позвоним на ${maskPhone(o.phone)}, чтобы подтвердить наличие
          и договориться о получении.
        </p>

        <dl class="cartok__grid">
          <div><dt>Номер</dt><dd>№${o.id}</dd></div>
          <div><dt>Позиций</dt><dd>${n}</dd></div>
          <div><dt>Получение</dt><dd>${o.delivery_type === 'delivery' ? 'Доставка' : 'Самовывоз'}</dd></div>
          <div><dt>Оплата</dt><dd>${(PAYMENTS.find((x) => x.v === o.payment_type) || {}).label || o.payment_type}</dd></div>
          <div><dt>Сумма</dt><dd>${money(sum)}</dd></div>
        </dl>

        <p class="ord__fine">Запишите номер заказа — по нему быстрее вас найдём.</p>

        <div class="cartok__cta">
          <a href="catalog.html" class="btn btn--solid">Продолжить покупки</a>
          <a href="index.html" class="btn btn--line">На главную</a>
        </div>
      </div>`;
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

  document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initSmoothScroll();
    draw();
  });
})();