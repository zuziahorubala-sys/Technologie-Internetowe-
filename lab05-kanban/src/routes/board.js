import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const cols = db.prepare('SELECT id, name, ord FROM Columns ORDER BY ord ASC').all();
  const tasks = db.prepare('SELECT id, title, col_id, ord FROM Tasks ORDER BY col_id ASC, ord ASC').all();
  res.json({ cols, tasks });
});

export default router;
