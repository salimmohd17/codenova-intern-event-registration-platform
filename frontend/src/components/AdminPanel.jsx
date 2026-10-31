import { useState } from 'react';
import { request } from '../api.js';
import EmptyState from './EmptyState.jsx';

const emptyEvent = { title: '', description: '', starts_at: '', venue: '', capacity: '' };

export default function AdminPanel({ events, onNotice, onEventAdded }) {
  const [key, setKey] = useState('');
  const [activeKey, setActiveKey] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState('all');
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [saving, setSaving] = useState(false);

  async function load(k = activeKey, id = eventId) {
    setLoading(true);
    try {
      const query = id === 'all' ? '' : `?event_id=${id}`;
      const data = await request(`/admin/registrations${query}`, { headers: { 'x-admin-key': k } });
      setRows(data.registrations);
      setActiveKey(k);
      onNotice(null);
    } catch (e) {
      onNotice({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function status(id, value) {
    try {
      await request(`/admin/registrations/${id}/status`, {
        method: 'PATCH', headers: { 'x-admin-key': activeKey }, body: JSON.stringify({ status: value })
      });
      await load();
      onNotice({ type: 'success', message: 'Registration status updated.' });
      await onEventAdded();
    } catch (e) {
      onNotice({ type: 'error', message: e.message });
    }
  }

  function changeEvent(e) {
    setEventForm(current => ({ ...current, [e.target.name]: e.target.value }));
  }

  async function addEvent(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await request('/admin/events', {
        method: 'POST',
        headers: { 'x-admin-key': key },
        body: JSON.stringify(eventForm)
      });
      setEventForm(emptyEvent);
      await onEventAdded();
      onNotice({ type: 'success', message: data.message });
    } catch (error) {
      onNotice({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel admin-box">
      <details>
        <summary>Administrator attendee view</summary>
        <p className="panel__intro">Enter the backend ADMIN_KEY to manage attendees and add events. The key is sent only to the API and is not saved in the browser.</p>
        <div className="admin-controls">
          <input className="control" type="password" placeholder="Administrator key" value={key} onChange={e => setKey(e.target.value)} />
          <select className="control" value={eventId} onChange={e => { setEventId(e.target.value); if (activeKey) load(activeKey, e.target.value); }}>
            <option value="all">All events</option>
            {events.map(event => <option value={event.id} key={event.id}>{event.title}</option>)}
          </select>
          <button className="button button--primary" onClick={() => load(key)} disabled={!key || loading}>{loading ? 'Loading' : 'Load attendees'}</button>
        </div>

        <div className="admin-add-event">
          <h3>Add an event</h3>
          <form className="event-form" onSubmit={addEvent}>
            <input className="control" name="title" value={eventForm.title} onChange={changeEvent} placeholder="Event title" required maxLength={120} />
            <textarea className="control" name="description" value={eventForm.description} onChange={changeEvent} placeholder="Event description" required maxLength={2000} rows={3} />
            <input className="control" name="starts_at" type="datetime-local" value={eventForm.starts_at} onChange={changeEvent} required />
            <input className="control" name="venue" value={eventForm.venue} onChange={changeEvent} placeholder="Venue" required maxLength={180} />
            <input className="control" name="capacity" type="number" min="1" max="100000" value={eventForm.capacity} onChange={changeEvent} placeholder="Capacity" required />
            <button className="button button--primary" disabled={!key || saving}>{saving ? 'Adding' : 'Add event'}</button>
          </form>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No attendee records loaded" detail="Enter the admin key and load the registrations to view attendee details." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Attendee</th><th>Event</th><th>Organization</th><th>Interests</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{rows.map(row => (
                <tr key={row.id}>
                  <td><strong>{row.full_name}</strong><br />{row.email}</td>
                  <td>{row.event_title}<br /><span className="small-muted">{new Date(row.starts_at).toLocaleDateString()}</span></td>
                  <td>{row.organization}</td><td>{row.interests.join(', ')}</td>
                  <td><span className={`badge badge--${row.status}`}>{row.status}</span></td>
                  <td><button className="button button--secondary" onClick={() => status(row.id, row.status === 'confirmed' ? 'cancelled' : 'confirmed')}>{row.status === 'confirmed' ? 'Cancel' : 'Restore'}</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </details>
    </section>
  );
}
