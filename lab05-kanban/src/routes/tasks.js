import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireJson } from '../middleware/validate.js';

const router = Router();

// helpers
function getColumnIdsOrdered() {
  return db.prepare('SELECT id FROM Columns ORDER BY ord ASC').all().map(r => r.id);
}

function colExists(col_id) {
  return !!db.prepare('SELECT 1 FROM Columns WHERE id=?').get(col_id);
}

function maxOrd(col_id) {
  const r = db.prepare('SELECT COALESCE(MAX(ord), 0) AS m FROM Tasks WHERE col_id=?').get(col_id);
  return r.m ?? 0;
}

function normalizeColumnOrds(col_id) {
  // optional safety: ensure ord are 1..N without gaps
  const rows = db.prepare('SELECT id FROM Tasks WHERE col_id=? ORDER BY ord ASC, id ASC').all(col_id);
  const upd = db.prepare('UPDATE Tasks SET ord=? WHERE id=?');
  const tx = db.transaction(() => {
    rows.forEach((t, idx) => upd.run(idx + 1, t.id));
  });
  tx();
}

// POST /api/tasks {title,col_id} -> 201; ord = MAX+1 in column
router.post('/', requireJson, (req, res) => {
  const schema = z.object({
    title: z.string().min(1).max(200),
    col_id: z.number().int().positive()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

  const { title, col_id } = parsed.data;
  if (!colExists(col_id)) return res.status(404).json({ error: 'Column not found' });

  const ord = maxOrd(col_id) + 1;
  const info = db.prepare('INSERT INTO Tasks(title, col_id, ord) VALUES (?, ?, ?)').run(title, col_id, ord);
  res.status(201).location(`/api/tasks/${info.lastInsertRowid}`).json({ id: info.lastInsertRowid, col_id, ord });
});

// POST /api/tasks/:id/move {col_id, ord} -> 200
router.post('/:id/move', requireJson, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(422).json({ error: 'Invalid task id' });

  const schema = z.object({
    col_id: z.number().int().positive(),
    ord: z.number().int().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

  const { col_id: newCol, ord: requestedOrd } = parsed.data;
  if (!colExists(newCol)) return res.status(404).json({ error: 'Column not found' });

  const task = db.prepare('SELECT id, col_id, ord FROM Tasks WHERE id=?').get(id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const oldCol = task.col_id;
  const oldOrd = task.ord;

  const tx = db.transaction(() => {
    // clamp ord to valid range in destination (1..max+1)
    const destMax = maxOrd(newCol);
    let newOrd = requestedOrd;
    if (newOrd > destMax + 1) newOrd = destMax + 1;

    if (oldCol === newCol) {
      // move within same column: shift range
      const curMax = destMax; // same column
      if (newOrd < 1) newOrd = 1;
      if (newOrd > curMax) newOrd = curMax;

      if (newOrd === oldOrd) return;

      if (newOrd < oldOrd) {
        // moving up: increment ord in [newOrd, oldOrd-1]
        db.prepare(`
          UPDATE Tasks
          SET ord = ord + 1
          WHERE col_id = ? AND ord >= ? AND ord < ? AND id <> ?
        `).run(oldCol, newOrd, oldOrd, id);
      } else {
        // moving down: decrement ord in (oldOrd, newOrd]
        db.prepare(`
          UPDATE Tasks
          SET ord = ord - 1
          WHERE col_id = ? AND ord > ? AND ord <= ? AND id <> ?
        `).run(oldCol, oldOrd, newOrd, id);
      }

      db.prepare('UPDATE Tasks SET ord=? WHERE id=?').run(newOrd, id);
      return;
    }

    // 1) close gap in old column: decrement ord > oldOrd
    db.prepare(`
      UPDATE Tasks
      SET ord = ord - 1
      WHERE col_id = ? AND ord > ? AND id <> ?
    `).run(oldCol, oldOrd, id);

    // 2) make space in new column from newOrd upwards: increment ord >= newOrd
    db.prepare(`
      UPDATE Tasks
      SET ord = ord + 1
      WHERE col_id = ? AND ord >= ?
    `).run(newCol, newOrd);

    // 3) update task
    db.prepare('UPDATE Tasks SET col_id=?, ord=? WHERE id=?').run(newCol, newOrd, id);

    // (optional) ensure no gaps in both columns after operations
    // normalizeColumnOrds(oldCol); normalizeColumnOrds(newCol);
  });

  try {
    tx();
    const updated = db.prepare('SELECT id, title, col_id, ord FROM Tasks WHERE id=?').get(id);
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Move failed' });
  }
});

export default router;
