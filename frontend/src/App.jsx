import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { request } from './api.js';
import EventCard from './components/EventCard.jsx';
import RegistrationForm from './components/RegistrationForm.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import Notice from './components/Notice.jsx';
import LoadingState from './components/LoadingState.jsx';
import EmptyState from './components/EmptyState.jsx';
import StatCard from './components/StatCard.jsx';
import { useServerWakeup } from './useServerWakeup.js';
import './styles.css';

const WakeupBanner = ({ status }) => {
  if (status === 'ready') return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: status === 'error' ? '#fef2f2' : '#eff6ff',
      borderBottom: `2px solid ${status === 'error' ? '#fca5a5' : '#93c5fd'}`,
      padding: '12px 24px', display: 'flex', alignItems: 'center',
      gap: '12px', fontSize: '13px',
      color: status === 'error' ? '#991b1b' : '#1e3a8a',
    }}>
      {status === 'waking' && (
        <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #93c5fd', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      )}
      {status === 'waking'
        ? 'Server is waking up - Render free tier spins down after inactivity. This takes up to 60 s on first load. Please wait...'
        : 'Could not reach the server. Check your connection or try refreshing.'}
    </div>
  );
};

export default function App() {
  const serverStatus = useServerWakeup();
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState('');
  const [activePage, setActivePage] = useState('home');

  async function load() {
    try {
      const d = await request('/events');
      setEvents(d.events);
      setNotice(null);
    } catch (e) {
      setNotice({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function register(id, form) {
    const d = await request(`/events/${id}/register`, { method: 'POST', body: JSON.stringify(form) });
    setNotice({ type: 'success', message: d.message });
    setSelected(null);
    await load();
  }

  const total = events.reduce((n, e) => n + e.registration_count, 0);
  const available = events.reduce((n, e) => n + e.spots_left, 0);
  const filtered = events.filter(e =>
    `${e.title} ${e.description} ${e.venue}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      <WakeupBanner status={serverStatus} />
      <header className="topbar" style={serverStatus !== 'ready' ? { marginTop: 48 } : {}}>
        <div className="brand">
          <div className="brand__mark"><CalendarDays size={22} /></div>
          <div>
            <h1>Event Registration Platform</h1>
            <p>Community events &amp; workshops</p>
          </div>
        </div>
        <nav className="nav">
          <a
            href="#"
            className={`nav__link ${activePage === 'home' ? 'nav__link--active' : ''}`}
            onClick={e => { e.preventDefault(); setActivePage('home'); setSelected(null); }}
          > Home</a>
          <a
            href="#"
            className={`nav__link ${activePage === 'events' ? 'nav__link--active' : ''}`}
            onClick={e => { e.preventDefault(); setActivePage('events'); setSelected(null); }}
          > Events</a>
          <a
            href="#"
            className={`nav__link ${activePage === 'about' ? 'nav__link--active' : ''}`}
            onClick={e => { e.preventDefault(); setActivePage('about'); setSelected(null); }}
          > About</a>
          <a
            href="#"
            className={`nav__link ${activePage === 'contact' ? 'nav__link--active' : ''}`}
            onClick={e => { e.preventDefault(); setActivePage('contact'); setSelected(null); }}
          > Contact</a>
        </nav>
        <span className="topbar__label">TASK 3</span>
      </header>

      <main className="container">
        {activePage === 'about' ? (
          <div>
            <div className="page-heading">
              <div>
                <h2>About This Platform</h2>
                <p>Learn about our event registration system and community mission.</p>
              </div>
            </div>
            <div className="panel">
              <h3>Event Registration Platform</h3>
              <p className="panel__intro">
                This platform helps community members discover, explore, and register for upcoming workshops,
                seminars, and networking events. Built with React and Node.js, it provides a seamless experience
                for both attendees and event administrators.
              </p>
              <h3 style={{ marginTop: '20px' }}>Features</h3>
              <ul style={{ color: '#64748b', lineHeight: '2', fontSize: '14px' }}>
                <li> Browse upcoming community events</li>
                <li> Register with your details instantly</li>
                <li> Search and filter events easily</li>
                <li> Real-time capacity tracking</li>
                <li> Secure admin panel for event management</li>
              </ul>
            </div>
          </div>
        ) : activePage === 'contact' ? (
          <div>
            <div className="page-heading">
              <div>
                <h2>Contact Us</h2>
                <p>Get in touch with the platform team.</p>
              </div>
            </div>
            <div className="panel">
              <h3>Get in Touch</h3>
              <p className="panel__intro">Have questions about events or need help with registration? Reach out to us.</p>
              <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f0fdf9', borderRadius: '8px', border: '1px solid #ccfbf1' }}>
                  <span style={{ fontSize: '24px' }}></span>
                  <div>
                    <strong style={{ color: '#0f766e', display: 'block' }}>Email</strong>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>sirleemmuhammad18@gmail.com</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f0fdf9', borderRadius: '8px', border: '1px solid #ccfbf1' }}>
                  <span style={{ fontSize: '24px' }}></span>
                  <div>
                    <strong style={{ color: '#0f766e', display: 'block' }}>Website</strong>
                    <a href="https://salim-mwamkoba.netlify.app" target="_blank" rel="noreferrer" style={{ fontSize: '13px' }}>
                      salim-mwamkoba.netlify.app
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="page-heading">
              <div>
                <h2>Find your next learning event</h2>
                <p>Explore workshops, register with your details, and connect with other students and builders.</p>
              </div>
            </div>
            <Notice notice={notice} onClose={() => setNotice(null)} />
            <div className="stats-grid">
              <StatCard label="Upcoming events" value={events.length} detail="Open for community registration" />
              <StatCard label="Confirmed registrations" value={total} detail="Across all listed events" />
              <StatCard label="Available places" value={available} detail="Capacity updates after registration" />
            </div>
            {selected ? (
              <div className="layout">
                <section className="panel">
                  <RegistrationForm
                    event={selected}
                    onCancel={() => setSelected(null)}
                    onSuccess={register}
                    onNotice={setNotice}
                  />
                </section>
                <section className="panel">
                  <h3>Selected event</h3>
                  <p className="panel__intro">Review the details before registering.</p>
                  <h3>{selected.title}</h3>
                  <p>{selected.description}</p>
                  <p className="small-muted">{new Date(selected.starts_at).toLocaleString()}  {selected.venue}</p>
                  <span className="badge badge--confirmed">{selected.spots_left} places left</span>
                </section>
              </div>
            ) : (
              <>
                <div className="section-title">
                  <div>
                    <h3>Available events</h3>
                    <p>Choose an event to open the registration form.</p>
                  </div>
                </div>
                <div className="filters">
                  <input
                    className="control"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search events by title, details, or venue"
                    aria-label="Search events"
                  />
                </div>
                {loading ? (
                  <LoadingState label="Loading events" />
                ) : filtered.length ? (
                  <div className="card-grid">
                    {filtered.map(e => <EventCard key={e.id} event={e} onRegister={setSelected} />)}
                  </div>
                ) : (
                  <EmptyState title="No matching events" detail="Try a different search phrase." />
                )}
              </>
            )}
            <AdminPanel events={events} onNotice={setNotice} onEventAdded={load} />
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__copy">
            <strong> {new Date().getFullYear()} Salim Mwamkoba</strong>
            <span style={{ marginLeft: '8px', opacity: 0.8 }}> Event Registration Platform  Task 3</span>
          </div>
          <a
            href="https://salim-mwamkoba.netlify.app" target="_blank" rel="noreferrer" className="footer__designed">Designed by BMS Techs</a>
        </div>
      </footer>
    </div>
  );
}
