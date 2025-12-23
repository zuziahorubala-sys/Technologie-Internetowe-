import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// POST /api/comments/:id/approve -> 200
router.post('/:id/approve', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(422).json({ error: 'Invalid comment id' });

  const c = db.prepare('SELECT id, approved FROM Comments WHERE id=?').get(id);
  if (!c) return res.status(404).json({ error: 'Comment not found' });

  if (c.approved === 1) return res.status(409).json({ error: 'Already approved' });

  db.prepare('UPDATE Comments SET approved=1 WHERE id=?').run(id);
  res.status(200).json({ ok: true });
});

// GET /api/comments/pending -> pomocnicze dla UI moderacji (nie z kontraktu, ale ułatwia)
router.get('/pending', (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.post_id, p.title AS post_title, c.author, c.body, c.created_at
    FROM Comments c
    JOIN Posts p ON p.id = c.post_id
    WHERE c.approved = 0
    ORDER BY c.id ASC
  `).all();
  res.json(rows);
});

export default router;
