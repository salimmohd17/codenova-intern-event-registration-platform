import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import events from '../src/routes/events.js';
import admin from '../src/routes/admin.js';
import '../src/db.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'CodeNova Task 3 Event Registration API' }));
app.use('/api/events', events);
app.use('/api/admin', admin);

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error. Please try again.' });
});

export default app;
