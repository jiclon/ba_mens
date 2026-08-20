/* ============================================================
   BA MENS — product.js
   Карточка одного товара + оформление заказа.
   Какой товар — берётся из адреса: product.html?id=3
   ============================================================ */

(() => {
  'use strict';

  const API_URL = 'https://ba-mens.onrender.com';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const money = (n) => n.toLocaleString('ru-RU') + ' ₸';

  const CAT_LABEL = {
    clothing: 'Одежда',
    shoes:    'Обувь',
    perfume:  'Парфюм'
  };

  /* Размеры зависят от категории.
     У парфюма размера нет — в заказ уйдёт null. */
  const SIZES = {
    clothing: ['S', 'M', 'L', 'XL', 'XXL'],
    shoes:    ['39', '40', '41', '42', '43', '44', '45']
  };

  const PAYMENTS = [
    { v: 'kaspi',       label: 'Kaspi QR' },
    { v: 'card',        label: 'Картой' },
    { v: 'cash',        label: 'Наличными' },
    { v: 'installment', label: 'Рассрочка 0-0-12' }
  ];

  /* Текущий товар — нужен форме */
  let current = null;

  /* ── Загрузка ────────────────────────────────────────────── */
  async function load() {
    const id = new URLSearchParams(location.search).get('id');

    if (!id) {
      fail('Товар не выбран');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/products/${id}`);

      if (res.status === 404) {
        fail('Такого товара нет');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const p = await res.json();
      current = p;

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
                ${p.category ? `<div><dt>Категория</dt><dd>${CAT_LABEL[p.category] || p.category}</dd></div>` : ''}
                ${SIZES[p.category] ? `<div><dt>Размеры</dt><dd>${SIZES[p.category].join(' · ')}</dd></div>` : ''}
                <div><dt>Наличие</dt><dd>${p.in_stock ? 'Есть в магазине' : 'Под заказ'}</dd></div>
                <div><dt>Оплата</dt><dd>Наличные, карта, Kaspi QR, рассрочка 0-0-12</dd></div>
              </dl>

              ${SIZES[p.category] ? `
              <div class="pick">
                <span class="pick__label">Размер</span>
                <div class="pick__chips" id="pickSizes">
                  ${SIZES[p.category].map((s) => `
                    <button type="button" class="pick__chip" data-size="${s}">${s}</button>
                  `).join('')}
                </div>
                <p class="pick__err" id="pickErr"></p>
              </div>` : ''}

              <div class="pick">
                <span class="pick__label">Количество</span>
                <div class="pick__step">
                  <button type="button" class="pick__stepbtn" id="pickMinus" aria-label="Меньше">−</button>
                  <span class="pick__val" id="pickVal">1</span>
                  <button type="button" class="pick__stepbtn" id="pickPlus" aria-label="Больше">+</button>
                </div>
              </div>

              <div class="prod__cta">
                <button type="button" class="btn btn--solid" id="toCart">
                  В корзину
                </button>
                <button type="button" class="btn btn--line" id="orderOpen">
                  Купить сразу
                </button>
              </div>

              <p class="prod__added" id="addedNote" hidden>
                Товар в корзине · <a href="cart.html">перейти к оформлению</a>
              </p>

              <p class="prod__note">
                Товар можно померить в магазине: ТРЦ Рахмет, 3 этаж.
                Доставка по Казахстану — обсудим после заказа.
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

    initPick(p);
  }

  /* ══════════════════════════════════════════════════════════
     ВЫБОР НА СТРАНИЦЕ ТОВАРА
     ══════════════════════════════════════════════════════════ */

  /* Что выбрано прямо сейчас — общее для корзины и быстрой покупки */
  const pick = { size: null, quantity: 1 };

  function initPick(p) {
    const sizes = SIZES[p.category] || null;

    pick.size = null;
    pick.quantity = 1;

    /* Размер */
    if (sizes) {
      $$('#pickSizes .pick__chip').forEach((b) => {
        b.addEventListener('click', () => {
          $$('#pickSizes .pick__chip').forEach((x) => x.classList.remove('is-on'));
          b.classList.add('is-on');
          pick.size = b.dataset.size;
          $('#pickErr').textContent = '';
        });
      });
    }

    /* Количество */
    const val = $('#pickVal');
    $('#pickMinus').addEventListener('click', () => {
      if (pick.quantity > 1) { pick.quantity--; val.textContent = pick.quantity; }
    });
    $('#pickPlus').addEventListener('click', () => {
      if (pick.quantity < 20) { pick.quantity++; val.textContent = pick.quantity; }
    });

    /* В корзину */
    $('#toCart').addEventListener('click', () => {
      if (sizes && !pick.size) {
        $('#pickErr').textContent = 'Сначала выберите размер';
        return;
      }

      Cart.add({
        product_id: p.id,
        brand: p.brand,
        name: p.name,
        price: p.price,
        image: p.image,
        size: pick.size,
        quantity: pick.quantity
      });

      const btn = $('#toCart');
      btn.textContent = 'Добавлено';
      $('#addedNote').hidden = false;
      setTimeout(() => { btn.textContent = 'В корзину'; }, 1800);
    });

    /* Быстрая покупка — открывает форму на один товар */
    $('#orderOpen').addEventListener('click', () => {
      if (sizes && !pick.size) {
        $('#pickErr').textContent = 'Сначала выберите размер';
        return;
      }
      openOrder();
    });
  }

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
          </div>
        </div>
      </a>`;
  }

  /* ══════════════════════════════════════════════════════════
     ФОРМА ЗАКАЗА
     ══════════════════════════════════════════════════════════ */

  /* Состояние формы живёт здесь, а не в DOM */
  const order = {
    size: null,
    quantity: 1,
    delivery: 'pickup',
    payment: 'kaspi'
  };

  function openOrder() {
    const p = current;
    if (!p) return;

    /* Размер и количество уже выбраны на странице — переносим их */
    order.size = pick.size;
    order.quantity = pick.quantity;
    order.delivery = 'pickup';
    order.payment = 'kaspi';

    /* В форме размер не переспрашиваем, только показываем */
    const sizes = null;

    const wrap = document.createElement('div');
    wrap.className = 'ord';
    wrap.id = 'ord';
    wrap.innerHTML = `
      <div class="ord__veil" data-close></div>

      <div class="ord__sheet" role="dialog" aria-modal="true" aria-labelledby="ordTitle">
        <button type="button" class="ord__x" data-close aria-label="Закрыть">×</button>

        <div class="ord__head">
          <p class="ord__tag">Заказ</p>
          <h2 class="ord__title" id="ordTitle">${p.brand} ${p.name}</h2>
        </div>

        <div class="ord__body" id="ordBody">

          <div class="ord__item">
            <img class="ord__thumb" src="${p.image || 'images/p-nike.jpg'}" alt="" />
            <div class="ord__itemtx">
              <p class="ord__itembrand">${p.brand}</p>
              <p class="ord__itemname">${p.name}</p>
              ${order.size ? `<p class="ord__itemsize">Размер ${order.size}</p>` : ''}
            </div>
            <span class="ord__itemprice">${money(p.price)}</span>
          </div>

          ${sizes ? `
          <div class="ord__field">
            <span class="ord__label">Размер</span>
            <div class="ord__chips" id="ordSizes">
              ${sizes.map((s) => `<button type="button" class="ord__chip" data-size="${s}">${s}</button>`).join('')}
            </div>
            <p class="ord__err" id="errSize"></p>
          </div>` : ''}

          <div class="ord__field">
            <span class="ord__label">Количество</span>
            <div class="ord__step">
              <button type="button" class="ord__stepbtn" id="qtyMinus" aria-label="Меньше">−</button>
              <span class="ord__stepval" id="qtyVal">${order.quantity}</span>
              <button type="button" class="ord__stepbtn" id="qtyPlus" aria-label="Больше">+</button>
            </div>
          </div>

          <div class="ord__field">
            <label class="ord__label" for="ordName">Как вас зовут</label>
            <input class="ord__input" id="ordName" type="text" placeholder="Имя" autocomplete="name" />
            <p class="ord__err" id="errName"></p>
          </div>

          <div class="ord__field">
            <label class="ord__label" for="ordPhone">Телефон</label>
            <input class="ord__input" id="ordPhone" type="tel" placeholder="+7 (___) ___-__-__" autocomplete="tel" inputmode="tel" />
            <p class="ord__hint">Позвоним, чтобы подтвердить заказ</p>
            <p class="ord__err" id="errPhone"></p>
          </div>

          <div class="ord__field">
            <span class="ord__label">Как получите</span>
            <div class="ord__chips" id="ordDelivery">
              <button type="button" class="ord__chip is-on" data-delivery="pickup">Заберу сам</button>
              <button type="button" class="ord__chip" data-delivery="delivery">Доставка</button>
            </div>
          </div>

          <div class="ord__field" id="ordAddrField" hidden>
            <span class="ord__label">Куда привезти</span>

            <div class="ord__addr">
              <input class="ord__input" id="ordCity" type="text"
                     placeholder="Город" autocomplete="address-level2" maxlength="30" />
              <input class="ord__input" id="ordStreet" type="text"
                     placeholder="Улица и дом" autocomplete="address-line1" maxlength="40" />
              <input class="ord__input" id="ordFlat" type="text"
                     placeholder="Квартира, подъезд — если есть" autocomplete="address-line2" maxlength="20" />
            </div>

            <p class="ord__err" id="errAddr"></p>
          </div>

          <div class="ord__field">
            <span class="ord__label">Чем оплатите</span>
            <div class="ord__chips" id="ordPay">
              ${PAYMENTS.map((x, i) => `
                <button type="button" class="ord__chip ${i === 0 ? 'is-on' : ''}" data-pay="${x.v}">${x.label}</button>
              `).join('')}
            </div>
          </div>

          <div class="ord__total">
            <span>Итого</span>
            <strong id="ordTotal">${money(p.price * order.quantity)}</strong>
          </div>

          <p class="ord__err ord__err--big" id="errAll"></p>

          <button type="button" class="btn btn--solid ord__send" id="ordSend">
            Отправить заказ
          </button>

          <p class="ord__fine">
            Оплата при получении. Сначала подтвердим наличие по телефону.
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(wrap);
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => wrap.classList.add('is-on'));

    bindOrder(p, sizes);
  }

  function closeOrder() {
    const wrap = $('#ord');
    if (!wrap) return;
    document.removeEventListener('keydown', onEsc);
    wrap.classList.remove('is-on');
    document.body.classList.remove('is-locked');
    setTimeout(() => wrap.remove(), 220);
  }

  function onEsc(e) {
    if (e.key === 'Escape') closeOrder();
  }

  function bindOrder(p, sizes) {
    const wrap = $('#ord');

    /* Закрытие */
    $$('[data-close]', wrap).forEach((el) => el.addEventListener('click', closeOrder));
    document.addEventListener('keydown', onEsc);

    /* Размер */
    if (sizes) {
      $$('#ordSizes .ord__chip', wrap).forEach((b) => {
        b.addEventListener('click', () => {
          $$('#ordSizes .ord__chip', wrap).forEach((x) => x.classList.remove('is-on'));
          b.classList.add('is-on');
          order.size = b.dataset.size;
          $('#errSize', wrap).textContent = '';
        });
      });
    }

    /* Количество */
    const qtyVal = $('#qtyVal', wrap);
    const redrawQty = () => {
      qtyVal.textContent = order.quantity;
      $('#ordTotal', wrap).textContent = money(p.price * order.quantity);
    };
    $('#qtyMinus', wrap).addEventListener('click', () => {
      if (order.quantity > 1) { order.quantity--; redrawQty(); }
    });
    $('#qtyPlus', wrap).addEventListener('click', () => {
      if (order.quantity < 20) { order.quantity++; redrawQty(); }
    });

    /* Доставка */
    $$('#ordDelivery .ord__chip', wrap).forEach((b) => {
      b.addEventListener('click', () => {
        $$('#ordDelivery .ord__chip', wrap).forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
        order.delivery = b.dataset.delivery;
        $('#ordAddrField', wrap).hidden = order.delivery !== 'delivery';
      });
    });

    /* Оплата */
    $$('#ordPay .ord__chip', wrap).forEach((b) => {
      b.addEventListener('click', () => {
        $$('#ordPay .ord__chip', wrap).forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
        order.payment = b.dataset.pay;
      });
    });

    /* Телефон — форматируем на лету */
    const phone = $('#ordPhone', wrap);
    phone.addEventListener('input', () => {
      phone.value = maskPhone(phone.value);
      $('#errPhone', wrap).textContent = '';
    });

    $('#ordName', wrap).addEventListener('input', () => {
      $('#errName', wrap).textContent = '';
    });

    /* Три поля адреса — любое очищает общую ошибку */
    ['#ordCity', '#ordStreet', '#ordFlat'].forEach((id) => {
      const el = $(id, wrap);
      if (el) el.addEventListener('input', () => {
        $('#errAddr', wrap).textContent = '';
      });
    });

    /* Отправка */
    $('#ordSend', wrap).addEventListener('click', () => send(p, sizes));
  }

  /* Приводим ввод к виду +7 (777) 123-45-67 */
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

  /* ── Отправка ────────────────────────────────────────────── */
  async function send(p, sizes) {
    const wrap = $('#ord');
    const name  = $('#ordName', wrap).value.trim();
    const phone = $('#ordPhone', wrap).value;
    const val = (id) => {
      const el = $(id, wrap);
      return el ? el.value.trim() : '';
    };

    const city   = val('#ordCity');
    const street = val('#ordStreet');
    const flat   = val('#ordFlat');

    /* Склеиваем три поля в одну строку — в базе колонка одна */
    const addr = [city, street, flat].filter(Boolean).join(', ').slice(0, 80);

    /* Чистим прошлые ошибки */
    $$('.ord__err', wrap).forEach((el) => (el.textContent = ''));

    let bad = false;

    if (sizes && !order.size) {
      $('#errSize', wrap).textContent = 'Выберите размер';
      bad = true;
    }
    if (name.length < 2) {
      $('#errName', wrap).textContent = 'Напишите имя';
      bad = true;
    }
    if (digits(phone).length !== 11) {
      $('#errPhone', wrap).textContent = 'Номер из 11 цифр, начиная с +7';
      bad = true;
    }
    if (order.delivery === 'delivery') {
      if (!city) {
        $('#errAddr', wrap).textContent = 'Укажите город';
        bad = true;
      } else if (street.length < 4) {
        $('#errAddr', wrap).textContent = 'Укажите улицу и номер дома';
        bad = true;
      }
    }

    if (bad) return;

    const btn = $('#ordSend', wrap);
    btn.disabled = true;
    btn.textContent = 'Отправляем…';

    const payload = {
      customer_name: name,
      phone: digits(phone),
      delivery_type: order.delivery,
      address: order.delivery === 'delivery' ? addr : null,
      payment_type: order.payment,
      items: [
        {
          product_id: p.id,
          quantity: order.quantity,
          size: order.size
        }
      ]
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
        } catch (_) { /* тело не JSON — оставим общий текст */ }
        throw new Error(msg);
      }

      const created = await res.json();
      done(created, p);
    } catch (err) {
      console.error('Заказ не ушёл:', err);
      $('#errAll', wrap).textContent = err.message;
      btn.disabled = false;
      btn.textContent = 'Отправить заказ';
    }
  }

  /* ── Готово ──────────────────────────────────────────────── */
  function done(o, p) {
    const wrap = $('#ord');
    const item = o.items[0];

    $('.ord__head', wrap).innerHTML = `
      <p class="ord__tag">Принято</p>
      <h2 class="ord__title">Заказ №${o.id}</h2>
    `;

    $('#ordBody', wrap).innerHTML = `
      <div class="ord__ok">
        <div class="ord__okmark" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M12 25l8 8 16-18" stroke="currentColor" stroke-width="3"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <p class="ord__oktx">
          Заказ на ${p.brand} ${p.name}${item.size ? `, размер ${item.size}` : ''} у нас.
          Позвоним на ${maskPhone(o.phone)}, чтобы подтвердить наличие
          и договориться о получении.
        </p>

        <dl class="ord__okgrid">
          <div><dt>Номер</dt><dd>№${o.id}</dd></div>
          <div><dt>Получение</dt><dd>${o.delivery_type === 'delivery' ? 'Доставка' : 'Самовывоз'}</dd></div>
          <div><dt>Оплата</dt><dd>${(PAYMENTS.find((x) => x.v === o.payment_type) || {}).label || o.payment_type}</dd></div>
          <div><dt>Сумма</dt><dd>${money(p.price * item.quantity)}</dd></div>
        </dl>

        <p class="ord__fine">Запишите номер заказа — по нему быстрее вас найдём.</p>

        <div class="ord__okcta">
          <a href="catalog.html" class="btn btn--solid">Смотреть каталог</a>
          <button type="button" class="btn btn--line" data-close>Закрыть</button>
        </div>
      </div>
    `;

    $$('[data-close]', wrap).forEach((el) => el.addEventListener('click', closeOrder));
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
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#ord')) close();
    });
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