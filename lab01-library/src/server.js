import express from 'express';
import morgan from 'morgan';
import { security } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/error.js';
import seedIfEmpty from './seed.js';
import members from './routes/members.js';
import books from './routes/books.js';
import loans from './routes/loans.js';

const app = express();
app.disable('x-powered-by');

app.use(security);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// API
app.use('/api/members', members);
app.use('/api/books', books);
app.use('/api/loans', loans);

// 404 + error
app.use(notFound);
app.use(errorHandler);

// Seed + start
const PORT = process.env.PORT || 3000;
seedIfEmpty();
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
