import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import events from './routes/events.js';
import admin from './routes/admin.js';
import { initializeDatabase } from './migrate.js';
import { pool } from './db.js';
await initializeDatabase();
const app = express();
app.get('/', (_req, res) => {
  res.json({ status: 'success', message: 'CodeNova Event Registration API is running.' });
});
app.get('/api', (_req, res) => {
  res.json({
    status: 'success',
    message: 'CodeNova Event Registration API endpoints are ready.',
    endpoints: ['/api/health', '/api/events', '/api/admin/registrations'],
  });
});
const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    let hostname = '';
    try {
      hostname = new URL(origin || '').hostname;
    } catch {
      hostname = '';
    }
    const normalizedOrigin = origin?.replace(/\/$/, '');
    const isConfiguredOrigin = allowedOrigins.includes(normalizedOrigin);
    const isLocalOrigin = hostname === 'localhost' || hostname === '127.0.0.1';
    const isVercelOrigin = hostname.endsWith('.vercel.app');

    if (!origin || allowedOrigins.length === 0 || isConfiguredOrigin || isLocalOrigin || isVercelOrigin) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (_req,res) => res.json({ status: 'ok', service: 'CodeNova Task 3 Event Registration API' }));
app.use('/api/events', events);
app.use('/api/admin', admin);
app.use((req,res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err,_req,res,_next) => { console.error(err); res.status(500).json({ error: 'Unexpected server error. Please try again.' }); });
const port = Number(process.env.PORT || 5003);
const server = app.listen(port, '0.0.0.0', () => console.log(`Event Registration API listening on port ${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) {
 process.on(signal, () => {
  server.close(async () => {
   await pool.end();
   process.exit(0);
  });
 });
}
