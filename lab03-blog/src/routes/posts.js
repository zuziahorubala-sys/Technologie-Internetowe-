import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { nowIso } from '../util/date.js';
import { requireJson } from '../middleware/validate.js';

const router = Router();

// GET /api/posts
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, title, body, created_at FROM Posts ORDER BY id DESC').all();
  res.json(rows);
});

// POST /api/posts {title, body}
router.post('/', requireJson, (req, res, next) => {
  const schema = z.object({
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(20000)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

  try {
    const info = db.prepare('INSERT INTO Posts(title, body, created_at) VALUES (?, ?, ?)').run(
      parsed.data.title, parsed.data.body, nowIso()
    );
    res.status(201).location(`/api/posts/${info.lastInsertRowid}`).json({ id: info.lastInsertRowid });
  } catch (e) { next(e); }
});

// GET /api/posts/:id/comments -> tylko approved=1
router.get('/:id/comments', (req, res) => {
  const postId = parseInt(req.params.id, 10);
  if (!Number.isInteger(postId) || postId <= 0) return res.status(422).json({ error: 'Invalid post id' });

  const post = db.prepare('SELECT id FROM Posts WHERE id=?').get(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const rows = db.prepare(`
    SELECT id, post_id, author, body, created_at, approved
    FROM Comments
    WHERE post_id = ? AND approved = 1
    ORDER BY id ASC
  `).all(postId);

  res.json(rows);
});

// POST /api/posts/:id/comments {author, body} -> 201 {approved:0}
router.post('/:id/comments', requireJson, (req, res, next) => {
  const postId = parseInt(req.params.id, 10);
  if (!Number.isInteger(postId) || postId <= 0) return res.status(422).json({ error: 'Invalid post id' });

  const post = db.prepare('SELECT id FROM Posts WHERE id=?').get(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const schema = z.object({
    author: z.string().min(1).max(100),
    body: z.string().min(1).max(1000)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

  try {
    const info = db.prepare(
      'INSERT INTO Comments(post_id, author, body, created_at, approved) VALUES (?, ?, ?, ?, 0)'
    ).run(postId, parsed.data.author, parsed.data.body, nowIso());

    res.status(201).location(`/api/comments/${info.lastInsertRowid}`).json({ id: info.lastInsertRowid, approved: 0 });
  } catch (e) { next(e); }
});

export default router;
