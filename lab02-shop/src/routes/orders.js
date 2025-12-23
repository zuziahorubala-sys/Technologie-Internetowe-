import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const orders = db.prepare('SELECT id, created_at FROM Orders ORDER BY id DESC').all();
  const items = db.prepare(`
    SELECT oi.order_id, oi.product_id, p.name, oi.qty, oi.price, (oi.qty * oi.price) AS line_total
    FROM OrderItems oi
    JOIN Products p ON p.id = oi.product_id
    ORDER BY oi.order_id DESC, oi.id ASC
  `).all();

  const map = new Map();
  for (const o of orders) map.set(o.id, { ...o, items: [], total: 0 });
  for (const it of items) {
    const o = map.get(it.order_id);
    if (!o) continue;
    o.items.push(it);
    o.total += Number(it.line_total);
  }
  for (const o of map.values()) o.total = Number(o.total.toFixed(2));

  res.json(Array.from(map.values()));
});

export default router;
