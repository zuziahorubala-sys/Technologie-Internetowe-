import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, name FROM Tags ORDER BY name ASC').all();
  res.json(rows);
});

export default router;
