import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireJson } from '../middleware/validate.js';

const router = Router();

const intOpt = (v) => (v === undefined ? undefined : (Number.isInteger(parseInt(v, 10)) ? parseInt(v, 10) : undefined));

// GET /api/movies?year=YYYY&limit=N
router.get('/', (req, res) => {
  const year = intOpt(req.query.year);
  const limit = intOpt(req.query.limit);

  if (req.query.year !== undefined && year === undefined) return res.status(422).json({ error: 'Invalid year' });
  if (req.query.limit !== undefined && (limit === undefined || limit <= 0 || limit > 200)) {
    return res.status(422).json({ error: 'Invalid limit (1..200)' });
  }

  const where = year ? 'WHERE m.year = @year' : '';
  const lim = limit ? 'LIMIT @limit' : '';

  const rows = db.prepare(`
    SELECT
      m.id,
      m.title,
      m.year,
      COALESCE(ROUND(AVG(r.score), 2), 0.00) AS avg_score,
      COUNT(r.id) AS votes
    FROM Movies m
    LEFT JOIN Ratings r ON r.movie_id = m.id
    ${where}
    GROUP BY m.id
    ORDER BY avg_score DESC, votes DESC, m.id ASC
    ${lim};
  `).all({ year, limit });

  res.json(rows);
});

// Bonus: GET /api/movies/top?limit=5(&year=YYYY)
router.get('/top', (req, res) => {
  const year = intOpt(req.query.year);
  const limit = intOpt(req.query.limit) ?? 5;

  if (req.query.year !== undefined && year === undefined) return res.status(422).json({ error: 'Invalid year' });
  if (!Number.isInteger(limit) || limit <= 0 || limit > 200) return res.status(422).json({ error: 'Invalid limit (1..200)' });

  const where = year ? 'WHERE m.year = @year' : '';

  const rows = db.prepare(`
    SELECT
      m.id,
      m.title,
      m.year,
      COALESCE(ROUND(AVG(r.score), 2), 0.00) AS avg_score,
      COUNT(r.id) AS votes
    FROM Movies m
    LEFT JOIN Ratings r ON r.movie_id = m.id
    ${where}
    GROUP BY m.id
    ORDER BY avg_score DESC, votes DESC, m.id ASC
    LIMIT @limit;
  `).all({ year, limit });

  res.json(rows);
});

// POST /api/movies {title, year} -> 201
router.post('/', requireJson, (req, res) => {
  const schema = z.object({
    title: z.string().min(1).max(200),
    year: z.number().int().min(1888).max(2100)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

  const info = db.prepare('INSERT INTO Movies(title, year) VALUES (?, ?)').run(parsed.data.title, parsed.data.year);
  res.status(201).location(`/api/movies/${info.lastInsertRowid}`).json({ id: info.lastInsertRowid });
});

export default router;
