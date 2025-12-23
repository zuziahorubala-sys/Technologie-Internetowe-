import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireJson } from '../middleware/validate.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, name, email FROM Members ORDER BY id').all();
  res.json(rows);
});

router.post('/', requireJson, (req, res, next) => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });
  try {
    const stmt = db.prepare('INSERT INTO Members(name, email) VALUES (?, ?)');
    const info = stmt.run(parsed.data.name, parsed.data.email);
    res.status(201).location(`/api/members/${info.lastInsertRowid}`).json({ id: info.lastInsertRowid });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Email already exists' });
    next(e);
  }
});

export default router;
