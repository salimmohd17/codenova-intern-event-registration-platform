import { Router } from 'express';
import db from '../db.js';
const router = Router();
router.use((req, res, next) => {
 const key = process.env.ADMIN_KEY;
 if (!key || req.get('x-admin-key') !== key) return res.status(401).json({ error: 'Admin access denied. Enter the configured admin key.' });
 next();
});
router.post('/events', (req, res) => {
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
 const result = db.prepare('INSERT INTO events (title, description, starts_at, venue, capacity) VALUES (?, ?, ?, ?, ?)')
  .run(clean.title, clean.description, clean.starts_at, clean.venue, clean.capacity);
 const event = db.prepare('SELECT * FROM events WHERE id=?').get(result.lastInsertRowid);
 res.status(201).json({ message: 'Event created successfully.', event });
});
router.get('/registrations', (req, res) => {
 const eventId = req.query.event_id ? Number(req.query.event_id) : null;
 if (req.query.event_id && (!Number.isInteger(eventId) || eventId < 1)) {
  return res.status(400).json({ error: 'Invalid event ID.' });
 }
 const rows = eventId ? db.prepare(`SELECT r.*, e.title AS event_title, e.starts_at FROM registrations r JOIN events e ON e.id=r.event_id WHERE r.event_id=? ORDER BY r.created_at DESC`).all(eventId) : db.prepare(`SELECT r.*, e.title AS event_title, e.starts_at FROM registrations r JOIN events e ON e.id=r.event_id ORDER BY r.created_at DESC`).all();
 res.json({ registrations: rows.map(r => ({ ...r, interests: JSON.parse(r.interests) })) });
});
router.patch('/registrations/:id/status', (req, res) => {
 const status = req.body?.status;
 if (!['confirmed','cancelled'].includes(status)) return res.status(400).json({ error: 'Status must be confirmed or cancelled.' });
 const registration = db.prepare('SELECT event_id, status FROM registrations WHERE id=?').get(Number(req.params.id));
 if (!registration) return res.status(404).json({ error: 'Registration not found.' });
 if (status === 'confirmed' && registration.status !== 'confirmed') {
  const event = db.prepare('SELECT capacity FROM events WHERE id=?').get(registration.event_id);
  const confirmed = db.prepare("SELECT COUNT(*) AS count FROM registrations WHERE event_id=? AND status='confirmed'").get(registration.event_id).count;
  if (confirmed >= event.capacity) return res.status(409).json({ error: 'This event has reached its registration capacity.' });
 }
 db.prepare('UPDATE registrations SET status=? WHERE id=?').run(status, Number(req.params.id));
 res.json({ message: 'Registration status updated.' });
});
export default router;
