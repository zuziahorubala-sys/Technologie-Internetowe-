import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireJson } from '../middleware/validate.js';

const router = Router();

router.get('/', (req, res) => {
  const author = (req.query.author || '').trim();
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '20', 10), 1), 100);
  const offset = (page - 1) * pageSize;

  let where = '';
  const params = [];
  if (author) { where = 'WHERE author LIKE ?'; params.push(`%${author}%`); }

  const total = db.prepare(`SELECT COUNT(*) AS c FROM Books ${where}`).get(...params).c;
  const rows = db.prepare(`
    SELECT b.*, 
      (b.copies - (
        SELECT COUNT(*) FROM Loans l WHERE l.book_id = b.id AND l.return_date IS NULL
      )) AS available
    FROM Books b
    ${where}
    ORDER BY b.id
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  res.json({ page, pageSize, total, items: rows });
});

router.post('/', requireJson, (req, res, next) => {
  const schema = z.object({
    title: z.string().min(1),
    author: z.string().min(1),
    copies: z.number().int().nonnegative()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });
  try {
    const stmt = db.prepare('INSERT INTO Books(title, author, copies) VALUES (?, ?, ?)');
    const info = stmt.run(parsed.data.title, parsed.data.author, parsed.data.copies);
    res.status(201).location(`/api/books/${info.lastInsertRowid}`).json({ id: info.lastInsertRowid });
  } catch (e) { next(e); }
});

export default router;
