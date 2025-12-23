import express from 'express';
import morgan from 'morgan';
import { security } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/error.js';
import seedIfEmpty from './seed.js';

import posts from './routes/posts.js';
import comments from './routes/comments.js';

const app = express();
app.disable('x-powered-by');

app.use(security);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

// no-cache dla API
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/posts', posts);
app.use('/api/comments', comments);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
seedIfEmpty();
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
