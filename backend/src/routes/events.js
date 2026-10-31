import { Router } from 'express';
import db from '../db.js';
import { validateRegistration } from '../validation.js';
const router = Router();
router.get('/', (_req, res) => {
 const events = db.prepare(`SELECT e.*, e.capacity - COUNT(CASE WHEN r.status='confirmed' THEN 1 END) AS spots_left,
 COUNT(CASE WHEN r.status='confirmed' THEN 1 END) AS registration_count
 FROM events e LEFT JOIN registrations r ON r.event_id=e.id GROUP BY e.id ORDER BY e.starts_at`).all();
 res.json({ events });
});
router.post('/:id/register', (req, res, next) => {
 try {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: 'Invalid event ID.' });
  const event = db.prepare('SELECT * FROM events WHERE id=?').get(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  const { errors, value } = validateRegistration(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please correct the highlighted fields.', fields: errors });
  const existing = db.prepare('SELECT id FROM registrations WHERE event_id=? AND email=?').get(eventId, value.email);
  if (existing) return res.status(409).json({ error: 'This email is already registered for this event.' });
  const confirmed = db.prepare("SELECT COUNT(*) AS count FROM registrations WHERE event_id=? AND status='confirmed'").get(eventId).count;
  if (confirmed >= event.capacity) return res.status(409).json({ error: 'This event has reached its registration capacity.' });
  const result = db.prepare('INSERT INTO registrations (event_id, full_name, email, organization, interests) VALUES (?, ?, ?, ?, ?)').run(eventId, value.full_name, value.email, value.organization, JSON.stringify(value.interests));
  const count = db.prepare("SELECT COUNT(*) AS count FROM registrations WHERE event_id=? AND status='confirmed'").get(eventId).count;
  res.status(201).json({ message: 'Registration confirmed.', registration: { id: result.lastInsertRowid, event_id: eventId, ...value, interests: value.interests, status: 'confirmed' }, registration_count: count });
 } catch (error) { next(error); }
});
export default router;
