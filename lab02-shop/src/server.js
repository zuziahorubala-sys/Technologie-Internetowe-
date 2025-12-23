import express from 'express';
import morgan from 'morgan';
import { security } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/error.js';
import seedIfEmpty from './seed.js';

import products from './routes/products.js';
import cart from './routes/cart.js';
import checkout from './routes/checkout.js';
import orders from './routes/orders.js';

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

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/products', products);
app.use('/api/cart', cart);
app.use('/api/checkout', checkout);
app.use('/api/orders', orders); // bonus

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
seedIfEmpty();
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
