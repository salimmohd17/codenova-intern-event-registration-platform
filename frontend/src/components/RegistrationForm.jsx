import { useState } from 'react';
import Field from './Field.jsx';

const choices = [
  'Web Development', 'Frontend Engineering', 'Backend Engineering', 'UI/UX Design',
  'Data and AI', 'Mobile Development', 'Cybersecurity', 'Cloud and DevOps'
];

export default function RegistrationForm({ event, onCancel, onSuccess, onNotice }) {
  const [form, setForm] = useState({ full_name: '', email: '', organization: '', interests: [] });
  const [busy, setBusy] = useState(false);
  const [interestsError, setInterestsError] = useState('');

  const change = e => setForm(current => ({ ...current, [e.target.name]: e.target.value }));
  const toggle = interest => {
    setForm(current => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter(item => item !== interest)
        : [...current.interests, interest]
    }));
    setInterestsError('');
  };

  async function submit(e) {
    e.preventDefault();
    if (!form.interests.length) {
      setInterestsError('Select at least one domain interest.');
      return;
    }

    setBusy(true);
    try {
      await onSuccess(event.id, form);
    } catch (err) {
      onNotice({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate={false}>
      <h3>Register for {event.title}</h3>
      <p className="panel__intro">Complete the form below. One email can register once for each event.</p>
      <Field label="Full name" name="full_name" value={form.full_name} onChange={change} required maxLength={100} />
      <Field label="Email address" name="email" value={form.email} onChange={change} type="email" required maxLength={254} />
      <Field label="College or organization" name="organization" value={form.organization} onChange={change} required maxLength={140} />
      <div className="field">
        <span className="field__label">Domain interests *</span>
        <div className="interest-grid" role="group" aria-label="Domain interests">
          {choices.map(choice => (
            <label className="check-option" key={choice}>
              <input
                type="checkbox"
                checked={form.interests.includes(choice)}
                onChange={() => toggle(choice)}
              />
              <span>{choice}</span>
            </label>
          ))}
        </div>
        {interestsError ? <small className="field-error">{interestsError}</small> : <small>Select at least one area.</small>}
      </div>
      <div className="inline-actions">
        <button className="button button--primary" disabled={busy}>{busy ? 'Submitting' : 'Confirm registration'}</button>
        <button type="button" className="button button--secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
