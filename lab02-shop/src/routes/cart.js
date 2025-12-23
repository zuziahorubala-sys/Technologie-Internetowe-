import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireJson } from '../middleware/validate.js';

const router = Router();

const cartViewSql = `
  SELECT ci.product_id, p.name, p.price, ci.qty, (p.price * ci.qty) AS line_total
  FROM CartItems ci
  JOIN Products p ON p.id = ci.product_id
  ORDER BY ci.product_id
`;

router.get('/', (req, res) => {
  const items = db.prepare(cartViewSql).all();
  const total = items.reduce((s, x) => s + Number(x.line_total), 0);
  res.json({ items, total: Number(total.toFixed(2)) });
});

router.post('/add', requireJson, (req, res) => {
  const schema = z.object({
    product_id: z.number().int().positive(),
    qty: z.number().int().min(1)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

  const { product_id, qty } = parsed.data;
  const p = db.prepare('SELECT id FROM Products WHERE id = ?').get(product_id);
  if (!p) return res.status(404).json({ error: 'Product not found' });

  const existing = db.prepare('SELECT qty FROM CartItems WHERE product_id = ?').get(product_id);
  if (existing) db.prepare('UPDATE CartItems SET qty = qty + ? WHERE product_id = ?').run(qty, product_id);
  else db.prepare('INSERT INTO CartItems(product_id, qty) VALUES (?, ?)').run(product_id, qty);

  res.status(200).json({ ok: true });
});

router.patch('/item', requireJson, (req, res) => {
  const schema = z.object({
    product_id: z.number().int().positive(),
    qty: z.number().int().min(1)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

  const { product_id, qty } = parsed.data;
  const row = db.prepare('SELECT product_id FROM CartItems WHERE product_id = ?').get(product_id);
  if (!row) return res.status(404).json({ error: 'Item not in cart' });

  db.prepare('UPDATE CartItems SET qty = ? WHERE product_id = ?').run(qty, product_id);
  res.status(200).json({ ok: true });
});

router.delete('/item/:product_id', (req, res) => {
  const product_id = parseInt(req.params.product_id, 10);
  if (!Number.isInteger(product_id) || product_id <= 0) return res.status(422).json({ error: 'Invalid product_id' });

  const info = db.prepare('DELETE FROM CartItems WHERE product_id = ?').run(product_id);
  if (info.changes === 0) return res.status(404).json({ error: 'Item not in cart' });

  res.status(200).json({ ok: true });
});

export default router;
