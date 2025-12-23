import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireJson } from '../middleware/validate.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, name, price FROM Products ORDER BY id').all();
  res.json(rows);
});

router.post('/', requireJson, (req, res, next) => {
  const schema = z.object({
    name: z.string().min(1).max(120),
    price: z.number().min(0)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

  try {
    const info = db.prepare('INSERT INTO Products(name, price) VALUES (?, ?)').run(parsed.data.name, parsed.data.price);
    res.status(201).location(`/api/products/${info.lastInsertRowid}`).json({ id: info.lastInsertRowid });
  } catch (e) { next(e); }
});

export default router;
