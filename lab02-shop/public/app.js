const $ = (sel) => document.querySelector(sel);

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...(options.headers || {}) },
    ...options
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || text || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data;
}

const money = (x) => Number(x).toFixed(2);

/* =======================
   PRODUKTY
======================= */
async function loadProducts() {
  const rows = await fetchJSON('/api/products');
  const tbody = document.getElementById('products-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  rows.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${money(p.price)}</td>
      <td><button class="add-to-cart" data-id="${p.id}">Dodaj</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/* =======================
   KOSZYK
======================= */
async function loadCart() {
  const cart = await fetchJSON('/api/cart');
  const tbody = document.getElementById('cart-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  cart.items.forEach(it => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${it.product_id}</td>
      <td>${it.name}</td>
      <td>${money(it.price)}</td>
      <td>
        <input class="qty" data-id="${it.product_id}" type="number" min="1" value="${it.qty}" style="width:80px" />
      </td>
      <td>${money(it.line_total)}</td>
      <td><button class="remove" data-id="${it.product_id}">Usuń</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('cart-total').textContent = money(cart.total);
}

/* =======================
   HISTORIA ZAMÓWIEŃ (bonus)
======================= */
async function loadOrders() {
  const container = document.getElementById('orders');
  if (!container) return;

  container.textContent = 'Ładowanie...';

  try {
    const orders = await fetchJSON('/api/orders');

    if (!Array.isArray(orders) || orders.length === 0) {
      container.textContent = 'Brak zamówień.';
      return;
    }

    container.innerHTML = orders.map(o => {
      const itemsHtml = (o.items || []).map(i =>
        `${i.name} x${i.qty} @${money(i.price)} = ${money(i.line_total)}`
      ).join('<br/>');

      return `
        <div style="margin-top:8px;">
          <strong>Zamówienie #${o.id}</strong> (${o.created_at}) — suma: ${money(o.total)}
          <div style="margin-top:4px;">${itemsHtml}</div>
        </div>
      `;
    }).join('');
  } catch (e) {
    container.textContent = 'Błąd: ' + e.message;
  }
}

/* =======================
   ZDARZENIA (delegacja)
======================= */
document.addEventListener('click', async (ev) => {
  // dodaj do koszyka
  const addBtn = ev.target.closest('.add-to-cart');
  if (addBtn) {
    const product_id = parseInt(addBtn.dataset.id, 10);
    try {
      await fetchJSON('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id, qty: 1 })
      });
      await loadCart();
    } catch (e) {
      alert('Nie udało się dodać do koszyka: ' + e.message);
    }
    return;
  }

  // usuń z koszyka
  const removeBtn = ev.target.closest('.remove');
  if (removeBtn) {
    const product_id = parseInt(removeBtn.dataset.id, 10);
    try {
      const res = await fetch('/api/cart/item/' + product_id, { method: 'DELETE' });
      // 404 traktujemy jako „już usunięte”
      if (res.status !== 404 && !res.ok) {
        const t = await res.text();
        throw new Error(t || 'Błąd usuwania');
      }
      await loadCart();
    } catch (e) {
      alert('Nie udało się usunąć: ' + e.message);
      await loadCart();
    }
    return;
  }

  // checkout
  const checkoutBtn = ev.target.closest('#checkout');
  if (checkoutBtn) {
    try {
      const r = await fetchJSON('/api/checkout', { method: 'POST' });
      const out = document.getElementById('checkout-result');
      if (out) out.textContent = `Zamówienie #${r.order_id}, suma: ${money(r.total)}`;
      await loadCart();

      // odśwież historię, jeśli użytkownik ją ma na stronie
      if (document.getElementById('orders')) {
        await loadOrders();
      }
    } catch (e) {
      alert('Nie udało się złożyć zamówienia: ' + e.message);
    }
    return;
  }

  // pokaż historię
  const ordersBtn = ev.target.closest('#load-orders');
  if (ordersBtn) {
    await loadOrders();
  }
});

// zmiana ilości
document.addEventListener('change', async (ev) => {
  const inp = ev.target.closest('input.qty');
  if (!inp) return;

  const product_id = parseInt(inp.dataset.id, 10);
  const qty = parseInt(inp.value, 10);

  if (!Number.isInteger(qty) || qty < 1) {
    inp.value = '1';
    return;
  }

  try {
    await fetchJSON('/api/cart/item', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id, qty })
    });
    await loadCart();
  } catch (e) {
    alert('Nie udało się zmienić ilości: ' + e.message);
    await loadCart();
  }
});

/* =======================
   PRODUKT (CRUD: Create)
======================= */
async function addProduct(e) {
  e.preventDefault();
  const name = document.getElementById('p_name').value.trim();
  const price = parseFloat(document.getElementById('p_price').value);

  if (!name || Number.isNaN(price) || price < 0) {
    alert('Podaj nazwę i poprawną cenę (>= 0).');
    return;
  }

  try {
    await fetchJSON('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price })
    });
    document.getElementById('p_name').value = '';
    document.getElementById('p_price').value = '0';
    await loadProducts();
  } catch (e) {
    alert('Nie udało się dodać produktu: ' + e.message);
  }
}

/* =======================
   START
======================= */
window.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadCart();
  document.getElementById('add-product-form')?.addEventListener('submit', addProduct);

  // historia ładowana na żądanie przyciskiem, ale możesz odkomentować aby auto-ładować:
  // loadOrders();
});
