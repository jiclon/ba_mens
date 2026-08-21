/* ===== BA MENS — админка ===== */

const API = 'https://ba-mens.onrender.com';
// для локальной проверки: const API = 'http://127.0.0.1:8000';

const TOKEN_KEY = 'bamens_admin_token';

// Сервер на Render пишет время по UTC, а Петропавловск — UTC+5.
// Поэтому к дате из базы прибавляем 5 часов.
// Локально (когда uvicorn запущен на твоём компьютере) поставь 0.
const TZ_SHIFT_HOURS = 5;

const STATUSES = {
  new:         { label: 'Новый',      short: 'Новый'      },
  in_progress: { label: 'В работе',   short: 'В работу'   },
  done:        { label: 'Доставлен',  short: 'Доставлен'  },
  canceled:    { label: 'Отменён',    short: 'Отменить'   }
};

const DELIVERY = { pickup: 'Самовывоз', delivery: 'Доставка' };
const PAYMENT  = { cash: 'Наличные', card: 'Картой', kaspi: 'Kaspi' };

let orders = [];
let productsById = {};
let activeFilter = 'all';

/* ---------- элементы ---------- */

const el = {
  loginScreen: document.getElementById('loginScreen'),
  panelScreen: document.getElementById('panelScreen'),
  loginInput:  document.getElementById('loginInput'),
  passInput:   document.getElementById('passwordInput'),
  loginBtn:    document.getElementById('loginBtn'),
  loginError:  document.getElementById('loginError'),
  logoutBtn:   document.getElementById('logoutBtn'),
  refreshBtn:  document.getElementById('refreshBtn'),
  filters:     document.getElementById('filters'),
  list:        document.getElementById('list'),
  toast:       document.getElementById('toast')
};

/* ---------- токен ---------- */

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = t => localStorage.setItem(TOKEN_KEY, t);
const dropToken = () => localStorage.removeItem(TOKEN_KEY);

/* ---------- уведомление ---------- */

let toastTimer;
function toast(text) {
  el.toast.textContent = text;
  el.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('is-visible'), 2600);
}

/* ---------- вход ---------- */

async function login() {
  const username = el.loginInput.value.trim();
  const password = el.passInput.value;

  if (!username || !password) {
    el.loginError.textContent = 'Заполните оба поля';
    return;
  }

  el.loginError.textContent = '';
  el.loginBtn.disabled = true;
  el.loginBtn.textContent = 'Проверяем…';

  // Render засыпает после простоя — первый запрос может идти долго
  const slowHint = setTimeout(() => {
    el.loginBtn.textContent = 'Сервер просыпается…';
  }, 4000);

  try {
    const res = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.status === 401) {
      el.loginError.textContent = 'Неверный логин или пароль';
      return;
    }
    if (!res.ok) {
      el.loginError.textContent = 'Сервер ответил ошибкой ' + res.status;
      return;
    }

    const data = await res.json();
    setToken(data.access_token);
    el.passInput.value = '';
    showPanel();

  } catch (e) {
    el.loginError.textContent = 'Нет связи с сервером';
  } finally {
    clearTimeout(slowHint);
    el.loginBtn.disabled = false;
    el.loginBtn.textContent = 'Войти';
  }
}

function logout() {
  dropToken();
  orders = [];
  el.list.innerHTML = '';
  el.panelScreen.hidden = true;
  el.panelScreen.style.display = 'none';
  el.loginScreen.hidden = false;
  el.loginScreen.style.display = 'flex';
  window.scrollTo(0, 0);
  el.loginInput.focus();
}

/* ---------- загрузка данных ---------- */

async function loadProducts() {
  try {
    const res = await fetch(API + '/products');
    if (!res.ok) return;
    const list = await res.json();
    productsById = {};
    list.forEach(p => { productsById[p.id] = p; });
  } catch (e) { /* без названий покажем id */ }
}

async function loadOrders() {
  const token = getToken();
  if (!token) return logout();

  el.list.innerHTML = '<div class="state">Загружаем заказы…</div>';

  try {
    const res = await fetch(API + '/orders', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (res.status === 401) {
      logout();
      toast('Вход истёк, войдите заново');
      return;
    }
    if (!res.ok) {
      el.list.innerHTML = '<div class="state"><strong>Ошибка ' + res.status + '</strong>Попробуйте обновить</div>';
      return;
    }

    orders = await res.json();
    render();

  } catch (e) {
    el.list.innerHTML = '<div class="state"><strong>Нет связи</strong>Проверьте интернет и обновите</div>';
  }
}

/* ---------- смена статуса ---------- */

async function changeStatus(orderId, status, button) {
  const token = getToken();
  if (!token) return logout();

  button.disabled = true;

  try {
    const res = await fetch(API + '/orders/' + orderId, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ status })
    });

    if (res.status === 401) {
      logout();
      toast('Вход истёк, войдите заново');
      return;
    }
    if (!res.ok) {
      toast('Не удалось изменить статус');
      button.disabled = false;
      return;
    }

    const updated = await res.json();
    const i = orders.findIndex(o => o.id === updated.id);
    if (i !== -1) orders[i] = updated;

    render();
    toast('Заказ №' + orderId + ' — ' + STATUSES[status].label.toLowerCase());

  } catch (e) {
    toast('Нет связи с сервером');
    button.disabled = false;
  }
}

/* ---------- вспомогательное ---------- */

function formatDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  d.setHours(d.getHours() + TZ_SHIFT_HOURS);

  const pad = n => String(n).padStart(2, '0');
  const months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  return pad(d.getDate()) + ' ' + months[d.getMonth()] + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function formatPrice(n) {
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₸';
}

function phoneDigits(phone) {
  return String(phone).replace(/\D/g, '');
}

function orderTotal(order) {
  return order.items.reduce((sum, item) => {
    const p = productsById[item.product_id];
    return sum + (p ? p.price * item.quantity : 0);
  }, 0);
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- отрисовка ---------- */

function renderCounts() {
  const counts = { all: orders.length, new: 0, in_progress: 0, done: 0, canceled: 0 };
  orders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
  el.filters.querySelectorAll('[data-count]').forEach(span => {
    span.textContent = counts[span.dataset.count] ?? 0;
  });
}

function renderItems(order) {
  return order.items.map(item => {
    const p = productsById[item.product_id];
    const name = p ? escapeHtml(p.name) : 'Товар #' + item.product_id;
    const brand = p ? '<span class="item__brand">' + escapeHtml(p.brand) + '</span>' : '';

    const meta = [];
    if (item.size) meta.push('размер ' + escapeHtml(item.size));
    meta.push(item.quantity + ' шт.');

    const sum = p ? formatPrice(p.price * item.quantity) : '—';

    return '<div class="item">' +
             '<div>' + brand +
               '<div class="item__name">' + name + '</div>' +
               '<div class="item__meta">' + meta.join(' · ') + '</div>' +
             '</div>' +
             '<div class="item__sum">' + sum + '</div>' +
           '</div>';
  }).join('');
}

function renderActions(order) {
  return Object.keys(STATUSES).map(key => {
    const isCurrent = key === order.status;
    return '<button class="actions__btn' + (isCurrent ? ' is-current' : '') + '"' +
           ' data-id="' + order.id + '" data-status="' + key + '"' +
           (isCurrent ? ' disabled' : '') + '>' +
           STATUSES[key].short + '</button>';
  }).join('');
}

function renderOrder(order) {
  const status = STATUSES[order.status] || { label: order.status };
  const digits = phoneDigits(order.phone);

  const rows = [
    ['Клиент', escapeHtml(order.customer_name)],
    ['Телефон',
      '<a href="tel:+' + digits + '">' + escapeHtml(order.phone) + '</a>' +
      '<div class="order__contacts">' +
        '<a class="order__contact" href="https://wa.me/' + digits + '" target="_blank" rel="noopener">WhatsApp</a>' +
        '<a class="order__contact" href="tel:+' + digits + '">Позвонить</a>' +
      '</div>'],
    ['Доставка', escapeHtml(DELIVERY[order.delivery_type] || order.delivery_type)],
  ];

  if (order.address) rows.push(['Адрес', escapeHtml(order.address)]);
  rows.push(['Оплата', escapeHtml(PAYMENT[order.payment_type] || order.payment_type)]);

  const rowsHtml = rows.map(([k, v]) =>
    '<div class="order__key">' + k + '</div><div class="order__val">' + v + '</div>'
  ).join('');

  const total = orderTotal(order);

  return '<article class="order" data-status="' + order.status + '">' +
    '<div class="order__head">' +
      '<div>' +
        '<div class="order__num"><span>№</span>' + order.id + '</div>' +
        '<div class="order__date">' + formatDate(order.created_at) + '</div>' +
      '</div>' +
      '<div class="order__badge badge--' + order.status + '">' + status.label + '</div>' +
    '</div>' +
    '<div class="order__rows">' + rowsHtml + '</div>' +
    '<div class="items">' + renderItems(order) + '</div>' +
    (total ? '<div class="total"><span class="total__label">Итого</span><span class="total__sum">' + formatPrice(total) + '</span></div>' : '') +
    '<div class="actions">' + renderActions(order) + '</div>' +
  '</article>';
}

function render() {
  renderCounts();

  const visible = activeFilter === 'all'
    ? orders
    : orders.filter(o => o.status === activeFilter);

  if (!visible.length) {
    el.list.innerHTML = '<div class="state"><strong>Пусто</strong>' +
      (activeFilter === 'all' ? 'Заказов пока нет' : 'В этой группе заказов нет') + '</div>';
    return;
  }

  el.list.innerHTML = visible.map(renderOrder).join('');
}

/* ---------- события ---------- */

el.loginBtn.addEventListener('click', login);

[el.loginInput, el.passInput].forEach(input => {
  input.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
});

el.logoutBtn.addEventListener('click', logout);

el.refreshBtn.addEventListener('click', () => {
  el.refreshBtn.disabled = true;
  loadOrders().finally(() => { el.refreshBtn.disabled = false; });
});

el.filters.addEventListener('click', e => {
  const btn = e.target.closest('.filters__item');
  if (!btn) return;
  el.filters.querySelectorAll('.filters__item').forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  activeFilter = btn.dataset.status;
  render();
});

el.list.addEventListener('click', e => {
  const btn = e.target.closest('.actions__btn');
  if (!btn || btn.disabled) return;
  changeStatus(Number(btn.dataset.id), btn.dataset.status, btn);
});

/* ---------- старт ---------- */

async function showPanel() {
  el.loginScreen.hidden = true;
  el.loginScreen.style.display = 'none';
  el.panelScreen.hidden = false;
  el.panelScreen.style.display = '';
  window.scrollTo(0, 0);
  await loadProducts();
  await loadOrders();
}

if (getToken()) {
  showPanel();
} else {
  el.loginScreen.hidden = false;
  el.loginScreen.style.display = 'flex';
  el.panelScreen.hidden = true;
  el.panelScreen.style.display = 'none';
}