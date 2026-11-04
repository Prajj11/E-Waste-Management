import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { initDb, closeDb } from './config/db.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Base health check endpoint
app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// Mount all REST API routes under /api
app.use('/api', routes);

// 404 catch-all & global error handler
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

// Start server only when executed directly (not when imported in test runner)
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('server.js') || process.argv[1].includes('server.js'));

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  initDb()
    .then(() => {
      app.listen(port, () => {
        console.log(`EcoCycle API server running on http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server due to database connection error:', err.message);
      process.exit(1);
    });
}

const handleShutdown = async () => {
  console.log('Shutting down EcoCycle server gracefully...');
  await closeDb();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

export { app };
export default app;
