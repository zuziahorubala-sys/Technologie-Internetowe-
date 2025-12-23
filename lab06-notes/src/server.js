import express from 'express';
import morgan from 'morgan';
import { security } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/error.js';
import seedIfEmpty from './seed.js';

import notes from './routes/notes.js';
import tags from './routes/tags.js';

const app = express();
app.disable('x-powered-by');

app.use(security);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  next();
});

seedIfEmpty();

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/notes', notes);
app.use('/api/tags', tags);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
