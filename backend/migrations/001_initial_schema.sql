CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(2000) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  venue VARCHAR(180) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registrations (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  organization VARCHAR(140) NOT NULL,
  interests JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_email_key
  ON registrations (event_id, lower(email));
CREATE INDEX IF NOT EXISTS registrations_event_status_idx
  ON registrations (event_id, status);
