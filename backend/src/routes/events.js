import { Router } from 'express';
import { pool, query } from '../db.js';
import { validateRegistration } from '../validation.js';
const router = Router();
router.get('/', async (_req, res, next) => {
 try {
  const result = await query(`SELECT e.*,
   e.capacity - COUNT(*) FILTER (WHERE r.status = 'confirmed')::int AS spots_left,
   COUNT(*) FILTER (WHERE r.status = 'confirmed')::int AS registration_count
   FROM events e LEFT JOIN registrations r ON r.event_id = e.id
   GROUP BY e.id ORDER BY e.starts_at`);
  res.json({ events: result.rows });
 } catch (error) { next(error); }
});
router.post('/:id/register', async (req, res, next) => {
 const eventId = Number(req.params.id);
 if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: 'Invalid event ID.' });
 const client = await pool.connect();
 try {
  const { errors, value } = validateRegistration(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please correct the highlighted fields.', fields: errors });
  await client.query('BEGIN');
  const eventResult = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [eventId]);
  if (!eventResult.rows.length) {
   await client.query('ROLLBACK');
   return res.status(404).json({ error: 'Event not found.' });
  }
  const existing = await client.query('SELECT id FROM registrations WHERE event_id = $1 AND lower(email) = $2', [eventId, value.email]);
  if (existing.rows.length) {
   await client.query('ROLLBACK');
   return res.status(409).json({ error: 'This email is already registered for this event.' });
  }
  const confirmed = await client.query("SELECT COUNT(*)::int AS count FROM registrations WHERE event_id = $1 AND status = 'confirmed'", [eventId]);
  if (confirmed.rows[0].count >= eventResult.rows[0].capacity) {
   await client.query('ROLLBACK');
   return res.status(409).json({ error: 'This event has reached its registration capacity.' });
  }
  const inserted = await client.query(
   'INSERT INTO registrations (event_id, full_name, email, organization, interests) VALUES ($1, $2, $3, $4, $5) RETURNING *',
   [eventId, value.full_name, value.email, value.organization, JSON.stringify(value.interests)]
  );
  const count = await client.query("SELECT COUNT(*)::int AS count FROM registrations WHERE event_id = $1 AND status = 'confirmed'", [eventId]);
  await client.query('COMMIT');
  res.status(201).json({ message: 'Registration confirmed.', registration: { ...inserted.rows[0], interests: value.interests }, registration_count: count.rows[0].count });
 } catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  next(error);
 } finally {
  client.release();
 }
});
export default router;
