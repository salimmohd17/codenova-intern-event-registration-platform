import { Router } from 'express';
import { pool, query } from '../db.js';
const router = Router();
router.use((req, res, next) => {
 const key = process.env.ADMIN_KEY;
 if (!key || req.get('x-admin-key') !== key) return res.status(401).json({ error: 'Admin access denied. Enter the configured admin key.' });
 next();
});
router.post('/events', async (req, res, next) => {
 const { title, description, starts_at, venue, capacity } = req.body || {};
 const clean = {
  title: String(title || '').trim(),
  description: String(description || '').trim(),
  starts_at: String(starts_at || '').trim(),
  venue: String(venue || '').trim(),
  capacity: Number(capacity)
 };
 if (!clean.title || clean.title.length > 120) return res.status(400).json({ error: 'Enter an event title (1120 characters).' });
 if (!clean.description || clean.description.length > 2000) return res.status(400).json({ error: 'Enter an event description (12000 characters).' });
 if (!clean.starts_at || Number.isNaN(Date.parse(clean.starts_at))) return res.status(400).json({ error: 'Enter a valid event date and time.' });
 if (!clean.venue || clean.venue.length > 180) return res.status(400).json({ error: 'Enter a venue (1180 characters).' });
 if (!Number.isInteger(clean.capacity) || clean.capacity < 1 || clean.capacity > 100000) return res.status(400).json({ error: 'Capacity must be a whole number between 1 and 100000.' });
 try {
  const result = await query('INSERT INTO events (title, description, starts_at, venue, capacity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
   [clean.title, clean.description, clean.starts_at, clean.venue, clean.capacity]);
  res.status(201).json({ message: 'Event created successfully.', event: result.rows[0] });
 } catch (error) { next(error); }
});
router.get('/registrations', async (req, res, next) => {
 const eventId = req.query.event_id ? Number(req.query.event_id) : null;
 if (req.query.event_id && (!Number.isInteger(eventId) || eventId < 1)) {
  return res.status(400).json({ error: 'Invalid event ID.' });
 }
 try {
  const result = eventId
   ? await query(`SELECT r.*, e.title AS event_title, e.starts_at FROM registrations r JOIN events e ON e.id = r.event_id WHERE r.event_id = $1 ORDER BY r.created_at DESC`, [eventId])
   : await query(`SELECT r.*, e.title AS event_title, e.starts_at FROM registrations r JOIN events e ON e.id = r.event_id ORDER BY r.created_at DESC`);
  res.json({ registrations: result.rows.map(r => ({ ...r, interests: Array.isArray(r.interests) ? r.interests : JSON.parse(r.interests) })) });
 } catch (error) { next(error); }
});
router.patch('/registrations/:id/status', async (req, res, next) => {
 const status = req.body?.status;
 if (!['confirmed','cancelled'].includes(status)) return res.status(400).json({ error: 'Status must be confirmed or cancelled.' });
 const client = await pool.connect();
 try {
  await client.query('BEGIN');
  const registration = await client.query('SELECT event_id, status FROM registrations WHERE id = $1 FOR UPDATE', [Number(req.params.id)]);
  if (!registration.rows.length) {
   await client.query('ROLLBACK');
   return res.status(404).json({ error: 'Registration not found.' });
  }
  if (status === 'confirmed' && registration.rows[0].status !== 'confirmed') {
   const event = await client.query('SELECT capacity FROM events WHERE id = $1 FOR UPDATE', [registration.rows[0].event_id]);
   const confirmed = await client.query("SELECT COUNT(*)::int AS count FROM registrations WHERE event_id = $1 AND status = 'confirmed'", [registration.rows[0].event_id]);
   if (confirmed.rows[0].count >= event.rows[0].capacity) {
    await client.query('ROLLBACK');
    return res.status(409).json({ error: 'This event has reached its registration capacity.' });
   }
  }
  await client.query('UPDATE registrations SET status = $1 WHERE id = $2', [status, Number(req.params.id)]);
  await client.query('COMMIT');
  res.json({ message: 'Registration status updated.' });
 } catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  next(error);
 } finally {
  client.release();
 }
});
export default router;
