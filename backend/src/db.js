import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const isSupabase = /supabase\.co|supabase\.com/i.test(process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.DATABASE_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

export function query(text, params = []) {
  return pool.query(text, params);
}

export async function checkDatabaseConnection() {
  const result = await pool.query('SELECT current_database() AS database, NOW() AS server_time');
  return result.rows[0];
}
