import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireJson } from '../middleware/validate.js';

const router = Router();

router.post('/', requireJson, (req,res)=>{
  const schema = z.object({
    movie_id: z.number().int().positive(),
    score: z.number().int().min(1).max(5)
  });
  const parsed = schema.safeParse(req.body);
  if(!parsed.success) return res.status(422).json({error: parsed.error.flatten()});

  const exists = db.prepare('SELECT id FROM Movies WHERE id=?').get(parsed.data.movie_id);
  if(!exists) return res.status(404).json({error:'Movie not found'});

  const info = db.prepare('INSERT INTO Ratings(movie_id, score) VALUES (?,?)').run(parsed.data.movie_id, parsed.data.score);
  res.status(201).location(`/api/ratings/${info.lastInsertRowid}`).json({id: info.lastInsertRowid});
});

export default router;
