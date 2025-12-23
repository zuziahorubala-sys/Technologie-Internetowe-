import { Router } from 'express';
import { db } from '../db.js';
import { nowIso } from '../util/date.js';

const router = Router();

router.post('/', (req, res, next) => {
  const txn = db.transaction(() => {
    const cart = db.prepare(`
      SELECT ci.product_id, ci.qty, p.price
      FROM CartItems ci
      JOIN Products p ON p.id = ci.product_id
      ORDER BY ci.product_id
    `).all();

    if (cart.length === 0) return { status: 409, message: 'Cart is empty' };

    const orderInfo = db.prepare('INSERT INTO Orders(created_at) VALUES (?)').run(nowIso());
    const order_id = orderInfo.lastInsertRowid;

    const ins = db.prepare('INSERT INTO OrderItems(order_id, product_id, qty, price) VALUES (?, ?, ?, ?)');
    let total = 0;
    for (const line of cart) {
      ins.run(order_id, line.product_id, line.qty, line.price); // snapshot ceny
      total += Number(line.qty) * Number(line.price);
    }

    db.prepare('DELETE FROM CartItems').run();
    return { status: 201, order_id, total: Number(total.toFixed(2)) };
  });

  try {
    const r = txn();
    if (r.status !== 201) return res.status(r.status).json({ error: r.message });
    res.status(201).location(`/api/orders/${r.order_id}`).json({ order_id: r.order_id, total: r.total });
  } catch (e) { next(e); }
});

export default router;
