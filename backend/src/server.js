import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { initDb, closeDb } from './config/db.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
initDb()
  .then(() => app.listen(port, () => console.log(`E-Waste API listening on http://localhost:${port}`)))
  .catch((err) => { console.error('Could not start:', err.message); process.exit(1); });

process.on('SIGINT', async () => { await closeDb(); process.exit(0); });
