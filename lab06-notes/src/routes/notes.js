import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireJson } from '../middleware/validate.js';

const router = Router();

function normalizeTagName(s) {
  return s.trim().toLowerCase();
}

function getTagsForNote(noteId) {
  return db.prepare(`
    SELECT t.id, t.name
    FROM Note_Tags nt
    JOIN Tags t ON t.id = nt.tag_id
    WHERE nt.note_id = ?
    ORDER BY t.name ASC
  `).all(noteId);
}

// GET /api/notes?q=...&tag=...
router.get('/', (req, res) => {
  const q = (req.query.q ?? '').toString().trim();
  const tag = (req.query.tag ?? '').toString().trim();

  const qLike = q ? `%${q.replaceAll('%','\%').replaceAll('_','\_')}%` : null;

  let rows = [];
  if (tag) {
    // filter by tag name + optional q
    rows = db.prepare(`
      SELECT n.id, n.title, n.body, n.created_at
      FROM Notes n
      JOIN Note_Tags nt ON nt.note_id = n.id
      JOIN Tags t ON t.id = nt.tag_id
      WHERE t.name = @tag
        AND (@q IS NULL OR (n.title LIKE @q ESCAPE '\\' OR n.body LIKE @q ESCAPE '\\'))
      ORDER BY n.created_at DESC, n.id DESC
    `).all({ tag: normalizeTagName(tag), q: qLike });
  } else {
    rows = db.prepare(`
      SELECT n.id, n.title, n.body, n.created_at
      FROM Notes n
      WHERE (@q IS NULL OR (n.title LIKE @q ESCAPE '\\' OR n.body LIKE @q ESCAPE '\\'))
      ORDER BY n.created_at DESC, n.id DESC
    `).all({ q: qLike });
  }

  // attach tags list per note
  const out = rows.map(n => ({
    ...n,
    tags: getTagsForNote(n.id).map(t => t.name)
  }));

  res.json(out);
});

// POST /api/notes {title,body} -> 201
router.post('/', requireJson, (req, res) => {
  const schema = z.object({
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(5000)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

  const info = db.prepare('INSERT INTO Notes(title, body) VALUES (?, ?)').run(parsed.data.title, parsed.data.body);
  res.status(201).location(`/api/notes/${info.lastInsertRowid}`).json({ id: info.lastInsertRowid });
});

// POST /api/notes/{id}/tags {tags:["work","home"]} -> create missing + link (unique via PK)
router.post('/:id/tags', requireJson, (req, res) => {
  const noteId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(noteId) || noteId <= 0) return res.status(422).json({ error: 'Invalid note id' });

  const schema = z.object({
    tags: z.array(z.string().min(1).max(40)).min(1).max(20)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

  const note = db.prepare('SELECT id FROM Notes WHERE id=?').get(noteId);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  const tags = [...new Set(parsed.data.tags.map(normalizeTagName).filter(Boolean))];

  const tx = db.transaction(() => {
    const insTag = db.prepare('INSERT OR IGNORE INTO Tags(name) VALUES (?)');
    const getTagId = db.prepare('SELECT id FROM Tags WHERE name=?');
    const link = db.prepare('INSERT OR IGNORE INTO Note_Tags(note_id, tag_id) VALUES (?, ?)');

    for (const name of tags) {
      insTag.run(name);
      const tid = getTagId.get(name).id;
      link.run(noteId, tid);
    }
  });

  tx();

  res.json({ id: noteId, tags: getTagsForNote(noteId).map(t => t.name) });
});

export default router;
